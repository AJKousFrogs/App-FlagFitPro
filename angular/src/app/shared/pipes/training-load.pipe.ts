import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "trainingLoad",
  standalone: true,
})
export class TrainingLoadPipe implements PipeTransform {
  transform(
    load: number | null | undefined,
    output: "label" | "full" = "label",
  ): string {
    if (load === null || load === undefined || load < 0) {
      return "--";
    }

    const level = this.getLevel(load);

    if (output === "full") {
      return `${level.label} (${load.toFixed(0)} AU)`;
    }

    return level.label;
  }

  private getLevel(load: number): { label: string; color: string } {
    if (load < 200) return { label: "Low", color: "var(--ui-info)" };
    if (load < 400) return { label: "Moderate", color: "var(--ui-success)" };
    if (load < 600) return { label: "High", color: "var(--ui-warning)" };
    return { label: "Very High", color: "var(--ui-danger)" };
  }
}
