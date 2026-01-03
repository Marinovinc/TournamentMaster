/**
 * =============================================================================
 * BRANDING SETTINGS PAGE
 * =============================================================================
 * Pagina per customizzare logo, colori, descrizione e info associazione
 * =============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams, useRouter } from "next/navigation";
import {
  Palette,
  Image,
  Globe,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  Save,
  RefreshCw,
  Eye,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Fish,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  FileImage,
  Type,
  Share2,
} from "lucide-react";
import Link from "next/link";

interface BrandingData {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  bannerImage?: string;
  primaryColor?: string;
  secondaryColor?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialYoutube?: string;
  fipsasCode?: string;
  fipsasRegion?: string;
}

interface TenantOption {
  id: string;
  name: string;
  slug: string;
}

export default function BrandingPage() {
  const { user, token, isAdmin } = useAuth();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string || "it";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // For SUPER_ADMIN tenant selection
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Fetch tenants list for SUPER_ADMIN
  useEffect(() => {
    const fetchTenants = async () => {
      if (!token || !isSuperAdmin) return;

      try {
        const response = await fetch(`${API_URL}/api/tenants?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setTenants(data.data.map((t: any) => ({ id: t.id, name: t.name, slug: t.slug })));
        }
      } catch (err) {
        console.error("Failed to fetch tenants:", err);
      }
    };

    fetchTenants();
  }, [token, isSuperAdmin, API_URL]);

  // Fetch branding data
  useEffect(() => {
    const fetchBranding = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      // For SUPER_ADMIN, require tenant selection first
      if (isSuperAdmin && !selectedTenantId) {
        setLoading(false);
        return;
      }

      try {
        const url = isSuperAdmin && selectedTenantId
          ? `${API_URL}/api/tenants/me/branding?tenantId=${selectedTenantId}`
          : `${API_URL}/api/tenants/me/branding`;

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setBranding(data.data);
        } else {
          setError("Impossibile caricare i dati");
        }
      } catch (err) {
        console.error("Failed to fetch branding:", err);
        setError("Errore di connessione");
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, [token, API_URL, isSuperAdmin, selectedTenantId]);

  // Check admin access
  useEffect(() => {
    if (!isAdmin && !loading) {
      router.push(`/${locale}/dashboard`);
    }
  }, [isAdmin, loading, router, locale]);

  // Handle save
  const handleSave = async () => {
    if (!branding) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const url = isSuperAdmin && selectedTenantId
        ? `${API_URL}/api/tenants/me/branding?tenantId=${selectedTenantId}`
        : `${API_URL}/api/tenants/me/branding`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(branding),
      });

      const data = await response.json();
      if (response.ok) {
        setBranding(data.data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.message || "Errore durante il salvataggio");
      }
    } catch (err) {
      console.error("Failed to save branding:", err);
      setError("Errore di connessione");
    } finally {
      setSaving(false);
    }
  };

  // Handle tenant selection for SUPER_ADMIN
  const handleTenantSelect = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setBranding(null);
    setLoading(true);
    setError(null);
  };

  // Update field
  const updateField = (field: keyof BrandingData, value: string) => {
    if (!branding) return;
    setBranding({ ...branding, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show tenant selector for SUPER_ADMIN
  if (isSuperAdmin && !selectedTenantId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Personalizza Associazione</h1>
          <p className="text-muted-foreground mt-2">
            Seleziona l&apos;associazione da personalizzare
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fish className="h-5 w-5" />
              Seleziona Associazione
            </CardTitle>
            <CardDescription>
              Come Super Admin puoi gestire il branding di qualsiasi associazione
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tenants.length === 0 ? (
              <p className="text-muted-foreground">Caricamento associazioni...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tenants.map((tenant) => (
                  <Button
                    key={tenant.id}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start gap-1"
                    onClick={() => handleTenantSelect(tenant.id)}
                  >
                    <span className="font-medium">{tenant.name}</span>
                    <span className="text-xs text-muted-foreground">/{tenant.slug}</span>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!branding) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Nessuna associazione trovata</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna indietro
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={`/${locale}/dashboard/admin`}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold">Personalizza Associazione</h1>
          </div>
          <p className="text-muted-foreground">
            Configura logo, colori, informazioni di contatto e social media
          </p>
          {isSuperAdmin && selectedTenantId && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                {branding?.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTenantId(null);
                  setBranding(null);
                }}
              >
                Cambia associazione
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open(`/${locale}/associazioni/${branding.slug}`, "_blank")}
          >
            <Eye className="h-4 w-4 mr-2" />
            Anteprima
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : success ? (
              <CheckCircle className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {success ? "Salvato!" : "Salva Modifiche"}
          </Button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Modifiche salvate con successo!
        </div>
      )}

      {/* Guida Branding */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center justify-between w-full text-left"
          >
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <HelpCircle className="h-5 w-5" />
              Guida alla Personalizzazione
            </CardTitle>
            {showGuide ? (
              <ChevronUp className="h-5 w-5 text-blue-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-blue-600" />
            )}
          </button>
          {!showGuide && (
            <CardDescription className="text-blue-700">
              Clicca per espandere la guida completa su come personalizzare la tua associazione
            </CardDescription>
          )}
        </CardHeader>

        {showGuide && (
          <CardContent className="pt-0">
            <div className="space-y-6 text-sm">
              {/* Introduzione */}
              <div className="prose prose-sm max-w-none">
                <p className="text-blue-900 leading-relaxed">
                  Personalizza l&apos;aspetto della <strong>pagina pubblica</strong> della tua associazione.
                  Le modifiche saranno visibili a tutti i visitatori su{" "}
                  <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-800">
                    /associazioni/{branding?.slug || "tuo-slug"}
                  </code>
                </p>
              </div>

              {/* Sezioni Guide */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Logo e Banner */}
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileImage className="h-4 w-4 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Logo e Banner</h4>
                  </div>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span><strong>Logo:</strong> Formato quadrato (es. 200x200px), PNG con trasparenza consigliato</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span><strong>Banner:</strong> Formato panoramico (es. 1920x400px), JPG per foto</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span>Usa URL diretti alle immagini (es. da Google Drive, Imgur, o tuo hosting)</span>
                    </li>
                  </ul>
                </div>

                {/* Colori */}
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Palette className="h-4 w-4 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Colori</h4>
                  </div>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span><strong>Primario:</strong> Colore principale per header, pulsanti e accenti</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span><strong>Secondario:</strong> Usato per gradienti e elementi secondari</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>Scegli colori con buon contrasto per leggibilita</span>
                    </li>
                  </ul>
                </div>

                {/* Contatti e Social */}
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Share2 className="h-4 w-4 text-orange-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Contatti e Social</h4>
                  </div>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Inserisci email e telefono per essere contattato</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>Aggiungi link ai tuoi profili Facebook, Instagram, YouTube</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>L&apos;indirizzo apparira nella sezione contatti della pagina</span>
                    </li>
                  </ul>
                </div>

                {/* FIPSAS */}
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Fish className="h-4 w-4 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Affiliazione FIPSAS</h4>
                  </div>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Inserisci il codice affiliazione FIPSAS ufficiale</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Seleziona la regione di appartenenza</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>I dati appariranno nei PDF delle classifiche ufficiali</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-2">Suggerimenti</h4>
                    <ul className="space-y-1 text-yellow-700">
                      <li>• Usa il pulsante <strong>&quot;Anteprima&quot;</strong> in alto a destra per vedere come appare la pagina</li>
                      <li>• Ricorda di cliccare <strong>&quot;Salva Modifiche&quot;</strong> dopo ogni modifica</li>
                      <li>• Le immagini devono essere gia caricate online (URL pubblico)</li>
                      <li>• Per caricare immagini puoi usare servizi come Imgur, Google Drive (link diretto), o il tuo sito web</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/${locale}/associazioni/${branding?.slug}`, "_blank")}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Vedi Pagina Pubblica
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/${locale}/fipsas`, "_blank")}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  <Fish className="h-4 w-4 mr-2" />
                  Info FIPSAS
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="contact">Contatti</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="fipsas">FIPSAS</TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logo & Banner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Logo e Immagini
                </CardTitle>
                <CardDescription>
                  Carica il logo e l&apos;immagine banner della tua associazione
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo">URL Logo</Label>
                  <Input
                    id="logo"
                    value={branding.logo || ""}
                    onChange={(e) => updateField("logo", e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                  {branding.logo && (
                    <div className="mt-2 p-4 bg-muted rounded-lg flex items-center justify-center">
                      <img
                        src={branding.logo}
                        alt="Logo preview"
                        className="max-h-20 max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder-logo.png";
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bannerImage">URL Banner</Label>
                  <Input
                    id="bannerImage"
                    value={branding.bannerImage || ""}
                    onChange={(e) => updateField("bannerImage", e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                  />
                  {branding.bannerImage && (
                    <div className="mt-2 overflow-hidden rounded-lg">
                      <img
                        src={branding.bannerImage}
                        alt="Banner preview"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder-banner.jpg";
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Colori
                </CardTitle>
                <CardDescription>
                  Personalizza i colori del tema della tua associazione
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Colore Primario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={branding.primaryColor || "#0066CC"}
                      onChange={(e) => updateField("primaryColor", e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={branding.primaryColor || "#0066CC"}
                      onChange={(e) => updateField("primaryColor", e.target.value)}
                      placeholder="#0066CC"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Colore Secondario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={branding.secondaryColor || "#004499"}
                      onChange={(e) => updateField("secondaryColor", e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={branding.secondaryColor || "#004499"}
                      onChange={(e) => updateField("secondaryColor", e.target.value)}
                      placeholder="#004499"
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-4 p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-2">Anteprima colori:</p>
                  <div className="flex gap-2">
                    <div
                      className="w-20 h-10 rounded-md flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: branding.primaryColor || "#0066CC" }}
                    >
                      Primario
                    </div>
                    <div
                      className="w-20 h-10 rounded-md flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: branding.secondaryColor || "#004499" }}
                    >
                      Secondario
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Descrizione Associazione</CardTitle>
              <CardDescription>
                Scrivi una breve descrizione della tua associazione
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="name">Nome Associazione</Label>
                <Input
                  id="name"
                  value={branding.name || ""}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Nome della tua associazione"
                />
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={branding.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Descrivi la tua associazione, la sua storia, le attività principali..."
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Informazioni di Contatto
              </CardTitle>
              <CardDescription>
                Inserisci le informazioni di contatto che verranno mostrate sulla pagina pubblica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="contactEmail"
                      type="email"
                      value={branding.contactEmail || ""}
                      onChange={(e) => updateField("contactEmail", e.target.value)}
                      placeholder="info@associazione.it"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Telefono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="contactPhone"
                      value={branding.contactPhone || ""}
                      onChange={(e) => updateField("contactPhone", e.target.value)}
                      placeholder="+39 123 456 7890"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Sito Web</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    value={branding.website || ""}
                    onChange={(e) => updateField("website", e.target.value)}
                    placeholder="https://www.associazione.it"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Indirizzo Sede</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="address"
                    value={branding.address || ""}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Via Roma 1, 00100 Roma (RM)"
                    rows={2}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Social Media
              </CardTitle>
              <CardDescription>
                Aggiungi i link ai tuoi profili social
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="socialFacebook">Facebook</Label>
                <div className="relative">
                  <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="socialFacebook"
                    value={branding.socialFacebook || ""}
                    onChange={(e) => updateField("socialFacebook", e.target.value)}
                    placeholder="https://facebook.com/tuaassociazione"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialInstagram">Instagram</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="socialInstagram"
                    value={branding.socialInstagram || ""}
                    onChange={(e) => updateField("socialInstagram", e.target.value)}
                    placeholder="https://instagram.com/tuaassociazione"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialYoutube">YouTube</Label>
                <div className="relative">
                  <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="socialYoutube"
                    value={branding.socialYoutube || ""}
                    onChange={(e) => updateField("socialYoutube", e.target.value)}
                    placeholder="https://youtube.com/@tuaassociazione"
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FIPSAS Tab */}
        <TabsContent value="fipsas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fish className="h-5 w-5" />
                Affiliazione FIPSAS
              </CardTitle>
              <CardDescription>
                Inserisci i dati di affiliazione alla Federazione Italiana Pesca Sportiva
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fipsasCode">Codice FIPSAS</Label>
                  <Input
                    id="fipsasCode"
                    value={branding.fipsasCode || ""}
                    onChange={(e) => updateField("fipsasCode", e.target.value)}
                    placeholder="Es. 12345"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fipsasRegion">Regione FIPSAS</Label>
                  <Input
                    id="fipsasRegion"
                    value={branding.fipsasRegion || ""}
                    onChange={(e) => updateField("fipsasRegion", e.target.value)}
                    placeholder="Es. Lazio"
                  />
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> I dati FIPSAS verranno mostrati sulla pagina pubblica
                  dell&apos;associazione e nei PDF delle classifiche ufficiali.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
