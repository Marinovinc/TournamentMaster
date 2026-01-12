/**
 * =============================================================================
 * NOTIFICATION SERVICE
 * =============================================================================
 * Gestione notifiche in-app, email alerts e reminder automatici
 * =============================================================================
 */

import { PrismaClient, NotificationType, NotificationChannel } from "@prisma/client";
import nodemailer from "nodemailer";
import { config } from "../config";

const prisma = new PrismaClient();

// Email transporter (configurabile via env)
const transporter = nodemailer.createTransport({
  host: config.smtp?.host || "smtp.gmail.com",
  port: config.smtp?.port || 587,
  secure: false,
  auth: {
    user: config.smtp?.user || "",
    pass: config.smtp?.pass || "",
  },
});

interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  body: string;
  userId: string;
  tenantId?: string;
  icon?: string;
  actionUrl?: string;
  tournamentId?: string;
  teamId?: string;
  catchId?: string;
  messageId?: string;
  channel?: NotificationChannel;
  scheduledFor?: Date;
  sendEmail?: boolean;
}

interface NotificationWithMeta {
  id: string;
  type: string;
  title: string;
  body: string;
  icon: string | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: Date;
  tournamentId: string | null;
}

export class NotificationService {
  /**
   * Crea una nuova notifica
   */
  static async create(input: CreateNotificationInput): Promise<NotificationWithMeta> {
    const notification = await prisma.notification.create({
      data: {
        type: input.type,
        title: input.title,
        body: input.body,
        userId: input.userId,
        tenantId: input.tenantId,
        icon: input.icon,
        actionUrl: input.actionUrl,
        tournamentId: input.tournamentId,
        teamId: input.teamId,
        catchId: input.catchId,
        messageId: input.messageId,
        channel: input.channel || "IN_APP",
        scheduledFor: input.scheduledFor,
        sentAt: input.scheduledFor ? null : new Date(),
      },
    });

    // Invia email se richiesto e configurato
    if (input.sendEmail && config.smtp?.user) {
      await this.sendEmailNotification(notification.id, input.userId);
    }

    return notification;
  }

  /**
   * Crea notifiche bulk per più utenti
   */
  static async createBulk(
    userIds: string[],
    input: Omit<CreateNotificationInput, "userId">
  ): Promise<number> {
    const notifications = userIds.map((userId) => ({
      type: input.type,
      title: input.title,
      body: input.body,
      userId,
      tenantId: input.tenantId,
      icon: input.icon,
      actionUrl: input.actionUrl,
      tournamentId: input.tournamentId,
      channel: input.channel || ("IN_APP" as NotificationChannel),
      sentAt: new Date(),
    }));

    const result = await prisma.notification.createMany({
      data: notifications,
    });

    return result.count;
  }

