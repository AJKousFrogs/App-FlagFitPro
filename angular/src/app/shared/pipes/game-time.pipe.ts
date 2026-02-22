import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "gameTime",
})
export class GameTimePipe implements PipeTransform {
  transform(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined) {
      return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
}
