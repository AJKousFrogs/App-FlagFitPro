/**
 * Page Header Component Tests
 *
 * Tests for the page header component with composite view support.
 *
 * NOTE: CSS custom property cascade tests are marked as E2E tests because
 * JSDOM doesn't properly support CSS custom property inheritance.
 * The actual cascade behavior should be tested in Playwright E2E tests.
 *
 * @author FlagFit Pro Team
 * @date January 5, 2026
 */

import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";

import { PageHeaderComponent } from "./page-header.component";

describe("PageHeaderComponent", () => {
  let component: PageHeaderComponent;
  let fixture: ComponentFixture<PageHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PageHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("Basic Rendering", () => {
    it("should display title", () => {
      fixture.componentRef.setInput("title", "Test Title");
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector(".page-title");
      expect(title.textContent).toContain("Test Title");
    });

    it("should display subtitle when provided", () => {
      fixture.componentRef.setInput("title", "Test Title");
      fixture.componentRef.setInput("subtitle", "Test Subtitle");
      fixture.detectChanges();

      const subtitle = fixture.nativeElement.querySelector(".page-subtitle");
      expect(subtitle).toBeTruthy();
      expect(subtitle.textContent).toContain("Test Subtitle");
    });

    it("should not display subtitle when not provided", () => {
      fixture.componentRef.setInput("title", "Test Title");
      fixture.detectChanges();

      const subtitle = fixture.nativeElement.querySelector(".page-subtitle");
      expect(subtitle).toBeFalsy();
    });

    it("should display icon when provided", () => {
      fixture.componentRef.setInput("title", "Test Title");
      fixture.componentRef.setInput("icon", "pi-home");
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector(".page-title i");
      expect(icon).toBeTruthy();
      expect(icon.classList.contains("pi")).toBe(true);
      expect(icon.classList.contains("pi-home")).toBe(true);
    });

    it("should not display icon when not provided", () => {
      fixture.componentRef.setInput("title", "Test Title");
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector(".page-title i");
      expect(icon).toBeFalsy();
    });
  });

  describe("Visibility", () => {
    it("should be visible by default", () => {
      fixture.componentRef.setInput("title", "Test Title");
      fixture.detectChanges();

      const header = fixture.nativeElement.querySelector(".page-header");
      expect(header).toBeTruthy();

      // Check that the host element is displayed
      const hostStyles = getComputedStyle(fixture.nativeElement);
      // Default should be block (from CSS variable default)
      expect(hostStyles.display).not.toBe("none");
    });

    it("should apply hidden-in-composite class when hideInComposite is true", () => {
      fixture.componentRef.setInput("title", "Test Title");
      fixture.componentRef.setInput("hideInComposite", true);
      fixture.detectChanges();

      const header = fixture.nativeElement.querySelector(".page-header");
      expect(header.classList.contains("hidden-in-composite")).toBe(true);
    });

    it("should not apply hidden-in-composite class when hideInComposite is false", () => {
      fixture.componentRef.setInput("title", "Test Title");
      fixture.componentRef.setInput("hideInComposite", false);
      fixture.detectChanges();

      const header = fixture.nativeElement.querySelector(".page-header");
      expect(header.classList.contains("hidden-in-composite")).toBe(false);
    });
  });

  describe("Accessibility", () => {
    it("should have h1 for page title", () => {
      fixture.componentRef.setInput("title", "Test Title");
      fixture.detectChanges();

      const h1 = fixture.nativeElement.querySelector("h1.page-title");
      expect(h1).toBeTruthy();
    });

    it("should have proper heading structure", () => {
      fixture.componentRef.setInput("title", "Test Title");
      fixture.componentRef.setInput("subtitle", "Test Subtitle");
      fixture.detectChanges();

      const h1 = fixture.nativeElement.querySelector("h1");
      const p = fixture.nativeElement.querySelector("p.page-subtitle");

      expect(h1).toBeTruthy();
      expect(p).toBeTruthy();
    });
  });
});

/**
 * Composite View Integration Tests
 *
 * Tests the DOM structure for composite view pattern.
 * CSS custom property cascade behavior is tested in E2E tests
 * because JSDOM doesn't support CSS variable inheritance.
 */
