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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Fetch branding data
  useEffect(() => {
    const fetchBranding = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/tenants/me/branding`, {
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
  }, [token, API_URL]);

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
      const response = await fetch(`${API_URL}/api/tenants/me/branding`, {
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
