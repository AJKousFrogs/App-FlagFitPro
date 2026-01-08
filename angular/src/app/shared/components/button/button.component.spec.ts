/**
 * Button Component Tests
 *
 * Tests for the custom button component with variants,
 * loading states, and ripple effects.
 *
 * @author FlagFit Pro Team
 */

import { ComponentFixture, TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { ButtonComponent } from "./button.component";

describe("ButtonComponent", () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("Variants", () => {
    it("should apply primary variant by default", () => {
      expect(component.buttonClasses()).toContain("btn-primary");
    });

    it("should apply secondary variant", () => {
      fixture.componentRef.setInput("variant", "secondary");
      fixture.detectChanges();

      expect(component.buttonClasses()).toContain("btn-secondary");
    });

    it("should apply outlined variant", () => {
      fixture.componentRef.setInput("variant", "outlined");
      fixture.detectChanges();

      expect(component.buttonClasses()).toContain("btn-outlined");
    });

    it("should apply text variant", () => {
      fixture.componentRef.setInput("variant", "text");
      fixture.detectChanges();

      expect(component.buttonClasses()).toContain("btn-text");
    });

    it("should apply danger variant", () => {
      fixture.componentRef.setInput("variant", "danger");
      fixture.detectChanges();

      expect(component.buttonClasses()).toContain("btn-danger");
    });

    it("should apply success variant", () => {
      fixture.componentRef.setInput("variant", "success");
      fixture.detectChanges();

      expect(component.buttonClasses()).toContain("btn-success");
    });
  });

  describe("Sizes", () => {
    it("should not add size class for default md size", () => {
      expect(component.buttonClasses()).not.toContain("btn-md");
    });

    it("should apply small size", () => {
      fixture.componentRef.setInput("size", "sm");
      fixture.detectChanges();

      expect(component.buttonClasses()).toContain("btn-sm");
    });

    it("should apply large size", () => {
      fixture.componentRef.setInput("size", "lg");
      fixture.detectChanges();

      expect(component.buttonClasses()).toContain("btn-lg");
    });

    // Note: xl size is not supported in the current design system
    // Only sm, md, lg sizes are available
  });

  describe("States", () => {
    it("should be enabled by default", () => {
      const button = fixture.nativeElement.querySelector("button");
      expect(button.disabled).toBe(false);
    });

    it("should be disabled when disabled input is true", () => {
      fixture.componentRef.setInput("disabled", true);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector("button");
      expect(button.disabled).toBe(true);
    });

    it("should be disabled when loading", () => {
      fixture.componentRef.setInput("loading", true);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector("button");
      expect(button.disabled).toBe(true);
    });

    it("should show spinner when loading", () => {
      fixture.componentRef.setInput("loading", true);
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector(".btn-spinner");
      expect(spinner).toBeTruthy();
    });

    it("should apply loading class to content when loading", () => {
      fixture.componentRef.setInput("loading", true);
      fixture.detectChanges();

      const content = fixture.nativeElement.querySelector(".btn-content");
      expect(content.classList.contains("btn-content-loading")).toBe(true);
    });

    it("should not apply loading class when not loading", () => {
      fixture.componentRef.setInput("loading", false);
      fixture.detectChanges();

      const content = fixture.nativeElement.querySelector(".btn-content");
      expect(content.classList.contains("btn-content-loading")).toBe(false);
    });
  });

  describe("Icon", () => {
    it("should display left icon when provided", () => {
      fixture.componentRef.setInput("iconLeft", "pi-plus");
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector(".btn-icon");
      expect(icon).toBeTruthy();
      expect(icon.classList.contains("pi-plus")).toBe(true);
    });

    it("should display right icon when provided", () => {
      fixture.componentRef.setInput("iconRight", "pi-arrow-right");
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector(".btn-icon");
      expect(icon).toBeTruthy();
      expect(icon.classList.contains("pi-arrow-right")).toBe(true);
    });

    it("should not show icon when loading", () => {
      fixture.componentRef.setInput("iconLeft", "pi-plus");
      fixture.componentRef.setInput("loading", true);
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector(".btn-icon");
      expect(icon).toBeFalsy();
    });
  });

  describe("Icon Only Mode", () => {
    it("should apply icon-only class", () => {
      fixture.componentRef.setInput("iconOnly", true);
      fixture.detectChanges();

      expect(component.buttonClasses()).toContain("btn-icon-only");
    });
  });

  describe("Full Width", () => {
    it("should apply full-width class when fullWidth is true", () => {
      fixture.componentRef.setInput("fullWidth", true);
      fixture.detectChanges();

      expect(component.buttonClasses()).toContain("btn-full-width");
    });

    // Note: 'block' input was deprecated and removed
    // Use 'fullWidth' instead - tested above
  });

  describe("Click Handling", () => {
    it("should emit click event when clicked", () => {
      const clickSpy = vi.spyOn(component.clicked, "emit");

      const button = fixture.nativeElement.querySelector("button");
      button.click();

      expect(clickSpy).toHaveBeenCalled();
    });

    it("should not emit click event when disabled", () => {
      fixture.componentRef.setInput("disabled", true);
      fixture.detectChanges();

      const clickSpy = vi.spyOn(component.clicked, "emit");

      const button = fixture.nativeElement.querySelector("button");
      button.click();

      expect(clickSpy).not.toHaveBeenCalled();
    });

    it("should not emit click event when loading", () => {
      fixture.componentRef.setInput("loading", true);
      fixture.detectChanges();

      const clickSpy = vi.spyOn(component.clicked, "emit");

      const button = fixture.nativeElement.querySelector("button");
      button.click();

      expect(clickSpy).not.toHaveBeenCalled();
    });
  });

  // Ripple effect is handled via CSS, no runtime ripple array exists

  describe("ARIA Pressed State", () => {
    it("should have aria-pressed attribute when set", () => {
      fixture.componentRef.setInput("ariaPressed", true);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector("button");
      expect(button.getAttribute("aria-pressed")).toBe("true");
    });

    it("should not have aria-pressed attribute by default", () => {
      const button = fixture.nativeElement.querySelector("button");
      expect(button.getAttribute("aria-pressed")).toBeNull();
    });
  });

  describe("Accessibility", () => {
    it("should have button type by default", () => {
      const button = fixture.nativeElement.querySelector("button");
      expect(button.type).toBe("button");
    });

    it("should apply submit type when specified", () => {
      fixture.componentRef.setInput("type", "submit");
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector("button");
      expect(button.type).toBe("submit");
    });

    it("should apply aria-label when provided", () => {
      fixture.componentRef.setInput("ariaLabel", "Add new item");
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector("button");
      expect(button.getAttribute("aria-label")).toBe("Add new item");
    });

    it("should set aria-busy when loading", () => {
      fixture.componentRef.setInput("loading", true);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector("button");
      expect(button.getAttribute("aria-busy")).toBe("true");
    });

    it("should set aria-disabled when disabled", () => {
      fixture.componentRef.setInput("disabled", true);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector("button");
      expect(button.getAttribute("aria-disabled")).toBe("true");
    });
  });

  describe("Combined Classes", () => {
    it("should combine multiple modifier classes", () => {
      fixture.componentRef.setInput("variant", "danger");
      fixture.componentRef.setInput("size", "lg");
      fixture.componentRef.setInput("fullWidth", true);
      fixture.detectChanges();

      const classes = component.buttonClasses();
      expect(classes).toContain("btn");
      expect(classes).toContain("btn-danger");
      expect(classes).toContain("btn-lg");
      expect(classes).toContain("btn-full-width");
    });
  });
});
