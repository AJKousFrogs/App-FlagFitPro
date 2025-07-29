/**
 * Comprehensive tests for Modal component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal, { ConfirmationModal } from '../../ui/Modal';

// Mock createPortal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    children: <div>Modal content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    
    // Mock document.body.style
    Object.defineProperty(document.body, 'style', {
      value: {
        overflow: '',
      },
      writable: true,
    });
  });

  afterEach(() => {
    // Clean up any remaining modals
    document.body.style.overflow = '';
  });

  describe('basic functionality', () => {
    it('should render modal when open', () => {
      render(<Modal {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<Modal {...defaultProps} title="Test Modal" />);
      
      const closeButton = screen.getByRole('button', { name: /close modal/i });
      await user.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when escape key is pressed', async () => {
      const user = userEvent.setup();
      
      render(<Modal {...defaultProps} />);
      
      await user.keyboard('{Escape}');
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      
      render(<Modal {...defaultProps} />);
      
      const backdrop = screen.getByRole('dialog').parentElement;
      await user.click(backdrop!);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when modal content is clicked', async () => {
      const user = userEvent.setup();
      
      render(<Modal {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      await user.click(dialog);
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('props and configuration', () => {
    it('should render title when provided', () => {
      render(<Modal {...defaultProps} title="Test Title" />);
      
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Test Title');
    });

    it('should render footer when provided', () => {
      const footer = (
        <div>
          <button>Cancel</button>
          <button>Save</button>
        </div>
      );
      
      render(<Modal {...defaultProps} footer={footer} />);
      
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('should not render close button when disabled', () => {
      render(<Modal {...defaultProps} title="Test" closeButton={false} />);
      
      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Modal {...defaultProps} className="custom-modal" />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('custom-modal');
    });

    it('should apply custom styles', () => {
      const customStyle = { backgroundColor: 'red' };
      
      render(<Modal {...defaultProps} style={customStyle} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveStyle('background-color: red');
    });

    it('should handle different sizes', () => {
      const { rerender } = render(<Modal {...defaultProps} size="small" />);
      let dialog = screen.getByRole('dialog');
      expect(dialog).toHaveStyle('max-width: 400px');

      rerender(<Modal {...defaultProps} size="large" />);
      dialog = screen.getByRole('dialog');
      expect(dialog).toHaveStyle('max-width: 900px');

      rerender(<Modal {...defaultProps} size="fullscreen" />);
      dialog = screen.getByRole('dialog');
      expect(dialog).toHaveStyle('width: 100vw');
      expect(dialog).toHaveStyle('height: 100vh');
    });

    it('should handle custom maxWidth and maxHeight', () => {
      render(<Modal {...defaultProps} maxWidth="500px" maxHeight="300px" />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveStyle('max-width: 500px');
      expect(dialog).toHaveStyle('max-height: 300px');
    });
  });

  describe('accessibility', () => {
    it('should set proper ARIA attributes', () => {
      render(
        <Modal 
          {...defaultProps} 
          title="Accessible Modal"
          ariaDescribedBy="modal-description"
        />
      );
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Accessible Modal');
      expect(dialog).toHaveAttribute('aria-describedby', 'modal-description');
    });

    it('should focus first focusable element when autoFocus is enabled', async () => {
      render(
        <Modal {...defaultProps} autoFocus>
          <button>First Button</button>
          <button>Second Button</button>
        </Modal>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'First Button' })).toHaveFocus();
      });
    });

    it('should trap focus within modal', async () => {
      const user = userEvent.setup();
      
      render(
        <Modal {...defaultProps} trapFocus>
          <button>First Button</button>
          <button>Second Button</button>
        </Modal>
      );

      const firstButton = screen.getByRole('button', { name: 'First Button' });
      const secondButton = screen.getByRole('button', { name: 'Second Button' });

      firstButton.focus();
      
      // Tab forward should move to second button
      await user.tab();
      expect(secondButton).toHaveFocus();
      
      // Tab forward again should wrap to first button
      await user.tab();
      expect(firstButton).toHaveFocus();
      
      // Shift+Tab should move to last button
      await user.tab({ shift: true });
      expect(secondButton).toHaveFocus();
    });

    it('should restore focus to previous element when returnFocus is enabled', async () => {
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Open Modal';
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      const { rerender } = render(<Modal {...defaultProps} returnFocus />);

      // Close modal
      rerender(<Modal {...defaultProps} isOpen={false} returnFocus />);

      await waitFor(() => {
        expect(triggerButton).toHaveFocus();
      });

      document.body.removeChild(triggerButton);
    });
  });

  describe('animation and lifecycle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should call onShow when modal opens', () => {
      const onShow = jest.fn();
      
      render(<Modal {...defaultProps} onShow={onShow} />);
      
      expect(onShow).toHaveBeenCalledTimes(1);
    });

    it('should call onHide when modal closes', () => {
      const onHide = jest.fn();
      
      const { rerender } = render(<Modal {...defaultProps} onHide={onHide} />);
      
      rerender(<Modal {...defaultProps} isOpen={false} onHide={onHide} />);
      
      expect(onHide).toHaveBeenCalledTimes(1);
    });

    it('should call onShown after animation completes', () => {
      const onShown = jest.fn();
      
      render(<Modal {...defaultProps} onShown={onShown} />);
      
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      expect(onShown).toHaveBeenCalledTimes(1);
    });

    it('should call onHidden after close animation completes', () => {
      const onHidden = jest.fn();
      
      const { rerender } = render(<Modal {...defaultProps} onHidden={onHidden} />);
      
      rerender(<Modal {...defaultProps} isOpen={false} onHidden={onHidden} />);
      
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      expect(onHidden).toHaveBeenCalledTimes(1);
    });

    it('should disable body scroll when open', () => {
      render(<Modal {...defaultProps} />);
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when closed', () => {
      const { rerender } = render(<Modal {...defaultProps} />);
      
      rerender(<Modal {...defaultProps} isOpen={false} />);
      
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('event handling', () => {
    it('should not close on backdrop click when backdropClick is false', async () => {
      const user = userEvent.setup();
      
      render(<Modal {...defaultProps} backdropClick={false} />);
      
      const backdrop = screen.getByRole('dialog').parentElement;
      await user.click(backdrop!);
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should not close on escape when keyboard is false', async () => {
      const user = userEvent.setup();
      
      render(<Modal {...defaultProps} keyboard={false} />);
      
      await user.keyboard('{Escape}');
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should not show backdrop when backdrop is false', () => {
      render(<Modal {...defaultProps} backdrop={false} />);
      
      const backdrop = screen.getByRole('dialog').parentElement;
      expect(backdrop).toHaveStyle('background: transparent');
    });
  });

  describe('animation types', () => {
    it('should apply fade animation styles', () => {
      render(<Modal {...defaultProps} animation="fade" />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveStyle('opacity: 1');
    });

    it('should apply slide animation styles', () => {
      render(<Modal {...defaultProps} animation="slide" />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveStyle('transform: translateY(0)');
    });

    it('should apply zoom animation styles', () => {
      render(<Modal {...defaultProps} animation="zoom" />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveStyle('transform: scale(1)');
    });
  });

  describe('scrollable content', () => {
    it('should apply scrollable styles when scrollable is true', () => {
      render(<Modal {...defaultProps} scrollable />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveStyle('max-height: 90vh');
      expect(dialog).toHaveStyle('overflow: auto');
    });

    it('should not apply scrollable styles when scrollable is false', () => {
      render(<Modal {...defaultProps} scrollable={false} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveStyle('overflow: visible');
    });
  });
});

describe('ConfirmationModal', () => {
  const defaultConfirmProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Confirm Action',
    message: 'Are you sure?',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render confirmation modal with default props', () => {
    render(<ConfirmationModal {...defaultConfirmProps} />);
    
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('should call onConfirm and onClose when confirm button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<ConfirmationModal {...defaultConfirmProps} />);
    
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    await user.click(confirmButton);
    
    expect(defaultConfirmProps.onConfirm).toHaveBeenCalledTimes(1);
    expect(defaultConfirmProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call only onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<ConfirmationModal {...defaultConfirmProps} />);
    
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);
    
    expect(defaultConfirmProps.onConfirm).not.toHaveBeenCalled();
    expect(defaultConfirmProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should render custom button text', () => {
    render(
      <ConfirmationModal 
        {...defaultConfirmProps}
        confirmText="Delete"
        cancelText="Keep"
      />
    );
    
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
  });

  it('should apply different confirm button variants', () => {
    const { rerender } = render(
      <ConfirmationModal {...defaultConfirmProps} confirmVariant="danger" />
    );
    
    let confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toHaveStyle('background: #dc3545');

    rerender(
      <ConfirmationModal {...defaultConfirmProps} confirmVariant="primary" />
    );
    
    confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toHaveStyle('background: #007bff');

    rerender(
      <ConfirmationModal {...defaultConfirmProps} confirmVariant="success" />
    );
    
    confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toHaveStyle('background: #28a745');
  });

  it('should render custom title and message', () => {
    render(
      <ConfirmationModal 
        {...defaultConfirmProps}
        title="Delete Item"
        message="This action cannot be undone."
      />
    );
    
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });
});