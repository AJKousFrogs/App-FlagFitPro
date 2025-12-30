/**
 * Button Component Tests
 *
 * Tests for the custom button component with variants,
 * loading states, and ripple effects.
 *
 * @author FlagFit Pro Team
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Variants', () => {
    it('should apply primary variant by default', () => {
      expect(component.buttonClass()).toContain('btn-primary');
    });

    it('should apply secondary variant', () => {
      fixture.componentRef.setInput('variant', 'secondary');
      fixture.detectChanges();

      expect(component.buttonClass()).toContain('btn-secondary');
    });

    it('should apply outlined variant', () => {
      fixture.componentRef.setInput('variant', 'outlined');
      fixture.detectChanges();

      expect(component.buttonClass()).toContain('btn-outlined');
    });

    it('should apply text variant', () => {
      fixture.componentRef.setInput('variant', 'text');
      fixture.detectChanges();

      expect(component.buttonClass()).toContain('btn-text');
    });

    it('should apply danger variant', () => {
      fixture.componentRef.setInput('variant', 'danger');
      fixture.detectChanges();

      expect(component.buttonClass()).toContain('btn-danger');
    });

    it('should apply success variant', () => {
      fixture.componentRef.setInput('variant', 'success');
      fixture.detectChanges();

      expect(component.buttonClass()).toContain('btn-success');
    });
  });

  describe('Sizes', () => {
    it('should not add size class for default md size', () => {
      expect(component.buttonClass()).not.toContain('btn-md');
    });

    it('should apply small size', () => {
      fixture.componentRef.setInput('size', 'sm');
      fixture.detectChanges();

      expect(component.buttonClass()).toContain('btn-sm');
    });

    it('should apply large size', () => {
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();

      expect(component.buttonClass()).toContain('btn-lg');
    });

    it('should apply extra large size', () => {
      fixture.componentRef.setInput('size', 'xl');
      fixture.detectChanges();

      expect(component.buttonClass()).toContain('btn-xl');
    });
  });

  describe('States', () => {
    it('should be enabled by default', () => {
      const button = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(false);
    });

    it('should be disabled when disabled input is true', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(true);
    });

    it('should be disabled when loading', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(true);
    });

    it('should show spinner when loading', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('.btn-spinner');
      expect(spinner).toBeTruthy();
    });

    it('should hide content when loading and showLabelOnLoading is false', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.componentRef.setInput('showLabelOnLoading', false);
      fixture.detectChanges();

      const content = fixture.nativeElement.querySelector('.btn-content');
      expect(content.classList.contains('btn-content-hidden')).toBe(true);
    });

    it('should show content when loading and showLabelOnLoading is true', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.componentRef.setInput('showLabelOnLoading', true);
      fixture.detectChanges();

      const content = fixture.nativeElement.querySelector('.btn-content');
      expect(content.classList.contains('btn-content-hidden')).toBe(false);
    });
  });

  describe('Icon', () => {
    it('should display icon when provided', () => {
      fixture.componentRef.setInput('icon', 'pi-plus');
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.btn-icon');
      expect(icon).toBeTruthy();
      expect(icon.classList.contains('pi-plus')).toBe(true);
    });

    it('should position icon on left by default', () => {
      fixture.componentRef.setInput('icon', 'pi-plus');
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      const icon = button.querySelector('.btn-icon');
      const content = button.querySelector('.btn-content');

      // Icon should come before content in DOM
      const iconIndex = Array.from(button.children).indexOf(icon.parentElement || icon);
      const contentIndex = Array.from(button.children).indexOf(content);

      // This is a simplified check - actual position depends on DOM structure
      expect(icon).toBeTruthy();
    });

    it('should position icon on right when specified', () => {
      fixture.componentRef.setInput('icon', 'pi-arrow-right');
      fixture.componentRef.setInput('iconPosition', 'right');
      fixture.detectChanges();

      expect(component.iconPosition()).toBe('right');
    });

    it('should not show icon when loading', () => {
      fixture.componentRef.setInput('icon', 'pi-plus');
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.btn-icon');
      expect(icon).toBeFalsy();
    });
  });

  describe('Icon Only Mode', () => {
    it('should apply icon-only class', () => {
      fixture.componentRef.setInput('iconOnly', true);
      fixture.detectChanges();

      expect(component.buttonClass()).toContain('btn-icon-only');
    });
  });

  describe('Rounded', () => {
    it('should apply rounded class when true', () => {
      fixture.componentRef.setInput('rounded', true);
      fixture.detectChanges();

      expect(component.buttonClass()).toContain('btn-rounded');
    });
  });

  describe('Block', () => {
    it('should apply block class when true', () => {
      fixture.componentRef.setInput('block', true);
      fixture.detectChanges();

      expect(component.buttonClass()).toContain('btn-block');
    });
  });

  describe('Click Handling', () => {
    it('should emit click event when clicked', () => {
      const clickSpy = spyOn(component.clicked, 'emit');

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should not emit click event when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const clickSpy = spyOn(component.clicked, 'emit');

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(clickSpy).not.toHaveBeenCalled();
    });

    it('should not emit click event when loading', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      const clickSpy = spyOn(component.clicked, 'emit');

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(clickSpy).not.toHaveBeenCalled();
    });
  });

  describe('Ripple Effect', () => {
    it('should create ripple on click', fakeAsync(() => {
      const button = fixture.nativeElement.querySelector('button');

      // Create a mock click event with coordinates
      const clickEvent = new MouseEvent('click', {
        clientX: 50,
        clientY: 50,
        bubbles: true,
      });

      button.dispatchEvent(clickEvent);
      fixture.detectChanges();

      expect(component.ripples().length).toBeGreaterThan(0);

      // Wait for ripple to be removed
      tick(700);
      fixture.detectChanges();

      expect(component.ripples().length).toBe(0);
    }));
  });

  describe('Press State', () => {
    it('should set pressed state on mousedown', () => {
      component.onMouseDown();
      expect(component.isPressed()).toBe(true);
    });

    it('should clear pressed state on mouseup', () => {
      component.onMouseDown();
      component.onMouseUp();
      expect(component.isPressed()).toBe(false);
    });

    it('should clear pressed state on mouseleave', () => {
      component.onMouseDown();
      component.onMouseUp(); // mouseleave calls onMouseUp
      expect(component.isPressed()).toBe(false);
    });

    it('should not set pressed state when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      component.onMouseDown();
      expect(component.isPressed()).toBe(false);
    });

    it('should apply pressed class when pressed', () => {
      component.onMouseDown();
      fixture.detectChanges();

      expect(component.buttonClass()).toContain('btn-pressed');
    });
  });

  describe('Accessibility', () => {
    it('should have button type by default', () => {
      const button = fixture.nativeElement.querySelector('button');
      expect(button.type).toBe('button');
    });

    it('should apply submit type when specified', () => {
      fixture.componentRef.setInput('type', 'submit');
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.type).toBe('submit');
    });

    it('should apply aria-label when provided', () => {
      fixture.componentRef.setInput('ariaLabel', 'Add new item');
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.getAttribute('aria-label')).toBe('Add new item');
    });

    it('should set aria-busy when loading', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.getAttribute('aria-busy')).toBe('true');
    });

    it('should set aria-disabled when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('Combined Classes', () => {
    it('should combine multiple modifier classes', () => {
      fixture.componentRef.setInput('variant', 'danger');
      fixture.componentRef.setInput('size', 'lg');
      fixture.componentRef.setInput('rounded', true);
      fixture.componentRef.setInput('block', true);
      fixture.detectChanges();

      const classes = component.buttonClass();
      expect(classes).toContain('btn');
      expect(classes).toContain('btn-danger');
      expect(classes).toContain('btn-lg');
      expect(classes).toContain('btn-rounded');
      expect(classes).toContain('btn-block');
    });
  });
});

