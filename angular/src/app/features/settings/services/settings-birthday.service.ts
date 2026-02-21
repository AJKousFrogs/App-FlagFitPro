import { Injectable, signal } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { calculateAge } from "../../../shared/utils/date.utils";

export interface BirthdaySuggestion {
  date: Date | null;
  age: number | null;
  formatted: string;
}

@Injectable({
  providedIn: "root",
})
export class SettingsBirthdayService {
  readonly birthdaySuggestion = signal<BirthdaySuggestion | null>(null);

  clearSuggestion(): void {
    this.birthdaySuggestion.set(null);
  }

  parseAndSuggestBirthday(typedValue: string, maxBirthDate: Date): void {
    const formats = [
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
      /^(\d{1,2})\.(\d{1,2})\.(\d{2})$/,
      /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/,
    ];

    let parsedDate: Date | null = null;
    let day = 0;
    let month = 0;
    let year = 0;

    for (const format of formats) {
      const match = typedValue.match(format);
      if (!match) {
        continue;
      }

      const [, part1, part2, part3] = match;
      const num1 = parseInt(part1, 10);
      const num2 = parseInt(part2, 10);
      const num3 = parseInt(part3, 10);

      if (num1 > 12) {
        day = num1;
        month = num2 - 1;
        year = num3 < 100 ? 2000 + num3 : num3;
      } else if (num2 > 12) {
        month = num1 - 1;
        day = num2;
        year = num3 < 100 ? 2000 + num3 : num3;
      } else if (num1 <= 31 && num2 <= 12) {
        day = num1;
        month = num2 - 1;
        year = num3 < 100 ? 2000 + num3 : num3;
      } else {
        month = num1 - 1;
        day = num2;
        year = num3 < 100 ? 2000 + num3 : num3;
      }

      parsedDate = new Date(year, month, day);
      if (
        parsedDate.getFullYear() === year &&
        parsedDate.getMonth() === month &&
        parsedDate.getDate() === day
      ) {
        const today = new Date();
        if (parsedDate <= today && parsedDate <= maxBirthDate) {
          break;
        }
      }

      parsedDate = null;
    }

    if (parsedDate && !isNaN(parsedDate.getTime())) {
      this.birthdaySuggestion.set({
        date: parsedDate,
        age: calculateAge(parsedDate),
        formatted: parsedDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      });
      return;
    }

    this.birthdaySuggestion.set(null);
  }

  applyBirthdaySuggestion(dateControl: AbstractControl | null): void {
    const suggestion = this.birthdaySuggestion();
    if (!suggestion?.date || !dateControl) {
      return;
    }

    dateControl.setValue(suggestion.date);
    this.birthdaySuggestion.set(null);
  }
}
