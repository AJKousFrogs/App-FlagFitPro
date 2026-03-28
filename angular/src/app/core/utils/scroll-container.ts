export type ScrollContainer = HTMLElement | Window;

export function resolveScrollContainer(
  element?: HTMLElement | null,
): ScrollContainer | null {
  if (typeof window === "undefined") {
    return null;
  }

  const shellScrollContainer =
    element?.closest<HTMLElement>("[data-scroll-root]") ??
    document.querySelector<HTMLElement>("[data-scroll-root]");

  if (shellScrollContainer instanceof HTMLElement) {
    return shellScrollContainer;
  }

  const nearestScrollableAncestor = findScrollableAncestor(
    element?.parentElement ?? null,
  );

  return nearestScrollableAncestor ?? window;
}

export function getScrollTop(container: ScrollContainer | null): number {
  if (typeof window === "undefined" || !container) {
    return 0;
  }

  return container instanceof Window ? window.scrollY || 0 : container.scrollTop;
}

export function getViewportBottom(container: ScrollContainer | null): number {
  if (typeof window === "undefined" || !container) {
    return 0;
  }

  return container instanceof Window
    ? window.innerHeight + getScrollTop(container)
    : container.clientHeight + container.scrollTop;
}

export function getScrollHeight(container: ScrollContainer | null): number {
  if (typeof window === "undefined" || !container) {
    return 0;
  }

  return container instanceof Window
    ? document.documentElement.scrollHeight
    : container.scrollHeight;
}

function findScrollableAncestor(element: HTMLElement | null): HTMLElement | null {
  let current = element;

  while (current) {
    const styles = window.getComputedStyle(current);
    const overflowY = styles.overflowY;

    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      current.scrollHeight > current.clientHeight
    ) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}
