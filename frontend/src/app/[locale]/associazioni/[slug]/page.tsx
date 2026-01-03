/**
 * =============================================================================
 * PUBLIC ASSOCIATION PAGE
 * =============================================================================
 * Pagina pubblica dell'associazione con branding personalizzato
 * =============================================================================
 */

import Link from "next/link";
import {
  Home,
  Fish,
  Trophy,
  Users,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Globe,
  Facebook,
  Instagram,
  Youtube,
  ExternalLink,
  Clock,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// API URL - for server-side rendering, prefer localhost or internal URL
// NEXT_PUBLIC_API_URL may point to external IP not reachable from server
const getApiUrl = () => {
  // Server-side: use internal URL (localhost)
  if (typeof window === "undefined") {
    return process.env.API_URL || "http://localhost:3001";
  }
  // Client-side: use public URL
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
};

// Fetch tenant data server-side
async function getTenantData(slug: string) {
  const apiUrl = getApiUrl();

  try {
    const response = await fetch(`${apiUrl}/api/tenants/public/${slug}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
      cache: "force-cache",
    });

    if (!response.ok) {
      console.error(`Failed to fetch tenant ${slug}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Failed to fetch tenant:", error);
    return null;
  }
}

// Format date
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Get status badge
function getStatusBadge(status: string) {
  const config: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    PUBLISHED: { label: "In Programma", variant: "outline" },
    ONGOING: { label: "In Corso", variant: "default" },
    COMPLETED: { label: "Completato", variant: "secondary" },
  };

  const { label, variant } = config[status] || { label: status, variant: "outline" };
  return <Badge variant={variant}>{label}</Badge>;
}

// Discipline labels
const disciplineLabels: Record<string, string> = {
  BIG_GAME: "Big Game",
  DRIFTING: "Drifting",
  TRAINA_COSTIERA: "Traina Costiera",
  BOLENTINO: "Bolentino",
  EGING: "Eging",
  VERTICAL_JIGGING: "Vertical Jigging",
  SHORE: "Shore",
  SOCIAL: "Social",
};

export default async function AssociationPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const tenant = await getTenantData(slug);

  if (!tenant) {
    return (
      <main className="container mx-auto px-4 py-16 max-w-4xl text-center">
        <Fish className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Associazione non trovata</h1>
        <p className="text-muted-foreground mb-6">
          L&apos;associazione richiesta non esiste o non e attiva.
        </p>
        <Button asChild>
          <Link href={`/${locale}`}>
            <Home className="h-4 w-4 mr-2" />
            Torna alla Home
          </Link>
        </Button>
      </main>
    );
  }

  const primaryColor = tenant.primaryColor || "#0066CC";
  const secondaryColor = tenant.secondaryColor || "#004499";

  return (
    <main className="min-h-screen">
      {/* Hero Banner */}
      <div
        className="relative h-64 md:h-80 bg-gradient-to-r from-blue-600 to-cyan-600"
        style={{
          backgroundImage: tenant.bannerImage ? `url(${tenant.bannerImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: !tenant.bannerImage ? primaryColor : undefined,
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="container mx-auto px-4 h-full flex items-end pb-8 relative z-10">
          <div className="flex items-end gap-6">
            {/* Logo */}
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-xl shadow-lg flex items-center justify-center overflow-hidden -mb-12">
              {tenant.logo ? (
                <img
                  src={tenant.logo}
                  alt={tenant.name}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <Fish className="h-12 w-12 text-primary" style={{ color: primaryColor }} />
              )}
            </div>
            <div className="text-white pb-2">
              <h1 className="text-2xl md:text-4xl font-bold drop-shadow-lg">
                {tenant.name}
              </h1>
              {tenant.fipsasCode && (
                <Badge variant="secondary" className="mt-2">
                  FIPSAS {tenant.fipsasRegion} - {tenant.fipsasCode}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back link */}
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 mt-8"
        >
          <Home className="h-4 w-4" />
          Torna alla Home
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {tenant.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Chi Siamo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {tenant.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <Trophy className="h-6 w-6" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{tenant._count?.tournaments || 0}</p>
                      <p className="text-sm text-muted-foreground">Tornei Organizzati</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <Users className="h-6 w-6" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{tenant._count?.users || 0}</p>
                      <p className="text-sm text-muted-foreground">Membri</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Tournaments */}
            {tenant.recentTournaments && tenant.recentTournaments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Tornei
                  </CardTitle>
                  <CardDescription>
                    Gli ultimi tornei organizzati dall&apos;associazione
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tenant.recentTournaments.map((tournament: any) => (
                      <Link
                        key={tournament.id}
                        href={`/${locale}/tournaments/${tournament.id}`}
                        className="block"
                      >
                        <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                          {tournament.bannerImage ? (
                            <img
                              src={tournament.bannerImage}
                              alt={tournament.name}
                              className="w-20 h-14 object-cover rounded-md"
                            />
                          ) : (
                            <div
                              className="w-20 h-14 rounded-md flex items-center justify-center"
                              style={{ backgroundColor: `${primaryColor}20` }}
                            >
                              <Trophy className="h-6 w-6" style={{ color: primaryColor }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-medium truncate">{tournament.name}</h3>
                              {getStatusBadge(tournament.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(tournament.startDate)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {tournament.location}
                              </span>
                            </div>
                            <Badge variant="outline" className="mt-2 text-xs">
                              {disciplineLabels[tournament.discipline] || tournament.discipline}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contatti
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tenant.contactEmail && (
                  <a
                    href={`mailto:${tenant.contactEmail}`}
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground"
                  >
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{tenant.contactEmail}</span>
                  </a>
                )}

                {tenant.contactPhone && (
                  <a
                    href={`tel:${tenant.contactPhone}`}
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{tenant.contactPhone}</span>
                  </a>
                )}

                {tenant.website && (
                  <a
                    href={tenant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground"
                  >
                    <Globe className="h-4 w-4" />
                    <span className="text-sm truncate">{tenant.website.replace(/^https?:\/\//, "")}</span>
                  </a>
                )}

                {tenant.address && (
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <span className="text-sm">{tenant.address}</span>
                  </div>
                )}

                {!tenant.contactEmail && !tenant.contactPhone && !tenant.website && !tenant.address && (
                  <p className="text-sm text-muted-foreground">
                    Nessuna informazione di contatto disponibile
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Social Links */}
            {(tenant.socialFacebook || tenant.socialInstagram || tenant.socialYoutube) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    Social
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {tenant.socialFacebook && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={tenant.socialFacebook}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Facebook className="h-4 w-4 mr-2" />
                        Facebook
                      </a>
                    </Button>
                  )}

                  {tenant.socialInstagram && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={tenant.socialInstagram}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Instagram className="h-4 w-4 mr-2" />
                        Instagram
                      </a>
                    </Button>
                  )}

                  {tenant.socialYoutube && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={tenant.socialYoutube}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Youtube className="h-4 w-4 mr-2" />
                        YouTube
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* FIPSAS Info */}
            {tenant.fipsasCode && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Fish className="h-5 w-5" />
                    Affiliazione FIPSAS
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Codice:</span>
                    <span className="font-medium">{tenant.fipsasCode}</span>
                  </div>
                  {tenant.fipsasRegion && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Regione:</span>
                      <span className="font-medium">{tenant.fipsasRegion}</span>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                    <Link href={`/${locale}/fipsas`}>
                      <Award className="h-4 w-4 mr-2" />
                      Scopri di piu su FIPSAS
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* CTA */}
            <Card
              className="text-white"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              }}
            >
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-2">Vuoi partecipare?</h3>
                <p className="text-white/90 text-sm mb-4">
                  Registrati su TournamentMaster per iscriverti ai tornei di questa associazione.
                </p>
                <Button variant="secondary" className="w-full" asChild>
                  <Link href={`/${locale}/register`}>
                    Registrati Gratis
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
