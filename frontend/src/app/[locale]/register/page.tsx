/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/app/[locale]/register/page.tsx
 * Creato: 2025-12-29
 * Descrizione: Pagina di registrazione nuovo utente
 *
 * Dipendenze:
 * - @/components/ui/card (shadcn)
 * - @/components/ui/input (shadcn)
 * - @/components/ui/button (shadcn)
 * - @/components/ui/label (shadcn)
 *
 * API:
 * - POST /api/auth/register
 * =============================================================================
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Fish, Mail, Lock, User, Phone, UserPlus, AlertCircle, CheckCircle, Home } from "lucide-react";
import { HelpGuide } from "@/components/HelpGuide";

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string || "it";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validazione password
    if (formData.password !== formData.confirmPassword) {
      setError("Le password non coincidono");
      return;
    }

    if (formData.password.length < 6) {
      setError("La password deve avere almeno 6 caratteri");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registrazione fallita");
      }

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante la registrazione");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 p-3 rounded-full bg-green-100 w-fit">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Registrazione Completata!</CardTitle>
            <CardDescription>
              Il tuo account è stato creato con successo. Verrai reindirizzato alla pagina di login...
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-12">
      {/* Back to Home */}
      <Link
        href={`/${locale}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 self-start max-w-md w-full"
      >
        <Home className="h-4 w-4" />
        Torna alla Home
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
            <Fish className="h-8 w-8 text-primary" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <CardTitle className="text-2xl">Crea il tuo account</CardTitle>
            <HelpGuide pageKey="register" position="inline" />
          </div>
          <CardDescription>
            Unisciti a TournamentMaster e partecipa ai tornei
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Nome e Cognome */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Mario"
                    className="pl-10"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Cognome</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Rossi"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="mario.rossi@esempio.it"
                  className="pl-10"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Telefono (opzionale) */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Telefono <span className="text-muted-foreground text-xs">(opzionale)</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+39 333 1234567"
                  className="pl-10"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Minimo 6 caratteri"
                  className="pl-10"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Conferma Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Conferma Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Ripeti la password"
                  className="pl-10"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="animate-pulse">Registrazione in corso...</span>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Registrati
                </>
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Hai già un account?{" "}
              <Link
                href={`/${locale}/login`}
                className="text-primary font-medium hover:underline"
              >
                Accedi
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
