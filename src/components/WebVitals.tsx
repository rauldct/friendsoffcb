"use client";

import { useEffect } from "react";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

function sendToGA(metric: { name: string; value: number; id: string }) {
  const gtag = (window as unknown as Record<string, unknown>).gtag as
    | ((...args: unknown[]) => void)
    | undefined;
  if (!gtag) return;

  gtag("event", metric.name, {
    value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
    event_label: metric.id,
    non_interaction: true,
  });
}

export default function WebVitals() {
  useEffect(() => {
    onCLS(sendToGA);
    onFCP(sendToGA);
    onINP(sendToGA);
    onLCP(sendToGA);
    onTTFB(sendToGA);
  }, []);

  return null;
}
