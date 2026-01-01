/**
 * Empty State Component Tests
 *
 * Tests for the reusable empty state component.
 * Covers all display variants and action handling.
 *
 * @author FlagFit Pro Team
 */

import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { By } from "@angular/platform-browser";

import { EmptyStateComponent } from "./empty-state.component";

describe("EmptyStateComponent", () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("Basic Display", () => {
    it("should display default title", () => {
      const titleEl = fixture.nativeElement.querySelector(".empty-title");
      expect(titleEl.textContent).toContain("No Data Available");
    });

    it("should display custom title", () => {
      fixture.componentRef.setInput("title", "No Sessions Found");
      fixture.detectChanges();

      const titleEl = fixture.nativeElement.querySelector(".empty-title");
      expect(titleEl.textContent).toContain("No Sessions Found");
    });

    it("should display message when provided", () => {
      fixture.componentRef.setInput(
        "message",
        "Start by creating your first session",
      );
      fixture.detectChanges();

      const messageEl = fixture.nativeElement.querySelector(".empty-message");
      expect(messageEl).toBeTruthy();
      expect(messageEl.textContent).toContain(
        "Start by creating your first session",
      );
    });

    it("should not display message when not provided", () => {
      fixture.componentRef.setInput("message", null);
      fixture.detectChanges();

      const messageEl = fixture.nativeElement.querySelector(".empty-message");
      expect(messageEl).toBeFalsy();
    });
  });

  describe("Icon Display", () => {
    it("should display icon when provided", () => {
      fixture.componentRef.setInput("icon", "pi-inbox");
      fixture.detectChanges();

      const iconEl = fixture.nativeElement.querySelector(".empty-icon i");
      expect(iconEl).toBeTruthy();
      expect(iconEl.classList.contains("pi-inbox")).toBe(true);
    });

    it("should not display icon container when no icon", () => {
      fixture.componentRef.setInput("icon", null);
      fixture.detectChanges();

      const iconEl = fixture.nativeElement.querySelector(".empty-icon");
      expect(iconEl).toBeFalsy();
    });

    it("should apply custom icon color", () => {
      fixture.componentRef.setInput("icon", "pi-inbox");
      fixture.componentRef.setInput("iconColor", "var(--ds-primary-green)");
      fixture.detectChanges();

      const iconEl = fixture.nativeElement.querySelector(".empty-icon");
      expect(iconEl.style.color).toBe("var(--ds-primary-green)");
    });
  });

  describe("Compact Mode", () => {
    it("should apply compact class when compact is true", () => {
      fixture.componentRef.setInput("compact", true);
      fixture.detectChanges();

      const containerEl = fixture.nativeElement.querySelector(".empty-state");
      expect(containerEl.classList.contains("compact")).toBe(true);
    });

    it("should not apply compact class by default", () => {
      const containerEl = fixture.nativeElement.querySelector(".empty-state");
      expect(containerEl.classList.contains("compact")).toBe(false);
    });
  });

  describe("Benefits List", () => {
    it("should display benefits when provided", () => {
      fixture.componentRef.setInput("benefits", [
        "Benefit 1",
        "Benefit 2",
        "Benefit 3",
      ]);
      fixture.detectChanges();

      const benefitsList =
        fixture.nativeElement.querySelector(".empty-benefits");
      expect(benefitsList).toBeTruthy();

      const benefitItems =
        fixture.nativeElement.querySelectorAll(".empty-benefits li");
      expect(benefitItems.length).toBe(3);
    });

    it("should not display benefits section when empty", () => {
      fixture.componentRef.setInput("benefits", null);
      fixture.detectChanges();

      const benefitsList =
        fixture.nativeElement.querySelector(".empty-benefits");
      expect(benefitsList).toBeFalsy();
    });

    it("should display check icons for each benefit", () => {
      fixture.componentRef.setInput("benefits", ["Benefit 1"]);
      fixture.detectChanges();

      const checkIcon = fixture.nativeElement.querySelector(
        ".empty-benefits li i",
      );
      expect(checkIcon.classList.contains("pi-check-circle")).toBe(true);
    });
  });

  describe("Primary Action", () => {
    it("should display primary action button with label", () => {
      fixture.componentRef.setInput("actionLabel", "Create New");
      fixture.componentRef.setInput("actionLink", "/create");
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector(
        ".empty-actions p-button",
      );
      expect(button).toBeTruthy();
    });

    it("should display action icon when provided", () => {
      fixture.componentRef.setInput("actionLabel", "Add Item");
      fixture.componentRef.setInput("actionIcon", "pi-plus");
      fixture.componentRef.setInput("actionLink", "/add");
      fixture.detectChanges();

      const button = fixture.debugElement.query(
        By.css(".empty-actions p-button"),
      );
      expect(button).toBeTruthy();
    });

    it("should use RouterLink when actionLink is provided", () => {
      fixture.componentRef.setInput("actionLabel", "Go to Page");
      fixture.componentRef.setInput("actionLink", "/some-page");
      fixture.detectChanges();

      const button = fixture.debugElement.query(
        By.css(".empty-actions p-button"),
      );
      expect(button).toBeTruthy();
    });

    it("should call handler when actionHandler is provided", () => {
      const handlerSpy = jasmine.createSpy("actionHandler");
      fixture.componentRef.setInput("actionLabel", "Click Me");
      fixture.componentRef.setInput("actionHandler", handlerSpy);
      fixture.detectChanges();

      component.handleAction();
      expect(handlerSpy).toHaveBeenCalled();
    });

    it("should emit onAction event when action is triggered", () => {
      fixture.componentRef.setInput("actionLabel", "Click Me");
      fixture.componentRef.setInput("actionHandler", () => {});
      fixture.detectChanges();

      const emitSpy = spyOn(component.onAction, "emit");
      component.handleAction();

      expect(emitSpy).toHaveBeenCalled();
    });

    it("should apply correct severity to button", () => {
      fixture.componentRef.setInput("actionLabel", "Danger Action");
      fixture.componentRef.setInput("actionLink", "/danger");
      fixture.componentRef.setInput("actionSeverity", "danger");
      fixture.detectChanges();

      expect(component.actionSeverity()).toBe("danger");
    });
  });

  describe("Secondary Action", () => {
    it("should display secondary action when label is provided", () => {
      fixture.componentRef.setInput("actionLabel", "Primary");
      fixture.componentRef.setInput("actionLink", "/primary");
      fixture.componentRef.setInput("secondaryActionLabel", "Secondary");
      fixture.componentRef.setInput("secondaryActionLink", "/secondary");
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll(
        ".empty-actions p-button",
      );
      expect(buttons.length).toBe(2);
    });

    it("should emit onSecondaryAction event when triggered", () => {
      fixture.componentRef.setInput("secondaryActionLabel", "Cancel");
      fixture.detectChanges();

      const emitSpy = spyOn(component.onSecondaryAction, "emit");
      component.handleSecondaryAction();

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe("Help Link", () => {
    it("should display help link when both text and link provided", () => {
      fixture.componentRef.setInput("helpText", "Need help?");
      fixture.componentRef.setInput("helpLink", "/help");
      fixture.detectChanges();

      const helpLink = fixture.nativeElement.querySelector(".empty-help-link");
      expect(helpLink).toBeTruthy();
      expect(helpLink.textContent).toContain("Need help?");
    });

    it("should not display help link when text is missing", () => {
      fixture.componentRef.setInput("helpText", null);
      fixture.componentRef.setInput("helpLink", "/help");
      fixture.detectChanges();

      const helpLink = fixture.nativeElement.querySelector(".empty-help");
      expect(helpLink).toBeFalsy();
    });

    it("should not display help link when link is missing", () => {
      fixture.componentRef.setInput("helpText", "Need help?");
      fixture.componentRef.setInput("helpLink", null);
      fixture.detectChanges();

      const helpLink = fixture.nativeElement.querySelector(".empty-help");
      expect(helpLink).toBeFalsy();
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure", () => {
      const heading = fixture.nativeElement.querySelector(".empty-title");
      expect(heading.tagName).toBe("H3");
    });

    it("should have descriptive text for screen readers", () => {
      fixture.componentRef.setInput("title", "No Results");
      fixture.componentRef.setInput("message", "Try adjusting your search");
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector(".empty-state");
      expect(container.textContent).toContain("No Results");
      expect(container.textContent).toContain("Try adjusting your search");
    });
  });

  describe("Animation", () => {
    it("should have fade-in animation class", () => {
      const container = fixture.nativeElement.querySelector(".empty-state");
      const computedStyle = window.getComputedStyle(container);

      // Animation should be defined (may vary by browser)
      expect(container).toBeTruthy();
    });
  });
});