  /**
   * Ottiene le notifiche di un utente
   */
  static async getUserNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
      type?: NotificationType;
    } = {}
  ) {
    const { unreadOnly = false, limit = 50, offset = 0, type } = options;

    const where: any = {
      userId,
      isArchived: false,
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, isRead: false, isArchived: false },
      }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      hasMore: offset + notifications.length < total,
    };
  }

  /**
   * Segna notifica come letta
   */
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });

    return result.count > 0;
  }

  /**
   * Segna tutte le notifiche come lette
   */
  static async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return result.count;
  }

  /**
   * Archivia notifica
   */
  static async archive(notificationId: string, userId: string): Promise<boolean> {
    const result = await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isArchived: true },
    });

    return result.count > 0;
  }

  /**
   * Elimina notifiche vecchie (cleanup)
   */
  static async cleanupOld(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    });

    return result.count;
  }

  /**
   * Conta notifiche non lette
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false, isArchived: false },
    });
  }

  // ==========================================================================
  // PREFERENZE NOTIFICHE
  // ==========================================================================

  /**
   * Ottiene preferenze notifiche utente
   */
  static async getPreferences(userId: string) {
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Crea preferenze default se non esistono
    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return prefs;
  }

  /**
   * Aggiorna preferenze notifiche
   */
  static async updatePreferences(
    userId: string,
    data: {
      tournamentReminders?: boolean;
      catchUpdates?: boolean;
      rankingChanges?: boolean;
      penaltyAlerts?: boolean;
      messageNotifications?: boolean;
      systemAlerts?: boolean;
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      reminderDaysBefore?: number;
      digestEnabled?: boolean;
      digestTime?: string;
      quietHoursEnabled?: boolean;
      quietHoursStart?: string;
      quietHoursEnd?: string;
    }
  ) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  // ==========================================================================
  // NOTIFICHE SPECIFICHE
  // ==========================================================================

  /**
   * Notifica cattura validata
   */
  static async notifyCatchValidated(
    userId: string,
    catchId: string,
    tournamentId: string,
    status: "APPROVED" | "REJECTED",
    weight: number,
    reviewNotes?: string
  ) {
    const isApproved = status === "APPROVED";

    return this.create({
      type: "CATCH_VALIDATED",
      title: isApproved ? "Cattura Approvata!" : "Cattura Rifiutata",
      body: isApproved
        ? `La tua cattura di ${weight} kg e stata approvata e aggiunta alla classifica.`
        : `La tua cattura di ${weight} kg e stata rifiutata. ${reviewNotes || ""}`,
      userId,
      catchId,
      tournamentId,
      icon: isApproved ? "check-circle" : "x-circle",
      actionUrl: `/dashboard/tournaments/${tournamentId}`,
      sendEmail: true,
    });
  }

  /**
   * Notifica cambio classifica
   */
  static async notifyRankingChange(
    userId: string,
    tournamentId: string,
    oldRank: number,
    newRank: number,
    tournamentName: string
  ) {
    const improved = newRank < oldRank;

    return this.create({
      type: "RANKING_CHANGE",
      title: improved ? "Sei salito in classifica!" : "Aggiornamento Classifica",
      body: improved
        ? `Sei passato dalla posizione #${oldRank} alla #${newRank} in "${tournamentName}"!`
        : `La tua posizione in "${tournamentName}" e cambiata: ora sei #${newRank}.`,
      userId,
      tournamentId,
      icon: improved ? "trending-up" : "bar-chart",
      actionUrl: `/dashboard/tournaments/${tournamentId}`,
    });
  }

  /**
   * Notifica penalita
   */
  static async notifyPenalty(
    userId: string,
    tournamentId: string,
    penaltyType: string,
    points: number,
    reason: string
  ) {
    return this.create({
      type: "PENALTY_ISSUED",
      title: "Penalita Ricevuta",
      body: `Hai ricevuto una penalita di ${points} punti per: ${reason}`,
      userId,
      tournamentId,
      icon: "alert-triangle",
      actionUrl: `/dashboard/tournaments/${tournamentId}/penalties`,
      sendEmail: true,
    });
  }

  /**
   * Notifica iscrizione confermata
   */
  static async notifyRegistrationConfirmed(
    userId: string,
    tournamentId: string,
    tournamentName: string,
    startDate: Date
  ) {
    const formattedDate = startDate.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return this.create({
      type: "REGISTRATION_CONFIRMED",
      title: "Iscrizione Confermata!",
      body: `La tua iscrizione a "${tournamentName}" e stata confermata. Il torneo inizia il ${formattedDate}.`,
      userId,
      tournamentId,
      icon: "check",
      actionUrl: `/dashboard/tournaments/${tournamentId}`,
      sendEmail: true,
    });
  }

  /**
   * Notifica reminder torneo
   */
  static async notifyTournamentReminder(
    userId: string,
    tournamentId: string,
    tournamentName: string,
    eventType: "REGISTRATION_CLOSING" | "STARTING_SOON" | "STARTING_TODAY",
    date: Date
  ) {
    const messages = {
      REGISTRATION_CLOSING: {
        title: "Iscrizioni in Chiusura",
        body: `Le iscrizioni a "${tournamentName}" chiudono domani! Iscriviti ora per non perdere l'opportunita.`,
      },
      STARTING_SOON: {
        title: "Torneo in Arrivo",
        body: `"${tournamentName}" inizia tra 2 giorni. Prepara la tua attrezzatura!`,
      },
      STARTING_TODAY: {
        title: "Il Torneo Inizia Oggi!",
        body: `"${tournamentName}" inizia oggi! In bocca al lupo e buona pesca!`,
      },
    };

    const msg = messages[eventType];

    return this.create({
      type: "TOURNAMENT_REMINDER",
      title: msg.title,
      body: msg.body,
      userId,
      tournamentId,
      icon: "calendar",
      actionUrl: `/dashboard/tournaments/${tournamentId}`,
      sendEmail: true,
    });
  }

  /**
   * Invia notifiche a tutti gli iscritti di un torneo
   */
  static async notifyAllParticipants(
    tournamentId: string,
    title: string,
    body: string,
    type: NotificationType = "SYSTEM_ALERT"
  ) {
    // Trova tutti gli utenti iscritti al torneo
    const registrations = await prisma.tournamentRegistration.findMany({
      where: { tournamentId, status: "CONFIRMED" },
      select: { userId: true },
    });

    const userIds = registrations.map((r) => r.userId);

    if (userIds.length === 0) return 0;

    return this.createBulk(userIds, {
      type,
      title,
      body,
      tournamentId,
      icon: "bell",
      actionUrl: `/dashboard/tournaments/${tournamentId}`,
    });
  }

  // ==========================================================================
  // EMAIL
  // ==========================================================================

  /**
   * Invia email per notifica
   */
  private static async sendEmailNotification(
    notificationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Verifica preferenze utente
      const prefs = await this.getPreferences(userId);
      if (!prefs.emailEnabled) return false;

      // Ottieni dati utente e notifica
      const [user, notification] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, firstName: true },
        }),
        prisma.notification.findUnique({ where: { id: notificationId } }),
      ]);

      if (!user || !notification || !config.smtp?.user) return false;

      // Invia email
      await transporter.sendMail({
        from: `"TournamentMaster" <${config.smtp.user}>`,
        to: user.email,
        subject: notification.title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #0066CC; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">TournamentMaster</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <p>Ciao ${user.firstName},</p>
              <h2 style="color: #333;">${notification.title}</h2>
              <p style="color: #666; line-height: 1.6;">${notification.body}</p>
              ${
                notification.actionUrl
                  ? `<a href="${process.env.FRONTEND_URL || "http://localhost:3000"}${notification.actionUrl}"
                      style="display: inline-block; background: #0066CC; color: white; padding: 12px 24px;
                             text-decoration: none; border-radius: 5px; margin-top: 20px;">
                      Vai alla Dashboard
                    </a>`
                  : ""
              }
            </div>
            <div style="padding: 15px; text-align: center; color: #999; font-size: 12px;">
              <p>Questa email e stata inviata automaticamente da TournamentMaster.</p>
              <p>Per modificare le preferenze notifiche, vai nelle impostazioni del tuo profilo.</p>
            </div>
          </div>
        `,
      });

      // Aggiorna stato email
      await prisma.notification.update({
        where: { id: notificationId },
        data: { emailSent: true, emailSentAt: new Date() },
      });

      return true;
    } catch (error) {
      console.error("Error sending email notification:", error);
      return false;
    }
  }

  // ==========================================================================
  // SCHEDULER (per reminder automatici)
  // ==========================================================================

  /**
   * Processa reminder tornei programmati
   * Da chiamare periodicamente (es. ogni ora via cron)
   */
  static async processScheduledReminders(): Promise<number> {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const twoDaysFromNow = new Date(now);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    // Trova tornei con iscrizioni che chiudono domani
    const closingTournaments = await prisma.tournament.findMany({
      where: {
        registrationCloses: {
          gte: now,
          lte: tomorrow,
        },
        status: "REGISTRATION_OPEN",
      },
      include: {
        registrations: {
          where: { status: "CONFIRMED" },
          select: { userId: true },
        },
      },
    });

    // Trova tornei che iniziano tra 2 giorni
    const startingSoonTournaments = await prisma.tournament.findMany({
      where: {
        startDate: {
          gte: tomorrow,
          lte: twoDaysFromNow,
        },
        status: { in: ["REGISTRATION_OPEN", "REGISTRATION_CLOSED"] },
      },
      include: {
        registrations: {
          where: { status: "CONFIRMED" },
          select: { userId: true },
        },
      },
    });

    // Trova tornei che iniziano oggi
    const startingTodayTournaments = await prisma.tournament.findMany({
      where: {
        startDate: {
          gte: new Date(now.setHours(0, 0, 0, 0)),
          lte: new Date(now.setHours(23, 59, 59, 999)),
        },
        status: { in: ["REGISTRATION_CLOSED", "ONGOING"] },
      },
      include: {
        registrations: {
          where: { status: "CONFIRMED" },
          select: { userId: true },
        },
      },
    });

    let count = 0;

    // Invia reminder iscrizioni in chiusura
    for (const t of closingTournaments) {
      for (const r of t.registrations) {
        await this.notifyTournamentReminder(
          r.userId,
          t.id,
          t.name,
          "REGISTRATION_CLOSING",
          t.registrationCloses
        );
        count++;
      }
    }

    // Invia reminder torneo in arrivo
    for (const t of startingSoonTournaments) {
      for (const r of t.registrations) {
        await this.notifyTournamentReminder(
          r.userId,
          t.id,
          t.name,
          "STARTING_SOON",
          t.startDate
        );
        count++;
      }
    }

    // Invia reminder torneo oggi
    for (const t of startingTodayTournaments) {
      for (const r of t.registrations) {
        await this.notifyTournamentReminder(
          r.userId,
          t.id,
          t.name,
          "STARTING_TODAY",
          t.startDate
        );
        count++;
      }
    }

    return count;
  }
}

export default NotificationService;
