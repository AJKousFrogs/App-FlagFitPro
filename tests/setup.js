/**
 * Test Setup for FlagFit Pro
 *
 * Global test configuration and mocks for Vitest.
 * This file is loaded before all tests run.
 */

import "@testing-library/jest-dom";
import { beforeEach, vi } from "vitest";

// ============================================================================
// DOM API Mocks
// ============================================================================

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.location
const mockLocation = {
  href: "http://localhost:8888/",
  origin: "http://localhost:8888",
  protocol: "http:",
  host: "localhost:8888",
  hostname: "localhost",
  port: "8888",
  pathname: "/",
  search: "",
  hash: "",
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

// ============================================================================
// Storage Mocks
// ============================================================================

// Mock localStorage
const localStorageMock = {
  store: new Map(),
  getItem: vi.fn(function (key) {
    return this.store.get(key) || null;
  }),
  setItem: vi.fn(function (key, value) {
    this.store.set(key, String(value));
  }),
  removeItem: vi.fn(function (key) {
    this.store.delete(key);
  }),
  clear: vi.fn(function () {
    this.store.clear();
  }),
  get length() {
    return this.store.size;
  },
  key: vi.fn(function (index) {
    return Array.from(this.store.keys())[index] || null;
  }),
};

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock sessionStorage
const sessionStorageMock = {
  store: new Map(),
  getItem: vi.fn(function (key) {
    return this.store.get(key) || null;
  }),
  setItem: vi.fn(function (key, value) {
    this.store.set(key, String(value));
  }),
  removeItem: vi.fn(function (key) {
    this.store.delete(key);
  }),
  clear: vi.fn(function () {
    this.store.clear();
  }),
  get length() {
    return this.store.size;
  },
  key: vi.fn(function (index) {
    return Array.from(this.store.keys())[index] || null;
  }),
};

Object.defineProperty(global, "sessionStorage", {
  value: sessionStorageMock,
  writable: true,
});

// ============================================================================
// Fetch Mock
// ============================================================================

global.fetch = vi.fn();

// ============================================================================
// Observer Mocks
// ============================================================================

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: "",
  thresholds: [],
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock MutationObserver
global.MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn().mockReturnValue([]),
}));

// ============================================================================
// Performance API Mock
// ============================================================================

global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn().mockReturnValue([]),
  getEntriesByType: vi.fn().mockReturnValue([]),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
};

// ============================================================================
// Notification API Mock
// ============================================================================

global.Notification = vi.fn().mockImplementation((title, options) => ({
  title,
  options,
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

global.Notification.permission = "granted";
global.Notification.requestPermission = vi.fn().mockResolvedValue("granted");

// ============================================================================
// Crypto API Mock
// ============================================================================

global.crypto = {
  randomUUID: vi.fn(() => `test-uuid-${  Math.random().toString(36).substr(2, 9)}`),
  getRandomValues: vi.fn((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
  subtle: {
    encrypt: vi.fn(),
    decrypt: vi.fn(),
    sign: vi.fn(),
    verify: vi.fn(),
    digest: vi.fn(),
    generateKey: vi.fn(),
    deriveKey: vi.fn(),
    deriveBits: vi.fn(),
    importKey: vi.fn(),
    exportKey: vi.fn(),
    wrapKey: vi.fn(),
    unwrapKey: vi.fn(),
  },
};

// ============================================================================
// Console Mock (optional - for cleaner test output)
// ============================================================================

// Uncomment to suppress console output during tests
// global.console = {
//   ...console,
//   log: vi.fn(),
//   debug: vi.fn(),
//   info: vi.fn(),
//   warn: vi.fn(),
//   error: vi.fn(),
// };

// ============================================================================
// Animation Frame Mock
// ============================================================================

global.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(callback, 16);
});

global.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id);
});

// ============================================================================
// URL Mock
// ============================================================================

global.URL.createObjectURL = vi.fn(() => "blob:http://localhost/test-blob");
global.URL.revokeObjectURL = vi.fn();

// ============================================================================
// File and Blob Mocks
// ============================================================================

global.File = class MockFile {
  constructor(bits, name, options = {}) {
    this.bits = bits;
    this.name = name;
    this.type = options.type || "";
    this.lastModified = options.lastModified || Date.now();
    this.size = bits.reduce((acc, bit) => acc + bit.length, 0);
  }

  text() {
    return Promise.resolve(this.bits.join(""));
  }

  arrayBuffer() {
    const encoder = new TextEncoder();
    return Promise.resolve(encoder.encode(this.bits.join("")).buffer);
  }
};

global.Blob = class MockBlob {
  constructor(bits = [], options = {}) {
    this.bits = bits;
    this.type = options.type || "";
    this.size = bits.reduce((acc, bit) => {
      if (typeof bit === "string") {return acc + bit.length;}
      if (bit instanceof ArrayBuffer) {return acc + bit.byteLength;}
      return acc;
    }, 0);
  }

  text() {
    return Promise.resolve(this.bits.join(""));
  }

  arrayBuffer() {
    const encoder = new TextEncoder();
    return Promise.resolve(encoder.encode(this.bits.join("")).buffer);
  }

  slice(start, end, contentType) {
    return new MockBlob([this.bits.join("").slice(start, end)], {
      type: contentType || this.type,
    });
  }
};

// ============================================================================
// FormData Mock
// ============================================================================

global.FormData = class MockFormData {
  constructor() {
    this._data = new Map();
  }

  append(key, value) {
    if (!this._data.has(key)) {
      this._data.set(key, []);
    }
    this._data.get(key).push(value);
  }

  get(key) {
    const values = this._data.get(key);
    return values ? values[0] : null;
  }

  getAll(key) {
    return this._data.get(key) || [];
  }

  has(key) {
    return this._data.has(key);
  }

  delete(key) {
    this._data.delete(key);
  }

  set(key, value) {
    this._data.set(key, [value]);
  }

  entries() {
    const entries = [];
    this._data.forEach((values, key) => {
      values.forEach((value) => entries.push([key, value]));
    });
    return entries[Symbol.iterator]();
  }

  keys() {
    return this._data.keys();
  }

  values() {
    const values = [];
    this._data.forEach((v) => values.push(...v));
    return values[Symbol.iterator]();
  }

  forEach(callback) {
    this._data.forEach((values, key) => {
      values.forEach((value) => callback(value, key, this));
    });
  }
};

// ============================================================================
// Test Lifecycle Hooks
// ============================================================================

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();

  // Clear storage
  localStorageMock.store.clear();
  sessionStorageMock.store.clear();

  // Reset location
  mockLocation.href = "http://localhost:8888/";
  mockLocation.pathname = "/";
  mockLocation.search = "";
  mockLocation.hash = "";
});

// ============================================================================
// Custom Matchers (optional)
// ============================================================================

// Add custom matchers if needed
// expect.extend({
//   toBeValidEmail(received) {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     const pass = emailRegex.test(received);
//     return {
//       pass,
//       message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid email`,
//     };
//   },
// });
