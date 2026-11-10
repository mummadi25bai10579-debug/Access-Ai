import React from "react";
import Link from "next/link";
import { Calendar, Clock, ArrowRight, Inbox } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface UpcomingDeadlinesProps {
  deadlines?: any[];
}

export const UpcomingDeadlines: React.FC<UpcomingDeadlinesProps> = ({ deadlines = [] }) => {
  return (
    <Card className="h-full flex flex-col justify-between">
      <div>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-base sm:text-lg text-foreground">Upcoming Deadlines</h2>
          </div>
          <Badge variant="outline" className="text-xs">
            Time Sensitive
          </Badge>
        </CardHeader>

        <CardContent className="space-y-3">
          {deadlines.length === 0 ? (
            <div className="py-8 text-center space-y-2 text-muted">
              <Inbox className="w-8 h-8 mx-auto text-muted/60" />
              <p className="text-xs sm:text-sm font-medium">No impending deadlines found.</p>
              <p className="text-xs text-muted max-w-xs mx-auto">
                Deadlines for active scholarships, welfare schemes, and job openings will appear here.
              </p>
            </div>
          ) : (
            deadlines.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <h3 className="font-semibold text-xs sm:text-sm text-foreground truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted">{item.category}</p>
                  <span className="text-[10px] text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span>{item.date}</span>
                  </span>
                </div>

                <Badge variant={item.isUrgent ? "danger" : "warning"} className="text-xs shrink-0 font-mono">
                  {item.daysLeft}d left
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </div>

      <div className="p-4 border-t border-border">
        <Link
          href="/schemes"
          className="text-xs sm:text-sm font-semibold text-primary hover:underline flex items-center justify-center gap-1"
        >
          <span>Explore all welfare schemes</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
};
