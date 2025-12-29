"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  locales,
  localeNames,
  localeFlags,
  priorityLocales,
  type Locale,
} from "@/i18n/config";

export function LanguageSelector() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering DropdownMenu on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  // Sort locales: priority first, then alphabetically
  const sortedLocales = [
    ...priorityLocales,
    ...locales.filter((l) => !priorityLocales.includes(l)).sort(),
  ];

  // Show placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="gap-2">
        <span className="text-lg">{localeFlags[locale]}</span>
        <span className="hidden sm:inline">{localeNames[locale]}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <span className="text-lg">{localeFlags[locale]}</span>
          <span className="hidden sm:inline">{localeNames[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
        {sortedLocales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => handleLocaleChange(l)}
            className={locale === l ? "bg-accent" : ""}
          >
            <span className="text-lg mr-2">{localeFlags[l]}</span>
            <span>{localeNames[l]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
