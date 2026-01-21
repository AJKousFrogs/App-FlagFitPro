/**
 * Data Export Service
 *
 * Handles exporting data to various formats (CSV, JSON).
 * Split from performance-data.service.ts for single responsibility.
 *
 * Responsibilities:
 * - Export to CSV
 * - Export to JSON
 * - File download utilities
 */

import { Injectable, inject } from "@angular/core";
import { LoggerService } from "./logger.service";

export interface ExportOptions {
  format: "csv" | "json";
  filename?: string;
  includeHeaders?: boolean;
}

@Injectable({
  providedIn: "root",
})
export class DataExportService {
  private logger = inject(LoggerService);

  /**
   * Export data to CSV format
   */
  exportToCSV<T extends Record<string, unknown>>(
    data: T[],
    filename: string = "export"
  ): void {
    if (!data || data.length === 0) {
      this.logger.warn("No data to export");
      return;
    }

    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    this.downloadBlob(blob, `${filename}.csv`);
  }

  /**
   * Export data to JSON format
   */
  exportToJSON<T>(data: T[], filename: string = "export"): void {
    if (!data || data.length === 0) {
      this.logger.warn("No data to export");
      return;
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    this.downloadBlob(blob, `${filename}.json`);
  }

  /**
   * Export multiple data sets
   */
  exportMultiple(
    datasets: Record<string, unknown[]>,
    options: ExportOptions
  ): void {
    const { format, filename = "export" } = options;

    if (format === "csv") {
      // For CSV, combine all datasets
      const combined: Record<string, unknown>[] = [];

      for (const [key, data] of Object.entries(datasets)) {
        if (Array.isArray(data)) {
          data.forEach((item) => {
            combined.push({ _type: key, ...(item as Record<string, unknown>) });
          });
        }
      }

      this.exportToCSV(combined, filename);
    } else {
      this.exportToJSON(Object.values(datasets).flat(), filename);
    }
  }

  /**
   * Convert data array to CSV string
   */
  private convertToCSV<T extends Record<string, unknown>>(data: T[]): string {
    if (data.length === 0) return "";

    // Get all unique headers from all objects
    const headers = new Set<string>();
    data.forEach((item) => {
      Object.keys(item).forEach((key) => headers.add(key));
    });

    const headerArray = Array.from(headers);

    // Build CSV string
    const lines: string[] = [];

    // Header row
    lines.push(headerArray.map((h) => this.escapeCSVValue(h)).join(","));

    // Data rows
    data.forEach((item) => {
      const values = headerArray.map((header) => {
        const value = item[header];
        return this.escapeCSVValue(this.formatValue(value));
      });
      lines.push(values.join(","));
    });

    return lines.join("\n");
  }

  /**
   * Escape CSV value
   */
  private escapeCSVValue(value: string): string {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  /**
   * Format value for export
   */
  private formatValue(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Download blob as file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
