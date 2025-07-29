import React, { memo, useEffect, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

/**
 * Enterprise-grade modal component with accessibility and advanced features
 * Supports focus management, keyboard navigation, and custom animations
 */
const Modal = memo(({
  isOpen = false,
  onClose,
  children,
  title,
  size = 'medium',
  centered = true,
  backdrop = true,
  backdropClick = true,
  keyboard = true,
  animation = 'fade',
  zIndex = 1050,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  closeButton = true,
  footer,
  maxWidth,
  maxHeight,
  scrollable = true,
  autoFocus = true,
  returnFocus = true,
  trapFocus = true,
  ariaLabel,
  ariaDescribedBy,
  onShow,
  onHide,
  onShown,
  onHidden,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef(null);
  const backdropRef = useRef(null);
  const previousActiveElement = useRef(null);
  const lastFocusedElement = useRef(null);

  // Modal sizes
  const sizeStyles = {
    small: { maxWidth: '400px' },
    medium: { maxWidth: '600px' },
    large: { maxWidth: '900px' },
    xl: { maxWidth: '1200px' },
    fullscreen: { width: '100vw', height: '100vh', maxWidth: 'none', maxHeight: 'none' }
  };

  // Animation styles
  const animationStyles = {
    fade: {
      entering: { opacity: 0 },
      entered: { opacity: 1 },
      exiting: { opacity: 0 },
      exited: { opacity: 0 }
    },
    slide: {
      entering: { opacity: 0, transform: 'translateY(-50px)' },
      entered: { opacity: 1, transform: 'translateY(0)' },
      exiting: { opacity: 0, transform: 'translateY(-50px)' },
      exited: { opacity: 0, transform: 'translateY(-50px)' }
    },
    zoom: {
      entering: { opacity: 0, transform: 'scale(0.9)' },
      entered: { opacity: 1, transform: 'scale(1)' },
      exiting: { opacity: 0, transform: 'scale(0.9)' },
      exited: { opacity: 0, transform: 'scale(0.9)' }
    }
  };

  // Handle modal show/hide
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement;
      
      setIsVisible(true);
      setIsAnimating(true);
      onShow?.();
      
      // Disable body scroll
      document.body.style.overflow = 'hidden';
      
      // Focus management
      if (autoFocus) {
        setTimeout(() => {
          const focusableElement = modalRef.current?.querySelector(
            'button, [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          focusableElement?.focus();
        }, 50);
      }
      
      // Animation end
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onShown?.();
      }, 300);
      
      return () => clearTimeout(timer);
    } else if (isVisible) {
      setIsAnimating(true);
      onHide?.();
      
      // Re-enable body scroll
      document.body.style.overflow = '';
      
      // Return focus
      if (returnFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
      
      // Hide after animation
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        onHidden?.();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, isVisible, autoFocus, returnFocus, onShow, onHide, onShown, onHidden]);

  // Handle escape key
  const handleKeyDown = useCallback((e) => {
    if (!keyboard) return;
    
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose?.();
    }
    
    // Focus trap
    if (trapFocus && e.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    }
  }, [keyboard, trapFocus, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (backdropClick && e.target === backdropRef.current) {
      onClose?.();
    }
  }, [backdropClick, onClose]);

  // Keyboard event listener
  useEffect(() => {
    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, handleKeyDown]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  const modalContent = (
    <div
      className={`modal-backdrop ${animation}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex,
        display: 'flex',
        alignItems: centered ? 'center' : 'flex-start',
        justifyContent: 'center',
        padding: centered ? '20px' : '50px 20px',
        background: backdrop ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
        transition: 'all 0.3s ease',
        ...animationStyles[animation]?.[isAnimating ? 'entering' : 'entered']
      }}
      ref={backdropRef}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`modal-dialog ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
        aria-describedby={ariaDescribedBy}
        style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          outline: 'none',
          maxHeight: scrollable ? '90vh' : 'none',
          overflow: scrollable ? 'auto' : 'visible',
          transition: 'all 0.3s ease',
          ...sizeStyles[size],
          ...(maxWidth && { maxWidth }),
          ...(maxHeight && { maxHeight }),
          ...animationStyles[animation]?.[isAnimating ? 'entering' : 'entered']
        }}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {/* Modal Header */}
        {(title || closeButton) && (
          <div
            className={`modal-header ${headerClassName}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px',
              borderBottom: '1px solid #dee2e6'
            }}
          >
            {title && (
              <h4
                className="modal-title"
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#212529'
                }}
              >
                {title}
              </h4>
            )}
            
            {closeButton && (
              <button
                type="button"
                className="modal-close"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#6c757d',
                  lineHeight: 1
                }}
                aria-label="Close modal"
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div
          className={`modal-body ${bodyClassName}`}
          style={{
            padding: '20px',
            ...(scrollable && { 
              overflowY: 'auto',
              maxHeight: 'calc(90vh - 120px)' // Account for header and footer
            })
          }}
        >
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div
            className={`modal-footer ${footerClassName}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '20px',
              borderTop: '1px solid #dee2e6'
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Render in portal
  return createPortal(modalContent, document.body);
});

Modal.displayName = 'Modal';

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'xl', 'fullscreen']),
  centered: PropTypes.bool,
  backdrop: PropTypes.bool,
  backdropClick: PropTypes.bool,
  keyboard: PropTypes.bool,
  animation: PropTypes.oneOf(['fade', 'slide', 'zoom']),
  zIndex: PropTypes.number,
  className: PropTypes.string,
  headerClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
  footerClassName: PropTypes.string,
  closeButton: PropTypes.bool,
  footer: PropTypes.node,
  maxWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  maxHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  scrollable: PropTypes.bool,
  autoFocus: PropTypes.bool,
  returnFocus: PropTypes.bool,
  trapFocus: PropTypes.bool,
  ariaLabel: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
  onShow: PropTypes.func,
  onHide: PropTypes.func,
  onShown: PropTypes.func,
  onHidden: PropTypes.func
};

// Utility components
export const ModalHeader = memo(({ children, className = '', ...props }) => (
  <div className={`modal-header ${className}`} {...props}>
    {children}
  </div>
));

export const ModalBody = memo(({ children, className = '', ...props }) => (
  <div className={`modal-body ${className}`} {...props}>
    {children}
  </div>
));

export const ModalFooter = memo(({ children, className = '', ...props }) => (
  <div className={`modal-footer ${className}`} {...props}>
    {children}
  </div>
));

// Confirmation modal utility
export const ConfirmationModal = memo(({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  ...props
}) => {
  const confirmButtonStyle = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    ...(confirmVariant === 'danger' && {
      background: '#dc3545',
      color: 'white'
    }),
    ...(confirmVariant === 'primary' && {
      background: '#007bff',
      color: 'white'
    }),
    ...(confirmVariant === 'success' && {
      background: '#28a745',
      color: 'white'
    })
  };

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        style={{
          padding: '8px 16px',
          background: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {cancelText}
      </button>
      <button
        type="button"
        onClick={() => {
          onConfirm?.();
          onClose?.();
        }}
        style={confirmButtonStyle}
      >
        {confirmText}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      footer={footer}
      {...props}
    >
      <p style={{ margin: 0 }}>{message}</p>
    </Modal>
  );
});

ConfirmationModal.displayName = 'ConfirmationModal';

export default Modal;