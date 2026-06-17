import { Pipe, PipeTransform } from "@angular/core";

export interface HeartRateZoneResult {
  zone: number;
  label: string;
  color: string;
}

const ZONE_DEFINITIONS: HeartRateZoneResult[] = [
  { zone: 1, label: "Recovery", color: "var(--ui-info)" },
  { zone: 2, label: "Aerobic", color: "var(--ui-success)" },
  { zone: 3, label: "Tempo", color: "var(--ui-warning)" },
  { zone: 4, label: "Threshold", color: "var(--primitive-warning-600)" },
  { zone: 5, label: "Max Effort", color: "var(--ui-danger)" },
];

@Pipe({
  name: "heartRateZone",
  standalone: true,
})
export class HeartRateZonePipe implements PipeTransform {
  transform(
    bpm: number | null | undefined,
    maxHr: number = 200,
    output: "label" | "zone" | "full" = "label",
  ): string {
    if (!bpm || bpm <= 0 || maxHr <= 0) {
      return "--";
    }

    const pct = (bpm / maxHr) * 100;
    let zoneIdx: number;

    if (pct < 60) zoneIdx = 0;
    else if (pct < 70) zoneIdx = 1;
    else if (pct < 80) zoneIdx = 2;
    else if (pct < 90) zoneIdx = 3;
    else zoneIdx = 4;

    const zone = ZONE_DEFINITIONS[zoneIdx];

    switch (output) {
      case "zone":
        return `Z${zone.zone}`;
      case "full":
        return `Z${zone.zone} - ${zone.label}`;
      default:
        return zone.label;
    }
  }
}
