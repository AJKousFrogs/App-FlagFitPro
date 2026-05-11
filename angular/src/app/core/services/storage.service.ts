import { Injectable } from "@angular/core";

const KEY_PREFIX = "ffp_";

interface StorageEntry<T> {
  value: T;
  expiresAt: number | null;
}

@Injectable({
  providedIn: "root",
})
export class StorageService {
  get<T>(key: string, defaultValue: T): T;
  get<T>(key: string): T | null;
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const raw = localStorage.getItem(KEY_PREFIX + key);
      if (raw === null) return defaultValue ?? null;

      const entry: StorageEntry<T> = JSON.parse(raw);

      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.remove(key);
        return defaultValue ?? null;
      }

      return entry.value;
    } catch {
      return defaultValue ?? null;
    }
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    try {
      const entry: StorageEntry<T> = {
        value,
        expiresAt: ttlMs ? Date.now() + ttlMs : null,
      };
      localStorage.setItem(KEY_PREFIX + key, JSON.stringify(entry));
    } catch {
      // Storage full or unavailable — fail silently
    }
  }

  remove(key: string): void {
    localStorage.removeItem(KEY_PREFIX + key);
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(KEY_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }
}
