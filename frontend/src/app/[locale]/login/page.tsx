/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/app/[locale]/login/page.tsx
 * Creato: 2025-12-29
 * Descrizione: Pagina di login con form autenticazione
 *
 * Dipendenze:
 * - @/components/ui/card (shadcn)
 * - @/components/ui/input (shadcn)
 * - @/components/ui/button (shadcn)
 * - @/components/ui/label (shadcn)
 *
 * API:
 * - POST /api/auth/login
 * =============================================================================
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Fish, Mail, Lock, LogIn, AlertCircle, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { HelpGuide } from "@/components/HelpGuide";

export default function LoginPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string || "it";
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      redirectToDashboard(user.role);
    }
  }, [authLoading, isAuthenticated, user]);

  const redirectToDashboard = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
      case "TENANT_ADMIN":
      case "ORGANIZER":
        router.push(`/${locale}/dashboard/admin`);
        break;
      case "JUDGE":
        router.push(`/${locale}/dashboard/judge`);
        break;
      default:
        router.push(`/${locale}/dashboard`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      // Get user from localStorage after login
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        redirectToDashboard(user.role);
      }
    } else {
      setError(result.error || "Errore durante il login");
    }

    setLoading(false);
  };

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
            <CardTitle className="text-2xl">Bentornato!</CardTitle>
            <HelpGuide pageKey="login" position="inline" />
          </div>
          <CardDescription>
            Accedi al tuo account TournamentMaster
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

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@esempio.it"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href={`/${locale}/forgot-password`}
                  className="text-xs text-primary hover:underline"
                >
                  Password dimenticata?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Demo Credentials Info */}
            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <p className="font-medium text-blue-800 mb-1">Credenziali Demo:</p>
              <p className="text-blue-600 font-mono text-xs">
                admin@ischiafishing.it / demo123
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="animate-pulse">Accesso in corso...</span>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Accedi
                </>
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Non hai un account?{" "}
              <Link
                href={`/${locale}/register`}
                className="text-primary font-medium hover:underline"
              >
                Registrati
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
