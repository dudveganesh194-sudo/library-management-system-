import { useState, TouchEvent } from 'react';

interface SwipeConfig {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  minSwipeDistance?: number;
  maxVerticalDistance?: number;
}

export function useSwipeGesture({
  onSwipeRight,
  onSwipeLeft,
  minSwipeDistance = 50,
  maxVerticalDistance = 60,
}: SwipeConfig) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;

    const target = e.target as HTMLElement | null;
    const clientX = e.touches[0].clientX;

    // If touching inside an interactive form element or modal/dialog,
    // only register swipe if touch originated right at the screen's left edge (<= 30px)
    if (target && target.closest('input, textarea, select, button, [role="dialog"], .scrollable')) {
      if (clientX > 30) {
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

    // Verify horizontal swipe (vertical movement must be within threshold)
    if (Math.abs(deltaY) <= maxVerticalDistance) {
      if (deltaX >= minSwipeDistance) {
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
