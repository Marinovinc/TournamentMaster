/**
 * =============================================================================
 * MESSAGES PAGE - Sistema Messaggistica Interno
 * =============================================================================
 * Inbox, messaggi inviati, composizione e lettura messaggi
 * =============================================================================
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useParams } from "next/navigation";
import {
  Mail,
  Send,
  Inbox,
  Users,
  Search,
  RefreshCw,
  MessageSquare,
  Reply,
  Archive,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronLeft,
  Megaphone,
  Star,
} from "lucide-react";
import {
  getInbox,
  getSentMessages,
  getUnreadCount,
  getRecipients,
  getMessage,
  sendMessage,
  sendBroadcast,
  replyToMessage,
  markAsRead,
  archiveMessage,
  deleteMessage,
  Message,
  MessageUser,
} from "@/lib/messages";

const PRIORITY_COLORS = {
  LOW: "bg-gray-100 text-gray-700",
  NORMAL: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

const PRIORITY_LABELS = {
  LOW: "Bassa",
  NORMAL: "Normale",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export default function MessagesPage() {
  const { user, isAdmin } = useAuth();
  const params = useParams();
  const locale = (params.locale as string) || "it";

  // State
  const [activeTab, setActiveTab] = useState("inbox");
  const [inboxMessages, setInboxMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [recipients, setRecipients] = useState<MessageUser[]>([]);
  const [unreadCount, setUnreadCount] = useState({ direct: 0, broadcast: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Selected message
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messageLoading, setMessageLoading] = useState(false);

  // Compose dialog
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<"direct" | "broadcast" | "reply">("direct");
  const [composeData, setComposeData] = useState({
    recipientId: "",
    subject: "",
    body: "",
    priority: "NORMAL" as "LOW" | "NORMAL" | "HIGH" | "URGENT",
  });
  const [composeSending, setComposeSending] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [inboxRes, sentRes, unreadRes] = await Promise.all([
        getInbox({ limit: 50 }),
        getSentMessages({ limit: 50 }),
        getUnreadCount(),
      ]);

      if (inboxRes.success && inboxRes.data) {
        setInboxMessages(inboxRes.data);
      }
      if (sentRes.success && sentRes.data) {
        setSentMessages(sentRes.data);
      }
      if (unreadRes.success && unreadRes.data) {
        setUnreadCount(unreadRes.data);
      }

      // Admin can get recipients list
      if (isAdmin) {
        const recipientsRes = await getRecipients();
        if (recipientsRes.success && recipientsRes.data) {
          setRecipients(recipientsRes.data);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open message detail
  const openMessage = async (msg: Message) => {
    setMessageLoading(true);
    try {
      const res = await getMessage(msg.id);
      if (res.success && res.data) {
        setSelectedMessage(res.data);
        // Update local state if was unread
        if (!msg.isRead) {
          setInboxMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
          );
          setUnreadCount((prev) => ({
            ...prev,
            total: Math.max(0, prev.total - 1),
            direct: msg.type === "DIRECT" ? Math.max(0, prev.direct - 1) : prev.direct,
            broadcast: msg.type === "BROADCAST" ? Math.max(0, prev.broadcast - 1) : prev.broadcast,
          }));
        }
      }
    } catch (error) {
      console.error("Error loading message:", error);
    } finally {
      setMessageLoading(false);
    }
  };

  // Handle compose
  const openCompose = (mode: "direct" | "broadcast", replyTo?: Message) => {
    setComposeMode(mode);
    if (replyTo) {
      setComposeMode("reply");
      setReplyToId(replyTo.id);
      setComposeData({
        recipientId: replyTo.senderId,
        subject: `Re: ${replyTo.subject}`,
        body: "",
        priority: replyTo.priority,
      });
    } else {
      setReplyToId(null);
      setComposeData({
        recipientId: "",
        subject: "",
        body: "",
        priority: "NORMAL",
      });
    }
    setComposeOpen(true);
  };

  // Send message
  const handleSend = async () => {
    setComposeSending(true);
    try {
      let res;
      if (composeMode === "reply" && replyToId) {
        res = await replyToMessage(replyToId, {
          body: composeData.body,
          subject: composeData.subject,
        });
      } else if (composeMode === "broadcast") {
        res = await sendBroadcast({
          subject: composeData.subject,
          body: composeData.body,
          priority: composeData.priority,
        });
      } else {
        res = await sendMessage({
          recipientId: composeData.recipientId,
          subject: composeData.subject,
          body: composeData.body,
          priority: composeData.priority,
        });
      }

      if (res.success) {
        setComposeOpen(false);
        fetchData();
        // If replying, refresh message detail
        if (composeMode === "reply" && replyToId && selectedMessage) {
          const updatedMsg = await getMessage(selectedMessage.id);
          if (updatedMsg.success && updatedMsg.data) {
            setSelectedMessage(updatedMsg.data);
          }
        }
      } else {
        alert(res.message || "Errore invio messaggio");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Errore di rete");
    } finally {
      setComposeSending(false);
    }
  };

  // Archive message
  const handleArchive = async (msgId: string) => {
    try {
      const res = await archiveMessage(msgId);
      if (res.success) {
        setInboxMessages((prev) => prev.filter((m) => m.id !== msgId));
        setSentMessages((prev) => prev.filter((m) => m.id !== msgId));
        if (selectedMessage?.id === msgId) {
          setSelectedMessage(null);
        }
      }
    } catch (error) {
      console.error("Error archiving:", error);
    }
  };

  // Delete message
  const handleDelete = async (msgId: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo messaggio?")) return;
    try {
      const res = await deleteMessage(msgId);
      if (res.success) {
        setSentMessages((prev) => prev.filter((m) => m.id !== msgId));
        if (selectedMessage?.id === msgId) {
          setSelectedMessage(null);
        }
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  // Filter messages
  const filterMessages = (messages: Message[]) => {
    if (!searchQuery) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.subject.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q) ||
        m.sender.firstName.toLowerCase().includes(q) ||
        m.sender.lastName.toLowerCase().includes(q)
    );
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays < 7) {
      return date.toLocaleDateString("it-IT", { weekday: "short", hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
  };

  // Get initials
  const getInitials = (user: MessageUser) => {
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
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
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Mail className="h-8 w-8" />
            Messaggi
          </h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount.total > 0
              ? `${unreadCount.total} messaggi non letti`
              : "Nessun messaggio non letto"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
          {isAdmin && (
            <Button variant="outline" onClick={() => openCompose("broadcast")}>
              <Megaphone className="h-4 w-4 mr-2" />
              Broadcast
            </Button>
          )}
          <Button onClick={() => openCompose("direct")}>
            <Send className="h-4 w-4 mr-2" />
            Nuovo Messaggio
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="lg:col-span-1">
          <Card className="h-[calc(100vh-250px)]">
            <CardHeader className="pb-3">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="inbox" className="gap-2">
                    <Inbox className="h-4 w-4" />
                    Ricevuti
                    {unreadCount.total > 0 && (
                      <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                        {unreadCount.total}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="sent" className="gap-2">
                    <Send className="h-4 w-4" />
                    Inviati
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca messaggi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto" style={{ maxHeight: "calc(100% - 140px)" }}>
              {activeTab === "inbox" ? (
                filterMessages(inboxMessages).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Inbox className="h-12 w-12 mb-3" />
                    <p>Nessun messaggio</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filterMessages(inboxMessages).map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => openMessage(msg)}
                        className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                          selectedMessage?.id === msg.id ? "bg-muted" : ""
                        } ${!msg.isRead ? "bg-primary/5" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={!msg.isRead ? "bg-primary text-primary-foreground" : ""}>
                              {msg.type === "BROADCAST" ? <Megaphone className="h-4 w-4" /> : getInitials(msg.sender)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`truncate ${!msg.isRead ? "font-semibold" : ""}`}>
                                {msg.sender.firstName} {msg.sender.lastName}
                              </span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDate(msg.createdAt)}
                              </span>
                            </div>
                            <p className={`text-sm truncate ${!msg.isRead ? "font-medium" : "text-muted-foreground"}`}>
                              {msg.subject}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {msg.type === "BROADCAST" && (
                                <Badge variant="secondary" className="text-xs">
                                  <Megaphone className="h-3 w-3 mr-1" />
                                  Broadcast
                                </Badge>
                              )}
                              {msg.priority !== "NORMAL" && (
                                <Badge className={`text-xs ${PRIORITY_COLORS[msg.priority]}`}>
                                  {PRIORITY_LABELS[msg.priority]}
                                </Badge>
                              )}
                              {msg._count && msg._count.replies > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  {msg._count.replies}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                filterMessages(sentMessages).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Send className="h-12 w-12 mb-3" />
                    <p>Nessun messaggio inviato</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filterMessages(sentMessages).map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => openMessage(msg)}
                        className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                          selectedMessage?.id === msg.id ? "bg-muted" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {msg.type === "BROADCAST" ? <Megaphone className="h-4 w-4" /> : msg.recipient ? getInitials(msg.recipient) : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">
                                {msg.type === "BROADCAST"
                                  ? "Tutti gli iscritti"
                                  : msg.recipient
                                  ? `${msg.recipient.firstName} ${msg.recipient.lastName}`
                                  : "Destinatario"}
                              </span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDate(msg.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{msg.subject}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {msg.type === "BROADCAST" && (
                                <Badge variant="secondary" className="text-xs">
                                  <Megaphone className="h-3 w-3 mr-1" />
                                  Broadcast
                                </Badge>
                              )}
                              {msg.isRead && msg.type === "DIRECT" && (
                                <Badge variant="outline" className="text-xs text-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Letto
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          <Card className="h-[calc(100vh-250px)]">
            {messageLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : selectedMessage ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setSelectedMessage(null)}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {selectedMessage.type === "BROADCAST" ? (
                            <Megaphone className="h-5 w-5" />
                          ) : (
                            getInitials(selectedMessage.sender)
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <span>
                            Da: {selectedMessage.sender.firstName} {selectedMessage.sender.lastName}
                          </span>
                          {selectedMessage.recipient && (
                            <span>
                              A: {selectedMessage.recipient.firstName} {selectedMessage.recipient.lastName}
                            </span>
                          )}
                          {selectedMessage.type === "BROADCAST" && <span>A: Tutti gli iscritti</span>}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(selectedMessage.createdAt).toLocaleString("it-IT")}
                          </Badge>
                          {selectedMessage.priority !== "NORMAL" && (
                            <Badge className={`text-xs ${PRIORITY_COLORS[selectedMessage.priority]}`}>
                              {PRIORITY_LABELS[selectedMessage.priority]}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openCompose("direct", selectedMessage)}
                        title="Rispondi"
                      >
                        <Reply className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleArchive(selectedMessage.id)}
                        title="Archivia"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                      {selectedMessage.senderId === user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(selectedMessage.id)}
                          title="Elimina"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 overflow-y-auto" style={{ maxHeight: "calc(100% - 180px)" }}>
                  {/* Message body */}
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">{selectedMessage.body}</div>

                  {/* Replies */}
                  {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                    <div className="mt-8 space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Risposte ({selectedMessage.replies.length})
                      </h4>
                      {selectedMessage.replies.map((reply) => (
                        <div key={reply.id} className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">{getInitials(reply.sender)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium text-sm">
                                {reply.sender.firstName} {reply.sender.lastName}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {new Date(reply.createdAt).toLocaleString("it-IT")}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm whitespace-pre-wrap pl-11">{reply.body}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick reply */}
                  <div className="mt-6 pt-4 border-t">
                    <Button variant="outline" onClick={() => openCompose("direct", selectedMessage)}>
                      <Reply className="h-4 w-4 mr-2" />
                      Rispondi
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Mail className="h-16 w-16 mb-4" />
                <p className="text-lg">Seleziona un messaggio</p>
                <p className="text-sm">Scegli un messaggio dalla lista per visualizzarlo</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {composeMode === "broadcast"
                ? "Nuovo Messaggio Broadcast"
                : composeMode === "reply"
                ? "Rispondi"
                : "Nuovo Messaggio"}
            </DialogTitle>
            <DialogDescription>
              {composeMode === "broadcast"
                ? "Invia un messaggio a tutti gli iscritti dell'associazione"
                : composeMode === "reply"
                ? "Rispondi al messaggio"
                : "Invia un messaggio diretto"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {composeMode === "direct" && (
              <div className="grid gap-2">
                <Label htmlFor="recipient">Destinatario *</Label>
                <Select
                  value={composeData.recipientId}
                  onValueChange={(value) => setComposeData({ ...composeData, recipientId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona destinatario" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipients.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.firstName} {r.lastName} ({r.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="subject">Oggetto *</Label>
              <Input
                id="subject"
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                placeholder="Inserisci oggetto"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="body">Messaggio *</Label>
              <Textarea
                id="body"
                value={composeData.body}
                onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                placeholder="Scrivi il tuo messaggio..."
                rows={6}
              />
            </div>
            {composeMode !== "reply" && (
              <div className="grid gap-2">
                <Label htmlFor="priority">Priorita</Label>
                <Select
                  value={composeData.priority}
                  onValueChange={(value) =>
                    setComposeData({ ...composeData, priority: value as typeof composeData.priority })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Bassa</SelectItem>
                    <SelectItem value="NORMAL">Normale</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleSend}
              disabled={
                composeSending ||
                !composeData.subject ||
                !composeData.body ||
                (composeMode === "direct" && !composeData.recipientId)
              }
            >
              {composeSending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Invia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
