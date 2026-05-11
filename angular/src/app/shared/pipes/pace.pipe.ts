import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "pace",
  standalone: true,
})
export class PacePipe implements PipeTransform {
  transform(
    speedMs: number | null | undefined,
    unit: "min/km" | "min/mi" | "km/h" | "mph" = "min/km",
  ): string {
    if (!speedMs || speedMs <= 0) {
      return "--";
    }

    switch (unit) {
      case "km/h":
        return `${(speedMs * 3.6).toFixed(1)} km/h`;
      case "mph":
        return `${(speedMs * 2.23694).toFixed(1)} mph`;
      case "min/mi": {
        const secPerMile = 1609.34 / speedMs;
        return this.formatMinSec(secPerMile) + " /mi";
      }
      default: {
        const secPerKm = 1000 / speedMs;
        return this.formatMinSec(secPerKm) + " /km";
      }
    }
  }

  private formatMinSec(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
}
