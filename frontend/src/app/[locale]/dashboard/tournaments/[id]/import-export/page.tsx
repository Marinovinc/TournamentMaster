/**
 * =============================================================================
 * TOURNAMENT IMPORT/EXPORT PAGE
 * =============================================================================
 * Gestione import/export dati torneo
 * - Import partecipanti da Excel/CSV
 * - Export partecipanti, catture, classifica
 * - Export formato FIPSAS
 * - Download template
 * =============================================================================
 */

"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  FileJson,
  Users,
  Fish,
  Trophy,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  FileDown,
  FileUp,
  Building2,
  Info,
} from "lucide-react";
import { HelpGuide } from "@/components/HelpGuide";

interface ImportResult {
  success: boolean;
  data: {
    imported: number;
    errors: Array<{
      row: number;
      field: string;
      value: string;
      message: string;
    }>;
    warnings: string[];
  };
}

export default function ImportExportPage() {
  const params = useParams();
  const router = useRouter();
  const { token, user } = useAuth();
  const tournamentId = params.id as string;
  const locale = params.locale as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [activeTab, setActiveTab] = useState("export");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<"xlsx" | "csv" | "json">("xlsx");
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/csv",
    ];

    if (!validTypes.includes(file.type)) {
      setError("Formato file non supportato. Usare XLSX o CSV.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(
        `${API_URL}/api/import-export/participants/${tournamentId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Errore durante l'import");
      }

      setImportResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'import");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle export
  const handleExport = async (type: "participants" | "catches" | "leaderboard" | "fipsas") => {
    setIsExporting(type);
    setError(null);

    try {
      const endpoint =
        type === "fipsas"
          ? `${API_URL}/api/import-export/export/fipsas/${tournamentId}`
          : `${API_URL}/api/import-export/export/${type}/${tournamentId}?format=${exportFormat}`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Errore durante l'export");
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${type}_${tournamentId}.${type === "fipsas" ? "xlsx" : exportFormat}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'export");
    } finally {
      setIsExporting(null);
    }
  };

  // Handle template download
  const handleTemplateDownload = async (type: "participants" | "catches") => {
    setIsExporting(`template-${type}`);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/import-export/templates/${type}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Errore durante il download");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `template_${type === "participants" ? "partecipanti" : "catture"}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il download");
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/dashboard/tournaments/${tournamentId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Import/Export Dati</h1>
          <p className="text-muted-foreground">
            Importa partecipanti ed esporta dati del torneo
          </p>
        </div>
        <HelpGuide pageKey="tournamentImportExport" position="inline" isAdmin={true} />
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Template
          </TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileDown className="h-5 w-5" />
                Formato Export
              </CardTitle>
              <CardDescription>
                Seleziona il formato per l'export dei dati
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as typeof exportFormat)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      Excel (.xlsx)
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      CSV (.csv)
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4 text-orange-600" />
                      JSON (.json)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Export Options */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Participants Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Partecipanti
                </CardTitle>
                <CardDescription>
                  Esporta la lista completa dei partecipanti iscritti
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleExport("participants")}
                  disabled={isExporting !== null}
                  className="w-full"
                >
                  {isExporting === "participants" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Esporta Partecipanti
                </Button>
              </CardContent>
            </Card>

            {/* Catches Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fish className="h-5 w-5 text-cyan-600" />
                  Catture
                </CardTitle>
                <CardDescription>
                  Esporta tutte le catture registrate nel torneo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleExport("catches")}
                  disabled={isExporting !== null}
                  className="w-full"
                >
                  {isExporting === "catches" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Esporta Catture
                </Button>
              </CardContent>
            </Card>

            {/* Leaderboard Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Classifica
                </CardTitle>
                <CardDescription>
                  Esporta la classifica finale con punteggi e statistiche
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleExport("leaderboard")}
                  disabled={isExporting !== null}
                  className="w-full"
                >
                  {isExporting === "leaderboard" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Esporta Classifica
                </Button>
              </CardContent>
            </Card>

            {/* FIPSAS Export */}
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-700" />
                  Formato FIPSAS
                </CardTitle>
                <CardDescription>
                  Export completo in formato ufficiale FIPSAS (Excel multi-foglio)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleExport("fipsas")}
                  disabled={isExporting !== null}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isExporting === "fipsas" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Esporta per FIPSAS
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5" />
                Importa Partecipanti
              </CardTitle>
              <CardDescription>
                Carica un file Excel o CSV per importare partecipanti in blocco
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Formato richiesto</AlertTitle>
                <AlertDescription>
                  Il file deve contenere le colonne: email, firstName, lastName.
                  Colonne opzionali: phone, fipsasNumber, teamName, boatName.
                  Scarica il template dalla sezione Template per il formato corretto.
                </AlertDescription>
              </Alert>

              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="file-upload"
                  className={`cursor-pointer ${isUploading ? "pointer-events-none opacity-50" : ""}`}
                >
                  <div className="flex flex-col items-center gap-4">
                    {isUploading ? (
                      <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                    ) : (
                      <Upload className="h-12 w-12 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-lg font-medium">
                        {isUploading ? "Caricamento in corso..." : "Clicca per caricare un file"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Formati supportati: XLSX, XLS, CSV (max 10MB)
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    {uploadProgress}% completato
                  </p>
                </div>
              )}

              {/* Import Result */}
              {importResult && (
                <div className="space-y-4">
                  {/* Summary */}
                  <Alert variant={importResult.success ? "default" : "destructive"}>
                    {importResult.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {importResult.success ? "Import completato" : "Import con errori"}
                    </AlertTitle>
                    <AlertDescription>
                      {importResult.data.imported} partecipanti importati
                      {importResult.data.errors.length > 0 &&
                        `, ${importResult.data.errors.length} errori`}
                      {importResult.data.warnings.length > 0 &&
                        `, ${importResult.data.warnings.length} avvisi`}
                    </AlertDescription>
                  </Alert>

                  {/* Errors */}
                  {importResult.data.errors.length > 0 && (
                    <Card className="border-red-200 bg-red-50/50">
                      <CardHeader>
                        <CardTitle className="text-red-700 text-sm">
                          Errori ({importResult.data.errors.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 text-sm">
                          {importResult.data.errors.slice(0, 10).map((err, i) => (
                            <li key={i} className="text-red-600">
                              Riga {err.row}: {err.message}
                            </li>
                          ))}
                          {importResult.data.errors.length > 10 && (
                            <li className="text-muted-foreground">
                              ... e altri {importResult.data.errors.length - 10} errori
                            </li>
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Warnings */}
                  {importResult.data.warnings.length > 0 && (
                    <Card className="border-yellow-200 bg-yellow-50/50">
                      <CardHeader>
                        <CardTitle className="text-yellow-700 text-sm">
                          Avvisi ({importResult.data.warnings.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 text-sm">
                          {importResult.data.warnings.slice(0, 10).map((warn, i) => (
                            <li key={i} className="text-yellow-600">
                              {warn}
                            </li>
                          ))}
                          {importResult.data.warnings.length > 10 && (
                            <li className="text-muted-foreground">
                              ... e altri {importResult.data.warnings.length - 10} avvisi
                            </li>
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Participants Template */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Template Partecipanti
                </CardTitle>
                <CardDescription>
                  Scarica il template Excel per l'import dei partecipanti
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Colonne incluse:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>email (obbligatorio)</li>
                    <li>firstName (obbligatorio)</li>
                    <li>lastName (obbligatorio)</li>
                    <li>phone</li>
                    <li>fipsasNumber</li>
                    <li>teamName</li>
                    <li>boatName</li>
                  </ul>
                </div>
                <Button
                  onClick={() => handleTemplateDownload("participants")}
                  disabled={isExporting !== null}
                  variant="outline"
                  className="w-full"
                >
                  {isExporting === "template-participants" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Scarica Template
                </Button>
              </CardContent>
            </Card>

            {/* Catches Template */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fish className="h-5 w-5 text-cyan-600" />
                  Template Catture
                </CardTitle>
                <CardDescription>
                  Riferimento per il formato delle catture (solo visualizzazione)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    L'import delle catture non e supportato. Le catture vengono
                    registrate tramite l'app mobile durante il torneo.
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => handleTemplateDownload("catches")}
                  disabled={isExporting !== null}
                  variant="outline"
                  className="w-full"
                >
                  {isExporting === "template-catches" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Scarica Riferimento
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
