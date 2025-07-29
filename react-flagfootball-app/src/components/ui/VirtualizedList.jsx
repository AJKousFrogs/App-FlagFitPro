import React, { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * High-performance virtualized list component
 * Handles large datasets efficiently with windowing
 */
const VirtualizedList = memo(({
  items = [],
  itemHeight = 60,
  containerHeight = 400,
  renderItem,
  getItemKey,
  overscan = 5,
  className = '',
  onScroll,
  ...props
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  // Calculate visible range
  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    // Apply overscan
    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(items.length - 1, visibleEnd + overscan);

    const visible = items.slice(start, end + 1).map((item, index) => ({
      item,
      index: start + index,
      key: getItemKey ? getItemKey(item, start + index) : start + index
    }));

    return {
      startIndex: start,
      endIndex: end,
      visibleItems: visible,
      totalHeight
    };
  }, [items, itemHeight, scrollTop, containerHeight, overscan, getItemKey]);

  // Handle scroll with debouncing
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set scrolling to false after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    // Call external scroll handler
    if (onScroll) {
      onScroll(e, { scrollTop: newScrollTop, isScrolling: true });
    }
  }, [onScroll]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`virtualized-list ${className}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
      {...props}
    >
      {/* Total height spacer */}
      <div
        style={{
          height: items.length * itemHeight,
          position: 'relative'
        }}
      >
        {/* Visible items */}
        {visibleItems.map(({ item, index, key }) => (
          <div
            key={key}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index, { isScrolling })}
          </div>
        ))}
      </div>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

VirtualizedList.propTypes = {
  items: PropTypes.array.isRequired,
  itemHeight: PropTypes.number,
  containerHeight: PropTypes.number,
  renderItem: PropTypes.func.isRequired,
  getItemKey: PropTypes.func,
  overscan: PropTypes.number,
  className: PropTypes.string,
  onScroll: PropTypes.func
};

export default VirtualizedList;