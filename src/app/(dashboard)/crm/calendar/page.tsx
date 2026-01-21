import { getLeads } from "@/server/actions/leads";
import { Lead } from "@/server/db/schema";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, addDays, startOfWeek, endOfWeek, endOfDay } from "date-fns";
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
    <div className="p-6 h-full flex flex-col overflow-y-auto custom-scrollbar gap-8">
      <div className="flex-none">
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
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col h-[600px]">
          {/* Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 flex-none">
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
                    </div>
                  </div>

                  <div className="space-y-1 max-h-[80px] overflow-y-auto">
                    {/* New leads */}
                    {dayLeads.slice(0, 3).map((lead: Lead) => (
                      <div key={lead.id} className="text-xs p-1 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 truncate">
                        {lead.name}
                      </div>
                    ))}
                    {dayLeads.length > 3 && (
                      <span className="text-[10px] text-slate-400">+{dayLeads.length - 3} mais</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Follow-ups List Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
        {/* Overdue */}
        <div className="bg-slate-900/95 text-white p-4 rounded-xl border border-slate-800 shadow-xl">
          <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4" /> Atrasados
            <span className="text-xs bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded ml-auto">{overdueCount}</span>
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {leadsWithFollowUp
              .filter((l: any) => new Date(l.followUpDate) < new Date(new Date().setHours(0, 0, 0, 0)))
              .map((lead: any) => (
                <div key={lead.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 flex justify-between items-center group hover:bg-slate-800 transition-colors">
                  <div>
                    <div className="font-medium text-sm text-slate-200">{lead.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {format(new Date(lead.followUpDate), "dd/MM")} • {format(new Date(lead.followUpDate), "HH:mm")}
                    </div>
                  </div>
                  {lead.whatsapp && (
                    <a href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 p-2 rounded-full hover:bg-green-500/10 transition-colors">
                      <span className="sr-only">Whatsapp</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                    </a>
                  )}
                </div>
              ))}
            {leadsWithFollowUp.filter((l: any) => new Date(l.followUpDate) < new Date(new Date().setHours(0, 0, 0, 0))).length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-4">Nenhum atrasado</p>
            )}
          </div>
        </div>

        {/* Today */}
        <div className="bg-slate-900/95 text-white p-4 rounded-xl border border-slate-800 shadow-xl">
          <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4" /> Para Hoje
            <span className="text-xs bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded ml-auto">
              {leadsWithFollowUp.filter((l: any) => isSameDay(new Date(l.followUpDate), new Date())).length}
            </span>
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {leadsWithFollowUp
              .filter((l: any) => isSameDay(new Date(l.followUpDate), new Date()))
              .map((lead: any) => (
                <div key={lead.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 flex justify-between items-center group hover:bg-slate-800 transition-colors">
                  <div>
                    <div className="font-medium text-sm text-slate-200">{lead.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {format(new Date(lead.followUpDate), "HH:mm")}
                    </div>
                  </div>
                  {lead.whatsapp && (
                    <a href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 p-2 rounded-full hover:bg-green-500/10 transition-colors">
                      <span className="sr-only">Whatsapp</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                    </a>
                  )}
                </div>
              ))}
            {leadsWithFollowUp.filter((l: any) => isSameDay(new Date(l.followUpDate), new Date())).length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-4">Nada para hoje</p>
            )}
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-slate-900/95 text-white p-4 rounded-xl border border-slate-800 shadow-xl">
          <h3 className="text-sm font-semibold text-sky-400 flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4" /> Próximos
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {leadsWithFollowUp
              .filter((l: any) => new Date(l.followUpDate) > endOfDay(new Date()))
              .sort((a: any, b: any) => new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime())
              .slice(0, 10)
              .map((lead: any) => (
                <div key={lead.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 flex justify-between items-center group hover:bg-slate-800 transition-colors">
                  <div>
                    <div className="font-medium text-sm text-slate-200">{lead.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {format(new Date(lead.followUpDate), "dd/MM")} • {format(new Date(lead.followUpDate), "HH:mm")}
                    </div>
                  </div>
                  {lead.whatsapp && (
                    <a href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 p-2 rounded-full hover:bg-green-500/10 transition-colors">
                      <span className="sr-only">Whatsapp</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                    </a>
                  )}
                </div>
              ))}
            {leadsWithFollowUp.filter((l: any) => new Date(l.followUpDate) > endOfDay(new Date())).length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-4">Sem agendamentos futuros</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
