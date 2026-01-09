/**
 * =============================================================================
 * MESSAGES SECTION - User Messages Management
 * =============================================================================
 * Gestione messaggi utente con:
 * - Lista messaggi ricevuti (inbox)
 * - Visualizzazione dettaglio messaggio
 * - Risposta ai messaggi
 * - Badge messaggi non letti
 * =============================================================================
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Mail,
  MailOpen,
  Loader2,
  Send,
  ArrowLeft,
  Inbox,
  Clock,
  AlertCircle,
  CheckCircle,
  Megaphone,
  User,
  RefreshCw,
} from "lucide-react";

// Types
interface MessageUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Message {
  id: string;
  type: "DIRECT" | "BROADCAST" | "SYSTEM";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  subject: string;
  body: string;
  senderId: string;
  sender: MessageUser;
  recipientId?: string;
  recipient?: MessageUser;
  isRead: boolean;
  readAt?: string;
  parentId?: string;
  replies?: Message[];
  createdAt: string;
  _count?: { replies: number };
}

interface MessagesSectionProps {
  primaryColor?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Priority config
const priorityConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  LOW: { label: "Bassa", color: "bg-gray-100 text-gray-600", icon: null },
  NORMAL: { label: "Normale", color: "bg-blue-100 text-blue-600", icon: null },
  HIGH: { label: "Alta", color: "bg-orange-100 text-orange-600", icon: <AlertCircle className="h-3 w-3" /> },
  URGENT: { label: "Urgente", color: "bg-red-100 text-red-600", icon: <AlertCircle className="h-3 w-3" /> },
};

// Format date
function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Adesso";
  if (diffMins < 60) return `${diffMins} min fa`;
  if (diffHours < 24) return `${diffHours} ore fa`;
  if (diffDays < 7) return `${diffDays} giorni fa`;

  return date.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessagesSection({ primaryColor = "#0066CC" }: MessagesSectionProps) {
  const { token } = useAuth();

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Selected message state
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messageDetailLoading, setMessageDetailLoading] = useState(false);

  // Reply state
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/messages/inbox?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch messages");

      const data = await response.json();
      if (data.success) {
        setMessages(data.data || []);
        // Count unread
        const unread = (data.data || []).filter((m: Message) => !m.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Impossibile caricare i messaggi");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Mark as read
  async function markAsRead(messageId: string) {
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/messages/${messageId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update local state
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, isRead: true } : m
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  }

  // View message detail
  async function viewMessage(message: Message) {
    setSelectedMessage(message);

    // Mark as read if unread
    if (!message.isRead) {
      markAsRead(message.id);
    }

    // Fetch full message with replies
    setMessageDetailLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/messages/${message.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSelectedMessage(data.data);
        }
      }
    } catch (err) {
      console.error("Error fetching message detail:", err);
    } finally {
      setMessageDetailLoading(false);
    }
  }

  // Send reply
  async function handleSendReply() {
    if (!token || !selectedMessage || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const response = await fetch(`${API_URL}/api/messages/${selectedMessage.id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: replyText }),
      });

      if (!response.ok) throw new Error("Failed to send reply");

      const data = await response.json();
      if (data.success) {
        // Add reply to selected message
        setSelectedMessage(prev => prev ? {
          ...prev,
          replies: [...(prev.replies || []), data.data],
        } : null);

        setReplyText("");
        setReplyDialogOpen(false);
      }
    } catch (err) {
      console.error("Error sending reply:", err);
      alert("Errore durante l'invio della risposta");
    } finally {
      setSendingReply(false);
    }
  }

  // Get message type icon
  function getMessageTypeIcon(type: string) {
    switch (type) {
      case "BROADCAST":
        return <Megaphone className="h-4 w-4" />;
      case "SYSTEM":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchMessages}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Riprova
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Message detail view
  if (selectedMessage) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMessage(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Indietro
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Message header */}
          <div className="border-b pb-4 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedMessage.subject}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  {getMessageTypeIcon(selectedMessage.type)}
                  <span>
                    Da: {selectedMessage.sender.firstName} {selectedMessage.sender.lastName}
                  </span>
                  <span>-</span>
                  <span>{formatFullDate(selectedMessage.createdAt)}</span>
                </div>
              </div>
              {selectedMessage.priority !== "NORMAL" && (
                <Badge className={priorityConfig[selectedMessage.priority]?.color}>
                  {priorityConfig[selectedMessage.priority]?.icon}
                  <span className="ml-1">{priorityConfig[selectedMessage.priority]?.label}</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Message body */}
          <div className="prose prose-sm max-w-none mb-6">
            <p className="whitespace-pre-wrap">{selectedMessage.body}</p>
          </div>

          {/* Replies */}
          {selectedMessage.replies && selectedMessage.replies.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Risposte ({selectedMessage.replies.length})
              </h4>
              <div className="space-y-3">
                {selectedMessage.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="bg-muted/50 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span className="font-medium text-foreground">
                        {reply.sender.firstName} {reply.sender.lastName}
                      </span>
                      <span>-</span>
                      <span>{formatDate(reply.createdAt)}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{reply.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reply button */}
          {selectedMessage.type === "DIRECT" && (
            <div className="mt-6 pt-4 border-t">
              <Button
                onClick={() => setReplyDialogOpen(true)}
                style={{ backgroundColor: primaryColor }}
              >
                <Send className="h-4 w-4 mr-2" />
                Rispondi
              </Button>
            </div>
          )}

          {messageDetailLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </CardContent>

        {/* Reply Dialog */}
        <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rispondi al messaggio</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Scrivi la tua risposta..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={6}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
                Annulla
              </Button>
              <Button
                onClick={handleSendReply}
                disabled={sendingReply || !replyText.trim()}
                style={{ backgroundColor: primaryColor }}
              >
                {sendingReply && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Send className="h-4 w-4 mr-2" />
                Invia
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  // Messages list view
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Inbox className="h-5 w-5" style={{ color: primaryColor }} />
            Messaggi Ricevuti
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} nuovi
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchMessages}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              Nessun messaggio ricevuto
            </p>
          </div>
        ) : (
          <div className="h-[400px] overflow-y-auto">
            <div className="space-y-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => viewMessage(message)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    message.isRead
                      ? "bg-muted/30 hover:bg-muted/50"
                      : "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Read/Unread icon */}
                    <div className="mt-0.5">
                      {message.isRead ? (
                        <MailOpen className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Mail className="h-5 w-5" style={{ color: primaryColor }} />
                      )}
                    </div>

                    {/* Message content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm truncate ${!message.isRead ? "font-semibold" : ""}`}>
                          {message.sender.firstName} {message.sender.lastName}
                        </span>
                        {message.type === "BROADCAST" && (
                          <Badge variant="outline" className="text-xs">
                            <Megaphone className="h-3 w-3 mr-1" />
                            Broadcast
                          </Badge>
                        )}
                        {message.priority === "HIGH" || message.priority === "URGENT" ? (
                          <Badge className={priorityConfig[message.priority]?.color + " text-xs"}>
                            {priorityConfig[message.priority]?.label}
                          </Badge>
                        ) : null}
                      </div>
                      <p className={`text-sm truncate ${!message.isRead ? "font-medium" : "text-muted-foreground"}`}>
                        {message.subject}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {message.body.substring(0, 80)}...
                      </p>
                    </div>

                    {/* Time and reply count */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(message.createdAt)}
                      </p>
                      {message._count && message._count.replies > 0 && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {message._count.replies} risposte
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
