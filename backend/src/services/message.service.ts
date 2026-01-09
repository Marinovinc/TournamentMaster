import prisma from "../lib/prisma";
import { UserRole } from "../types";

// Tipi per messaggi
export enum MessageType {
  DIRECT = "DIRECT",
  BROADCAST = "BROADCAST",
  SYSTEM = "SYSTEM",
}

export enum MessagePriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

interface SendMessageInput {
  senderId: string;
  recipientId?: string; // null per broadcast
  tenantId: string;
  subject: string;
  body: string;
  type?: MessageType;
  priority?: MessagePriority;
  parentId?: string; // per risposte
}

interface MessageFilters {
  userId: string;
  tenantId?: string;
  type?: MessageType;
  isRead?: boolean;
  folder?: "inbox" | "sent" | "archived";
}

export class MessageService {
  /**
   * Invia un messaggio diretto a un utente
   */
  static async sendDirectMessage(input: SendMessageInput) {
    if (!input.recipientId) {
      throw new Error("Recipient ID required for direct messages");
    }

    // Verifica che il destinatario esista e appartenga allo stesso tenant
    const recipient = await prisma.user.findFirst({
      where: {
        id: input.recipientId,
        tenantId: input.tenantId,
        isActive: true,
      },
    });

    if (!recipient) {
      throw new Error("Recipient not found or not in same association");
    }

    const message = await prisma.message.create({
      data: {
        type: MessageType.DIRECT,
        priority: input.priority || MessagePriority.NORMAL,
        subject: input.subject,
        body: input.body,
        senderId: input.senderId,
        recipientId: input.recipientId,
        tenantId: input.tenantId,
        parentId: input.parentId,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        recipient: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    });

    return message;
  }

  /**
   * Invia un messaggio broadcast a tutti gli iscritti dell'associazione
   */
  static async sendBroadcastMessage(input: SendMessageInput) {
    // Verifica che il mittente sia un admin
    const sender = await prisma.user.findUnique({
      where: { id: input.senderId },
    });

    if (!sender) {
      throw new Error("Sender not found");
    }

    const adminRoles = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT];
    if (!adminRoles.includes(sender.role as UserRole)) {
      throw new Error("Only administrators can send broadcast messages");
    }

    // Crea il messaggio broadcast
    const message = await prisma.message.create({
      data: {
        type: MessageType.BROADCAST,
        priority: input.priority || MessagePriority.NORMAL,
        subject: input.subject,
        body: input.body,
        senderId: input.senderId,
        recipientId: null, // broadcast = nessun destinatario specifico
        tenantId: input.tenantId,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    });

    return message;
  }

  /**
   * Rispondi a un messaggio
   */
  static async replyToMessage(
    originalMessageId: string,
    senderId: string,
    body: string,
    subject?: string
  ) {
    // Recupera il messaggio originale
    const originalMessage = await prisma.message.findUnique({
      where: { id: originalMessageId },
      include: { sender: true },
    });

    if (!originalMessage) {
      throw new Error("Original message not found");
    }

    // Determina il destinatario della risposta
    let recipientId: string;

    if (originalMessage.type === MessageType.BROADCAST) {
      // Se rispondo a un broadcast, il destinatario e' il mittente originale
      recipientId = originalMessage.senderId;
    } else {
      // Se rispondo a un messaggio diretto, il destinatario e' il mittente originale
      // (a meno che non sia io stesso il mittente, allora rispondo al destinatario)
      recipientId =
        originalMessage.senderId === senderId
          ? originalMessage.recipientId!
          : originalMessage.senderId;
    }

    const replySubject = subject || `Re: ${originalMessage.subject}`;

    const reply = await prisma.message.create({
      data: {
        type: MessageType.DIRECT,
        priority: originalMessage.priority,
        subject: replySubject,
        body: body,
        senderId: senderId,
        recipientId: recipientId,
        tenantId: originalMessage.tenantId,
        parentId: originalMessageId,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        recipient: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    });

    return reply;
  }

  /**
   * Ottieni inbox dell'utente (messaggi ricevuti)
   */
  static async getInbox(
    userId: string,
    tenantId: string,
    options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
  ) {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const whereCondition = {
      tenantId,
      isDeleted: false,
      isArchivedByRecipient: false,
      OR: [
        // Messaggi diretti a me
        { recipientId: userId, type: MessageType.DIRECT },
        // Broadcast dell'associazione (non inviati da me)
        { type: MessageType.BROADCAST, senderId: { not: userId } },
      ],
      ...(unreadOnly && {
        // Per messaggi diretti: non letti
        // Per broadcast: non ho ricevuta di lettura
        AND: [
          {
            OR: [
              { type: MessageType.DIRECT, isRead: false },
              {
                type: MessageType.BROADCAST,
                readReceipts: { none: { userId } },
              },
            ],
          },
        ],
      }),
    };

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: whereCondition,
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
          },
          readReceipts: {
            where: { userId },
            select: { readAt: true },
          },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.message.count({ where: whereCondition }),
    ]);

