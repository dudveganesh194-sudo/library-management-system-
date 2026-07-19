import { useState, TouchEvent } from 'react';

interface SwipeConfig {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  minSwipeDistance?: number;
  maxVerticalDistance?: number;
  maxStartEdgeX?: number; // Only allow swipe right if touch starts near left edge
}

export function useSwipeGesture({
  onSwipeRight,
  onSwipeLeft,
  minSwipeDistance = 90, // Requires a longer, deliberate slide (90px)
  maxVerticalDistance = 45, // Strict vertical limit to avoid vertical scrolling triggers
  maxStartEdgeX = 50, // To open menu, touch must start within 50px of left screen edge
}: SwipeConfig) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;

    const target = e.target as HTMLElement | null;
    const clientX = e.touches[0].clientX;

    // Do not intercept if user is touching interactive inputs or dialog elements unless near left edge
    if (target && target.closest('input, textarea, select, button, [role="dialog"], .scrollable')) {
      if (clientX > maxStartEdgeX) {
        return;
      }
    }

    setTouchStart({
      x: clientX,
      y: e.touches[0].clientY,
    });
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStart || e.changedTouches.length !== 1) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStart.x;
    const deltaY = touchEndY - touchStart.y;

    // Verify horizontal swipe:
    // 1. Vertical movement must be small (<= maxVerticalDistance)
    // 2. To open menu (swipe right), touch start position must be near the left edge (<= maxStartEdgeX)
    if (Math.abs(deltaY) <= maxVerticalDistance) {
      if (deltaX >= minSwipeDistance && touchStart.x <= maxStartEdgeX) {
        onSwipeRight?.();
      } else if (deltaX <= -minSwipeDistance) {
        onSwipeLeft?.();
      }
    }

    setTouchStart(null);
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}
