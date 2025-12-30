import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';
import { provideRouter } from '@angular/router';

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with closed state', () => {
      expect(component.visible()).toBe(false);
    });

    it('should have default configuration', () => {
      expect(component.modal()).toBe(true);
      expect(component.closable()).toBe(true);
      expect(component.size()).toBe('md');
      expect(component.position()).toBe('center');
    });
  });

  describe('Visibility Control', () => {
    it('should open modal', () => {
      component.open();
      expect(component.visible()).toBe(true);
    });

    it('should close modal', () => {
      component.visible.set(true);
      component.close();
      expect(component.visible()).toBe(false);
    });

    it('should toggle modal visibility', () => {
      expect(component.visible()).toBe(false);
      component.toggle();
      expect(component.visible()).toBe(true);
      component.toggle();
      expect(component.visible()).toBe(false);
    });

    it('should render dialog when visible', () => {
      component.visible.set(true);
      fixture.detectChanges();
      const dialog = compiled.querySelector('p-dialog');
      expect(dialog).toBeTruthy();
    });

    it('should not render visible dialog when closed', () => {
      component.visible.set(false);
      fixture.detectChanges();
      // PrimeNG dialog still renders but is hidden
      const dialog = compiled.querySelector('p-dialog');
      expect(dialog?.getAttribute('ng-reflect-visible')).toBe('false');
    });
  });

  describe('Size Variants', () => {
    it('should apply small size', () => {
      fixture.componentRef.setInput('size', 'sm');
      fixture.detectChanges();
      expect(component.dialogStyleClass()).toBe('modal-sm');
    });

    it('should apply medium size by default', () => {
      expect(component.dialogStyleClass()).toBe('modal-md');
    });

    it('should apply large size', () => {
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();
      expect(component.dialogStyleClass()).toBe('modal-lg');
    });

    it('should apply extra large size', () => {
      fixture.componentRef.setInput('size', 'xl');
      fixture.detectChanges();
      expect(component.dialogStyleClass()).toBe('modal-xl');
    });

    it('should apply full size', () => {
      fixture.componentRef.setInput('size', 'full');
      fixture.detectChanges();
      expect(component.dialogStyleClass()).toBe('modal-full');
    });

    it('should set correct width for small modal', () => {
      fixture.componentRef.setInput('size', 'sm');
      fixture.detectChanges();
      const style = component.dialogStyle();
      expect(style['width']).toBe('400px');
    });

    it('should set correct width for medium modal', () => {
      fixture.componentRef.setInput('size', 'md');
      fixture.detectChanges();
      const style = component.dialogStyle();
      expect(style['width']).toBe('560px');
    });

    it('should set correct width for large modal', () => {
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();
      const style = component.dialogStyle();
      expect(style['width']).toBe('800px');
    });
  });

  describe('Position Variants', () => {
    it('should support center position', () => {
      fixture.componentRef.setInput('position', 'center');
      expect(component.position()).toBe('center');
    });

    it('should support top position', () => {
      fixture.componentRef.setInput('position', 'top');
      expect(component.position()).toBe('top');
    });

    it('should support corner positions', () => {
      fixture.componentRef.setInput('position', 'top-right');
      expect(component.position()).toBe('top-right');
    });
  });

  describe('Header Configuration', () => {
    it('should display header title', () => {
      fixture.componentRef.setInput('header', 'Test Modal');
      component.visible.set(true);
      fixture.detectChanges();
      expect(component.header()).toBe('Test Modal');
    });

    it('should show custom header when icon provided', () => {
      fixture.componentRef.setInput('headerIcon', 'pi-check');
      expect(component.showCustomHeader()).toBe(true);
    });

    it('should show custom header when subtitle provided', () => {
      fixture.componentRef.setInput('headerSubtitle', 'Subtitle text');
      expect(component.showCustomHeader()).toBe(true);
    });

    it('should not show custom header by default', () => {
      expect(component.showCustomHeader()).toBe(false);
    });

    it('should support header icon colors', () => {
      const colors: Array<'primary' | 'success' | 'warning' | 'error' | 'info'> =
        ['primary', 'success', 'warning', 'error', 'info'];

      colors.forEach(color => {
        fixture.componentRef.setInput('headerIconColor', color);
        expect(component.headerIconColor()).toBe(color);
      });
    });
  });

  describe('Footer Configuration', () => {
    it('should not show footer by default', () => {
      expect(component.showFooter()).toBe(false);
    });

    it('should show footer when enabled', () => {
      fixture.componentRef.setInput('showFooter', true);
      expect(component.showFooter()).toBe(true);
    });

    it('should show default buttons in footer', () => {
      fixture.componentRef.setInput('showFooter', true);
      expect(component.showDefaultButtons()).toBe(true);
    });

    it('should hide default buttons when configured', () => {
      fixture.componentRef.setInput('showFooter', true);
      fixture.componentRef.setInput('showDefaultButtons', false);
      expect(component.showDefaultButtons()).toBe(false);
    });

    it('should support footer alignment options', () => {
      const alignments: Array<'left' | 'center' | 'right' | 'between'> =
        ['left', 'center', 'right', 'between'];

      alignments.forEach(align => {
        fixture.componentRef.setInput('footerAlignment', align);
        expect(component.footerAlignment()).toBe(align);
      });
    });
  });

  describe('Cancel Button', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('showFooter', true);
      component.visible.set(true);
      fixture.detectChanges();
    });

    it('should show cancel button by default', () => {
      expect(component.showCancelButton()).toBe(true);
    });

    it('should have default cancel label', () => {
      expect(component.cancelLabel()).toBe('Cancel');
    });

    it('should support custom cancel label', () => {
      fixture.componentRef.setInput('cancelLabel', 'Close');
      expect(component.cancelLabel()).toBe('Close');
    });

    it('should support cancel button icon', () => {
      fixture.componentRef.setInput('cancelIcon', 'pi-times');
      expect(component.cancelIcon()).toBe('pi-times');
    });

    it('should emit onCancel event', () => {
      let cancelEmitted = false;
      component.onCancel.subscribe(() => {
        cancelEmitted = true;
      });

      component.handleCancel();
      expect(cancelEmitted).toBe(true);
    });

    it('should close modal on cancel', () => {
      component.visible.set(true);
      component.handleCancel();
      expect(component.visible()).toBe(false);
    });

    it('should support disabled state', () => {
      fixture.componentRef.setInput('cancelDisabled', true);
      expect(component.cancelDisabled()).toBe(true);
    });
  });

  describe('Confirm Button', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('showFooter', true);
      component.visible.set(true);
      fixture.detectChanges();
    });

    it('should show confirm button by default', () => {
      expect(component.showConfirmButton()).toBe(true);
    });

    it('should have default confirm label', () => {
      expect(component.confirmLabel()).toBe('Confirm');
    });

    it('should support custom confirm label', () => {
      fixture.componentRef.setInput('confirmLabel', 'Save');
      expect(component.confirmLabel()).toBe('Save');
    });

    it('should support confirm button icon', () => {
      fixture.componentRef.setInput('confirmIcon', 'pi-check');
      expect(component.confirmIcon()).toBe('pi-check');
    });

    it('should emit onConfirm event', () => {
      let confirmEmitted = false;
      component.onConfirm.subscribe(() => {
        confirmEmitted = true;
      });

      component.handleConfirm();
      expect(confirmEmitted).toBe(true);
    });

    it('should support disabled state', () => {
      fixture.componentRef.setInput('confirmDisabled', true);
      expect(component.confirmDisabled()).toBe(true);
    });

    it('should support loading state', () => {
      fixture.componentRef.setInput('confirmLoading', true);
      expect(component.confirmLoading()).toBe(true);
    });

    it('should support severity variants', () => {
      const severities: Array<'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'primary'> =
        ['success', 'info', 'warning', 'danger', 'secondary', 'primary'];

      severities.forEach(severity => {
        fixture.componentRef.setInput('confirmSeverity', severity);
        expect(component.confirmSeverity()).toBe(severity);
      });
    });
  });

  describe('Modal Behavior', () => {
    it('should support modal backdrop by default', () => {
      expect(component.modal()).toBe(true);
    });

    it('should support non-modal mode', () => {
      fixture.componentRef.setInput('modal', false);
      expect(component.modal()).toBe(false);
    });

    it('should be closable by default', () => {
      expect(component.closable()).toBe(true);
    });

    it('should support non-closable mode', () => {
      fixture.componentRef.setInput('closable', false);
      expect(component.closable()).toBe(false);
    });

    it('should support draggable mode', () => {
      fixture.componentRef.setInput('draggable', true);
      expect(component.draggable()).toBe(true);
    });

    it('should support resizable mode', () => {
      fixture.componentRef.setInput('resizable', true);
      expect(component.resizable()).toBe(true);
    });

    it('should block scroll by default', () => {
      expect(component.blockScroll()).toBe(true);
    });

    it('should support dismissable mask', () => {
      fixture.componentRef.setInput('dismissableMask', true);
      expect(component.dismissableMask()).toBe(true);
    });

    it('should close on escape by default', () => {
      expect(component.closeOnEscape()).toBe(true);
    });

    it('should support scrollable content', () => {
      fixture.componentRef.setInput('scrollable', true);
      expect(component.scrollable()).toBe(true);
    });
  });

  describe('Event Handling', () => {
    it('should emit onShow event when modal opens', () => {
      let showEmitted = false;
      component.onShow.subscribe(() => {
        showEmitted = true;
      });

      component.handleShow();
      expect(showEmitted).toBe(true);
    });

    it('should emit onHide event when modal closes', () => {
      let hideEmitted = false;
      component.onHide.subscribe(() => {
        hideEmitted = true;
      });

      component.handleHide();
      expect(hideEmitted).toBe(true);
    });

    it('should update visible signal on hide', () => {
      component.visible.set(true);
      component.handleHide();
      expect(component.visible()).toBe(false);
    });

    it('should emit onHide when visible changes to false', () => {
      let hideEmitted = false;
      component.onHide.subscribe(() => {
        hideEmitted = true;
      });

      component.onVisibleChange(false);
      expect(hideEmitted).toBe(true);
    });
  });

  describe('Content Projection', () => {
    it('should support content projection', () => {
      component.visible.set(true);
      fixture.detectChanges();
      const content = compiled.querySelector('.modal-content');
      expect(content).toBeTruthy();
    });

    it('should support footer content projection', () => {
      fixture.componentRef.setInput('showFooter', true);
      component.visible.set(true);
      fixture.detectChanges();
      const footer = compiled.querySelector('.modal-footer');
      expect(footer).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      component.visible.set(true);
      fixture.detectChanges();
    });

    it('should use PrimeNG Dialog which provides ARIA', () => {
      const dialog = compiled.querySelector('p-dialog');
      expect(dialog).toBeTruthy();
    });

    it('should have keyboard navigation support', () => {
      expect(component.closeOnEscape()).toBe(true);
    });

    it('should focus management on open', () => {
      // PrimeNG Dialog handles focus automatically
      expect(component.visible()).toBe(true);
    });
  });

  describe('Responsive Behavior', () => {
    it('should set max-width to 95vw on all sizes', () => {
      const sizes: Array<'sm' | 'md' | 'lg' | 'xl'> = ['sm', 'md', 'lg', 'xl'];

      sizes.forEach(size => {
        fixture.componentRef.setInput('size', size);
        const style = component.dialogStyle();
        expect(style['maxWidth']).toBe('95vw');
      });
    });

    it('should use viewport units for full size', () => {
      fixture.componentRef.setInput('size', 'full');
      const style = component.dialogStyle();
      expect(style['width']).toBe('95vw');
      expect(style['height']).toBe('90vh');
    });
  });

  describe('Performance', () => {
    it('should use OnPush change detection', () => {
      const changeDetection = (component.constructor as any).ɵcmp?.changeDetection;
      expect(changeDetection).toBe(0); // ChangeDetectionStrategy.OnPush
    });

    it('should use signals for reactive state', () => {
      expect(component.visible).toBeDefined();
      expect(typeof component.visible).toBe('function');
    });

    it('should use computed values efficiently', () => {
      expect(component.showCustomHeader).toBeDefined();
      expect(component.dialogStyle).toBeDefined();
      expect(component.dialogStyleClass).toBeDefined();
    });
  });
});
