'use client';

import React, { useEffect, useState } from 'react';

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (docHeight > 0) {
        const percentage = Math.min(100, Math.max(0, Math.round((scrollY / docHeight) * 100)));
        setProgress(percentage);
      } else {
        setProgress(0);
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      role="progressbar"
      aria-label="Tiến độ đọc bài viết"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed top-0 left-0 right-0 h-1 bg-transparent z-50 pointer-events-none"
    >
      <div
        className="h-full bg-primary transition-[width] duration-100 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
