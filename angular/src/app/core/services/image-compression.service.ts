import { Injectable, inject } from "@angular/core";
import { LoggerService } from "./logger.service";

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  outputFormat?: "image/jpeg" | "image/png" | "image/webp";
  preserveAspectRatio?: boolean;
}

interface RequiredCompressionOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  outputFormat: "image/jpeg" | "image/png" | "image/webp";
  preserveAspectRatio: boolean;
}

export interface CompressionResult {
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
  format: string;
}

export interface BatchCompressionResult {
  results: CompressionResult[];
  totalOriginalSize: number;
  totalCompressedSize: number;
  overallCompressionRatio: number;
  successCount: number;
  errorCount: number;
  errors: { index: number; error: string }[];
}

const DEFAULT_OPTIONS: RequiredCompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  outputFormat: "image/webp",
  preserveAspectRatio: true,
};

/**
 * Image Compression Service
 *
 * Provides client-side image compression using browser-native APIs:
 * - Canvas API for resizing and format conversion
 * - createImageBitmap for efficient decoding
 * - WebP output for modern browsers (best compression)
 * - JPEG fallback for older browsers
 *
 * Features:
 * - Automatic format detection and conversion
 * - Quality-based compression
 * - Dimension-based resizing with aspect ratio preservation
 * - Batch processing support
 * - Memory-efficient processing
 */
@Injectable({
  providedIn: "root",
})
export class ImageCompressionService {
  private logger = inject(LoggerService);
  private supportsWebP: boolean | null = null;

  constructor() {
    this.checkWebPSupport();
  }

  /**
   * Check if browser supports WebP encoding
   */
  private async checkWebPSupport(): Promise<boolean> {
    if (this.supportsWebP !== null) {
      return this.supportsWebP;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      this.supportsWebP = canvas
        .toDataURL("image/webp")
        .startsWith("data:image/webp");
    } catch {
      this.supportsWebP = false;
    }

    this.logger.debug(`WebP support: ${this.supportsWebP}`);
    return this.supportsWebP;
  }

  /**
   * Compress a single image file
   */
  async compressImage(
    file: File | Blob,
    options: CompressionOptions = {},
  ): Promise<CompressionResult> {
    const opts: RequiredCompressionOptions = { ...DEFAULT_OPTIONS, ...options };
    const originalSize = file.size;

    try {
      // Check WebP support and fallback if needed
      if (
        opts.outputFormat === "image/webp" &&
        !(await this.checkWebPSupport())
      ) {
        opts.outputFormat = "image/jpeg";
        this.logger.debug("WebP not supported, falling back to JPEG");
      }

      // Create ImageBitmap for efficient processing
      const imageBitmap = await createImageBitmap(file);

      // Calculate new dimensions
      const { width, height } = this.calculateDimensions(
        imageBitmap.width,
        imageBitmap.height,
        opts.maxWidth,
        opts.maxHeight,
        opts.preserveAspectRatio,
      );

      // Create canvas and draw resized image
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // Use high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw the image
      ctx.drawImage(imageBitmap, 0, 0, width, height);

      // Clean up ImageBitmap
      imageBitmap.close();

      // Convert to blob
      const blob = await this.canvasToBlob(
        canvas,
        opts.outputFormat,
        opts.quality,
      );
      const dataUrl = canvas.toDataURL(opts.outputFormat, opts.quality);

      const compressedSize = blob.size;
      const compressionRatio =
        originalSize > 0
          ? Number(((1 - compressedSize / originalSize) * 100).toFixed(1))
          : 0;

      this.logger.debug(
        `Image compressed: ${this.formatBytes(originalSize)} → ${this.formatBytes(compressedSize)} (${compressionRatio}% reduction)`,
      );

      return {
        blob,
        dataUrl,
        originalSize,
        compressedSize,
        compressionRatio,
        width,
        height,
        format: opts.outputFormat,
      };
    } catch (error) {
      this.logger.error("Image compression failed:", error);
      throw error;
    }
  }

