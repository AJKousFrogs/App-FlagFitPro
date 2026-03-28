import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveScrollContainer } from "./scroll-container";

describe("scroll-container", () => {
  let shellScrollRoot: HTMLDivElement;

  beforeEach(() => {
    shellScrollRoot = document.createElement("div");
    shellScrollRoot.dataset.scrollRoot = "app-shell-main";
    document.body.appendChild(shellScrollRoot);
  });

  afterEach(() => {
    shellScrollRoot.remove();
    document.body.innerHTML = "";
  });

  it("prefers the nearest declared shell scroll root", () => {
    const nestedElement = document.createElement("div");
    shellScrollRoot.appendChild(nestedElement);

    expect(resolveScrollContainer(nestedElement)).toBe(shellScrollRoot);
  });

  it("falls back to the document shell scroll root when no element is provided", () => {
    expect(resolveScrollContainer()).toBe(shellScrollRoot);
  });
});
