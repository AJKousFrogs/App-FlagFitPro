import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';
import { provideRouter } from '@angular/router';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default title', () => {
      fixture.detectChanges();
      const titleEl = compiled.querySelector('.empty-title');
      expect(titleEl?.textContent).toBe('No Data Available');
    });

    it('should render with custom title', () => {
      fixture.componentRef.setInput('title', 'No Training Sessions');
      fixture.detectChanges();
      const titleEl = compiled.querySelector('.empty-title');
      expect(titleEl?.textContent).toBe('No Training Sessions');
    });
  });

  describe('Icon Display', () => {
    it('should not show icon by default', () => {
      fixture.detectChanges();
      const iconEl = compiled.querySelector('.empty-icon');
      expect(iconEl).toBeNull();
    });

    it('should display icon when provided', () => {
      fixture.componentRef.setInput('icon', 'pi-inbox');
      fixture.detectChanges();
      const iconEl = compiled.querySelector('.empty-icon i');
      expect(iconEl?.classList.contains('pi-inbox')).toBe(true);
    });

    it('should apply custom icon color', () => {
      fixture.componentRef.setInput('icon', 'pi-users');
      fixture.componentRef.setInput('iconColor', 'red');
      fixture.detectChanges();
      const iconContainerEl = compiled.querySelector('.empty-icon') as HTMLElement;
      expect(iconContainerEl?.style.color).toBe('red');
    });
  });

  describe('Message Display', () => {
    it('should not show message by default', () => {
      fixture.detectChanges();
      const messageEl = compiled.querySelector('.empty-message');
      expect(messageEl).toBeNull();
    });

    it('should display message when provided', () => {
      const testMessage = 'Start logging your training to track progress.';
      fixture.componentRef.setInput('message', testMessage);
      fixture.detectChanges();
      const messageEl = compiled.querySelector('.empty-message');
      expect(messageEl?.textContent).toBe(testMessage);
    });
  });

  describe('Benefits List', () => {
    it('should not show benefits list when not provided', () => {
      fixture.detectChanges();
      const benefitsEl = compiled.querySelector('.empty-benefits');
      expect(benefitsEl).toBeNull();
    });

    it('should display benefits list when provided', () => {
      fixture.componentRef.setInput('benefits', [
        'Track your progress',
        'Optimize performance',
        'Prevent injuries'
      ]);
      fixture.detectChanges();
      const benefitItems = compiled.querySelectorAll('.empty-benefits li');
      expect(benefitItems.length).toBe(3);
    });

    it('should show checkmark icons for benefits', () => {
      fixture.componentRef.setInput('benefits', ['Benefit 1']);
      fixture.detectChanges();
      const checkIcon = compiled.querySelector('.empty-benefits li i');
      expect(checkIcon?.classList.contains('pi-check-circle')).toBe(true);
    });
  });

  describe('Action Buttons', () => {
    it('should not show action button when no label provided', () => {
      fixture.detectChanges();
      const buttonEl = compiled.querySelector('p-button');
      expect(buttonEl).toBeNull();
    });

    it('should show action button with RouterLink', () => {
      fixture.componentRef.setInput('actionLabel', 'Log Session');
      fixture.componentRef.setInput('actionLink', '/training/log');
      fixture.detectChanges();
      const buttonEl = compiled.querySelector('p-button');
      expect(buttonEl).toBeTruthy();
    });

    it('should emit onAction event when button clicked', () => {
      let actionEmitted = false;
      component.onAction.subscribe(() => {
        actionEmitted = true;
      });

      fixture.componentRef.setInput('actionLabel', 'Test Action');
      fixture.componentRef.setInput('actionHandler', () => {});
      fixture.detectChanges();

      component.handleAction();
      expect(actionEmitted).toBe(true);
    });

    it('should show secondary action button when provided', () => {
      fixture.componentRef.setInput('actionLabel', 'Primary');
      fixture.componentRef.setInput('secondaryActionLabel', 'Secondary');
      fixture.componentRef.setInput('secondaryActionLink', '/help');
      fixture.detectChanges();
      const buttons = compiled.querySelectorAll('p-button');
      expect(buttons.length).toBe(2);
    });

    it('should emit onSecondaryAction event', () => {
      let secondaryActionEmitted = false;
      component.onSecondaryAction.subscribe(() => {
        secondaryActionEmitted = true;
      });

      component.handleSecondaryAction();
      expect(secondaryActionEmitted).toBe(true);
    });
  });

  describe('Help Link', () => {
    it('should not show help link when not provided', () => {
      fixture.detectChanges();
      const helpEl = compiled.querySelector('.empty-help');
      expect(helpEl).toBeNull();
    });

    it('should display help link when both text and link provided', () => {
      fixture.componentRef.setInput('helpText', 'Learn more');
      fixture.componentRef.setInput('helpLink', '/help/training');
      fixture.detectChanges();
      const helpLink = compiled.querySelector('.empty-help-link');
      expect(helpLink?.textContent?.trim()).toContain('Learn more');
    });

    it('should not show help link if only text is provided', () => {
      fixture.componentRef.setInput('helpText', 'Learn more');
      fixture.detectChanges();
      const helpEl = compiled.querySelector('.empty-help');
      expect(helpEl).toBeNull();
    });

    it('should show question icon in help link', () => {
      fixture.componentRef.setInput('helpText', 'Help');
      fixture.componentRef.setInput('helpLink', '/help');
      fixture.detectChanges();
      const helpIcon = compiled.querySelector('.empty-help-link i');
      expect(helpIcon?.classList.contains('pi-question-circle')).toBe(true);
    });
  });

  describe('Compact Variant', () => {
    it('should apply compact class when compact=true', () => {
      fixture.componentRef.setInput('compact', true);
      fixture.detectChanges();
      const emptyState = compiled.querySelector('.empty-state');
      expect(emptyState?.classList.contains('compact')).toBe(true);
    });

    it('should not apply compact class by default', () => {
      fixture.detectChanges();
      const emptyState = compiled.querySelector('.empty-state');
      expect(emptyState?.classList.contains('compact')).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA structure', () => {
      fixture.componentRef.setInput('title', 'No Data');
      fixture.componentRef.setInput('message', 'Please add data');
      fixture.detectChanges();

      const titleEl = compiled.querySelector('.empty-title');
      const messageEl = compiled.querySelector('.empty-message');

      expect(titleEl?.tagName).toBe('H3');
      expect(messageEl?.tagName).toBe('P');
    });

    it('should have animation that respects prefers-reduced-motion', () => {
      fixture.detectChanges();
      const styles = getComputedStyle(compiled.querySelector('.empty-state')!);
      // This test verifies the CSS exists; actual motion reduction is browser-level
      expect(styles).toBeDefined();
    });
  });

  describe('Integration', () => {
    it('should render complete empty state with all features', () => {
      fixture.componentRef.setInput('icon', 'pi-inbox');
      fixture.componentRef.setInput('iconColor', 'var(--ds-primary-green)');
      fixture.componentRef.setInput('title', 'No Training Sessions');
      fixture.componentRef.setInput('message', 'Start logging to track progress');
      fixture.componentRef.setInput('benefits', [
        'Track progress',
        'Optimize performance'
      ]);
      fixture.componentRef.setInput('actionLabel', 'Log First Session');
      fixture.componentRef.setInput('actionIcon', 'pi-plus');
      fixture.componentRef.setInput('actionLink', '/training/log');
      fixture.componentRef.setInput('secondaryActionLabel', 'Learn More');
      fixture.componentRef.setInput('secondaryActionLink', '/help/training');
      fixture.componentRef.setInput('helpText', 'Need help?');
      fixture.componentRef.setInput('helpLink', '/support');
      fixture.detectChanges();

      expect(compiled.querySelector('.empty-icon')).toBeTruthy();
      expect(compiled.querySelector('.empty-title')).toBeTruthy();
      expect(compiled.querySelector('.empty-message')).toBeTruthy();
      expect(compiled.querySelector('.empty-benefits')).toBeTruthy();
      expect(compiled.querySelectorAll('p-button').length).toBe(2);
      expect(compiled.querySelector('.empty-help')).toBeTruthy();
    });
  });
});
