/**
 * =============================================================================
 * TOURNAMENT COMMUNICATIONS PAGE
 * =============================================================================
 * Centro messaggi per comunicazioni torneo-specifiche
 * Permette di inviare broadcast a partecipanti e staff
 * =============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Users,
  UserCog,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  Megaphone,
} from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  status: string;
}

interface Message {
  id: string;
  subject: string;
  body: string;
  type: string;
  priority: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    readReceipts: number;
  };
}

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export default function TournamentCommunicationsPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const locale = (params.locale as string) || "it";
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [targetGroup, setTargetGroup] = useState<"all" | "teams" | "staff">("all");
  const [priority, setPriority] = useState<"NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !tournamentId) return;

      try {
        setLoading(true);

        // Fetch tournament info
        const tournamentRes = await fetch(`${API_URL}/api/tournaments/${tournamentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (tournamentRes.ok) {
          const tournamentData = await tournamentRes.json();
          setTournament(tournamentData.data);
        }

        // Fetch messages history
        const messagesRes = await fetch(
          `${API_URL}/api/messages/tournament/${tournamentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json();
          setMessages(messagesData.data || []);
        }

        // Fetch templates
        const templatesRes = await fetch(`${API_URL}/api/messages/templates`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          setTemplates(templatesData.data || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, tournamentId, API_URL]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      // Sostituisci i placeholder con i dati del torneo
      let newSubject = template.subject;
      let newBody = template.body;

      if (tournament) {
        newSubject = newSubject.replace(/\{\{tournamentName\}\}/g, tournament.name);
        newBody = newBody.replace(/\{\{tournamentName\}\}/g, tournament.name);
      }

      setSubject(newSubject);
      setBody(newBody);
    }
  };

  const handleSendMessage = async () => {
    if (!token || !subject.trim() || !body.trim()) {
      alert("Compila tutti i campi obbligatori");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(
        `${API_URL}/api/messages/tournament/${tournamentId}/broadcast`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject,
            body,
            targetGroup,
            priority,
          }),
        }
      );

      if (res.ok) {
        const result = await res.json();
        alert(`Messaggio inviato a ${result.recipientCount} destinatari`);
        setDialogOpen(false);
        setSubject("");
        setBody("");
        setSelectedTemplate("");

        // Ricarica messaggi
        const messagesRes = await fetch(
          `${API_URL}/api/messages/tournament/${tournamentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json();
          setMessages(messagesData.data || []);
        }
      } else {
        const err = await res.json();
        alert(err.message || "Errore nell'invio del messaggio");
      }
    } catch (err) {
      alert("Errore di rete");
    } finally {
      setSending(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <Badge variant="destructive">Urgente</Badge>;
      case "HIGH":
        return <Badge className="bg-orange-500">Alta</Badge>;
      default:
        return <Badge variant="secondary">Normale</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/dashboard/tournaments/${tournamentId}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna al torneo
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Centro Comunicazioni
          </h1>
          <p className="text-muted-foreground">
            {tournament?.name} - Invia messaggi ai partecipanti
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Nuovo Messaggio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Invia Comunicazione</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Template Selection */}
              <div className="space-y-2">
                <Label>Template (opzionale)</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Scegli un template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Group */}
              <div className="space-y-2">
                <Label>Destinatari</Label>
                <Select
                  value={targetGroup}
                  onValueChange={(v) => setTargetGroup(v as typeof targetGroup)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4" />
                        Tutti (Partecipanti + Staff)
                      </div>
                    </SelectItem>
                    <SelectItem value="teams">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Solo Partecipanti
                      </div>
                    </SelectItem>
                    <SelectItem value="staff">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4" />
                        Solo Staff
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>Priorita</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as typeof priority)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">Normale</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label>Oggetto *</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Oggetto del messaggio"
                />
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label>Messaggio *</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Scrivi il tuo messaggio..."
                  rows={8}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={handleSendMessage} disabled={sending}>
                {sending ? "Invio in corso..." : "Invia Messaggio"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => {
            handleTemplateSelect("tournament_reminder");
            setDialogOpen(true);
          }}
        >
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-2">
              <Clock className="h-8 w-8 text-blue-500" />
              <p className="font-medium">Promemoria</p>
              <p className="text-xs text-muted-foreground">Ricorda la data</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => {
            handleTemplateSelect("tournament_started");
            setDialogOpen(true);
          }}
        >
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <p className="font-medium">Torneo Iniziato</p>
              <p className="text-xs text-muted-foreground">Annuncia l'inizio</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => {
            handleTemplateSelect("tournament_completed");
            setDialogOpen(true);
          }}
        >
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-2">
              <FileText className="h-8 w-8 text-purple-500" />
              <p className="font-medium">Risultati</p>
              <p className="text-xs text-muted-foreground">Annuncia i vincitori</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => {
            setSubject("");
            setBody("");
            setSelectedTemplate("");
            setPriority("URGENT");
            setDialogOpen(true);
          }}
        >
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <p className="font-medium">Urgente</p>
              <p className="text-xs text-muted-foreground">Avviso importante</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message History */}
      <Card>
        <CardHeader>
          <CardTitle>Storico Comunicazioni</CardTitle>
          <CardDescription>
            Messaggi inviati ai partecipanti di questo torneo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{message.subject}</h4>
                        {getPriorityBadge(message.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {message.body}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Da: {message.sender.firstName} {message.sender.lastName}
                        </span>
                        <span>{formatDate(message.createdAt)}</span>
                        {message._count?.readReceipts !== undefined && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {message._count.readReceipts} letture
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nessun messaggio inviato</p>
              <p className="text-sm">Clicca "Nuovo Messaggio" per iniziare</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
