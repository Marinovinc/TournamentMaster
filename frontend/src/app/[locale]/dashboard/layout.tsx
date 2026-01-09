/**
 * =============================================================================
 * DASHBOARD LAYOUT - Sidebar Contestuale v2.0
 * =============================================================================
 * Layout con sidebar organizzata in sezioni collassabili
 * - Filtro per RUOLO utente
 * - Espansione contestuale basata sulla pagina corrente
 * - Sezioni personalizzate per PARTICIPANT
 * =============================================================================
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Fish,
  LayoutDashboard,
  Trophy,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  CheckCircle,
  BarChart3,
  Bell,
  ChevronDown,
  ChevronRight,
  Ship,
  Zap,
  Building2,
  Palette,
  Anchor,
  Award,
  Calendar,
  CreditCard,
  FileText,
  History,
  Image,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
  badge?: number;
}

interface SidebarSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
  roles?: string[];
}

function SidebarSectionComponent({
  section,
  isExpanded,
  onToggle,
  pathname,
  locale,
  onItemClick,
  userRole,
}: {
  section: SidebarSection;
  isExpanded: boolean;
  onToggle: () => void;
  pathname: string;
  locale: string;
  onItemClick: () => void;
  userRole: string;
}) {
  const visibleItems = section.items.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  if (visibleItems.length === 0) return null;

  const hasActiveItem = visibleItems.some((item) => pathname === item.href);

  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
          hasActiveItem
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <div className="flex items-center gap-2">
          {section.icon}
          <span>{section.label}</span>
        </div>
        <ChevronRight
          className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isExpanded ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pl-4 space-y-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
                onClick={onItemClick}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = (params.locale as string) || "it";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [impersonatingTenant, setImpersonatingTenant] = useState<{id: string; name: string} | null>(null);
  const [activeTournament, setActiveTournament] = useState<{id: string; name: string; status: string} | null>(null);

  // Check for impersonation mode
  useEffect(() => {
    const checkImpersonation = () => {
      const tenantStr = localStorage.getItem("impersonatingTenant");
      if (tenantStr) {
        try {
          setImpersonatingTenant(JSON.parse(tenantStr));
        } catch {
          setImpersonatingTenant(null);
        }
      } else {
        setImpersonatingTenant(null);
      }
    };

    // Check on mount and pathname changes
    checkImpersonation();

    // Listen to storage events (for cross-tab sync)
    window.addEventListener("storage", checkImpersonation);
    
    // Also check periodically in case of same-tab changes
    const interval = setInterval(checkImpersonation, 500);

    return () => {
      window.removeEventListener("storage", checkImpersonation);
      clearInterval(interval);
    };
  }, [pathname]);

  // Exit association mode
  const exitAssociationMode = () => {
    localStorage.removeItem("impersonationToken");
    localStorage.removeItem("impersonatingTenant");
    setImpersonatingTenant(null);
    router.push(`/${locale}/dashboard/super-admin`);
  };

  // Check for active tournament mode
  useEffect(() => {
    const checkActiveTournament = () => {
      const tournamentStr = localStorage.getItem("activeTournament");
      if (tournamentStr) {
        try {
          setActiveTournament(JSON.parse(tournamentStr));
        } catch {
          setActiveTournament(null);
        }
      } else {
        setActiveTournament(null);
      }
    };

    // Check on mount
    checkActiveTournament();

    // Listen to custom event for tournament changes
    const handleTournamentChanged = () => checkActiveTournament();
    window.addEventListener("tournamentChanged", handleTournamentChanged);

    // Listen to storage events (for cross-tab sync)
    window.addEventListener("storage", checkActiveTournament);

    return () => {
      window.removeEventListener("tournamentChanged", handleTournamentChanged);
      window.removeEventListener("storage", checkActiveTournament);
    };
  }, []);

  // Exit tournament mode
  const exitTournamentMode = () => {
    localStorage.removeItem("activeTournament");
    setActiveTournament(null);
    window.dispatchEvent(new Event("tournamentChanged"));
    router.push(`/${locale}/dashboard/tournaments`);
  };

  const operationalSections: SidebarSection[] = useMemo(
    () => [
      {
        id: "gestione",
        label: "Gestione",
        icon: <Settings className="h-4 w-4" />,
        roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT"],
        items: [
          {
            href: `/${locale}/dashboard/super-admin`,
            label: "Associazioni",
            icon: <Building2 className="h-4 w-4" />,
            roles: ["SUPER_ADMIN"],
          },
          {
            href: `/${locale}/dashboard/users`,
            label: "Utenti",
            icon: <Users className="h-4 w-4" />,
            roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT"],
          },
          {
            href: `/${locale}/dashboard/super-admin/media`,
            label: "Media Library",
            icon: <Image className="h-4 w-4" />,
            roles: ["SUPER_ADMIN"],
          },
        ],
      },
      {
        id: "admin",
        label: "Amministrazione",
        icon: <CreditCard className="h-4 w-4" />,
        roles: ["SUPER_ADMIN"],
        items: [
          {
            href: `/${locale}/dashboard/subscriptions`,
            label: "Abbonamenti",
            icon: <CreditCard className="h-4 w-4" />,
            roles: ["SUPER_ADMIN"],
          },
          {
            href: `/${locale}/dashboard/payments`,
            label: "Pagamenti",
            icon: <FileText className="h-4 w-4" />,
            roles: ["SUPER_ADMIN"],
          },
        ],
      },

      {
        id: "report",
        label: "Report e Statistiche",
        icon: <BarChart3 className="h-4 w-4" />,
        roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT", "ORGANIZER"],
        items: [
          {
            href: `/${locale}/dashboard/reports`,
            label: "Report & Classifiche",
            icon: <BarChart3 className="h-4 w-4" />,
            roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT", "ORGANIZER"],
          },
          {
            href: `/${locale}/dashboard/admin/branding`,
            label: "Branding",
            icon: <Palette className="h-4 w-4" />,
            roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT"],
          },
          {
            href: `/${locale}/dashboard/admin/media`,
            label: "Media Library",
            icon: <Image className="h-4 w-4" />,
            roles: ["TENANT_ADMIN", "PRESIDENT"],
          },
        ],
      },
    ],
    [locale]
  );

  // Sezioni per modalità associazione
  const associationSections: SidebarSection[] = useMemo(
    () => [
      {
        id: "assoc-gestione",
        label: "Gestione Associazione",
        icon: <Building2 className="h-4 w-4" />,
        roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT"],
        items: [
          {
            href: `/${locale}/dashboard/tournaments`,
            label: "Tornei",
            icon: <Trophy className="h-4 w-4" />,
            roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT", "ORGANIZER"],
          },
          {
            href: `/${locale}/dashboard/users`,
            label: "Utenti",
            icon: <Users className="h-4 w-4" />,
            roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT"],
          },
          {
            href: `/${locale}/dashboard/teams`,
            label: "Barche/Team",
            icon: <Ship className="h-4 w-4" />,
            roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT", "ORGANIZER"],
          },
        ],
      },
      // Tournament sections are added dynamically based on activeTournament
      {
        id: "assoc-report",
        label: "Report",
        icon: <BarChart3 className="h-4 w-4" />,
        roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT", "ORGANIZER"],
        items: [
          {
            href: `/${locale}/dashboard/reports`,
            label: "Report & Classifiche",
            icon: <BarChart3 className="h-4 w-4" />,
            roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT", "ORGANIZER"],
          },
          {
            href: `/${locale}/dashboard/admin/branding`,
            label: "Branding",
            icon: <Palette className="h-4 w-4" />,
            roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT"],
          },
          {
            href: `/${locale}/dashboard/admin/media`,
            label: "Media Library",
            icon: <Image className="h-4 w-4" />,
            roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT"],
          },
        ],
      },
    ],
    [locale]
  );

  const participantSections: SidebarSection[] = useMemo(
    () => [
      {
        id: "miei-tornei",
        label: "I Miei Tornei",
        icon: <Trophy className="h-4 w-4" />,
        items: [
          {
            href: `/${locale}/dashboard/my-tournaments`,
            label: "Tornei Iscritti",
            icon: <Calendar className="h-4 w-4" />,
          },
          {
            href: `/${locale}/dashboard/my-catches`,
            label: "Le Mie Catture",
            icon: <Fish className="h-4 w-4" />,
          },
          {
            href: `/${locale}/dashboard/my-results`,
            label: "I Miei Risultati",
            icon: <Award className="h-4 w-4" />,
          },
        ],
      },
      {
        id: "mia-barca",
        label: "La Mia Barca",
        icon: <Anchor className="h-4 w-4" />,
        items: [
          {
            href: `/${locale}/dashboard/my-team`,
            label: "Il Mio Equipaggio",
            icon: <Users className="h-4 w-4" />,
          },
          {
            href: `/${locale}/dashboard/my-boat`,
            label: "Dati Barca",
            icon: <Ship className="h-4 w-4" />,
          },
        ],
      },
    ],
    [locale]
  );

  const getExpandedSectionsForPath = (path: string): Set<string> => {
    const expanded = new Set<string>();
    const pathMappings: Record<string, string[]> = {
      [`/${locale}/dashboard/super-admin`]: ["gestione"],
      [`/${locale}/dashboard/users`]: ["gestione"],
      [`/${locale}/dashboard/subscriptions`]: ["admin"],
      [`/${locale}/dashboard/payments`]: ["admin"],
      [`/${locale}/dashboard/strikes`]: ["tornei"],
      [`/${locale}/dashboard/judge`]: ["tornei"],
      [`/${locale}/dashboard/teams`]: ["tornei"],
      [`/${locale}/dashboard/reports`]: ["report"],
      [`/${locale}/dashboard/admin`]: ["report"],
      [`/${locale}/dashboard/admin/branding`]: ["report"],
      [`/${locale}/dashboard/admin/media`]: ["report", "assoc-report"],
      [`/${locale}/dashboard/super-admin/media`]: ["gestione"],
      [`/${locale}/dashboard/my-tournaments`]: ["miei-tornei"],
      [`/${locale}/dashboard/my-catches`]: ["miei-tornei"],
      [`/${locale}/dashboard/my-results`]: ["miei-tornei"],
      [`/${locale}/dashboard/my-team`]: ["mia-barca"],
      [`/${locale}/dashboard/my-boat`]: ["mia-barca"],
    };
    if (pathMappings[path]) {
      pathMappings[path].forEach((s) => expanded.add(s));
    }
    Object.entries(pathMappings).forEach(([pattern, sections]) => {
      if (path.startsWith(pattern + "/")) {
        sections.forEach((s) => expanded.add(s));
      }
    });
    return expanded;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isLoading, isAuthenticated, router, locale]);

  useEffect(() => {
    const newExpanded = getExpandedSectionsForPath(pathname);
    setExpandedSections(newExpanded);
  }, [pathname, locale]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const closeSidebar = () => setSidebarOpen(false);

  // Dynamic tournament sections based on active tournament
  const tournamentSections: SidebarSection[] = useMemo(() => {
    if (!activeTournament) return [];

    const isCompleted = activeTournament.status === "COMPLETED";
    const isOngoing = activeTournament.status === "ONGOING";
    const tournamentId = activeTournament.id;

    const sections: SidebarSection[] = [];

    // Gestione Torneo - always shown when tournament is active
    sections.push({
      id: "tournament-manage",
      label: "Gestione Torneo",
      icon: <Settings className="h-4 w-4" />,
      roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT", "ORGANIZER"],
      items: [
        {
          href: `/${locale}/dashboard/tournaments/${tournamentId}`,
          label: "Panoramica",
          icon: <Trophy className="h-4 w-4" />,
          roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT", "ORGANIZER", "JUDGE"],
        },
        {
          href: `/${locale}/dashboard/tournaments/${tournamentId}/participants`,
          label: "Partecipanti",
          icon: <Users className="h-4 w-4" />,
          roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT", "ORGANIZER"],
        },
        {
          href: `/${locale}/dashboard/tournaments/${tournamentId}/teams`,
          label: "Barche/Equipaggi",
          icon: <Ship className="h-4 w-4" />,
          roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT", "ORGANIZER"],
        },
        {
          href: `/${locale}/dashboard/tournaments/${tournamentId}/judges`,
          label: "Ispettori",
          icon: <Award className="h-4 w-4" />,
          roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT", "ORGANIZER"],
        },
        {
          href: `/${locale}/dashboard/tournaments/${tournamentId}/payments`,
          label: "Pagamenti",
          icon: <CreditCard className="h-4 w-4" />,
          roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT", "ORGANIZER"],
        },
      ],
    });

    if (isCompleted) {
      // Statistiche Torneo for completed tournaments
      sections.push({
        id: "tournament-stats",
        label: "Statistiche Torneo",
        icon: <BarChart3 className="h-4 w-4" />,
        roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT", "ORGANIZER", "JUDGE"],
        items: [
          {
            href: `/${locale}/dashboard/strikes?tournamentId=${tournamentId}&mode=history`,
            label: "Storico Strike",
            icon: <History className="h-4 w-4" />,
            roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT", "ORGANIZER", "JUDGE"],
          },
          {
            href: `/${locale}/dashboard/judge?tournamentId=${tournamentId}&mode=history`,
            label: "Storico Catture",
            icon: <Fish className="h-4 w-4" />,
            roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT", "ORGANIZER", "JUDGE"],
          },
        ],
      });
    } else if (isOngoing) {
      // Operazioni Live for ongoing tournaments
      sections.push({
        id: "tournament-ops",
        label: "Operazioni Live",
        icon: <Zap className="h-4 w-4" />,
        roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT", "ORGANIZER", "JUDGE"],
        items: [
          {
            href: `/${locale}/dashboard/strikes?tournamentId=${tournamentId}`,
            label: "Strike Live",
            icon: <Zap className="h-4 w-4" />,
            roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT", "ORGANIZER", "JUDGE"],
          },
          {
            href: `/${locale}/dashboard/judge?tournamentId=${tournamentId}`,
            label: "Catture da Validare",
            icon: <CheckCircle className="h-4 w-4" />,
            roles: ["SUPER_ADMIN", "TENANT_ADMIN", "PRESIDENT", "ORGANIZER", "JUDGE"],
          },
        ],
      });
    }

    return sections;
  }, [activeTournament, locale]);

  const sectionsToShow = useMemo(() => {
    if (!user) return [];
    if (user.role === "PARTICIPANT") {
      return participantSections;
    }
    
    let baseSections: SidebarSection[] = [];
    
    // In association mode, show association-specific sections
    if (impersonatingTenant) {
      baseSections = associationSections.filter((section) => {
        if (!section.roles) return true;
        return section.roles.includes(user.role);
      });
    } else {
      baseSections = operationalSections.filter((section) => {
        if (!section.roles) return true;
        return section.roles.includes(user.role);
      });
    }
    
    // Add tournament sections if a tournament is active
    if (activeTournament && tournamentSections.length > 0) {
      const filteredTournamentSections = tournamentSections.filter((section) => {
        if (!section.roles) return true;
        return section.roles.includes(user.role);
      });
      baseSections = [...baseSections, ...filteredTournamentSections];
    }
    
    return baseSections;
  }, [user, operationalSections, participantSections, associationSections, impersonatingTenant, activeTournament, tournamentSections]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
              <Fish className="h-5 w-5" />
            </div>
            <span className="font-bold">TournamentMaster</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={closeSidebar}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Association Mode Banner */}
        {impersonatingTenant && (
          <div className="mx-3 mt-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
              <Building2 className="h-4 w-4" />
              <span className="text-sm font-medium">Modalità Associazione</span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-semibold">
              {impersonatingTenant.name}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs h-7 border-blue-300 text-blue-700 hover:bg-blue-100"
              onClick={exitAssociationMode}
            >
              <LogOut className="h-3 w-3 mr-1" />
              Esci dalla modalità
            </Button>
          </div>
        )}

        
        <nav className="p-4 flex-1 overflow-y-auto" style={{ maxHeight: impersonatingTenant ? "calc(100vh - 300px)" : "calc(100vh - 180px)" }}>
          <Link
            href={`/${locale}/dashboard`}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-4 ${
              pathname === `/${locale}/dashboard`
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
            onClick={closeSidebar}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>

          {sectionsToShow.map((section) => (
            <SidebarSectionComponent
              key={section.id}
              section={section}
              isExpanded={expandedSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
              pathname={pathname}
              locale={locale}
              onItemClick={closeSidebar}
              userRole={user?.role || ""}
            />
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.role.replace("_", " ")}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 sticky top-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </div>
                  <span className="hidden sm:inline">{user?.firstName}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>
                  {user?.firstName} {user?.lastName}
                  <p className="text-xs font-normal text-muted-foreground">
                    {user?.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/dashboard/settings`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Impostazioni
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
