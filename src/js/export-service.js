import { logger } from '../logger.js';

/**
 * FlagFit Pro - Export Service
 * Export data to PDF and CSV formats
 * 100% FREE - Uses jsPDF (loaded via CDN)
 */

class ExportService {
  constructor() {
    this.jsPDFLoaded = false;
    this.loadJsPDF();
  }

  /**
   * Load jsPDF library from CDN
   */
  async loadJsPDF() {
    if (window.jspdf) {
      this.jsPDFLoaded = true;
      return;
    }

    try {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.async = true;

      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      this.jsPDFLoaded = true;
      logger.info("[Export] jsPDF loaded successfully");
    } catch (error) {
      logger.error("[Export] Failed to load jsPDF:", error);
    }
  }

  /**
   * Export data to CSV
   */
  exportToCSV(data, filename = "flagfit-export.csv") {
    if (!data || data.length === 0) {
      logger.warn("[Export] No data to export");
      return;
    }

    try {
      // Get headers from first object
      const headers = Object.keys(data[0]);

      // Create CSV content
      const csvContent = [
        // Header row
        headers.join(","),
        // Data rows
        ...data.map((row) =>
          headers
            .map((header) => {
              let value = row[header];

              // Handle special characters
              if (typeof value === "string") {
                // Escape quotes and wrap in quotes if contains comma
                if (
                  value.includes(",") ||
                  value.includes('"') ||
                  value.includes("\n")
                ) {
                  value = '"' + value.replace(/"/g, '""') + '"';
                }
              }

              return value ?? "";
            })
            .join(","),
        ),
      ].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      this.downloadFile(blob, filename);

      logger.info(`[Export] CSV exported: ${filename}`);
      return true;
    } catch (error) {
      logger.error("[Export] CSV export failed:", error);
      return false;
    }
  }

  /**
   * Export wellness data to PDF
   */
  async exportWellnessToPDF(
    wellnessData,
    filename = "flagfit-wellness-report.pdf",
  ) {
    if (!this.jsPDFLoaded) {
      await this.loadJsPDF();
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      logger.error("[Export] jsPDF not available");
      alert("PDF export is loading. Please try again in a moment.");
      return false;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;

      // Header
      doc.setFontSize(24);
      doc.setFont(undefined, "bold");
      doc.text("🏈 FlagFit Pro", pageWidth / 2, yPos, { align: "center" });

      yPos += 10;
      doc.setFontSize(18);
      doc.text("Wellness Report", pageWidth / 2, yPos, { align: "center" });

      yPos += 5;
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        yPos,
        { align: "center" },
      );

      yPos += 15;

      // Summary Stats
      if (wellnessData && wellnessData.length > 0) {
        const avgSleep = (
          wellnessData.reduce((sum, d) => sum + (d.sleep || 0), 0) /
          wellnessData.length
        ).toFixed(1);
        const avgEnergy = (
          wellnessData.reduce((sum, d) => sum + (d.energy || 0), 0) /
          wellnessData.length
        ).toFixed(1);
        const avgMood = (
          wellnessData.reduce((sum, d) => sum + (d.mood || 0), 0) /
          wellnessData.length
        ).toFixed(1);

        doc.setFontSize(12);
        doc.setFont(undefined, "bold");
        doc.text("Summary Statistics", 20, yPos);
        yPos += 8;

        doc.setFont(undefined, "normal");
        doc.setFontSize(10);
        doc.text(`Total Entries: ${wellnessData.length}`, 20, yPos);
        yPos += 6;
        doc.text(`Average Sleep: ${avgSleep} hours`, 20, yPos);
        yPos += 6;
        doc.text(`Average Energy: ${avgEnergy}/10`, 20, yPos);
        yPos += 6;
        doc.text(`Average Mood: ${avgMood}/10`, 20, yPos);
        yPos += 10;

        // Daily Entries
        doc.setFontSize(12);
        doc.setFont(undefined, "bold");
        doc.text("Daily Entries", 20, yPos);
        yPos += 8;

        doc.setFont(undefined, "normal");
        doc.setFontSize(9);

        // Table header
        doc.setFont(undefined, "bold");
        doc.text("Date", 20, yPos);
        doc.text("Sleep", 60, yPos);
        doc.text("Energy", 90, yPos);
        doc.text("Mood", 120, yPos);
        doc.text("Stress", 150, yPos);
        yPos += 6;

        doc.setFont(undefined, "normal");

        // Table rows
        wellnessData.slice(0, 30).forEach((entry, index) => {
          // Check if we need a new page
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }

          const date = new Date(entry.date).toLocaleDateString();
          doc.text(date, 20, yPos);
          doc.text(`${entry.sleep || "N/A"}h`, 60, yPos);
          doc.text(`${entry.energy || "N/A"}/10`, 90, yPos);
          doc.text(`${entry.mood || "N/A"}/10`, 120, yPos);
          doc.text(`${entry.stress || "N/A"}/10`, 150, yPos);

          yPos += 6;
        });

        if (wellnessData.length > 30) {
          yPos += 4;
          doc.setFontSize(8);
          doc.setTextColor(100);
          doc.text(
            `Showing first 30 of ${wellnessData.length} entries`,
            20,
            yPos,
          );
        }
      } else {
        doc.setFontSize(12);
        doc.text("No wellness data available", 20, yPos);
      }

      // Footer
      const footerY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Generated by FlagFit Pro", pageWidth / 2, footerY, {
        align: "center",
      });
      doc.text(
        "Professional Flag Football Training Platform",
        pageWidth / 2,
        footerY + 4,
        { align: "center" },
      );

      // Save PDF
      doc.save(filename);

      logger.info(`[Export] PDF exported: ${filename}`);
      return true;
    } catch (error) {
      logger.error("[Export] PDF export failed:", error);
      alert("PDF export failed. Please try again.");
      return false;
    }
  }

  /**
   * Export achievements to PDF
   */
  async exportAchievementsToPDF(
    achievementsData,
    filename = "flagfit-achievements.pdf",
  ) {
    if (!this.jsPDFLoaded) {
      await this.loadJsPDF();
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      logger.error("[Export] jsPDF not available");
      return false;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      doc.setFontSize(24);
      doc.setFont(undefined, "bold");
      doc.text("🏆 FlagFit Pro", pageWidth / 2, yPos, { align: "center" });

      yPos += 10;
      doc.setFontSize(18);
      doc.text("Achievements Report", pageWidth / 2, yPos, { align: "center" });

      yPos += 5;
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        yPos,
        { align: "center" },
      );

      yPos += 15;

      // Summary
      const unlocked = achievementsData.filter((a) => a.unlocked);
      const totalPoints = unlocked.reduce((sum, a) => sum + a.points, 0);

      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("Summary", 20, yPos);
      yPos += 8;

      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(
        `Unlocked: ${unlocked.length} / ${achievementsData.length}`,
        20,
        yPos,
      );
      yPos += 6;
      doc.text(`Total Points: ${totalPoints}`, 20, yPos);
      yPos += 6;
      doc.text(
        `Completion: ${Math.round((unlocked.length / achievementsData.length) * 100)}%`,
        20,
        yPos,
      );
      yPos += 12;

      // Unlocked Achievements
      if (unlocked.length > 0) {
        doc.setFontSize(12);
        doc.setFont(undefined, "bold");
        doc.text("Unlocked Achievements", 20, yPos);
        yPos += 8;

        doc.setFont(undefined, "normal");
        doc.setFontSize(10);

        unlocked.forEach((achievement) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFont(undefined, "bold");
          doc.text(`${achievement.icon} ${achievement.name}`, 20, yPos);
          yPos += 6;

          doc.setFont(undefined, "normal");
          doc.setFontSize(9);
          doc.text(achievement.description, 25, yPos);
          yPos += 5;
          doc.text(`Points: ${achievement.points}`, 25, yPos);

          if (achievement.unlockedAt) {
            doc.setTextColor(100);
            doc.text(
              `Unlocked: ${new Date(achievement.unlockedAt).toLocaleDateString()}`,
              25,
              yPos + 4,
            );
            doc.setTextColor(0);
            yPos += 4;
          }

          yPos += 8;
        });
      }

      doc.save(filename);
      logger.info(`[Export] Achievements PDF exported: ${filename}`);
      return true;
    } catch (error) {
      logger.error("[Export] Achievements PDF export failed:", error);
      return false;
    }
  }

  /**
   * Download file helper
   */
  downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  /**
   * Export training data to CSV
   */
  exportTrainingToCSV(trainingData, filename = "flagfit-training-history.csv") {
    if (!trainingData || trainingData.length === 0) {
      logger.warn("[Export] No training data to export");
      return false;
    }

    // Format data for CSV
    const csvData = trainingData.map((session) => ({
      Date: new Date(session.date || session.completedAt).toLocaleDateString(),
      Type: session.workoutType || session.type || "Training",
      Duration: `${session.duration || 0} min`,
      Score: session.score || "N/A",
      Exercises: session.exercises?.length || 0,
      Notes: session.notes || "",
    }));

    return this.exportToCSV(csvData, filename);
  }
}

// Create singleton instance
const exportService = new ExportService();

// Make available globally
window.exportService = exportService;

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = exportService;
}

logger.info("[Export] Export Service loaded");
