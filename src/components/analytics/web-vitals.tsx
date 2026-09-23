'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // In development mode, log Web Vitals metrics
    if (process.env.NODE_ENV === 'development') {
      const formattedValue =
        metric.name === 'CLS'
          ? Math.round(metric.value * 1000) / 1000
          : Math.round(metric.value);

      console.log(`[Web Vitals] ${metric.name}:`, {
        value: formattedValue,
        rating: metric.rating,
        navigationType: metric.navigationType,
      });
    }

    // Optional telemetry beacon egress if configured in environment
    const analyticsUrl = process.env.NEXT_PUBLIC_ANALYTICS_URL;
    if (analyticsUrl && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      try {
        const body = JSON.stringify({
          id: metric.id,
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          page: window.location.pathname,
        });
        navigator.sendBeacon(analyticsUrl, body);
      } catch (err) {
        console.error('[Web Vitals Telemetry Error]', err);
      }
    }
  });

  return null;
}
