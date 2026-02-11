/**
 * Lazy PDF Export Service
 * ========================
 * Dynamically loads jsPDF and html2canvas only when PDF export is needed
 * This prevents ~150 KB of libraries from being in the initial bundle
 */

import { inject, Injectable, signal } from "@angular/core";
import { TIMEOUTS } from "../constants/app.constants";
import { LoggerService } from "./logger.service";

export interface PDFExportOptions {
  filename?: string;
  format?: "a4" | "letter" | "legal";
  orientation?: "portrait" | "landscape";
  quality?: number;
  scale?: number;
  /** Header text centered at top (e.g. "ACWR Dashboard Report") */
  headerText?: string;
  /** Subtitle text below header (e.g. generated date) */
  subtitleText?: string;
  /** Image format: png for charts, jpeg for photos */
  imageFormat?: "jpeg" | "png";
  /** Y position (mm) to place image when header/subtitle used */
  imageStartY?: number;
  /** Max image height (mm) to cap tall content */
  imageMaxHeight?: number;
}

// Dynamic import types - these libraries are loaded lazily
type JsPDFOrientation = "p" | "l" | "portrait" | "landscape";
type JsPDFUnit = "in" | "em" | "ex" | "cm" | "pt" | "px" | "mm" | "pc";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsPDFConstructor = new (options: any) => any;
type Html2CanvasFunction = (
  element: HTMLElement,
  options: Record<string, unknown>,
) => Promise<HTMLCanvasElement>;

@Injectable({
  providedIn: "root",
})
export class LazyPdfService {
  private logger = inject(LoggerService);
  private jsPDF: JsPDFConstructor | null = null;
  private html2canvas: Html2CanvasFunction | null = null;
  private loading = signal(false);
  private loaded = signal(false);

  /**
   * Load jsPDF and html2canvas libraries
   */
  private async loadLibraries(): Promise<void> {
    if (this.loaded()) {
      return;
    }

    if (this.loading()) {
      // Wait for existing load to complete
      while (this.loading()) {
        await new Promise((resolve) =>
          setTimeout(resolve, TIMEOUTS.UI_MICRO_DELAY),
        );
      }
      return;
    }

    try {
      this.loading.set(true);

      // Load both libraries in parallel
      const [jsPDFModule, html2canvasModule] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      this.jsPDF = (jsPDFModule.default ?? (jsPDFModule as { jsPDF?: unknown }).jsPDF) as JsPDFConstructor;
      this.html2canvas = html2canvasModule.default;
      this.loaded.set(true);
    } catch (error) {
      this.logger.error("Failed to load PDF libraries:", error);
      throw new Error("Failed to load PDF export libraries");
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Export an HTML element to PDF
   */
  async exportElementToPDF(
    element: HTMLElement,
    options: PDFExportOptions = {},
  ): Promise<void> {
    await this.loadLibraries();

    const {
      filename = "export.pdf",
      format = "a4",
      orientation = "portrait",
      quality = 0.95,
      scale = 2,
      headerText,
      subtitleText,
      imageFormat = "jpeg",
      imageStartY = 0,
      imageMaxHeight,
    } = options;

    try {
      // Convert HTML to canvas
      if (!this.html2canvas) {
        throw new Error("html2canvas not loaded");
      }
      const computedBackground =
        getComputedStyle(element).backgroundColor ||
        getComputedStyle(document.documentElement)
          .getPropertyValue("--surface-primary")
          .trim();
      const canvas = await this.html2canvas(element, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: computedBackground || undefined,
      });

      // Get canvas dimensions
      const imgWidth = format === "a4" ? 210 : 216; // mm
      let imgHeight = (canvas.height * imgWidth) / canvas.width;
      if (imageMaxHeight != null && imgHeight > imageMaxHeight) {
        imgHeight = imageMaxHeight;
      }

      // Create PDF
      if (!this.jsPDF) {
        throw new Error("jsPDF not loaded");
      }
      const pdf = new this.jsPDF({
        orientation: orientation as JsPDFOrientation,
        unit: "mm" as JsPDFUnit,
        format,
      });

      let imgY = imageStartY;
      if (headerText) {
        pdf.setFontSize(20);
        pdf.text(headerText, imgWidth / 2, 15, { align: "center" });
        imgY = 22;
      }
      if (subtitleText) {
        pdf.setFontSize(10);
        pdf.text(subtitleText, imgWidth / 2, imgY, { align: "center" });
        imgY += 8;
      }
      imgY = headerText || subtitleText ? Math.max(imgY, 30) : imageStartY;

      const imgData =
        imageFormat === "png"
          ? canvas.toDataURL("image/png")
          : canvas.toDataURL("image/jpeg", quality);
      pdf.addImage(imgData, imageFormat.toUpperCase(), 0, imgY, imgWidth, imgHeight);

      // Save PDF
      pdf.save(filename);
    } catch (error) {
      this.logger.error("Failed to export PDF:", error);
      throw new Error("Failed to generate PDF");
    }
  }

  /**
   * Export multiple elements to a single PDF
   */
  async exportMultipleElementsToPDF(
    elements: HTMLElement[],
    options: PDFExportOptions = {},
  ): Promise<void> {
    await this.loadLibraries();

    const {
      filename = "export.pdf",
      format = "a4",
      orientation = "portrait",
      quality = 0.95,
      scale = 2,
    } = options;

    try {
      if (!this.jsPDF) {
        throw new Error("jsPDF not loaded");
      }
      if (!this.html2canvas) {
        throw new Error("html2canvas not loaded");
      }

      const pdf = new this.jsPDF({
        orientation: orientation as JsPDFOrientation,
        unit: "mm" as JsPDFUnit,
        format,
      });

      const imgWidth = format === "a4" ? 210 : 216;

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const computedBackground =
          getComputedStyle(element).backgroundColor ||
          getComputedStyle(document.documentElement)
            .getPropertyValue("--surface-primary")
            .trim();

        // Convert to canvas
        const canvas = await this.html2canvas(element, {
          scale,
          useCORS: true,
          logging: false,
          backgroundColor: computedBackground || undefined,
        });

        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const imgData = canvas.toDataURL("image/jpeg", quality);

        // Add new page for subsequent elements
        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
      }

      pdf.save(filename);
    } catch (error) {
      this.logger.error("Failed to export PDF:", error);
      throw new Error("Failed to generate PDF");
    }
  }

  /**
   * Check if libraries are loaded
   */
  isLoaded(): boolean {
    return this.loaded();
  }

  /**
   * Check if libraries are currently loading
   */
  isLoading(): boolean {
    return this.loading();
  }
}
