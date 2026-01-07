/**
 * Schedule File Parser Service
 * Parses CSV, Excel, and Markdown training schedule files
 */

import { logger } from "../../logger.js";

class ScheduleFileParser {
  /**
   * Parse uploaded file and extract training schedule data
   * @param {File} file - The uploaded file
   * @returns {Promise<Object>} Parsed schedule data
   */
  async parseFile(file) {
    const fileType = this.getFileType(file.name);

    try {
      switch (fileType) {
        case "csv":
          return await this.parseCSV(file);
        case "excel":
          return await this.parseExcel(file);
        case "markdown":
          return await this.parseMarkdown(file);
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      logger.error("Error parsing schedule file:", error);
      throw error;
    }
  }

  /**
   * Get file type from filename
   */
  getFileType(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    if (ext === "csv") {
      return "csv";
    }
    if (["xlsx", "xls"].includes(ext)) {
      return "excel";
    }
    if (["md", "markdown"].includes(ext)) {
      return "markdown";
    }
    return null;
  }

  /**
   * Parse CSV file
   */
  async parseCSV(file) {
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length === 0) {
      throw new Error("CSV file is empty");
    }

    // Parse header
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    // Expected columns: date, day, workout_type, workout_title, duration, notes, is_game_day
    const schedule = {
      gameDays: [],
      workouts: [],
      customSchedule: true,
    };

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row = {};

      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || "";
      });

      // Extract date
      if (row.date) {
        const date = this.parseDate(row.date);
        if (date) {
          // Check if it's a game day
          const isGameDay =
            row.is_game_day?.toLowerCase() === "true" ||
            row.is_game_day?.toLowerCase() === "yes" ||
            row.game_day?.toLowerCase() === "true" ||
            row.game_day?.toLowerCase() === "yes";

          if (isGameDay) {
            schedule.gameDays.push({
              date: date.toISOString().split("T")[0],
              dayOfWeek: date.getDay(),
            });
          }

          // Add workout if present
          if (row.workout_type || row.workout_title) {
            schedule.workouts.push({
              date: date.toISOString().split("T")[0],
              dayOfWeek: date.getDay(),
              type: row.workout_type || "custom",
              title: row.workout_title || row.workout_type || "Custom Workout",
              duration: parseInt(row.duration) || 60,
              notes: row.notes || "",
            });
          }
        }
      }
    }

    return schedule;
  }

  /**
   * Parse CSV line handling quoted values
   */
  parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);

    return result;
  }

  /**
   * Parse Excel file (XLSX/XLS)
   * Note: This requires a library like SheetJS. For now, we'll provide a basic implementation.
   */
  async parseExcel(file) {
    // Check if SheetJS is available
    if (typeof XLSX === "undefined") {
      throw new Error(
        "Excel parsing requires SheetJS library. Please include it in your HTML: " +
          '<script src="https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js"></script>',
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet);

    const schedule = {
      gameDays: [],
      workouts: [],
      customSchedule: true,
    };

    data.forEach((row) => {
      // Try to find date column (case-insensitive)
      const dateKey = Object.keys(row).find((key) =>
        key.toLowerCase().includes("date"),
      );

      if (dateKey && row[dateKey]) {
        const date = this.parseDate(row[dateKey]);
        if (date) {
          // Check for game day
          const gameDayKey = Object.keys(row).find((key) =>
            key.toLowerCase().includes("game"),
          );
          const isGameDay =
            gameDayKey &&
            (row[gameDayKey]?.toString().toLowerCase() === "true" ||
              row[gameDayKey]?.toString().toLowerCase() === "yes" ||
              row[gameDayKey]?.toString().toLowerCase() === "1");

          if (isGameDay) {
            schedule.gameDays.push({
              date: date.toISOString().split("T")[0],
              dayOfWeek: date.getDay(),
            });
          }

          // Add workout
          const workoutTypeKey = Object.keys(row).find(
            (key) =>
              key.toLowerCase().includes("workout") ||
              key.toLowerCase().includes("type"),
          );
          const workoutTitleKey = Object.keys(row).find(
            (key) =>
              key.toLowerCase().includes("title") ||
              key.toLowerCase().includes("name"),
          );

          if (workoutTypeKey || workoutTitleKey) {
            schedule.workouts.push({
              date: date.toISOString().split("T")[0],
              dayOfWeek: date.getDay(),
              type: row[workoutTypeKey] || "custom",
              title:
                row[workoutTitleKey] || row[workoutTypeKey] || "Custom Workout",
              duration: parseInt(row.duration || row.duration_minutes || 60),
              notes: row.notes || row.description || "",
            });
          }
        }
      }
    });

    return schedule;
  }

  /**
   * Parse Markdown file
   */
  async parseMarkdown(file) {
    const text = await file.text();
    const lines = text.split("\n");

    const schedule = {
      gameDays: [],
      workouts: [],
      customSchedule: true,
    };

    // Look for markdown table or date patterns
    let inTable = false;
    let headers = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect markdown table
      if (line.startsWith("|") && line.includes("---")) {
        inTable = true;
        // Parse headers from previous line
        if (i > 0) {
          headers = lines[i - 1]
            .split("|")
            .map((h) => h.trim().toLowerCase())
            .filter((h) => h);
        }
        continue;
      }

      if (inTable && line.startsWith("|")) {
        const values = line
          .split("|")
          .map((v) => v.trim())
          .filter((v) => v);

        if (values.length === headers.length) {
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });

          // Parse date
          const dateKey = Object.keys(row).find((k) =>
            k.toLowerCase().includes("date"),
          );
          if (dateKey && row[dateKey]) {
            const date = this.parseDate(row[dateKey]);
            if (date) {
              // Check for game day
              const gameDayKey = Object.keys(row).find((k) =>
                k.toLowerCase().includes("game"),
              );
              const isGameDay =
                gameDayKey &&
                (row[gameDayKey]?.toLowerCase() === "true" ||
                  row[gameDayKey]?.toLowerCase() === "yes" ||
                  row[gameDayKey] === "✓" ||
                  row[gameDayKey] === "x");

              if (isGameDay) {
                schedule.gameDays.push({
                  date: date.toISOString().split("T")[0],
                  dayOfWeek: date.getDay(),
                });
              }

              // Add workout
              const workoutKey = Object.keys(row).find(
                (k) =>
                  k.toLowerCase().includes("workout") ||
                  k.toLowerCase().includes("type"),
              );
              if (workoutKey && row[workoutKey]) {
                schedule.workouts.push({
                  date: date.toISOString().split("T")[0],
                  dayOfWeek: date.getDay(),
                  type: row[workoutKey].toLowerCase(),
                  title: row[workoutKey],
                  duration: parseInt(row.duration || 60),
                  notes: row.notes || "",
                });
              }
            }
          }
        }
      }

      // Also look for date patterns in text
      const dateMatch = line.match(/(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/);
      if (dateMatch) {
        const date = this.parseDate(dateMatch[1]);
        if (date) {
          // Check if line mentions "game" or "match"
          if (/game|match|competition/i.test(line)) {
            schedule.gameDays.push({
              date: date.toISOString().split("T")[0],
              dayOfWeek: date.getDay(),
            });
          }
        }
      }
    }

    return schedule;
  }

  /**
   * Parse date string in various formats
   */
  parseDate(dateString) {
    if (!dateString) {
      return null;
    }

    // Try ISO format (YYYY-MM-DD)
    let date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Try MM/DD/YYYY
    const parts = dateString.split("/");
    if (parts.length === 3) {
      date = new Date(parts[2], parts[0] - 1, parts[1]);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // Try DD/MM/YYYY
    if (parts.length === 3) {
      date = new Date(parts[2], parts[1] - 1, parts[0]);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    return null;
  }

  /**
   * Validate parsed schedule data
   */
  validateSchedule(schedule) {
    const errors = [];

    if (!schedule.gameDays || !Array.isArray(schedule.gameDays)) {
      errors.push("Invalid game days format");
    }

    if (!schedule.workouts || !Array.isArray(schedule.workouts)) {
      errors.push("Invalid workouts format");
    }

    // Validate dates
    schedule.gameDays?.forEach((gameDay, index) => {
      if (!gameDay.date || !gameDay.dayOfWeek) {
        errors.push(`Invalid game day at index ${index}`);
      }
    });

    if (errors.length > 0) {
      throw new Error(`Schedule validation failed: ${errors.join(", ")}`);
    }

    return true;
  }
}

// Export singleton instance
export const scheduleFileParser = new ScheduleFileParser();