    // Aggiungi campo isRead calcolato per i broadcast
    const messagesWithReadStatus = messages.map((msg) => ({
      ...msg,
      isRead:
        msg.type === MessageType.BROADCAST
          ? msg.readReceipts.length > 0
          : msg.isRead,
    }));

    return {
      messages: messagesWithReadStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Ottieni messaggi inviati dall'utente
   */
  static async getSentMessages(
    userId: string,
    tenantId: string,
    options: { page?: number; limit?: number } = {}
  ) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          senderId: userId,
          tenantId,
          isDeleted: false,
          isArchivedBySender: false,
        },
        include: {
          recipient: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
          },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.message.count({
        where: {
          senderId: userId,
          tenantId,
          isDeleted: false,
          isArchivedBySender: false,
        },
      }),
    ]);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Ottieni un singolo messaggio con thread di risposte
   */
  static async getMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        recipient: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        replies: {
          where: { isDeleted: false },
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        parent: {
          select: { id: true, subject: true },
        },
      },
    });

    if (!message) {
      throw new Error("Message not found");
    }

    // Verifica accesso: deve essere mittente, destinatario o (per broadcast) stesso tenant
    const canAccess =
      message.senderId === userId ||
      message.recipientId === userId ||
      message.type === MessageType.BROADCAST;

    if (!canAccess) {
      throw new Error("Access denied to this message");
    }

    // Segna come letto se sono il destinatario
    if (message.recipientId === userId && !message.isRead) {
      await prisma.message.update({
        where: { id: messageId },
        data: { isRead: true, readAt: new Date() },
      });
    }

    // Per broadcast, crea/aggiorna ricevuta di lettura
    if (message.type === MessageType.BROADCAST && message.senderId !== userId) {
      await prisma.messageReadReceipt.upsert({
        where: {
          messageId_userId: { messageId, userId },
        },
        create: { messageId, userId },
        update: { readAt: new Date() },
      });
    }

    return message;
  }

  /**
   * Segna un messaggio come letto
   */
  static async markAsRead(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error("Message not found");
    }

    if (message.type === MessageType.BROADCAST) {
      // Per broadcast, usa MessageReadReceipt
      await prisma.messageReadReceipt.upsert({
        where: {
          messageId_userId: { messageId, userId },
        },
        create: { messageId, userId },
        update: { readAt: new Date() },
      });
    } else if (message.recipientId === userId) {
      // Per messaggi diretti
      await prisma.message.update({
        where: { id: messageId },
        data: { isRead: true, readAt: new Date() },
      });
    }

    return { success: true };
  }

  /**
   * Archivia un messaggio
   */
  static async archiveMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error("Message not found");
    }

    const updateData: Record<string, boolean> = {};

    if (message.senderId === userId) {
      updateData.isArchivedBySender = true;
    }
    if (message.recipientId === userId) {
      updateData.isArchivedByRecipient = true;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("Cannot archive this message");
    }

    await prisma.message.update({
      where: { id: messageId },
      data: updateData,
    });

    return { success: true };
  }

  /**
   * Elimina un messaggio (soft delete)
   */
  static async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error("Message not found");
    }

    // Solo il mittente puo' eliminare definitivamente
    if (message.senderId !== userId) {
      throw new Error("Only sender can delete messages");
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });

    return { success: true };
  }

  /**
   * Conta messaggi non letti
   */
  static async getUnreadCount(userId: string, tenantId: string) {
    // Conta messaggi diretti non letti
    const directUnread = await prisma.message.count({
      where: {
        recipientId: userId,
        tenantId,
        type: MessageType.DIRECT,
        isRead: false,
        isDeleted: false,
      },
    });

    // Conta broadcast non letti (senza ricevuta di lettura)
    const allBroadcasts = await prisma.message.findMany({
      where: {
        tenantId,
        type: MessageType.BROADCAST,
        senderId: { not: userId },
        isDeleted: false,
      },
      select: {
        id: true,
        readReceipts: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    const broadcastUnread = allBroadcasts.filter(
      (b) => b.readReceipts.length === 0
    ).length;

    return {
      direct: directUnread,
      broadcast: broadcastUnread,
      total: directUnread + broadcastUnread,
    };
  }

  /**
   * Ottieni lista iscritti per invio messaggi (solo admin)
   */
  static async getRecipientsList(tenantId: string, senderId: string) {
    const members = await prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        id: { not: senderId },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        role: true,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return members;
  }
}

export default MessageService;
