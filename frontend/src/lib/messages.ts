/**
 * =============================================================================
 * MESSAGES API - Servizio per sistema messaggistica interno
 * =============================================================================
 */

import api from "./api";

// Types
export interface MessageUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

export interface Message {
  id: string;
  type: "DIRECT" | "BROADCAST" | "SYSTEM";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  subject: string;
  body: string;
  senderId: string;
  sender: MessageUser;
  recipientId?: string;
  recipient?: MessageUser;
  tenantId: string;
  isRead: boolean;
  readAt?: string;
  parentId?: string;
  parent?: { id: string; subject: string };
  replies?: Message[];
  isArchivedBySender: boolean;
  isArchivedByRecipient: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { replies: number };
}

export interface MessagePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MessagesResponse {
  success: boolean;
  data?: Message[];
  pagination?: MessagePagination;
  message?: string;
}

export interface UnreadCountResponse {
  success: boolean;
  data?: {
    direct: number;
    broadcast: number;
    total: number;
  };
}

export interface RecipientResponse {
  success: boolean;
  data?: MessageUser[];
}

// API Functions

/**
 * Ottieni inbox (messaggi ricevuti)
 */
export async function getInbox(options?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}): Promise<MessagesResponse> {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", String(options.page));
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.unreadOnly) params.set("unreadOnly", "true");

  return api(`/api/messages/inbox?${params.toString()}`);
}

/**
 * Ottieni messaggi inviati
 */
export async function getSentMessages(options?: {
  page?: number;
  limit?: number;
}): Promise<MessagesResponse> {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", String(options.page));
  if (options?.limit) params.set("limit", String(options.limit));

  return api(`/api/messages/sent?${params.toString()}`);
}

/**
 * Ottieni conteggio messaggi non letti
 */
export async function getUnreadCount(): Promise<UnreadCountResponse> {
  return api("/api/messages/unread-count");
}

/**
 * Ottieni lista destinatari (per admin)
 */
export async function getRecipients(): Promise<RecipientResponse> {
  return api("/api/messages/recipients");
}

/**
 * Ottieni dettaglio messaggio
 */
export async function getMessage(messageId: string): Promise<{
  success: boolean;
  data?: Message;
  message?: string;
}> {
  return api(`/api/messages/${messageId}`);
}

/**
 * Invia messaggio diretto
 */
export async function sendMessage(data: {
  recipientId: string;
  subject: string;
  body: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
}): Promise<{ success: boolean; data?: Message; message?: string }> {
  return api("/api/messages/send", {
    method: "POST",
    body: data,
  });
}

/**
 * Invia messaggio broadcast (solo admin)
 */
export async function sendBroadcast(data: {
  subject: string;
  body: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
}): Promise<{ success: boolean; data?: Message; message?: string }> {
  return api("/api/messages/broadcast", {
    method: "POST",
    body: data,
  });
}

/**
 * Rispondi a un messaggio
 */
export async function replyToMessage(
  messageId: string,
  data: { body: string; subject?: string }
): Promise<{ success: boolean; data?: Message; message?: string }> {
  return api(`/api/messages/${messageId}/reply`, {
    method: "POST",
    body: data,
  });
}

/**
 * Segna messaggio come letto
 */
export async function markAsRead(
  messageId: string
): Promise<{ success: boolean; message?: string }> {
  return api(`/api/messages/${messageId}/read`, {
    method: "PUT",
  });
}

/**
 * Archivia messaggio
 */
export async function archiveMessage(
  messageId: string
): Promise<{ success: boolean; message?: string }> {
  return api(`/api/messages/${messageId}/archive`, {
    method: "PUT",
  });
}

/**
 * Elimina messaggio
 */
export async function deleteMessage(
  messageId: string
): Promise<{ success: boolean; message?: string }> {
  return api(`/api/messages/${messageId}`, {
    method: "DELETE",
  });
}
