'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ============================================================
// TYPES
// ============================================================

interface UseVirtualListOptions {
  itemCount: number;
  itemHeight: number;
  overscan?: number;
  containerHeight?: number;
}

interface VirtualItem {
  index: number;
  start: number;
  end: number;
  size: number;
}

interface UseVirtualListReturn {
  virtualItems: VirtualItem[];
  totalHeight: number;
  scrollOffset: number;
  containerRef: React.RefObject<HTMLDivElement>;
  startIndex: number;
  endIndex: number;
  isScrolling: boolean;
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
}

// ============================================================
// HOOK: useVirtualList
// ============================================================

export function useVirtualList({
  itemCount,
  itemHeight,
  overscan = 5,
  containerHeight: initialContainerHeight,
}: UseVirtualListOptions): UseVirtualListReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [containerHeight, setContainerHeight] = useState(initialContainerHeight || 0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate total height
  const totalHeight = itemCount * itemHeight;

  // Observe container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    // Initial measurement
    updateHeight();

    // Use ResizeObserver for dynamic size changes
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Handle scroll events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollOffset(container.scrollTop);
      setIsScrolling(true);

      // Clear previous timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set isScrolling to false after scroll ends
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Calculate visible range with overscan
  const { startIndex, endIndex } = useMemo(() => {
    if (containerHeight === 0) {
      return { startIndex: 0, endIndex: Math.min(overscan * 2, itemCount - 1) };
    }

    const start = Math.max(0, Math.floor(scrollOffset / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(itemCount - 1, start + visibleCount + overscan * 2);

    return { startIndex: start, endIndex: end };
  }, [scrollOffset, containerHeight, itemHeight, itemCount, overscan]);

  // Generate virtual items
  const virtualItems = useMemo((): VirtualItem[] => {
    const items: VirtualItem[] = [];

    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
        size: itemHeight,
      });
    }

    return items;
  }, [startIndex, endIndex, itemHeight]);

  // Scroll to specific index
  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'auto') => {
    const container = containerRef.current;
    if (!container) return;

    const targetOffset = Math.max(0, Math.min(index * itemHeight, totalHeight - containerHeight));
    container.scrollTo({
      top: targetOffset,
      behavior,
    });
  }, [itemHeight, totalHeight, containerHeight]);

  return {
    virtualItems,
    totalHeight,
    scrollOffset,
    containerRef,
    startIndex,
    endIndex,
    isScrolling,
    scrollToIndex,
  };
}

// ============================================================
// HOOK: useWindowVirtualList (for window-based virtualization)
// ============================================================

interface UseWindowVirtualListOptions {
  itemCount: number;
  itemHeight: number;
  overscan?: number;
}

export function useWindowVirtualList({
  itemCount,
  itemHeight,
  overscan = 5,
}: UseWindowVirtualListOptions): Omit<UseVirtualListReturn, 'containerRef'> & { measureRef: React.RefObject<HTMLDivElement> } {
  const measureRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 0);
  const [offsetTop, setOffsetTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const totalHeight = itemCount * itemHeight;

  // Measure offset from top of page
  useEffect(() => {
    const measureElement = () => {
      if (measureRef.current) {
        const rect = measureRef.current.getBoundingClientRect();
        setOffsetTop(rect.top + window.scrollY);
      }
    };

    measureElement();

    const resizeObserver = new ResizeObserver(measureElement);
    if (measureRef.current) {
      resizeObserver.observe(measureRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Handle window scroll and resize
  useEffect(() => {
    const handleScroll = () => {
      setScrollOffset(window.scrollY);
      setIsScrolling(true);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Calculate visible range
  const { startIndex, endIndex } = useMemo(() => {
    const relativeScroll = Math.max(0, scrollOffset - offsetTop);
    const start = Math.max(0, Math.floor(relativeScroll / itemHeight) - overscan);
    const visibleCount = Math.ceil(windowHeight / itemHeight);
    const end = Math.min(itemCount - 1, start + visibleCount + overscan * 2);

    return { startIndex: start, endIndex: end };
  }, [scrollOffset, offsetTop, windowHeight, itemHeight, itemCount, overscan]);

  const virtualItems = useMemo((): VirtualItem[] => {
    const items: VirtualItem[] = [];

    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
        size: itemHeight,
      });
    }

    return items;
  }, [startIndex, endIndex, itemHeight]);

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'auto') => {
    const targetOffset = offsetTop + index * itemHeight;
    window.scrollTo({
      top: targetOffset,
      behavior,
    });
  }, [offsetTop, itemHeight]);

  return {
    virtualItems,
    totalHeight,
    scrollOffset,
    measureRef,
    startIndex,
    endIndex,
    isScrolling,
    scrollToIndex,
  };
}

// ============================================================
// HELPER: Style generators for virtual list rendering
// ============================================================

/**
 * Get container styles for virtual list
 */
export const getVirtualContainerStyle = (totalHeight: number): React.CSSProperties => ({
  height: totalHeight,
  position: 'relative',
});

/**
 * Get item styles for virtual list items
 */
export const getVirtualItemStyle = (start: number, size: number): React.CSSProperties => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: size,
  transform: `translateY(${start}px)`,
});

export default useVirtualList;
