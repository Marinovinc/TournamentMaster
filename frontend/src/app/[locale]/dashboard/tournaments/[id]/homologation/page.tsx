"use client";

/**
 * =============================================================================
 * HOMOLOGATION FIPSAS PAGE
 * =============================================================================
 * Gestione omologazione FIPSAS torneo - Fase 4: Compliance
 * Include: checklist conformita, documenti, workflow approvazione
 * =============================================================================
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  Circle,
  FileText,
  Upload,
  Send,
  Clock,
  AlertTriangle,
  XCircle,
  Award,
  ChevronDown,
  ChevronRight,
  Download,
  Trash2,
  RefreshCw,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import api from "@/lib/api";

// Types
interface ChecklistItem {
  id: string;
  category: string;
  description: string;
  required: boolean;
  checked: boolean;
  notes?: string;
  checkedAt?: string;
  checkedBy?: string;
}

interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

interface Progress {
  requiredTotal: number;
  requiredComplete: number;
  requiredPercent: number;
  optionalTotal: number;
  optionalComplete: number;
  totalPercent: number;
  isReady: boolean;
}

interface Homologation {
  id: string;
  status: string;
  fipsasEventCode: string | null;
  homologationNumber: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  homologatedAt: string | null;
  documents: Document[];
  reviewerNotes: string | null;
  correctionRequests: string | null;
  complianceChecklist: ChecklistItem[];
  progress: Progress;
  tournament: {
    id: string;
    name: string;
    discipline: string;
    level: string;
    startDate: string;
    endDate: string;
    location: string;
  };
}

// Status configuration
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  NOT_REQUIRED: { label: "Non Richiesta", color: "bg-gray-100 text-gray-800", icon: <Circle className="h-4 w-4" /> },
  PENDING: { label: "In Preparazione", color: "bg-blue-100 text-blue-800", icon: <Clock className="h-4 w-4" /> },
  READY_TO_SUBMIT: { label: "Pronto per Invio", color: "bg-yellow-100 text-yellow-800", icon: <CheckCircle className="h-4 w-4" /> },
  SUBMITTED: { label: "Inviato", color: "bg-purple-100 text-purple-800", icon: <Send className="h-4 w-4" /> },
  UNDER_REVIEW: { label: "In Revisione", color: "bg-orange-100 text-orange-800", icon: <RefreshCw className="h-4 w-4" /> },
  CORRECTIONS_NEEDED: { label: "Correzioni Richieste", color: "bg-red-100 text-red-800", icon: <AlertTriangle className="h-4 w-4" /> },
  CORRECTIONS_REQUIRED: { label: "Correzioni Richieste", color: "bg-red-100 text-red-800", icon: <AlertTriangle className="h-4 w-4" /> },
  HOMOLOGATED: { label: "Omologato", color: "bg-green-100 text-green-800", icon: <Award className="h-4 w-4" /> },
  APPROVED: { label: "Approvato", color: "bg-green-100 text-green-800", icon: <Award className="h-4 w-4" /> },
  REJECTED: { label: "Respinto", color: "bg-red-100 text-red-800", icon: <XCircle className="h-4 w-4" /> },
};

export default function HomologationPage() {
  const params = useParams();
  const tournamentId = params.id as string;

  // State
  const [homologation, setHomologation] = useState<Homologation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Dialogs
  const [showAddDocDialog, setShowAddDocDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [docForm, setDocForm] = useState({ name: "", url: "", type: "pdf" });

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api<Homologation>(`/api/homologation/tournament/${tournamentId}`);
      if (res.success && res.data) {
        setHomologation(res.data);
      } else {
        setError(res.message || "Errore nel caricamento");
      }
    } catch (err) {
      console.error("Error loading homologation:", err);
      setError("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Start process
  const handleStartProcess = async () => {
    try {
      setSaving(true);
      const res = await api(`/api/homologation/tournament/${tournamentId}/start`, {
        method: "POST",
      });
      if (res.success) {
        loadData();
      } else {
        alert(res.message || "Errore nell'avvio del processo");
      }
    } catch (err) {
      console.error("Error starting process:", err);
    } finally {
      setSaving(false);
    }
  };

  // Update checklist item
  const handleChecklistChange = async (itemId: string, checked: boolean) => {
    if (!homologation) return;

    const updatedChecklist = homologation.complianceChecklist.map((item) =>
      item.id === itemId ? { ...item, checked } : item
    );

    // Optimistic update
    setHomologation({
      ...homologation,
      complianceChecklist: updatedChecklist,
    });

    try {
      await api(`/api/homologation/tournament/${tournamentId}/checklist/${itemId}`, {
        method: "PUT",
        body: { checked },
      });
      loadData(); // Reload to get updated progress
    } catch (err) {
      console.error("Error updating checklist:", err);
      loadData(); // Revert on error
    }
  };

  // Add document
  const handleAddDocument = async () => {
    try {
      setSaving(true);
      const res = await api(`/api/homologation/tournament/${tournamentId}/documents`, {
        method: "POST",
        body: docForm,
      });
      if (res.success) {
        setShowAddDocDialog(false);
        setDocForm({ name: "", url: "", type: "pdf" });
        loadData();
      } else {
        alert(res.message || "Errore nell'aggiunta del documento");
      }
    } catch (err) {
      console.error("Error adding document:", err);
    } finally {
      setSaving(false);
    }
  };

  // Remove document
  const handleRemoveDocument = async (docId: string) => {
    if (!confirm("Rimuovere questo documento?")) return;

    try {
      const res = await api(`/api/homologation/tournament/${tournamentId}/documents/${docId}`, {
        method: "DELETE",
      });
      if (res.success) {
        loadData();
      }
    } catch (err) {
      console.error("Error removing document:", err);
    }
  };

  // Submit for review
  const handleSubmit = async () => {
    try {
      setSaving(true);
      const res = await api(`/api/homologation/tournament/${tournamentId}/submit`, {
        method: "POST",
      });
      if (res.success) {
        setShowSubmitDialog(false);
        loadData();
      } else {
        alert(res.message || "Errore nell'invio");
      }
    } catch (err) {
      console.error("Error submitting:", err);
    } finally {
      setSaving(false);
    }
  };

  // Group checklist by category
  const groupedChecklist = homologation?.complianceChecklist.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>) || {};

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  if (!homologation) return null;

  const status = statusConfig[homologation.status] || statusConfig.NOT_REQUIRED;
  const canEdit = ["NOT_REQUIRED", "PENDING", "READY_TO_SUBMIT", "CORRECTIONS_NEEDED", "CORRECTIONS_REQUIRED"].includes(homologation.status);
  const canSubmit = homologation.status === "READY_TO_SUBMIT";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/it/dashboard/tournaments/${tournamentId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna al torneo
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Omologazione FIPSAS
            </h1>
            <p className="text-gray-500">{homologation.tournament.name}</p>
          </div>
        </div>
        <Badge className={`${status.color} flex items-center gap-1 px-3 py-1`}>
          {status.icon}
          {status.label}
        </Badge>
      </div>

      {/* Correction Requests Alert */}
      {(homologation.status === "CORRECTIONS_NEEDED" || homologation.status === "CORRECTIONS_REQUIRED") && homologation.correctionRequests && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Correzioni Richieste</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">
            {homologation.correctionRequests}
          </AlertDescription>
        </Alert>
      )}

      {/* Approved Info */}
      {(homologation.status === "HOMOLOGATED" || homologation.status === "APPROVED") && (
        <Alert className="bg-green-50 border-green-200">
          <Award className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Torneo Omologato</AlertTitle>
          <AlertDescription className="text-green-700">
            <div className="space-y-1 mt-2">
              {homologation.fipsasEventCode && (
                <div>Codice Evento FIPSAS: <strong>{homologation.fipsasEventCode}</strong></div>
              )}
              {homologation.homologationNumber && (
                <div>Numero Omologazione: <strong>{homologation.homologationNumber}</strong></div>
              )}
              {homologation.homologatedAt && (
                <div>Data: {new Date(homologation.homologatedAt).toLocaleDateString("it-IT")}</div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Not Required State */}
      {homologation.status === "NOT_REQUIRED" && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Shield className="h-16 w-16 mx-auto text-gray-300" />
              <div>
                <h3 className="text-lg font-medium">Omologazione Non Richiesta</h3>
                <p className="text-gray-500 mt-1">
                  Se questo e un torneo ufficiale FIPSAS, avvia il processo di omologazione per garantire la conformita federale.
                </p>
              </div>
              <Button onClick={handleStartProcess} disabled={saving}>
                {saving ? "Avvio..." : "Avvia Processo Omologazione"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress & Checklist */}
      {homologation.status !== "NOT_REQUIRED" && (
        <>
          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Progresso Checklist</span>
                <span className="text-2xl font-bold text-blue-600">
                  {homologation.progress.requiredPercent}%
                </span>
              </CardTitle>
              <CardDescription>
                {homologation.progress.requiredComplete} di {homologation.progress.requiredTotal} requisiti obbligatori completati
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={homologation.progress.requiredPercent} className="h-3" />
              <div className="mt-4 flex justify-between text-sm text-gray-500">
                <span>
                  Opzionali: {homologation.progress.optionalComplete}/{homologation.progress.optionalTotal}
                </span>
                {homologation.progress.isReady && (
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Pronto per invio
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Checklist Conformita FIPSAS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={Object.keys(groupedChecklist)} className="space-y-2">
                {Object.entries(groupedChecklist).map(([category, items]) => {
                  const categoryComplete = items.filter((i) => i.checked).length;
                  const categoryRequired = items.filter((i) => i.required).length;
                  const categoryRequiredComplete = items.filter((i) => i.required && i.checked).length;

                  return (
                    <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="font-medium">{category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              {categoryComplete}/{items.length}
                            </span>
                            {categoryRequiredComplete === categoryRequired ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-300" />
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className={`flex items-start gap-3 p-3 rounded-lg ${
                                item.checked ? "bg-green-50" : "bg-gray-50"
                              }`}
                            >
                              <Checkbox
                                id={item.id}
                                checked={item.checked}
                                onCheckedChange={(checked) =>
                                  canEdit && handleChecklistChange(item.id, checked as boolean)
                                }
                                disabled={!canEdit}
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={item.id}
                                  className={`text-sm cursor-pointer ${
                                    item.checked ? "text-green-700" : ""
                                  }`}
                                >
                                  {item.description}
                                  {item.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </label>
                                {item.checkedAt && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    Completato il {new Date(item.checkedAt).toLocaleDateString("it-IT")}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Documenti Allegati
                </CardTitle>
                {canEdit && (
                  <Button size="sm" onClick={() => setShowAddDocDialog(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Aggiungi Documento
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {homologation.documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nessun documento allegato
                </div>
              ) : (
                <div className="space-y-2">
                  {homologation.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-xs text-gray-500">
                            {doc.type.toUpperCase()} - {new Date(doc.uploadedAt).toLocaleDateString("it-IT")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => handleRemoveDocument(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          {canSubmit && (
            <div className="flex justify-end">
              <Button size="lg" onClick={() => setShowSubmitDialog(true)}>
                <Send className="h-5 w-5 mr-2" />
                Invia per Omologazione
              </Button>
            </div>
          )}
        </>
      )}

      {/* Add Document Dialog */}
      <Dialog open={showAddDocDialog} onOpenChange={setShowAddDocDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Documento</DialogTitle>
            <DialogDescription>
              Inserisci i dettagli del documento da allegare
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome Documento *</Label>
              <Input
                placeholder="es. Regolamento Gara 2024"
                value={docForm.name}
                onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>URL Documento *</Label>
              <Input
                placeholder="https://..."
                value={docForm.url}
                onChange={(e) => setDocForm({ ...docForm, url: e.target.value })}
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={docForm.type}
                onChange={(e) => setDocForm({ ...docForm, type: e.target.value })}
              >
                <option value="pdf">PDF</option>
                <option value="word">Word</option>
                <option value="excel">Excel</option>
                <option value="image">Immagine</option>
                <option value="other">Altro</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDocDialog(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleAddDocument}
              disabled={!docForm.name || !docForm.url || saving}
            >
              {saving ? "Salvataggio..." : "Aggiungi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Invio</DialogTitle>
            <DialogDescription>
              Stai per inviare la richiesta di omologazione al comitato FIPSAS.
              Assicurati che tutti i documenti siano corretti prima di procedere.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Dopo l'invio, il torneo sara sottoposto a revisione da parte del comitato federale.
                Riceverai una notifica quando sara disponibile l'esito.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Invio..." : "Conferma Invio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
