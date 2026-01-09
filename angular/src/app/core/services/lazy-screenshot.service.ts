/**
 * Lazy Screenshot Service
 * ========================
 * Dynamically loads html2canvas only when screenshots are needed
 * This prevents ~80 KB from being in the initial bundle
 */

import { Injectable, signal } from "@angular/core";
import { TIMEOUTS } from "../constants/app.constants";

export interface ScreenshotOptions {
  scale?: number;
  backgroundColor?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  scrollX?: number;
  scrollY?: number;
  useCORS?: boolean;
  allowTaint?: boolean;
  [key: string]: unknown;
}

// Dynamic import type - html2canvas is loaded lazily
type Html2CanvasFunction = (
  element: HTMLElement,
  options: Record<string, unknown>,
) => Promise<HTMLCanvasElement>;

@Injectable({
  providedIn: "root",
})
export class LazyScreenshotService {
  private html2canvas: Html2CanvasFunction | null = null;
  private loading = signal(false);
  private loaded = signal(false);

  constructor() {}

  /**
   * Load html2canvas library
   */
  private async loadLibrary(): Promise<void> {
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
      const module = await import("html2canvas");
      this.html2canvas = module.default;
      this.loaded.set(true);
    } catch (error) {
      console.error("Failed to load html2canvas:", error);
      throw new Error("Failed to load screenshot library");
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Take a screenshot of an HTML element
   * Returns a canvas element
   */
  async captureElement(
    element: HTMLElement,
    options: ScreenshotOptions = {},
  ): Promise<HTMLCanvasElement> {
    await this.loadLibrary();

    const defaultOptions: ScreenshotOptions = {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      ...options,
    };

    try {
      if (!this.html2canvas) {
        throw new Error("html2canvas not loaded");
      }
      const canvas = await this.html2canvas(element, defaultOptions);
      return canvas;
    } catch (error) {
      console.error("Failed to capture screenshot:", error);
      throw new Error("Failed to capture screenshot");
    }
  }

  /**
   * Take a screenshot and download it
   */
  async downloadScreenshot(
    element: HTMLElement,
    filename: string = "screenshot.png",
    options: ScreenshotOptions = {},
  ): Promise<void> {
    const canvas = await this.captureElement(element, options);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error("Failed to create image blob");
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  /**
   * Take a screenshot and get as data URL
   */
  async getScreenshotDataURL(
    element: HTMLElement,
    type: "image/png" | "image/jpeg" = "image/png",
    quality: number = 0.95,
    options: ScreenshotOptions = {},
  ): Promise<string> {
    const canvas = await this.captureElement(element, options);
    return canvas.toDataURL(type, quality);
  }

  /**
   * Take a screenshot and copy to clipboard
   */
  async copyScreenshotToClipboard(
    element: HTMLElement,
    options: ScreenshotOptions = {},
  ): Promise<void> {
    const canvas = await this.captureElement(element, options);

    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error("Failed to create image blob"));
          return;
        }

        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, "image/png");
    });
  }

  /**
   * Check if library is loaded
   */
  isLoaded(): boolean {
    return this.loaded();
  }

  /**
   * Check if library is currently loading
   */
  isLoading(): boolean {
    return this.loading();
  }
}
