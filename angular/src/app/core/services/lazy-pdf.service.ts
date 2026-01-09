/**
 * Lazy PDF Export Service
 * ========================
 * Dynamically loads jsPDF and html2canvas only when PDF export is needed
 * This prevents ~150 KB of libraries from being in the initial bundle
 */

import { Injectable, signal } from "@angular/core";
import { TIMEOUTS } from "../constants/app.constants";

export interface PDFExportOptions {
  filename?: string;
  format?: "a4" | "letter" | "legal";
  orientation?: "portrait" | "landscape";
  quality?: number;
  scale?: number;
}

// Dynamic import types - these libraries are loaded lazily
type JsPDFOrientation = "p" | "l" | "portrait" | "landscape";
type JsPDFConstructor = new (options: {
  orientation: JsPDFOrientation;
  unit: string;
  format: string;
}) => {
  addImage: (
    data: string,
    format: string,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => void;
  addPage: () => void;
  save: (filename: string) => void;
};
type Html2CanvasFunction = (
  element: HTMLElement,
  options: Record<string, unknown>,
) => Promise<HTMLCanvasElement>;

@Injectable({
  providedIn: "root",
})
export class LazyPdfService {
  private jsPDF: JsPDFConstructor | null = null;
  private html2canvas: Html2CanvasFunction | null = null;
  private loading = signal(false);
  private loaded = signal(false);

  constructor() {}

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

      this.jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
      this.html2canvas = html2canvasModule.default;
      this.loaded.set(true);
    } catch (error) {
      console.error("Failed to load PDF libraries:", error);
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
    } = options;

    try {
      // Convert HTML to canvas
      const canvas = await this.html2canvas!(element, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Get canvas dimensions
      const imgWidth = format === "a4" ? 210 : 216; // mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new this.jsPDF!({
        orientation: orientation as JsPDFOrientation,
        unit: "mm",
        format,
      });

      // Add image to PDF
      const imgData = canvas.toDataURL("image/jpeg", quality);
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);

      // Save PDF
      pdf.save(filename);
    } catch (error) {
      console.error("Failed to export PDF:", error);
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
      const pdf = new this.jsPDF!({
        orientation: orientation as JsPDFOrientation,
        unit: "mm",
        format,
      });

      const imgWidth = format === "a4" ? 210 : 216;

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];

        // Convert to canvas
        const canvas = await this.html2canvas!(element, {
          scale,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
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
      console.error("Failed to export PDF:", error);
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
