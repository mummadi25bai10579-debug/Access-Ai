import React from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  GraduationCap,
  Clock,
  ArrowRight,
  Inbox,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface RecentActivityProps {
  activities?: any[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities = [] }) => {
  return (
    <Card className="h-full flex flex-col justify-between">
      <div>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-base sm:text-lg text-foreground">Recent Activity</h2>
          </div>
          <Badge variant="outline" className="text-xs">
            Audit Trail
          </Badge>
        </CardHeader>

        <CardContent className="space-y-3.5">
          {activities.length === 0 ? (
            <div className="py-8 text-center space-y-2 text-muted">
              <Inbox className="w-8 h-8 mx-auto text-muted/60" />
              <p className="text-xs sm:text-sm font-medium">No recent activities recorded yet.</p>
              <p className="text-xs text-muted max-w-xs mx-auto">
                Actions like document uploads, scheme evaluations, and quiz completions will be logged here.
              </p>
            </div>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-accent text-primary shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <h3 className="font-semibold text-xs sm:text-sm text-foreground truncate">
                    {act.title}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed line-clamp-2">
                    {act.description}
                  </p>
                  <span className="text-[10px] text-muted font-mono block pt-1">
                    {act.timestamp}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </div>

      <div className="p-4 border-t border-border">
        <Link
          href="/documents"
          className="text-xs sm:text-sm font-semibold text-primary hover:underline flex items-center justify-center gap-1"
        >
          <span>View all documents</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
};
