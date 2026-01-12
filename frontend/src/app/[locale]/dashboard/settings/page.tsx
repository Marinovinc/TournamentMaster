"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Shield, Palette } from "lucide-react";
import { HelpGuide } from "@/components/HelpGuide";

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Impostazioni</h1>
          <p className="text-muted-foreground">
            Gestisci le impostazioni del tuo account e le preferenze
          </p>
        </div>
        <HelpGuide pageKey="settings" isAdmin={isAdmin} />
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profilo</CardTitle>
            </div>
            <CardDescription>
              Gestisci le informazioni del tuo profilo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input id="firstName" defaultValue={user?.firstName || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Cognome</Label>
                <Input id="lastName" defaultValue={user?.lastName || ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user?.email || ""} disabled />
              <p className="text-xs text-muted-foreground">
                L'email non può essere modificata
              </p>
            </div>
            <Button>Salva modifiche</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifiche</CardTitle>
            </div>
            <CardDescription>
              Configura le tue preferenze di notifica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifiche Email</Label>
                <p className="text-sm text-muted-foreground">
                  Ricevi aggiornamenti via email sui tuoi tornei
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifiche Push</Label>
                <p className="text-sm text-muted-foreground">
                  Ricevi notifiche push sul browser
                </p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Aggiornamenti Catture</Label>
                <p className="text-sm text-muted-foreground">
                  Notifica quando vengono registrate nuove catture
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Sicurezza</CardTitle>
            </div>
            <CardDescription>
              Gestisci la sicurezza del tuo account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Password attuale</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nuova password</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Conferma password</Label>
              <Input id="confirmPassword" type="password" />
            </div>
            <Button>Cambia password</Button>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle>Aspetto</CardTitle>
            </div>
            <CardDescription>
              Personalizza l'aspetto dell'applicazione
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tema scuro</Label>
                <p className="text-sm text-muted-foreground">
                  Attiva il tema scuro per l'interfaccia
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
