import { vi } from "vitest";

export const mockLoggerService = () => ({
  info: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
});
