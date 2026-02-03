import { Injectable } from "@angular/core";

function formatMessage(message: string, title?: string): string {
  if (title) {
    return `${title}\n\n${message}`;
  }
  return message;
}

@Injectable({
  providedIn: "root",
})
export class DialogService {
  confirm(message: string, title?: string): Promise<boolean> {
    if (typeof window === "undefined") {
      return Promise.resolve(true);
    }
    const response = window.confirm(formatMessage(message, title));
    return Promise.resolve(response);
  }

  prompt(
    message: string,
    defaultValue: string = "",
    title?: string,
  ): Promise<string | null> {
    if (typeof window === "undefined") {
      return Promise.resolve(defaultValue);
    }
    const response = window.prompt(
      formatMessage(message, title),
      defaultValue,
    );
    return Promise.resolve(response);
  }

  alert(message: string, title?: string): Promise<void> {
    if (typeof window === "undefined") {
      return Promise.resolve();
    }
    window.alert(formatMessage(message, title));
    return Promise.resolve();
  }
}