describe("PageHeaderComponent - Composite View Pattern", () => {
  /**
   * Test wrapper component that simulates a composite view
   * Sets --page-header-display CSS variable to control child header visibility
   */
  @Component({
    selector: "app-test-composite-view",
    standalone: true,
    imports: [PageHeaderComponent],
    template: `
      <div class="composite-view">
        <!-- Parent header - should always be visible -->
        <div class="parent-header-container">
          <app-page-header
            title="Parent View"
            subtitle="This header should always be visible"
          ></app-page-header>
        </div>

        <!-- Child content area - headers inside should be hidden -->
        <div class="child-content">
          <app-page-header
            title="Child View"
            subtitle="This header should be hidden in composite mode"
          ></app-page-header>
        </div>
      </div>
    `,
    styles: [
      `
        .composite-view {
          display: block;
        }
        .parent-header-container {
          --page-header-display: block;
        }
        .child-content {
          padding: 1rem;
          --page-header-display: none;
        }
      `,
    ],
  })
  class TestCompositeViewComponent {}

  let fixture: ComponentFixture<TestCompositeViewComponent>;
  let component: TestCompositeViewComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestCompositeViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestCompositeViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create composite view", () => {
    expect(component).toBeTruthy();
  });

  it("should render parent header in DOM", () => {
    const parentContainer = fixture.nativeElement.querySelector(
      ".parent-header-container"
    );
    const parentHeader = parentContainer.querySelector("app-page-header");

    expect(parentHeader).toBeTruthy();

    const title = parentHeader.querySelector(".page-title");
    expect(title.textContent).toContain("Parent View");
  });

  it("should render child header in DOM", () => {
    const childContainer = fixture.nativeElement.querySelector(".child-content");
    const childHeader = childContainer.querySelector("app-page-header");

    expect(childHeader).toBeTruthy();

    const title = childHeader.querySelector(".page-title");
    expect(title.textContent).toContain("Child View");
  });

  it("should have both headers in DOM for composite view", () => {
    const allHeaders = fixture.nativeElement.querySelectorAll("app-page-header");
    expect(allHeaders.length).toBe(2);
  });

  /**
   * NOTE: CSS custom property cascade visibility tests should be in E2E tests.
   * JSDOM doesn't support CSS variable inheritance properly.
   *
   * E2E test should verify:
   * - Parent header is visible (--page-header-display: block)
   * - Child header is hidden (--page-header-display: none)
   * - CSS variable cascade works through component boundaries
   */
});

/**
 * QB Hub Simulation Tests
 *
 * Simulates the actual QB Hub composite view pattern DOM structure.
 * CSS visibility behavior is tested in E2E tests.
 */
describe("PageHeaderComponent - QB Hub Pattern Simulation", () => {
  /**
   * Simulates a child component like QbThrowingTrackerComponent
   * that has its own page header
   */
  @Component({
    selector: "app-mock-child-component",
    standalone: true,
    imports: [PageHeaderComponent],
    template: `
      <div class="child-component">
        <app-page-header
          title="Child Component Header"
          subtitle="Should be hidden when inside hub"
          icon="pi-chart-bar"
        ></app-page-header>
        <div class="child-content">
          <p>Child component content</p>
        </div>
      </div>
    `,
  })
  class MockChildComponent {}

  /**
   * Simulates the QB Hub composite view
   */
  @Component({
    selector: "app-mock-qb-hub",
    standalone: true,
    imports: [PageHeaderComponent, MockChildComponent],
    template: `
      <div class="qb-hub-page">
        <!-- Hub's own header -->
        <app-page-header
          title="QB Performance Hub"
          subtitle="Unified tracking"
          icon="pi-bolt"
        ></app-page-header>

        <!-- Tab content area - child headers should be hidden -->
        <div class="hub-tab-content">
          <app-mock-child-component></app-mock-child-component>
        </div>
      </div>
    `,
    styles: [
      `
        .qb-hub-page {
          padding: 1rem;
        }
        .qb-hub-page > app-page-header {
          --page-header-display: block;
        }
        .hub-tab-content {
          padding: 1rem 0;
          --page-header-display: none;
        }
      `,
    ],
  })
  class MockQbHubComponent {}

  let fixture: ComponentFixture<MockQbHubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockQbHubComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MockQbHubComponent);
    fixture.detectChanges();
  });

  it("should render hub header with correct title", () => {
    const hubPage = fixture.nativeElement.querySelector(".qb-hub-page");
    const hubHeader = hubPage.querySelector(":scope > app-page-header");

    expect(hubHeader).toBeTruthy();

    const title = hubHeader.querySelector(".page-title");
    expect(title.textContent).toContain("QB Performance Hub");
  });

  it("should render child component header in DOM", () => {
    const tabContent = fixture.nativeElement.querySelector(".hub-tab-content");
    const childComponent = tabContent.querySelector("app-mock-child-component");
    const childHeader = childComponent.querySelector("app-page-header");

    expect(childHeader).toBeTruthy();

    // Verify the title is there
    const title = childHeader.querySelector(".page-title");
    expect(title.textContent).toContain("Child Component Header");
  });

  it("should have both headers in DOM", () => {
    const allHeaders = fixture.nativeElement.querySelectorAll("app-page-header");

    // Should have 2 headers: hub header + child header
    expect(allHeaders.length).toBe(2);
  });

  it("should have hub-tab-content container for CSS variable cascade", () => {
    const tabContent = fixture.nativeElement.querySelector(".hub-tab-content");
    expect(tabContent).toBeTruthy();

    // The CSS variable is set on this container
    // Actual visibility is tested in E2E tests
  });

  /**
   * NOTE: Visual visibility tests should be in E2E tests.
   * JSDOM doesn't support CSS variable inheritance properly.
   *
   * E2E test should verify:
   * - Hub header is visible
   * - Child component header is hidden
   * - Only one header is visually displayed
   */
});
