"use client";

import type { ReactNode } from 'react';

// This component can be used to wrap your application with any context providers
// or perform other global setup. For now, it's a simple pass-through.
export function AppProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
