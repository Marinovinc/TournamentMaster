"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  label?: string;
  fallbackHref?: string;
  className?: string;
}

/**
 * Client-side back button that uses browser history.
 * Falls back to specified href if history is empty.
 */
export function BackButton({
  label = "Torna indietro",
  fallbackHref,
  className = "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      router.back();
    } else if (fallbackHref) {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={className}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
