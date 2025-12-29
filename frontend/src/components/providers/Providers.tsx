/**
 * =============================================================================
 * CLIENT PROVIDERS WRAPPER
 * =============================================================================
 * Wraps all client-side providers (Auth, Theme, etc.)
 * Used in the root layout to provide context to the entire app
 * =============================================================================
 */

"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
