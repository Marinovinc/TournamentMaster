/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File estratto da: src/app/[locale]/page.tsx (righe 119-152)
 * Data refactoring: 2025-12-29
 * Motivo: Componente layout riutilizzabile per header
 *
 * Funzionalita:
 * - Logo e nome app
 * - Navigazione principale (Tornei, Classifica)
 * - Selettore lingua
 * - Pulsanti Login/Registrati
 * - Sticky header con blur backdrop
 *
 * Utilizzato in tutte le pagine con layout principale
 * =============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { HelpGuide } from "@/components/HelpGuide";
import Link from "next/link";
import { Fish, Trophy, Award } from "lucide-react";

export function Header() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="p-2 rounded-xl bg-primary text-primary-foreground">
            <Fish className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold text-gradient-sea">
            {t("common.appName")}
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/tournaments">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Trophy className="h-4 w-4 mr-2" />
              {t("nav.tournaments")}
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Award className="h-4 w-4 mr-2" />
              {t("nav.leaderboard")}
            </Button>
          </Link>
          <LanguageSelector />
          <HelpGuide pageKey="home" position="inline" />
          <Link href="/login">
            <Button variant="outline" size="sm">{t("nav.login")}</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">{t("nav.register")}</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
