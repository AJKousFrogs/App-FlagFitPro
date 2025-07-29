import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * High-performance lazy loading image component
 * Includes intersection observer, placeholder, and error handling
 */
const LazyImage = memo(({
  src,
  alt = '',
  className = '',
  placeholderSrc,
  errorSrc,
  width,
  height,
  style = {},
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(placeholderSrc || '');
  const [imageState, setImageState] = useState('loading'); // loading, loaded, error
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer setup
  useEffect(() => {
    const currentImgRef = imgRef.current;
    
    if (!currentImgRef || isInView) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observerRef.current.observe(currentImgRef);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin, isInView]);

  // Load image when in view
  useEffect(() => {
    if (!isInView || !src) return;

    const imageLoader = new Image();
    
    imageLoader.onload = () => {
      setImageSrc(src);
      setImageState('loaded');
      onLoad?.();
    };
    
    imageLoader.onerror = () => {
      setImageSrc(errorSrc || placeholderSrc || '');
      setImageState('error');
      onError?.();
    };
    
    imageLoader.src = src;
  }, [isInView, src, errorSrc, placeholderSrc, onLoad, onError]);

  // Handle image load
  const handleImageLoad = useCallback((e) => {
    if (imageState !== 'loaded' && e.target.src === src) {
      setImageState('loaded');
      onLoad?.(e);
    }
  }, [imageState, src, onLoad]);

  // Handle image error
  const handleImageError = useCallback((e) => {
    if (errorSrc && e.target.src !== errorSrc) {
      setImageSrc(errorSrc);
    }
    setImageState('error');
    onError?.(e);
  }, [errorSrc, onError]);

  // Generate CSS classes based on state
  const cssClasses = [
    'lazy-image',
    className,
    `lazy-image--${imageState}`,
    isInView ? 'lazy-image--in-view' : 'lazy-image--pending'
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={`lazy-image-container ${cssClasses}`}
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className="lazy-image-element"
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'opacity 0.3s ease-in-out',
          opacity: imageState === 'loaded' ? 1 : 0.7
        }}
        {...props}
      />
      
      {/* Loading placeholder */}
      {imageState === 'loading' && (
        <div 
          className="lazy-image-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            color: '#666'
          }}
        >
          <div className="lazy-image-spinner">
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid #ddd',
              borderTop: '2px solid #666',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        </div>
      )}
      
      {/* Error state */}
      {imageState === 'error' && !errorSrc && (
        <div 
          className="lazy-image-error"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f8f8',
            color: '#999',
            fontSize: '14px'
          }}
        >
          <div>
            <div style={{ marginBottom: '4px' }}>⚠️</div>
            <div>Image failed to load</div>
          </div>
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

LazyImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  className: PropTypes.string,
  placeholderSrc: PropTypes.string,
  errorSrc: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  style: PropTypes.object,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  threshold: PropTypes.number,
  rootMargin: PropTypes.string
};

// Add CSS animation for spinner
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default LazyImage;