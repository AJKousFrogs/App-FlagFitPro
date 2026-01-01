/**
 * Wearable Parser Service
 *
 * AI-powered parser for wearable device data formats (CSV, JSON, XML)
 * Handles various device formats and normalizes to standard format
 */

import { Injectable } from "@angular/core";

export interface ParsedWearableData {
  data: Array<{ speed_m_s: number; distance_m: number }>;
  metadata: {
    deviceType?: string;
    deviceModel?: string;
    startTime?: string;
    endTime?: string;
    totalSamples: number;
    samplingRate?: number;
    fields: string[];
  };
  errors?: string[];
}

export interface ParseOptions {
  deviceType?: "garmin" | "polar" | "suunto" | "fitbit" | "apple" | "generic";
  autoDetect?: boolean; // Auto-detect format
}

interface JsonDataStructure {
  data?: unknown[];
  samples?: unknown[];
  records?: unknown[];
  deviceType?: string;
  deviceModel?: string;
  startTime?: string;
  timestamp?: string;
  [key: string]: unknown;
}

type WearableDataEntry = Record<string, unknown>;

@Injectable({
  providedIn: "root",
})
export class WearableParserService {
  /**
   * Parse uploaded file (CSV, JSON, or XML)
   */
  async parseFile(
    file: File,
    options: ParseOptions = {},
  ): Promise<ParsedWearableData> {
    const extension = file.name.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "csv":
        return this.parseCSV(file, options);
      case "json":
        return this.parseJSON(file, options);
      case "xml":
        return this.parseXML(file, options);
      default:
        throw new Error(
          `Unsupported file format: ${extension}. Supported: CSV, JSON, XML`,
        );
    }
  }

  /**
   * Parse CSV file
   */
  private async parseCSV(
    file: File,
    options: ParseOptions,
  ): Promise<ParsedWearableData> {
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header and one data row");
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const data: Array<{ speed_m_s: number; distance_m: number }> = [];
    const errors: string[] = [];

    // Detect speed and distance columns
    const speedCol = this.findColumn(headers, [
      "speed",
      "velocity",
      "pace",
      "speed_m_s",
      "speed_ms",
    ]);
    const distanceCol = this.findColumn(headers, [
      "distance",
      "dist",
      "distance_m",
      "distance_meters",
      "total_distance",
    ]);

    if (!speedCol && !distanceCol) {
      throw new Error("Could not find speed or distance columns in CSV");
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);

        let speed = 0;
        let distance = 0;

        if (speedCol !== null) {
          const speedVal = parseFloat(values[speedCol]);
          if (!isNaN(speedVal)) {
            // Convert if needed (km/h to m/s, or pace to m/s)
            speed = this.normalizeSpeed(speedVal, headers[speedCol]);
          }
        }

        if (distanceCol !== null) {
          const distVal = parseFloat(values[distanceCol]);
          if (!isNaN(distVal)) {
            distance = this.normalizeDistance(distVal, headers[distanceCol]);
          }
        }

        // Calculate missing values
        const calculated = this.calculateMissingValue(speed, distance);
        speed = calculated.speed;
        distance = calculated.distance;

        if (speed > 0 || distance > 0) {
          data.push({ speed_m_s: speed, distance_m: distance });
        }
      } catch (error) {
        errors.push(
          `Row ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    return {
      data,
      metadata: {
        deviceType: options.deviceType || "generic",
        totalSamples: data.length,
        fields: headers,
      },
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Parse JSON file
   */
  private async parseJSON(
    file: File,
    options: ParseOptions,
  ): Promise<ParsedWearableData> {
    const text = await file.text();
    let jsonData: JsonDataStructure;

    try {
      jsonData = JSON.parse(text);
    } catch (error) {
      throw new Error("Invalid JSON format");
    }

    // Handle different JSON structures
    let dataArray: unknown[] = [];

    if (Array.isArray(jsonData)) {
      dataArray = jsonData;
    } else if (jsonData.data && Array.isArray(jsonData.data)) {
      dataArray = jsonData.data;
    } else if (jsonData.samples && Array.isArray(jsonData.samples)) {
      dataArray = jsonData.samples;
    } else if (jsonData.records && Array.isArray(jsonData.records)) {
      dataArray = jsonData.records;
    } else {
      throw new Error(
        "JSON structure not recognized. Expected array or object with data/samples/records array",
      );
    }

    const data: Array<{ speed_m_s: number; distance_m: number }> = [];
    const errors: string[] = [];

    for (let i = 0; i < dataArray.length; i++) {
      try {
        const entry = dataArray[i];
        let speed = 0;
        let distance = 0;

        // Try various field names
        speed = this.extractSpeed(entry as WearableDataEntry);
        distance = this.extractDistance(entry as WearableDataEntry);

        // Calculate missing values
        const calculated = this.calculateMissingValue(speed, distance);
        speed = calculated.speed;
        distance = calculated.distance;

        if (speed > 0 || distance > 0) {
          data.push({ speed_m_s: speed, distance_m: distance });
        }
      } catch (error) {
        errors.push(
          `Entry ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    return {
      data,
      metadata: {
        deviceType: jsonData.deviceType || options.deviceType || "generic",
        deviceModel: jsonData.deviceModel,
        startTime: jsonData.startTime || jsonData.timestamp,
        totalSamples: data.length,
        fields: Object.keys(dataArray[0] || {}),
      },
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Parse XML file
   */
  private async parseXML(
    file: File,
    options: ParseOptions,
  ): Promise<ParsedWearableData> {
    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");

    // Check for parsing errors
    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
      throw new Error("Invalid XML format");
    }

    // Try to find data elements (common patterns)
    const samples = xmlDoc.querySelectorAll(
      "sample, record, point, data, trackpoint",
    );
    const data: Array<{ speed_m_s: number; distance_m: number }> = [];
    const errors: string[] = [];

    samples.forEach((sample, index) => {
      try {
        let speed = 0;
        let distance = 0;

        // Extract speed
        const speedEl = sample.querySelector("speed, velocity, pace");
        if (speedEl) {
          speed = this.normalizeSpeed(
            parseFloat(speedEl.textContent || "0"),
            speedEl.tagName,
          );
        }

        // Extract distance
        const distanceEl = sample.querySelector("distance, dist");
        if (distanceEl) {
          distance = this.normalizeDistance(
            parseFloat(distanceEl.textContent || "0"),
            distanceEl.tagName,
          );
        }

        if (speed > 0 || distance > 0) {
          data.push({ speed_m_s: speed, distance_m: distance });
        }
      } catch (error) {
        errors.push(
          `Sample ${index + 1}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    });

    return {
      data,
      metadata: {
        deviceType: options.deviceType || "generic",
        totalSamples: data.length,
        fields: [], // Add empty fields array to satisfy type requirement
      },
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Helper: Find column index by name patterns
   */
  private findColumn(headers: string[], patterns: string[]): number | null {
    for (const pattern of patterns) {
      const index = headers.findIndex((h) => h.includes(pattern));
      if (index !== -1) return index;
    }
    return null;
  }

  /**
   * Helper: Parse CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Helper: Extract speed from object
   */
  private extractSpeed(obj: WearableDataEntry): number {
    const speedFields = [
      "speed_m_s",
      "speed",
      "velocity",
      "pace",
      "speed_ms",
      "speedMs",
    ];
    for (const field of speedFields) {
      if (obj[field] !== undefined) {
        return this.normalizeSpeed(parseFloat(String(obj[field])), field);
      }
    }
    return 0;
  }

  /**
   * Helper: Extract distance from object
   */
  private extractDistance(obj: WearableDataEntry): number {
    const distanceFields = [
      "distance_m",
      "distance",
      "dist",
      "distance_meters",
      "distanceMeters",
      "total_distance",
    ];
    for (const field of distanceFields) {
      if (obj[field] !== undefined) {
        return this.normalizeDistance(parseFloat(String(obj[field])), field);
      }
    }
    return 0;
  }

  /**
   * Helper: Calculate missing value (speed or distance) from the other
   */
  private calculateMissingValue(
    speed: number,
    distance: number,
  ): { speed: number; distance: number } {
    // Calculate distance from speed if distance not provided (assume 1 Hz sampling)
    if (distance === 0 && speed > 0) {
      distance = speed;
    }
    // Calculate speed from distance if speed not provided (assume 1 Hz sampling)
    if (speed === 0 && distance > 0) {
      speed = distance;
    }
    return { speed, distance };
  }

  /**
   * Helper: Normalize speed to m/s
   */
  private normalizeSpeed(value: number, fieldName: string): number {
    const field = fieldName.toLowerCase();

    // Already in m/s
    if (field.includes("speed_m_s") || field.includes("speedms")) {
      return value;
    }

    // km/h to m/s
    if (field.includes("kmh") || field.includes("km/h")) {
      return value / 3.6;
    }

    // Pace (min/km) to m/s
    if (field.includes("pace")) {
      return 1000 / (value * 60); // Convert min/km to m/s
    }

    // Assume m/s if unclear
    return value;
  }

  /**
   * Helper: Normalize distance to meters
   */
  private normalizeDistance(value: number, fieldName: string): number {
    const field = fieldName.toLowerCase();

    // Already in meters
    if (
      field.includes("distance_m") ||
      field.includes("meters") ||
      field.includes("metres")
    ) {
      return value;
    }

    // Kilometers to meters
    if (field.includes("km") || field.includes("kilometer")) {
      return value * 1000;
    }

    // Assume meters if unclear
    return value;
  }
}
