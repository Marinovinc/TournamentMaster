/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/app/[locale]/organizer/register/page.tsx
 * Creato: 2026-01-02
 * Descrizione: Registrazione Organizzatore - Form per diventare organizzatore
 * =============================================================================
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Home,
  UserPlus,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const benefits = [
  "Crea tornei illimitati (piano Pro)",
  "Gestione partecipanti completa",
  "Classifiche in tempo reale",
  "Validazione GPS automatica",
  "Dashboard analytics",
  "Supporto dedicato",
];

export default function OrganizerRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: "",
    contactName: "",
    email: "",
    phone: "",
    city: "",
    description: "",
    acceptTerms: false,
    acceptMarketing: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simula invio form
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSubmitted(true);
    setLoading(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (submitted) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto mb-6 p-4 rounded-full bg-green-100 text-green-600 w-fit">
              <CheckCircle className="h-12 w-12" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Richiesta Inviata!</h1>
            <p className="text-muted-foreground mb-6">
              Grazie per il tuo interesse in TournamentMaster. Il nostro team
              ti contattera entro 24-48 ore per completare la registrazione.
            </p>
            <Button asChild>
              <Link href={`/${locale}`}>
                Torna alla Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Back to Home */}
      <Link
        href={`/${locale}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <Home className="h-4 w-4" />
        Torna alla Home
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Left Column - Info */}
        <div>
          <Badge className="mb-4">
            <Building2 className="h-4 w-4 mr-2" />
            Per Organizzatori
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Diventa <span className="text-primary">Organizzatore</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Unisciti alla community di organizzatori TournamentMaster e porta i tuoi
            tornei di pesca al livello successivo.
          </p>

          {/* Benefits */}
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold">Cosa ottieni:</h3>
            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing Link */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">
                Hai gia visto i nostri piani?
              </p>
              <Link
                href={`/${locale}/pricing`}
                className="text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                Scopri i prezzi
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Richiedi Accesso
            </CardTitle>
            <CardDescription>
              Compila il form e ti contatteremo per attivare il tuo account organizzatore.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Organization Name */}
              <div className="space-y-2">
                <Label htmlFor="organizationName">
                  <Building2 className="h-4 w-4 inline mr-2" />
                  Nome Associazione/Circolo
                </Label>
                <Input
                  id="organizationName"
                  name="organizationName"
                  placeholder="Es. ASD Pescatori Ischia"
                  value={formData.organizationName}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Contact Name */}
              <div className="space-y-2">
                <Label htmlFor="contactName">Nome e Cognome Referente</Label>
                <Input
                  id="contactName"
                  name="contactName"
                  placeholder="Mario Rossi"
                  value={formData.contactName}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@esempio.it"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Telefono
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+39 333 1234567"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  Citta
                </Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="Napoli"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Descrivi la tua attivita
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Raccontaci dei tornei che organizzi, quanti partecipanti mediamente, ecc."
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        acceptTerms: checked as boolean,
                      }))
                    }
                    required
                  />
                  <Label htmlFor="acceptTerms" className="text-sm leading-tight">
                    Accetto i{" "}
                    <Link href={`/${locale}/terms`} className="text-primary hover:underline">
                      Termini di Servizio
                    </Link>{" "}
                    e la{" "}
                    <Link href={`/${locale}/privacy`} className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="acceptMarketing"
                    checked={formData.acceptMarketing}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        acceptMarketing: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="acceptMarketing" className="text-sm leading-tight">
                    Desidero ricevere aggiornamenti su nuove funzionalita e offerte
                  </Label>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || !formData.acceptTerms}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invia Richiesta
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
