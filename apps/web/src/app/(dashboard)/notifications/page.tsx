"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  Bell,
  Clock,
  ExternalLink,
  Check,
  Trash2,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { ApiClient } from "@/lib/api/client";
import { formatDate } from "@/lib/utils/format";

export default function NotificationsPage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const token = await getToken();
      const data = await ApiClient.listNotifications(token);
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (isLoaded) {
      fetchNotifications();
    }
  }, [isLoaded, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read && !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    const isRead = Boolean(n.is_read ?? n.isRead);
    const type = (n.type || "").toLowerCase();
    if (filterType === "all") return true;
    if (filterType === "unread") return !isRead;
    return type === filterType;
  });

  const markAllAsRead = async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      const unreadList = notifications.filter((n) => !n.is_read && !n.isRead);
      await Promise.all(
        unreadList.map((n) => ApiClient.markNotificationRead(n.id, true, token))
      );
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, isRead: true }))
      );
    } catch (err: any) {
      alert(`Could not mark all as read: ${err.message}`);
    }
  };

  const toggleRead = async (id: string, currentReadStatus: boolean) => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      const newStatus = !currentReadStatus;
      await ApiClient.markNotificationRead(id, newStatus, token);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: newStatus, isRead: newStatus } : n))
      );
    } catch (err: any) {
      alert(`Could not update notification: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      await ApiClient.deleteNotification(id, token);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      alert(`Could not delete notification: ${err.message}`);
    }
  };

  const getPriorityBadge = (priority?: string) => {
    const p = (priority || "").toLowerCase();
    if (p === "high") return <Badge variant="danger">HIGH PRIORITY</Badge>;
    if (p === "medium") return <Badge variant="warning">MEDIUM</Badge>;
    return <Badge variant="outline">NOTICE</Badge>;
  };

  return (
    <PullToRefresh onRefresh={fetchNotifications} className="space-y-8">
      <PageHeader
        title="Notifications & Citizen Alerts"
        description="Stay updated with critical application deadlines, automated eligibility matches, and course progress milestones."
        badge={
          unreadCount > 0 ? (
            <Badge variant="primary">{unreadCount} Unread Alerts</Badge>
          ) : (
            <Badge variant="success">All Caught Up</Badge>
          )
        }
        actions={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Check className="w-4 h-4" />}
              onClick={markAllAsRead}
            >
              Mark All as Read
            </Button>
          ) : undefined
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Notifications" },
        ]}
      />

      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
          {errorMessage}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex border-b border-border text-xs sm:text-sm font-semibold gap-2 overflow-x-auto pb-1">
        {[
          { label: "All Alerts", value: "all", count: notifications.length },
          { label: "Unread", value: "unread", count: unreadCount },
          { label: "Deadlines", value: "deadline" },
          { label: "Eligibility", value: "eligibility" },
          { label: "Opportunities", value: "opportunity" },
          { label: "EduBridge", value: "course" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilterType(tab.value)}
            className={`pb-3 px-3.5 border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              filterType === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span className="px-2 py-0.5 rounded-full bg-card border border-border text-xs font-mono">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {isLoading ? (
        <ListSkeleton count={5} />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          title={!isSignedIn ? "Sign In to View Alerts" : "No Notifications"}
          description={
            !isSignedIn
              ? "Citizen notifications and deadlines are linked to your authenticated account."
              : filterType !== "all"
                ? "You do not have any notifications matching this filter."
                : "No active notifications or deadlines at this time."
          }
          actionLabel={filterType !== "all" ? "Show All Alerts" : undefined}
          onAction={filterType !== "all" ? () => setFilterType("all") : undefined}
        />
      ) : (
        <div className="space-y-3.5">
          {filteredNotifications.map((n, idx) => {
            const isRead = Boolean(n.is_read ?? n.isRead);
            const title = n.title;
            const message = n.message || n.body || "";
            const tag = n.tag || n.type || "System";
            const priority = n.priority || "normal";
            const timeStr = formatDate(n.created_at);
            const actionUrl = n.action_url || n.actionUrl || "/dashboard";
            const actionLabel = n.action_label || n.actionLabel || "View";

            return (
              <Card
                key={n.id || `notif-${idx}`}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  !isRead ? "border-primary/60 ring-1 ring-primary/30" : "border-border"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${
                      !isRead ? "bg-primary" : "bg-transparent border border-border"
                    }`}
                    aria-hidden="true"
                  />

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm sm:text-base text-foreground">
                        {title}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                      {getPriorityBadge(priority)}
                    </div>
                    <p className="text-xs sm:text-sm text-muted leading-relaxed">
                      {message}
                    </p>
                    <div className="text-xs text-muted flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeStr}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                  <Link href={actionUrl}>
                    <Button
                      variant="primary"
                      size="sm"
                      rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                    >
                      {actionLabel}
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleRead(n.id, isRead)}
                    title={isRead ? "Mark as unread" : "Mark as read"}
                  >
                    {isRead ? "Mark Unread" : "Mark Read"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => handleDelete(n.id)}
                    aria-label={`Dismiss notification: ${title}`}
                    className="p-2 rounded-lg text-muted hover:text-rose-400 hover:bg-muted border border-border transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PullToRefresh>
  );
}
