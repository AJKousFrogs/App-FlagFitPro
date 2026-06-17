import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "duration",
  standalone: true,
})
export class DurationPipe implements PipeTransform {
  transform(
    seconds: number | null | undefined,
    format: "short" | "long" | "hms" = "short",
  ): string {
    if (seconds === null || seconds === undefined || seconds < 0) {
      return "--";
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    switch (format) {
      case "hms":
        return hours > 0
          ? `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
          : `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      case "long":
        if (hours > 0) return `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} min`;
        if (minutes > 0) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
        return `${secs} second${secs !== 1 ? "s" : ""}`;
      default:
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m`;
        return `${secs}s`;
    }
  }
}
