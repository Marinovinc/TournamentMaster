"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, Archive, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  icon: string | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
  tournamentId: string | null;
}

const iconMap: Record<string, string> = {
  "check-circle": "text-green-500",
  "x-circle": "text-red-500",
  "trending-up": "text-blue-500",
  "bar-chart": "text-purple-500",
  "alert-triangle": "text-amber-500",
  calendar: "text-orange-500",
  check: "text-green-500",
  bell: "text-gray-500",
};

export function NotificationBell() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Fetch unread count on mount and periodically
  useEffect(() => {
    if (!token) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch(`${API_URL}/api/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.data.count);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [token, API_URL]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (!isOpen || !token) return;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/notifications?limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.data.notifications);
          setUnreadCount(data.data.unreadCount);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen, token, API_URL]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const archiveNotification = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/notifications/${id}/archive`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Error archiving:", error);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ora";
    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays < 7) return `${diffDays}g fa`;
    return date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-sm">Notifiche</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Segna tutte lette
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Nessuna notifica</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      !notif.isRead ? "bg-blue-50 dark:bg-blue-950/20" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          !notif.isRead ? "bg-blue-500" : "bg-transparent"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm truncate">{notif.title}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notif.body}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {notif.actionUrl && (
                            <Link
                              href={notif.actionUrl}
                              className="text-xs text-primary hover:underline"
                              onClick={() => {
                                if (!notif.isRead) markAsRead(notif.id);
                                setIsOpen(false);
                              }}
                            >
                              Visualizza
                            </Link>
                          )}
                          {!notif.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => markAsRead(notif.id)}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-red-500"
                            onClick={() => archiveNotification(notif.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/it/dashboard/notifications"
              className="text-xs text-primary hover:underline block text-center"
              onClick={() => setIsOpen(false)}
            >
              Vedi tutte le notifiche
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
