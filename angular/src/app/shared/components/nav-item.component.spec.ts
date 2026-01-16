import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NavItemComponent } from "./nav-item.component";

describe("NavItemComponent", () => {
  let fixture: ComponentFixture<NavItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NavItemComponent);
    fixture.componentRef.setInput("label", "Logout");
    fixture.componentRef.setInput("icon", "pi-sign-out");
    fixture.detectChanges();
  });

  it("renders a button when no route is provided", () => {
    const button = fixture.nativeElement.querySelector("button.nav-item");
    expect(button).toBeTruthy();
  });

  it("uses label as the aria-label fallback", () => {
    const button = fixture.nativeElement.querySelector("button.nav-item");
    expect(button.getAttribute("aria-label")).toBe("Logout");
  });
});
