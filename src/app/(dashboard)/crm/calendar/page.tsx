import { getLeads } from "@/server/actions/leads";
import { Lead } from "@/server/db/schema";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, addDays, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const leads: any[] = await getLeads();

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Get leads with follow-ups
  const leadsWithFollowUp = leads.filter((l: any) => l.followUpDate);
  const overdueCount = leadsWithFollowUp.filter((l: any) => {
    const date = new Date(l.followUpDate);
    date.setHours(0, 0, 0, 0);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return date < todayStart;
  }).length;

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Calendário</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {format(today, "MMMM yyyy", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase())}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-indigo-500"></div>
            <span className="text-slate-600 dark:text-slate-400">Novos Leads</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-sky-500"></div>
            <span className="text-slate-600 dark:text-slate-400">Follow-ups</span>
          </div>
          {overdueCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              ⚠️ {overdueCount} atrasado{overdueCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
          {weekDays.map((day) => (
            <div key={day} className="py-3 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
          {days.map((day: Date, dayIdx: number) => {
            // New leads created on this day
            const dayLeads = leads.filter((l: any) => isSameDay(new Date(l.createdAt), day));
            // Follow-ups scheduled for this day
            const dayFollowUps = leads.filter((l: any) => l.followUpDate && isSameDay(new Date(l.followUpDate), day));
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, today);

            return (
              <div
                key={day.toString()}
                className={cn(
                  "min-h-[100px] border-b border-r border-slate-200 dark:border-slate-800 p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                  !isCurrentMonth && "bg-slate-50/50 dark:bg-slate-900/50 text-slate-400",
                  (dayIdx + 1) % 7 === 0 && "border-r-0" // Remove right border for last column
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full",
                    isToday && "bg-indigo-600 text-white"
                  )}>
                    {format(day, "d")}
                  </span>
                  <div className="flex gap-1">
                    {dayLeads.length > 0 && (
                      <span className="text-xs text-indigo-500 font-medium">
                        {dayLeads.length}L
                      </span>
                    )}
                    {dayFollowUps.length > 0 && (
                      <span className="text-xs text-sky-500 font-medium">
                        {dayFollowUps.length}F
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 max-h-[80px] overflow-y-auto">
                  {/* Follow-ups first (more important or sorted by date) */}
                  {dayFollowUps
                    .sort((a: any, b: any) => new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime())
                    .slice(0, 3)
                    .map((lead: Lead) => {
                      const fDate = new Date(lead.followUpDate!);
                      fDate.setHours(0, 0, 0, 0);
                      const fNow = new Date();
                      fNow.setHours(0, 0, 0, 0);

                      let badgeClass = "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800";

                      if (fDate < fNow) {
                        badgeClass = "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
                      } else if (fDate.getTime() === fNow.getTime()) {
                        badgeClass = "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
                      }

                      return (
                        <div key={`fu-${lead.id}`} className={cn("text-xs p-1 rounded border truncate flex items-center gap-1", badgeClass)}>
                          <Clock className="h-3 w-3 shrink-0" /> {lead.name}
                        </div>
                      );
                    })}
                  {/* New leads */}
                  {dayLeads.slice(0, 2).map((lead: Lead) => (
                    <div key={lead.id} className="text-xs p-1 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 truncate">
                      {lead.name}
                    </div>
                  ))}
                  {(dayLeads.length + dayFollowUps.length) > 5 && (
                    <span className="text-[10px] text-slate-400">+{dayLeads.length + dayFollowUps.length - 5} mais</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
