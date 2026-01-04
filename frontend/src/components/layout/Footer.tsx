/**
 * =============================================================================
 * REFACTORING INFO
 * =============================================================================
 * File estratto da: src/app/[locale]/page.tsx (righe 294-307)
 * Data refactoring: 2025-12-29
 * Motivo: Componente layout riutilizzabile per footer
 *
 * Funzionalita:
 * - Logo e nome app
 * - Copyright con anno dinamico
 * - Testo "All rights reserved"
 *
 * Utilizzato in tutte le pagine con layout principale
 * =============================================================================
 */

"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Fish, Facebook, Instagram, Twitter, Youtube, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  const t = useTranslations();

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com/tournamentmaster", label: "Facebook" },
    { icon: Instagram, href: "https://instagram.com/tournamentmaster", label: "Instagram" },
    { icon: Twitter, href: "https://twitter.com/tournamentmaster", label: "Twitter" },
    { icon: Youtube, href: "https://youtube.com/tournamentmaster", label: "YouTube" },
  ];

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Fish className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">{t("common.appName")}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              La piattaforma definitiva per tornei di pesca sportiva. Organizza, partecipa e vinci.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Link Rapidi</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/tournaments" className="text-muted-foreground hover:text-foreground transition-colors">
                  Tornei
                </Link>
              </li>
              <li>
                <Link href="/fipsas" className="text-muted-foreground hover:text-foreground transition-colors">
                  FIPSAS
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">
                  Registrati
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                  Accedi
                </Link>
              </li>
            </ul>
          </div>

          {/* For Organizers */}
          <div>
            <h3 className="font-semibold mb-4">Per Organizzatori</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/organizer/register" className="text-muted-foreground hover:text-foreground transition-colors">
                  Diventa Organizzatore
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Prezzi
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Funzionalità
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contatti</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <a href="mailto:info@tournamentmaster.it" className="hover:text-foreground transition-colors">
                  info@tournamentmaster.it
                </a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+39 02 1234567</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>Via della Pesca, 1<br />80077 Ischia, NA</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} {t("common.appName")}. {t("home.allRightsReserved")}
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Termini di Servizio
            </Link>
            <Link href="/cookies" className="hover:text-foreground transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