  /**
   * Compress multiple images in batch
   */
  async compressImages(
    files: (File | Blob)[],
    options: CompressionOptions = {},
  ): Promise<BatchCompressionResult> {
    const results: CompressionResult[] = [];
    const errors: { index: number; error: string }[] = [];
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.compressImage(files[i], options);
        results.push(result);
        totalOriginalSize += result.originalSize;
        totalCompressedSize += result.compressedSize;
      } catch (error) {
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const overallCompressionRatio =
      totalOriginalSize > 0
        ? Number(
            ((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(1),
          )
        : 0;

    return {
      results,
      totalOriginalSize,
      totalCompressedSize,
      overallCompressionRatio,
      successCount: results.length,
      errorCount: errors.length,
      errors,
    };
  }

  /**
   * Compress image from URL
   */
  async compressImageFromUrl(
    url: string,
    options: CompressionOptions = {},
  ): Promise<CompressionResult> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      return this.compressImage(blob, options);
    } catch (error) {
      this.logger.error("Failed to compress image from URL:", error);
      throw error;
    }
  }

  /**
   * Compress image from data URL
   */
  async compressImageFromDataUrl(
    dataUrl: string,
    options: CompressionOptions = {},
  ): Promise<CompressionResult> {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      return this.compressImage(blob, options);
    } catch (error) {
      this.logger.error("Failed to compress image from data URL:", error);
      throw error;
    }
  }

  /**
   * Get optimal compression options based on use case
   */
  getPresetOptions(
    preset: "thumbnail" | "profile" | "post" | "full",
  ): CompressionOptions {
    switch (preset) {
      case "thumbnail":
        return {
          maxWidth: 150,
          maxHeight: 150,
          quality: 0.7,
          outputFormat: "image/webp",
        };
      case "profile":
        return {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.85,
          outputFormat: "image/webp",
        };
      case "post":
        return {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8,
          outputFormat: "image/webp",
        };
      case "full":
        return {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.85,
          outputFormat: "image/webp",
        };
      default:
        return DEFAULT_OPTIONS;
    }
  }

  /**
   * Check if image needs compression
   */
  async shouldCompress(
    file: File | Blob,
    maxSizeBytes: number = 500 * 1024, // 500KB default
  ): Promise<boolean> {
    // Check file size
    if (file.size > maxSizeBytes) {
      return true;
    }

    // Check dimensions
    try {
      const imageBitmap = await createImageBitmap(file);
      const needsResize =
        imageBitmap.width > DEFAULT_OPTIONS.maxWidth ||
        imageBitmap.height > DEFAULT_OPTIONS.maxHeight;
      imageBitmap.close();
      return needsResize;
    } catch {
      return false;
    }
  }

  /**
   * Calculate new dimensions while preserving aspect ratio
   */
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
    preserveAspectRatio: boolean,
  ): { width: number; height: number } {
    if (!preserveAspectRatio) {
      return {
        width: Math.min(originalWidth, maxWidth),
        height: Math.min(originalHeight, maxHeight),
      };
    }

    let width = originalWidth;
    let height = originalHeight;

    // Scale down if exceeds max dimensions
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }

    return { width, height };
  }

  /**
   * Convert canvas to blob with promise wrapper
   */
  private canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string,
    quality: number,
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas to blob conversion failed"));
          }
        },
        type,
        quality,
      );
    });
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Get image dimensions from file
   */
  async getImageDimensions(
    file: File | Blob,
  ): Promise<{ width: number; height: number }> {
    try {
      const imageBitmap = await createImageBitmap(file);
      const { width, height } = imageBitmap;
      imageBitmap.close();
      return { width, height };
    } catch (error) {
      this.logger.error("Failed to get image dimensions:", error);
      throw error;
    }
  }

  /**
   * Validate image file
   */
  validateImage(
    file: File,
    options: {
      maxSizeBytes?: number;
      allowedTypes?: string[];
    } = {},
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const {
      maxSizeBytes = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
    } = options;

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`Invalid file type. Allowed: ${allowedTypes.join(", ")}`);
    }

    // Check file size
    if (file.size > maxSizeBytes) {
      errors.push(
        `File too large. Maximum size: ${this.formatBytes(maxSizeBytes)}`,
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
