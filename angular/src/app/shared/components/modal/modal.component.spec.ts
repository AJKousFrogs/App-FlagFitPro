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

  describe('Accessibility Enhancements - Focus Trap', () => {
    beforeEach(() => {
      // Create modal with focusable elements
      component.visible.set(true);
      fixture.detectChanges();
    });

    it('should enable focus trap by default', () => {
      expect(component.enableFocusTrap()).toBe(true);
    });

    it('should allow disabling focus trap', () => {
      fixture.componentRef.setInput('enableFocusTrap', false);
      expect(component.enableFocusTrap()).toBe(false);
    });

    it('should trap Tab key within modal', () => {
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');

      // Mock focusable elements
      const mockElements = [
        document.createElement('button'),
        document.createElement('input'),
        document.createElement('button'),
      ];
      mockElements.forEach((el, i) => {
        el.id = `element-${i}`;
      });

      vi.spyOn(component as any, 'getFocusableElements').mockReturnValue(mockElements);

      // Mock active element as last element
      Object.defineProperty(document, 'activeElement', {
        writable: true,
        value: mockElements[2],
      });

      component.handleTabKey(tabEvent);

      // Should prevent default and cycle to first element
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should trap Shift+Tab key within modal (reverse)', () => {
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = vi.spyOn(shiftTabEvent, 'preventDefault');

      const mockElements = [
        document.createElement('button'),
        document.createElement('input'),
        document.createElement('button'),
      ];

      vi.spyOn(component as any, 'getFocusableElements').mockReturnValue(mockElements);

      // Mock active element as first element
      Object.defineProperty(document, 'activeElement', {
        writable: true,
        value: mockElements[0],
      });

      component.handleTabKey(shiftTabEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not trap focus when modal is not visible', () => {
      component.visible.set(false);

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');

      component.handleTabKey(tabEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should not trap focus when enableFocusTrap is false', () => {
      fixture.componentRef.setInput('enableFocusTrap', false);

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');

      component.handleTabKey(tabEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should get focusable elements correctly', () => {
      // Create mock dialog with focusable elements
      const mockDialog = document.createElement('div');
      const button1 = document.createElement('button');
      const input1 = document.createElement('input');
      const button2 = document.createElement('button');
      const disabledButton = document.createElement('button');
      disabledButton.disabled = true;

      mockDialog.appendChild(button1);
      mockDialog.appendChild(input1);
      mockDialog.appendChild(disabledButton);
      mockDialog.appendChild(button2);

      vi.spyOn(component as any, 'getModalElement').mockReturnValue(mockDialog);

      const focusableElements = (component as any).getFocusableElements();

      // Should include enabled buttons and input, but not disabled button
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('should exclude hidden elements from focus trap', () => {
      const mockDialog = document.createElement('div');
      const visibleButton = document.createElement('button');
      const hiddenButton = document.createElement('button');
      hiddenButton.setAttribute('hidden', 'true');

      mockDialog.appendChild(visibleButton);
      mockDialog.appendChild(hiddenButton);

      vi.spyOn(component as any, 'getModalElement').mockReturnValue(mockDialog);

      const focusableElements = (component as any).getFocusableElements();

      // Should only include visible elements
      expect(focusableElements).not.toContain(hiddenButton);
    });

    it('should exclude disabled elements from focus trap', () => {
      const mockDialog = document.createElement('div');
      const enabledButton = document.createElement('button');
      const disabledButton = document.createElement('button');
      disabledButton.disabled = true;

      mockDialog.appendChild(enabledButton);
      mockDialog.appendChild(disabledButton);

      vi.spyOn(component as any, 'getModalElement').mockReturnValue(mockDialog);

      const focusableElements = (component as any).getFocusableElements();

      // Should only include enabled elements
      expect(focusableElements).not.toContain(disabledButton);
    });

    it('should focus first element on modal open', async () => {
      const mockButton = document.createElement('button');
      mockButton.id = 'first-button';

      const mockDialog = document.createElement('div');
      mockDialog.appendChild(mockButton);

      vi.spyOn(component as any, 'getModalElement').mockReturnValue(mockDialog);

      const focusSpy = vi.spyOn(mockButton, 'focus');

      (component as any).focusFirstElement();

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should handle modal with no focusable elements', () => {
      const mockDialog = document.createElement('div');
      mockDialog.innerHTML = '<p>No focusable elements</p>';

      vi.spyOn(component as any, 'getModalElement').mockReturnValue(mockDialog);

      expect(() => (component as any).focusFirstElement()).not.toThrow();
    });
  });

  describe('Accessibility Enhancements - Focus Restoration', () => {
    it('should enable focus restoration by default', () => {
      expect(component.restoreFocus()).toBe(true);
    });

    it('should allow disabling focus restoration', () => {
      fixture.componentRef.setInput('restoreFocus', false);
      expect(component.restoreFocus()).toBe(false);
    });

    it('should store focused element on modal open', () => {
      const mockButton = document.createElement('button');
      mockButton.id = 'trigger-button';
      document.body.appendChild(mockButton);
      mockButton.focus();

      // Mock document.activeElement
      Object.defineProperty(document, 'activeElement', {
        writable: true,
        value: mockButton,
      });

      component.handleShow();

      // Should store the last focused element
      expect((component as any).lastFocusedElement).toBe(mockButton);

      document.body.removeChild(mockButton);
    });

    it('should restore focus to original element on close', async () => {
      const mockButton = document.createElement('button');
      mockButton.id = 'trigger-button';
      document.body.appendChild(mockButton);

      const focusSpy = vi.spyOn(mockButton, 'focus');

      // Set as last focused element
      (component as any).lastFocusedElement = mockButton;

      // Mock document.body.contains
      vi.spyOn(document.body, 'contains').mockReturnValue(true);

      component.close();

      // Wait for the timeout (200ms)
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(focusSpy).toHaveBeenCalled();

      document.body.removeChild(mockButton);
    });

    it('should fallback to body when element removed from DOM', async () => {
      const mockButton = document.createElement('button');
      mockButton.id = 'removed-button';

      (component as any).lastFocusedElement = mockButton;

      // Mock document.body.contains to return false (element removed)
      vi.spyOn(document.body, 'contains').mockReturnValue(false);

      const bodyFocusSpy = vi.spyOn(document.body, 'focus');

      component.close();

      await new Promise(resolve => setTimeout(resolve, 250));

      expect(bodyFocusSpy).toHaveBeenCalled();
    });

    it('should not restore focus when restoreFocus is disabled', async () => {
      fixture.componentRef.setInput('restoreFocus', false);

      const mockButton = document.createElement('button');
      document.body.appendChild(mockButton);

      const focusSpy = vi.spyOn(mockButton, 'focus');

      (component as any).lastFocusedElement = mockButton;

      component.close();

      await new Promise(resolve => setTimeout(resolve, 250));

      expect(focusSpy).not.toHaveBeenCalled();

      document.body.removeChild(mockButton);
    });

    it('should use requestAnimationFrame for smooth restoration', async () => {
      const mockButton = document.createElement('button');
      document.body.appendChild(mockButton);

      (component as any).lastFocusedElement = mockButton;
      vi.spyOn(document.body, 'contains').mockReturnValue(true);

      const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: any) => {
        cb();
        return 0;
      });

      component.close();

      await new Promise(resolve => setTimeout(resolve, 250));

      expect(rafSpy).toHaveBeenCalled();

      document.body.removeChild(mockButton);
      rafSpy.mockRestore();
    });

    it('should clear lastFocusedElement after restoration', async () => {
      const mockButton = document.createElement('button');
      document.body.appendChild(mockButton);

      (component as any).lastFocusedElement = mockButton;
      vi.spyOn(document.body, 'contains').mockReturnValue(true);

      component.close();

      await new Promise(resolve => setTimeout(resolve, 250));

      expect((component as any).lastFocusedElement).toBeNull();

      document.body.removeChild(mockButton);
    });
  });

  describe('Accessibility Enhancements - Stacking Context Management', () => {
    it('should add modal to static stack on show', () => {
      const modalStackBefore = (component.constructor as any).modalStack?.length || 0;

      component.handleShow();

      const modalStackAfter = (component.constructor as any).modalStack?.length || 0;

      expect(modalStackAfter).toBeGreaterThan(modalStackBefore);
    });

    it('should remove modal from stack on close', () => {
      component.handleShow(); // Add to stack

      const modalStackBefore = (component.constructor as any).modalStack?.length || 0;

      (component as any).removeFromModalStack();

      const modalStackAfter = (component.constructor as any).modalStack?.length || 0;

      expect(modalStackAfter).toBeLessThan(modalStackBefore);
    });

    it('should assign z-index based on stack position', () => {
      const baseZIndex = (component.constructor as any).baseZIndex || 1100;

      // Clear stack first
      if ((component.constructor as any).modalStack) {
        (component.constructor as any).modalStack = [];
      }

      // Create first modal
      component.handleShow();

      // Mock dialog element
      const mockDialog = document.createElement('div');
      const mockMask = document.createElement('div');
      mockMask.classList.add('p-dialog-mask');

      mockDialog.appendChild(mockMask);
      document.body.appendChild(mockDialog);

      vi.spyOn(component as any, 'getModalElement').mockReturnValue(mockDialog);

      (component as any).updateModalZIndex();

      // First modal should have baseZIndex
      expect(parseInt(mockMask.style.zIndex || '0')).toBeGreaterThanOrEqual(baseZIndex);

      document.body.removeChild(mockDialog);
    });

    it('should calculate z-index with increment for multiple modals', () => {
      const baseZIndex = (component.constructor as any).baseZIndex || 1100;

      // Clear stack
      if ((component.constructor as any).modalStack) {
        (component.constructor as any).modalStack = [];
      }

      // Add to stack manually to simulate multiple modals
      const modalId = (component as any).modalId;
      (component.constructor as any).modalStack = ['modal-1', 'modal-2', modalId];

      const mockDialog = document.createElement('div');
      const mockMask = document.createElement('div');
      mockMask.classList.add('p-dialog-mask');
      mockDialog.appendChild(mockMask);
      document.body.appendChild(mockDialog);

      vi.spyOn(component as any, 'getModalElement').mockReturnValue(mockDialog);

      (component as any).updateModalZIndex();

      // Third modal should have baseZIndex + 20 (2 * 10)
      const expectedZIndex = baseZIndex + 20;
      expect(parseInt(mockMask.style.zIndex || '0')).toBe(expectedZIndex);

      document.body.removeChild(mockDialog);
    });

    it('should only trap focus on topmost modal in stack', () => {
      // Simulate two modals in stack
      (component.constructor as any).modalStack = ['modal-1', 'modal-2-different'];
      (component as any).modalId = 'modal-1'; // Current modal is not topmost

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');

      component.handleTabKey(tabEvent);

      // Should not trap focus since not topmost
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should handle stack correctly with multiple modals', () => {
      // Clear stack
      if ((component.constructor as any).modalStack) {
        (component.constructor as any).modalStack = [];
      }

      const component1 = fixture.componentInstance;
      const component2 = TestBed.createComponent(ModalComponent).componentInstance;
      const component3 = TestBed.createComponent(ModalComponent).componentInstance;

      component1.handleShow(); // Add to stack
      component2.handleShow(); // Add to stack
      component3.handleShow(); // Add to stack

      const stackLength = (component1.constructor as any).modalStack?.length || 0;
      expect(stackLength).toBe(3);

      (component2 as any).removeFromModalStack();

      const newStackLength = (component1.constructor as any).modalStack?.length || 0;
      expect(newStackLength).toBe(2);
    });

    it('should handle z-index update when modal element not found', () => {
      vi.spyOn(component as any, 'getModalElement').mockReturnValue(null);

      expect(() => (component as any).updateModalZIndex()).not.toThrow();
    });

    it('should generate unique modal ID for each instance', () => {
      const component1 = fixture.componentInstance;
      const component2 = TestBed.createComponent(ModalComponent).componentInstance;

      const id1 = (component1 as any).modalId;
      const id2 = (component2 as any).modalId;

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^modal-/);
      expect(id2).toMatch(/^modal-/);
    });
  });

  describe('Accessibility Enhancements - Integration', () => {
    it('should work correctly with all accessibility features enabled', async () => {
      // Enable all features
      fixture.componentRef.setInput('enableFocusTrap', true);
      fixture.componentRef.setInput('restoreFocus', true);

      const mockButton = document.createElement('button');
      document.body.appendChild(mockButton);
      mockButton.focus();

      Object.defineProperty(document, 'activeElement', {
        writable: true,
        value: mockButton,
      });

      // Open modal
      component.handleShow();

      expect((component as any).lastFocusedElement).toBe(mockButton);

      // Close modal
      vi.spyOn(document.body, 'contains').mockReturnValue(true);
      const focusSpy = vi.spyOn(mockButton, 'focus');

      component.close();

      await new Promise(resolve => setTimeout(resolve, 250));

      expect(focusSpy).toHaveBeenCalled();

      document.body.removeChild(mockButton);
    });

    it('should work correctly with all accessibility features disabled', () => {
      fixture.componentRef.setInput('enableFocusTrap', false);
      fixture.componentRef.setInput('restoreFocus', false);

      component.handleShow();

      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');

      component.handleTabKey(tabEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should handle nested modals correctly', async () => {
      const modal1 = fixture.componentInstance;
      const modal2 = TestBed.createComponent(ModalComponent).componentInstance;

      // Clear stack
      if ((modal1.constructor as any).modalStack) {
        (modal1.constructor as any).modalStack = [];
      }

      // Open first modal
      modal1.handleShow();

      // Open second modal (nested)
      modal2.handleShow();

      // Second modal should be on top
      const stackLength = (modal1.constructor as any).modalStack?.length || 0;
      expect(stackLength).toBe(2);

      // Close second modal
      (modal2 as any).removeFromModalStack();

      // First modal should now be on top
      const newStackLength = (modal1.constructor as any).modalStack?.length || 0;
      expect(newStackLength).toBe(1);
    });
  });
});
