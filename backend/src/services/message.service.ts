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
   * Ottieni l'admin del tenant (per permettere agli utenti di inviare messaggi)
   */
  static async getTenantAdmin(tenantId: string) {
    const admin = await prisma.user.findFirst({
      where: {
        tenantId,
        role: { in: ["TENANT_ADMIN", "PRESIDENT"] },
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: {
        role: "asc", // TENANT_ADMIN viene prima di PRESIDENT alfabeticamente
      },
    });

    return admin;
  }

  /**
   * Ottieni lista ID utenti che hanno inviato messaggi non letti all'admin
   */
  static async getUsersWithUnreadMessages(adminUserId: string, tenantId: string): Promise<string[]> {
    const unreadMessages = await prisma.message.findMany({
      where: {
        recipientId: adminUserId,
        tenantId,
        type: MessageType.DIRECT,
        isRead: false,
        isDeleted: false,
      },
      select: {
        senderId: true,
      },
      distinct: ["senderId"],
    });

    return unreadMessages.map((m) => m.senderId);
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

  /**
   * Invia messaggio broadcast ai partecipanti di un torneo specifico
   */
  static async sendTournamentBroadcast(input: {
    senderId: string;
    tournamentId: string;
    tenantId: string;
    subject: string;
    body: string;
    priority?: MessagePriority;
    targetGroup?: "all" | "teams" | "staff";
  }) {
    // Verifica che il mittente sia autorizzato
    const sender = await prisma.user.findUnique({
      where: { id: input.senderId },
    });

    if (!sender) {
      throw new Error("Sender not found");
    }

    const adminRoles = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PRESIDENT, UserRole.ORGANIZER];
    if (!adminRoles.includes(sender.role as UserRole)) {
      throw new Error("Only administrators can send tournament broadcasts");
    }

    // Verifica il torneo
    const tournament = await prisma.tournament.findUnique({
      where: { id: input.tournamentId },
      include: {
        registrations: {
          where: { status: "CONFIRMED" },
          include: { user: { select: { id: true } } },
        },
        staff: {
          include: { user: { select: { id: true } } },
        },
      },
    });

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Determina i destinatari in base al targetGroup
    let recipientIds: string[] = [];

    if (input.targetGroup === "staff") {
      recipientIds = tournament.staff.map((s) => s.user.id);
    } else if (input.targetGroup === "teams") {
      recipientIds = tournament.registrations.map((r) => r.user.id);
    } else {
      // "all" - sia partecipanti che staff
      const teamIds = tournament.registrations.map((r) => r.user.id);
      const staffIds = tournament.staff.map((s) => s.user.id);
      recipientIds = [...new Set([...teamIds, ...staffIds])];
    }

    // Rimuovi il mittente dalla lista
    recipientIds = recipientIds.filter((id) => id !== input.senderId);

    if (recipientIds.length === 0) {
      throw new Error("No recipients found for this tournament");
    }

    // Crea il messaggio broadcast con riferimento al torneo
    const message = await prisma.message.create({
      data: {
        type: MessageType.BROADCAST,
        priority: input.priority || MessagePriority.NORMAL,
        subject: input.subject,
        body: input.body,
        senderId: input.senderId,
        recipientId: null,
        tenantId: input.tenantId,
        tournamentId: input.tournamentId,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        tournament: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      message,
      recipientCount: recipientIds.length,
    };
  }

  /**
   * Ottieni storico messaggi di un torneo
   */
  static async getTournamentMessages(
    tournamentId: string,
    options: { page?: number; limit?: number } = {}
  ) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          tournamentId,
          isDeleted: false,
        },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
          },
          _count: { select: { readReceipts: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.message.count({
        where: {
          tournamentId,
          isDeleted: false,
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
   * Template messaggi predefiniti per tornei
   */
  static getMessageTemplates() {
    return [
      {
        id: "registration_confirmed",
        name: "Conferma Iscrizione",
        subject: "Iscrizione confermata - {{tournamentName}}",
        body: `Gentile {{participantName}},

La tua iscrizione al torneo "{{tournamentName}}" è stata confermata.

Data: {{startDate}}
Luogo: {{location}}

Ti aspettiamo!

Cordiali saluti,
L'organizzazione`,
      },
      {
        id: "tournament_reminder",
        name: "Promemoria Torneo",
        subject: "Promemoria: {{tournamentName}} inizia tra {{days}} giorni",
        body: `Gentile partecipante,

Ti ricordiamo che il torneo "{{tournamentName}}" inizierà tra {{days}} giorni.

Data inizio: {{startDate}}
Briefing: {{briefingTime}}
Luogo ritrovo: {{meetingPoint}}

Non dimenticare di portare:
- Documento d'identità
- Tessera FIPSAS (se richiesta)
- Attrezzatura conforme al regolamento

A presto!`,
      },
      {
        id: "tournament_started",
        name: "Torneo Iniziato",
        subject: "Il torneo {{tournamentName}} è iniziato!",
        body: `Il torneo "{{tournamentName}}" è ufficialmente iniziato!

Buona pesca a tutti i partecipanti.

Ricordate:
- Rispettate le zone di pesca autorizzate
- Seguite le indicazioni degli ispettori
- In caso di emergenza contattate la direzione gara

In bocca al lupo!`,
      },
      {
        id: "tournament_completed",
        name: "Torneo Concluso",
        subject: "Risultati finali - {{tournamentName}}",
        body: `Gentili partecipanti,

Il torneo "{{tournamentName}}" si è concluso.

Complimenti a tutti i partecipanti!

I risultati ufficiali sono disponibili nella sezione classifiche dell'app.

Grazie per aver partecipato e arrivederci al prossimo torneo!`,
      },
      {
        id: "inspector_assignment",
        name: "Assegnazione Ispettore",
        subject: "Assegnazione ispettore - {{tournamentName}}",
        body: `Gentile {{inspectorName}},

Sei stato assegnato come ispettore di bordo per il torneo "{{tournamentName}}".

Barca assegnata: {{boatName}}
Equipaggio: {{teamName}}

Ti preghiamo di presentarti al briefing pre-gara alle ore {{briefingTime}}.

Per qualsiasi domanda contatta la direzione gara.`,
      },
      {
        id: "custom",
        name: "Messaggio Personalizzato",
        subject: "",
        body: "",
      },
    ];
  }
}

export default MessageService;
