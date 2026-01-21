"use client";

import { useState, useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, ComposedChart, Line
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lead, Column } from "@/server/db/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarIcon, FilterX, TrendingUp, TrendingDown, Clock, Target, AlertTriangle, MessageSquareText, ArrowUpRight, CalendarClock } from "lucide-react";
import { format, subDays, isWithinInterval, startOfDay, endOfDay, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-xl">
                <p className="font-medium text-slate-900 dark:text-slate-100 text-sm mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <p className="text-slate-600 dark:text-slate-300 text-xs font-medium">
                        {payload[0].value} Leads
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

// --- Configuration ---
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#14b8a6'];

const DD_TO_STATE: Record<string, string> = {
    '11': 'SP', '12': 'SP', '13': 'SP', '14': 'SP', '15': 'SP', '16': 'SP', '17': 'SP', '18': 'SP', '19': 'SP',
    '21': 'RJ', '22': 'RJ', '24': 'RJ',
    '27': 'ES', '28': 'ES',
    '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG', '35': 'MG', '37': 'MG', '38': 'MG',
    '41': 'PR', '42': 'PR', '43': 'PR', '44': 'PR', '45': 'PR', '46': 'PR',
    '47': 'SC', '48': 'SC', '49': 'SC',
    '51': 'RS', '53': 'RS', '54': 'RS', '55': 'RS',
    '61': 'DF',
    '62': 'GO', '64': 'GO',
    '63': 'TO',
    '65': 'MT', '66': 'MT',
    '67': 'MS', '68': 'AC', '69': 'RO',
    '71': 'BA', '73': 'BA', '74': 'BA', '75': 'BA', '77': 'BA',
    '79': 'SE',
    '81': 'PE', '87': 'PE', '82': 'AL', '83': 'PB', '84': 'RN', '85': 'CE', '88': 'CE', '86': 'PI', '89': 'PI',
    '91': 'PA', '93': 'PA', '94': 'PA', '92': 'AM', '97': 'AM', '95': 'RR', '96': 'AP', '98': 'MA', '99': 'MA'
};

const getStateFromPhone = (phone?: string | null) => {
    if (!phone) return 'N/A';
    let clean = phone.replace(/\D/g, '');
    if (clean.length >= 12 && clean.startsWith('55')) {
        clean = clean.substring(2);
    }
    if (clean.length < 10) return 'N/A';
    const dd = clean.substring(0, 2);
    return DD_TO_STATE[dd] || 'Outros';
};

const parseValue = (val: any) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const clean = val.toString().replace(/[^\d,.-]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
};

interface AnalyticsDashboardProps {
    initialLeads: (Lead | {
        columnId?: string | null;
        id: string;
        name: string;
        organizationId: string;
        company: string | null;
        email: string | null;
        whatsapp: string | null;
        campaignSource: string | null;
        status: string;
        value: string | null;
        notes: string | null;
        position: number;
        createdAt: Date;
        updatedAt: Date | null;
        followUpDate: Date | null;
        followUpNote: string | null;
    })[];
    columns: Column[];
}

export function AnalyticsDashboard({ initialLeads, columns }: AnalyticsDashboardProps) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 90),
        to: new Date(),
    });
    const [selectedSource, setSelectedSource] = useState<string>("all");
    const [selectedState, setSelectedState] = useState<string>("all");
    const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
    const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

    const {
        filteredLeads,
        kpis,
        charts,
        sourcePerformance,
        uniqueSources,
        activitySummary
    } = useMemo(() => {
        // 1. Identify "Won" and "Lost" columns
        const wonColumnIds = columns
            .filter(c => {
                const t = c.title.toLowerCase();
                return t.includes('ganho') || t.includes('won') || t.includes('fechado') || t.includes('vendido');
            })
            .map(c => c.id);

        const lostColumnIds = columns
            .filter(c => {
                const t = c.title.toLowerCase();
                return t.includes('perdido') || t.includes('lost') || t.includes('arquivado');
            })
            .map(c => c.id);

        // 2. Filter Leads
        const filtered = initialLeads.filter(lead => {
            if (dateRange?.from) {
                const created = new Date(lead.createdAt);
                if (!isWithinInterval(created, {
                    start: startOfDay(dateRange.from),
                    end: dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from)
                })) return false;
            }
            if (selectedSource !== "all") {
                const src = lead.campaignSource || "Direto";
                if (src !== selectedSource) return false;
            }
            if (selectedState !== "all") {
                const st = getStateFromPhone(lead.whatsapp);
                if (st !== selectedState) return false;
            }
            return true;
        });

        // 3. Metadata
        const uniqueSrc = Array.from(new Set(initialLeads.map(l => l.campaignSource || "Direto"))).sort();

        // 4. Calculate KPIs
        const totalLeads = filtered.length;
        const wonLeads = filtered.filter(l => wonColumnIds.includes(l.columnId || ''));
        const lostLeads = filtered.filter(l => lostColumnIds.includes(l.columnId || ''));
        const openLeads = filtered.filter(l => !wonColumnIds.includes(l.columnId || '') && !lostColumnIds.includes(l.columnId || ''));

        const totalRevenue = wonLeads.reduce((sum, l) => sum + parseValue(l.value), 0);
        const forecastRevenue = openLeads.reduce((sum, l) => sum + parseValue(l.value), 0);

        const conversionRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0;
        const lossRate = totalLeads > 0 ? (lostLeads.length / totalLeads) * 100 : 0;
        const avgTicket = wonLeads.length > 0 ? totalRevenue / wonLeads.length : 0;

        // Ciclo Médio de Venda (Average days to close for won leads)
        // We don't have a "closed date", so we use "age" of lead as proxy
        const avgSalesCycle = wonLeads.length > 0
            ? wonLeads.reduce((sum, l) => sum + differenceInDays(new Date(), new Date(l.createdAt)), 0) / wonLeads.length
            : 0;

        // 5. Source Performance
        const srcPerfMap = new Map();
        filtered.forEach(lead => {
            const src = lead.campaignSource || "Direto";
            if (!srcPerfMap.has(src)) srcPerfMap.set(src, { source: src, leads: 0, won: 0, lost: 0, revenue: 0 });
            const entry = srcPerfMap.get(src);
            entry.leads++;
            if (wonColumnIds.includes(lead.columnId || '')) {
                entry.won++;
                entry.revenue += parseValue(lead.value);
            }
            if (lostColumnIds.includes(lead.columnId || '')) {
                entry.lost++;
            }
        });
        const sourcePerformance = Array.from(srcPerfMap.values())
            .map(p => ({ ...p, winRate: p.leads > 0 ? (p.won / p.leads) * 100 : 0 }))
            .sort((a, b) => b.revenue - a.revenue);

        // 6. Charts Data
        // A) Timeline - FIX: Sort chronologically
        const timelineMap = new Map<string, { name: string, leads: number, revenue: number, sortDate: Date }>();
        filtered.forEach(lead => {
            const d = new Date(lead.createdAt);
            const monthKey = format(d, 'yyyy-MM'); // Use sortable key
            const displayName = format(d, 'MMM/yy', { locale: ptBR });
            if (!timelineMap.has(monthKey)) {
                timelineMap.set(monthKey, { name: displayName, leads: 0, revenue: 0, sortDate: new Date(d.getFullYear(), d.getMonth(), 1) });
            }
            const entry = timelineMap.get(monthKey)!;
            entry.leads++;
            if (wonColumnIds.includes(lead.columnId || '')) entry.revenue += parseValue(lead.value);
        });
        const timelineData = Array.from(timelineMap.values())
            .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime()); // Chronological order

        // B) State
        const stateMap = new Map();
        filtered.forEach(lead => {
            const st = getStateFromPhone(lead.whatsapp);
            if (st === 'N/A') return;
            stateMap.set(st, (stateMap.get(st) || 0) + 1);
        });
        const stateData = Array.from(stateMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);

        // Daily Leads Data (New Request)
        const dailyMap = new Map<string, { date: string, leads: number, sortDate: Date }>();
        filtered.forEach(lead => {
            const d = new Date(lead.createdAt);
            const key = format(d, 'yyyy-MM-dd');
            const displayDate = format(d, 'dd/MM', { locale: ptBR });

            if (!dailyMap.has(key)) {
                dailyMap.set(key, { date: displayDate, leads: 0, sortDate: startOfDay(d) });
            }
            dailyMap.get(key)!.leads++;
        });

        // Ensure all days in range are represented if range is small, otherwise just days with data
        // For now, just sorting existing data
        const dailyData = Array.from(dailyMap.values())
            .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());

        // C) Funnel - Truncate long names
        const truncate = (str: string, max: number) => str.length > max ? str.substring(0, max) + '...' : str;
        const funnelData = columns.map(col => {
            const count = filtered.filter(l => l.columnId === col.id).length;
            return {
                name: truncate(col.title, 12),
                fullName: col.title,
                value: count,
                fill: COLORS[columns.indexOf(col) % COLORS.length]
            };
        }).filter(d => d.value > 0);

        // 7. Activity Summary with EXPANDED keyword extraction
        const leadsWithNotes = filtered.filter(l => l.notes && l.notes.trim().length > 0).length;
        const leadsWithValue = filtered.filter(l => parseValue(l.value) > 0).length;
        const leadsWithPhone = filtered.filter(l => l.whatsapp && l.whatsapp.trim().length > 0).length;
        const leadsWithSource = filtered.filter(l => l.campaignSource && l.campaignSource.trim().length > 0).length;

        // Extract keywords from notes - EXPANDED patterns
        const notesData = filtered
            .filter(l => l.notes && l.notes.trim().length > 0)
            .map(l => ({ note: l.notes!.toLowerCase(), original: l.notes!, lead: l }));

        const allNotes = notesData.map(n => n.note);

        // Status/Ação keywords
        const statusPatterns = [
            { keyword: 'interesse', label: 'Interessados', icon: '🎯' },
            { keyword: 'proposta', label: 'Proposta', icon: '📝' },
            { keyword: 'orçamento', label: 'Orçamento', icon: '💰' },
            { keyword: 'contato', label: 'Em Contato', icon: '📞' },
            { keyword: 'retornou', label: 'Retornou', icon: '↩️' },
            { keyword: 'não retorn', label: 'Sem Retorno', icon: '❌' },
            { keyword: 'fechado', label: 'Fechado', icon: '✅' },
            { keyword: 'agend', label: 'Agendamento', icon: '📅' },
            { keyword: 'video', label: 'Vídeo Call', icon: '🎥' },
            { keyword: 'conversa', label: 'Em Conversa', icon: '💬' },
            { keyword: 'whatsapp', label: 'WhatsApp', icon: '📱' },
            { keyword: 'email', label: 'Email', icon: '✉️' },
            { keyword: 'reunião', label: 'Reunião', icon: '🤝' },
            { keyword: 'follow', label: 'Follow-up', icon: '🔄' },
            { keyword: 'esperando', label: 'Aguardando', icon: '⏳' },
            { keyword: 'analis', label: 'Analisando', icon: '🔍' },
        ];

        // Sentiment/Temperature keywords
        const positiveWords = ['interessado', 'quer', 'gostou', 'fechou', 'confirmou', 'aprovou', 'sim', 'ok', 'topa', 'aceita', 'negócio'];
        const negativeWords = ['não quer', 'desistiu', 'cancelou', 'perdido', 'sem interesse', 'não tem', 'esfriou', 'sumiu', 'bloqueou'];
        const urgentWords = ['urgente', 'hoje', 'agora', 'pressa', 'rápido', 'amanhã', 'imediato'];

        const statusCounts = statusPatterns.map(p => ({
            label: p.label,
            icon: p.icon,
            count: allNotes.filter(n => n.includes(p.keyword)).length
        })).filter(k => k.count > 0).sort((a, b) => b.count - a.count);

        // Sentiment analysis
        const positiveLeads = allNotes.filter(n => positiveWords.some(w => n.includes(w))).length;
        const negativeLeads = allNotes.filter(n => negativeWords.some(w => n.includes(w))).length;
        const urgentLeads = allNotes.filter(n => urgentWords.some(w => n.includes(w))).length;
        const neutralLeads = leadsWithNotes - positiveLeads - negativeLeads;

        // Average note length (indicates engagement level)
        const avgNoteLength = leadsWithNotes > 0
            ? Math.round(notesData.reduce((sum, n) => sum + n.original.length, 0) / leadsWithNotes)
            : 0;

        // Recent notes preview (last 3)
        const recentNotesPreview = notesData
            .sort((a, b) => new Date(b.lead.createdAt).getTime() - new Date(a.lead.createdAt).getTime())
            .slice(0, 3)
            .map(n => ({
                name: n.lead.name,
                preview: n.original.substring(0, 60) + (n.original.length > 60 ? '...' : ''),
                date: format(new Date(n.lead.createdAt), 'dd/MM', { locale: ptBR })
            }));

        // Get last 7 days activity
        const last7Days = subDays(new Date(), 7);
        const last30Days = subDays(new Date(), 30);
        const recentLeads = filtered.filter(l => new Date(l.createdAt) >= last7Days).length;
        const recentWon = filtered.filter(l => new Date(l.createdAt) >= last7Days && wonColumnIds.includes(l.columnId || '')).length;
        const monthLeads = filtered.filter(l => new Date(l.createdAt) >= last30Days).length;
        const monthWon = filtered.filter(l => new Date(l.createdAt) >= last30Days && wonColumnIds.includes(l.columnId || '')).length;

        const activitySummary = {
            leadsWithNotes,
            leadsWithValue,
            leadsWithPhone,
            leadsWithSource,
            recentLeads,
            recentWon,
            monthLeads,
            monthWon,

            // Follow-up Stats
            upcomingFollowUps: filtered.filter(l => l.followUpDate && new Date(l.followUpDate) >= startOfDay(new Date())).length,
            overdueFollowUps: filtered.filter(l => l.followUpDate && new Date(l.followUpDate) < startOfDay(new Date())).length,
            nextFollowUpsList: filtered
                .filter(l => l.followUpDate && new Date(l.followUpDate) >= startOfDay(new Date()))
                .sort((a, b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime())
                .slice(0, 3)
                .map(l => ({
                    id: l.id,
                    name: l.name,
                    date: format(new Date(l.followUpDate!), 'dd/MM', { locale: ptBR }),
                    note: l.followUpNote
                })),

            notesPercentage: totalLeads > 0 ? (leadsWithNotes / totalLeads) * 100 : 0,
            valuePercentage: totalLeads > 0 ? (leadsWithValue / totalLeads) * 100 : 0,
            statusCounts,
            sentiment: { positive: positiveLeads, negative: negativeLeads, neutral: neutralLeads, urgent: urgentLeads },
            avgNoteLength,
            recentNotesPreview,
        };

        return {
            filteredLeads: filtered,
            uniqueSources: uniqueSrc,
            kpis: {
                totalLeads,
                totalRevenue,
                forecastRevenue,
                conversionRate,
                lossRate,
                avgTicket,
                avgSalesCycle,
                wonCount: wonLeads.length,
                lostCount: lostLeads.length,
            },
            charts: {
                timelineData,
                stateData,
                funnelData,
                dailyData
            },
            sourcePerformance,
            activitySummary
        };

    }, [initialLeads, columns, dateRange, selectedSource, selectedState]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* 1. Filter Bar */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-10">
                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-center">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn(
                                "w-[260px] justify-start text-left font-normal",
                                "flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition-all",
                                "hover:bg-slate-50 hover:border-slate-300",
                                "dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100",
                                "dark:hover:bg-slate-800 dark:hover:border-slate-700",
                                !dateRange && "text-slate-500 dark:text-slate-400"
                            )}>
                                <CalendarIcon className="h-4 w-4" />
                                {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "dd/MM/y")} - ${format(dateRange.to, "dd/MM/y")}` : format(dateRange.from, "dd/MM/y")) : <span>Selecione o período</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                        </PopoverContent>
                    </Popover>

                    <Select value={selectedSource} onValueChange={setSelectedSource}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Origem" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as Origens</SelectItem>
                            {uniqueSources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={selectedState} onValueChange={setSelectedState}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Estados</SelectItem>
                            {Array.from(new Set(initialLeads.map(l => getStateFromPhone(l.whatsapp))))
                                .filter(s => s !== 'N/A').sort().map(s => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button variant="ghost" size="sm" onClick={() => {
                    setSelectedSource("all");
                    setSelectedState("all");
                    setDateRange({ from: subDays(new Date(), 90), to: new Date() });
                }}>
                    <FilterX className="mr-2 h-4 w-4" />
                    Resetar Filtros
                </Button>
            </div>

            {/* 2. KPI Cards - Enhanced */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                <KpiCard title="Receita Fechada" value={formatCurrency(kpis.totalRevenue)} icon={<TrendingUp className="h-4 w-4 text-emerald-500" />} accent="emerald" />
                <KpiCard title="Pipeline Aberto" value={formatCurrency(kpis.forecastRevenue)} icon={<Target className="h-4 w-4 text-blue-500" />} accent="blue" />
                <KpiCard title="Total de Leads" value={kpis.totalLeads.toString()} icon={<ArrowUpRight className="h-4 w-4 text-indigo-500" />} accent="indigo" />
                <KpiCard title="Taxa de Conversão" value={`${kpis.conversionRate.toFixed(1)}%`} sub={`${kpis.wonCount} vendas`} icon={<TrendingUp className="h-4 w-4 text-green-500" />} accent="green" />
                <KpiCard title="Taxa de Perda" value={`${kpis.lossRate.toFixed(1)}%`} sub={`${kpis.lostCount} perdidos`} icon={<AlertTriangle className="h-4 w-4 text-red-500" />} accent="red" />
                <KpiCard title="Ciclo Médio" value={`${Math.round(kpis.avgSalesCycle)} dias`} sub="Até fechamento" icon={<Clock className="h-4 w-4 text-amber-500" />} accent="amber" />
                <KpiCard title="Follow-ups" value={activitySummary.upcomingFollowUps.toString()} sub={`${activitySummary.overdueFollowUps} atrasados`} icon={<CalendarClock className="h-4 w-4 text-sky-500" />} accent="blue" />
            </div>

            {/* 3. Row 1: Timeline + Regional */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Timeline */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Evolução de Vendas</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={charts.timelineData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={30} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#64748b' }} width={45} />
                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                <Area yAxisId="left" type="monotone" dataKey="leads" name="Leads" fill="#6366f1" fillOpacity={0.15} stroke="#6366f1" strokeWidth={2} />
                                <Line yAxisId="right" type="monotone" dataKey="revenue" name="Receita" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Regional */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Performance Regional</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.stateData} layout="vertical" margin={{ left: 0, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={35} tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                                <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                <Bar
                                    dataKey="value"
                                    name="Leads"
                                    fill="#0ea5e9"
                                    radius={[0, 4, 4, 0]}
                                    barSize={18}
                                    className="cursor-pointer"
                                    onClick={(data) => {
                                        if (data && data.name) setSelectedState(data.name === selectedState ? "all" : data.name);
                                    }}
                                >
                                    {charts.stateData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === selectedState ? '#6366f1' : '#0ea5e9'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* 4. Row 2: Daily Leads Bar Chart - NEW USER REQUEST */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Leads Diários</CardTitle>
                    <CardDescription className="text-xs">Volume de leads por dia no período selecionado</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={charts.dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                minTickGap={30}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#64748b' }}
                            />
                            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                            <Bar
                                dataKey="leads"
                                name="Leads"
                                fill="#8b5cf6"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* 5. Pipeline Full Width - CLICKABLE */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        Temperatura do Pipeline
                        {selectedColumn && (
                            <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => setSelectedColumn(null)}>
                                ✕ {selectedColumn}
                            </Badge>
                        )}
                    </CardTitle>
                    <CardDescription className="text-xs">Clique em uma etapa para ver os leads</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={charts.funnelData} margin={{ left: 0, right: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={140}
                                tick={{ fontSize: 11, cursor: 'pointer' }}
                                interval={0}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => value.length > 18 ? value.substring(0, 18) + '...' : value}
                            />
                            <RechartsTooltip
                                cursor={{ fill: 'rgba(99,102,241,0.1)' }}
                                contentStyle={{ borderRadius: '8px', border: 'none' }}
                                formatter={(value, name, props) => [value, (props.payload as any).fullName || name]}
                            />
                            <Bar
                                dataKey="value"
                                name="Leads"
                                radius={[0, 4, 4, 0]}
                                barSize={20}
                                className="cursor-pointer"
                                onClick={(data: any) => {
                                    if (data && data.fullName) {
                                        setSelectedColumn(data.fullName === selectedColumn ? null : data.fullName);
                                        setSelectedKeyword(null);
                                    }
                                }}
                            >
                                {charts.funnelData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.fullName === selectedColumn ? '#6366f1' : entry.fill}
                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* 5. Insights das Observações - EXPANDED */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <MessageSquareText className="h-4 w-4 text-slate-400" />
                        Insights das Observações
                    </CardTitle>
                    <CardDescription>Análise automática das anotações dos leads</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Row 1: Sentiment + Activity Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Sentiment Cards */}
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">😊 Positivos</span>
                                <span className="text-lg font-bold text-emerald-600">{activitySummary.sentiment.positive}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Interessados, confirmaram, etc</p>
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">😕 Negativos</span>
                                <span className="text-lg font-bold text-red-600">{activitySummary.sentiment.negative}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Desistiram, sem interesse, etc</p>
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-100 dark:border-amber-900">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">🔥 Urgentes</span>
                                <span className="text-lg font-bold text-amber-600">{activitySummary.sentiment.urgent}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Mencionam urgência ou pressa</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">📝 Média chars</span>
                                <span className="text-lg font-bold text-slate-600">{activitySummary.avgNoteLength}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Tamanho médio das notas</p>
                        </div>
                    </div>

                    {/* Row 2: Status Keywords - CLICKABLE */}
                    <div>
                        <h4 className="text-sm font-semibold text-slate-600 uppercase mb-3 flex items-center gap-2">
                            Ações Mencionadas
                            {selectedKeyword && (
                                <Badge variant="outline" className="text-xs cursor-pointer normal-case" onClick={() => setSelectedKeyword(null)}>
                                    ✕ Limpar filtro
                                </Badge>
                            )}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {activitySummary.statusCounts.length > 0 ? (
                                activitySummary.statusCounts.map((s) => (
                                    <Badge
                                        key={s.label}
                                        variant={selectedKeyword === s.label ? "default" : "secondary"}
                                        className={cn(
                                            "text-sm px-3 py-1.5 cursor-pointer transition-all hover:scale-105",
                                            selectedKeyword === s.label && "ring-2 ring-indigo-300"
                                        )}
                                        onClick={() => {
                                            setSelectedKeyword(selectedKeyword === s.label ? null : s.label);
                                            setSelectedColumn(null);
                                        }}
                                    >
                                        {s.icon} {s.label}: <span className="font-bold ml-1">{s.count}</span>
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-sm text-slate-400">Nenhuma ação identificada nas observações</span>
                            )}
                        </div>
                    </div>

                    {/* Row 3: Recent Notes Preview + Period Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Recent Notes */}
                        <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Últimas Observações</h4>
                            {activitySummary.recentNotesPreview.length > 0 ? (
                                <div className="space-y-2">
                                    {activitySummary.recentNotesPreview.map((note, i) => (
                                        <div key={i} className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded text-xs">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-medium text-slate-700 dark:text-slate-300">{note.name}</span>
                                                <span className="text-slate-400">{note.date}</span>
                                            </div>
                                            <p className="text-slate-500 text-[11px]">{note.preview}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400">Nenhuma observação no período</p>
                            )}
                        </div>

                        {/* Period Stats */}
                        <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Resumo por Período</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg text-center">
                                    <div className="text-xs text-slate-500 mb-1">Últimos 7 dias</div>
                                    <div className="text-xl font-bold text-indigo-600">{activitySummary.recentLeads}</div>
                                    <div className="text-[10px] text-slate-400">leads / {activitySummary.recentWon} vendas</div>
                                </div>
                                <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-lg text-center">
                                    <div className="text-xs text-slate-500 mb-1">Últimos 30 dias</div>
                                    <div className="text-xl font-bold text-violet-600">{activitySummary.monthLeads}</div>
                                    <div className="text-[10px] text-slate-400">leads / {activitySummary.monthWon} vendas</div>
                                </div>
                            </div>
                            {/* Data Quality */}
                            <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded text-xs">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex justify-between"><span className="text-slate-500">Com Observação</span><span className="font-medium">{activitySummary.leadsWithNotes} ({activitySummary.notesPercentage.toFixed(0)}%)</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Com Valor</span><span className="font-medium">{activitySummary.leadsWithValue} ({activitySummary.valuePercentage.toFixed(0)}%)</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Row 4: Upcoming Follow-ups */}
                    {
                        activitySummary.nextFollowUpsList.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                    <CalendarClock className="h-3 w-3" /> Próximos Retornos
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {activitySummary.nextFollowUpsList.map((lead) => (
                                        <div key={lead.id} className="p-2.5 bg-sky-50 dark:bg-sky-950/30 rounded-lg border border-sky-100 dark:border-sky-900 flex flex-col gap-1">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-sm text-slate-700 dark:text-slate-300 truncate">{lead.name}</span>
                                                <span className="text-[10px] bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded text-sky-600 font-medium whitespace-nowrap">{lead.date}</span>
                                            </div>
                                            {lead.note && (
                                                <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-1 italic">"{lead.note}"</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    }
                </CardContent >
            </Card >

            {/* 6. Filtered Leads List - Shows when column or keyword is selected */}
            {
                (selectedColumn || selectedKeyword) && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                Leads Filtrados
                                <Badge variant="secondary" className="text-xs">
                                    {selectedColumn ? `Etapa: ${selectedColumn}` : `Ação: ${selectedKeyword}`}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-auto text-xs"
                                    onClick={() => { setSelectedColumn(null); setSelectedKeyword(null); }}
                                >
                                    Limpar Filtro
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                                {filteredLeads
                                    .filter(lead => {
                                        if (selectedColumn) {
                                            const col = columns.find(c => c.title === selectedColumn);
                                            return col && lead.columnId === col.id;
                                        }
                                        if (selectedKeyword) {
                                            const keywordMap: Record<string, string> = {
                                                'Interessados': 'interesse',
                                                'Proposta': 'proposta',
                                                'Orçamento': 'orçamento',
                                                'Em Contato': 'contato',
                                                'Retornou': 'retornou',
                                                'Sem Retorno': 'não retorn',
                                                'Fechado': 'fechado',
                                                'Agendamento': 'agend',
                                                'Vídeo Call': 'video',
                                                'Em Conversa': 'conversa',
                                                'WhatsApp': 'whatsapp',
                                                'Email': 'email',
                                                'Reunião': 'reunião',
                                                'Follow-up': 'follow',
                                                'Aguardando': 'esperando',
                                                'Analisando': 'analis',
                                            };
                                            const kw = keywordMap[selectedKeyword];
                                            return kw && lead.notes?.toLowerCase().includes(kw);
                                        }
                                        return false;
                                    })
                                    .slice(0, 20)
                                    .map(lead => (
                                        <div
                                            key={lead.id}
                                            className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-indigo-200 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h5 className="font-medium text-sm text-slate-800 dark:text-slate-200">{lead.name}</h5>
                                                    {lead.company && <p className="text-xs text-slate-500">{lead.company}</p>}
                                                </div>
                                                {lead.value && (
                                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                                        {formatCurrency(parseValue(lead.value))}
                                                    </span>
                                                )}
                                            </div>
                                            {lead.notes && (
                                                <p className="text-xs text-slate-500 line-clamp-2 mb-2">{lead.notes}</p>
                                            )}
                                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                                                <span>{lead.campaignSource || 'Direto'}</span>
                                                <span>{format(new Date(lead.createdAt), 'dd/MM/yy', { locale: ptBR })}</span>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                            {filteredLeads.filter(lead => {
                                if (selectedColumn) {
                                    const col = columns.find(c => c.title === selectedColumn);
                                    return col && lead.columnId === col.id;
                                }
                                if (selectedKeyword) {
                                    const keywordMap: Record<string, string> = {
                                        'Interessados': 'interesse', 'Proposta': 'proposta', 'Orçamento': 'orçamento',
                                        'Em Contato': 'contato', 'Retornou': 'retornou', 'Sem Retorno': 'não retorn',
                                        'Fechado': 'fechado', 'Agendamento': 'agend', 'Vídeo Call': 'video',
                                        'Em Conversa': 'conversa', 'WhatsApp': 'whatsapp', 'Email': 'email',
                                        'Reunião': 'reunião', 'Follow-up': 'follow', 'Aguardando': 'esperando', 'Analisando': 'analis',
                                    };
                                    const kw = keywordMap[selectedKeyword];
                                    return kw && lead.notes?.toLowerCase().includes(kw);
                                }
                                return false;
                            }).length > 20 && (
                                    <p className="text-center text-xs text-slate-400 mt-3">
                                        Mostrando 20 de {filteredLeads.filter(lead => {
                                            if (selectedColumn) {
                                                const col = columns.find(c => c.title === selectedColumn);
                                                return col && lead.columnId === col.id;
                                            }
                                            return false;
                                        }).length} leads
                                    </p>
                                )}
                        </CardContent>
                    </Card>
                )
            }
        </div >
    );
}

function KpiCard({ title, value, sub, icon, accent }: { title: string, value: string, sub?: string, icon?: React.ReactNode, accent?: string }) {
    const accentColors: Record<string, string> = {
        emerald: 'bg-emerald-50 dark:bg-emerald-950/30',
        blue: 'bg-blue-50 dark:bg-blue-950/30',
        indigo: 'bg-indigo-50 dark:bg-indigo-950/30',
        green: 'bg-green-50 dark:bg-green-950/30',
        red: 'bg-red-50 dark:bg-red-950/30',
        amber: 'bg-amber-50 dark:bg-amber-950/30',
    };

    return (
        <Card className={cn("hover:shadow-md transition-shadow", accent && accentColors[accent])}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-muted-foreground">{title}</span>
                        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</span>
                        {sub && <span className="text-[10px] text-slate-500">{sub}</span>}
                    </div>
                    {icon && <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">{icon}</div>}
                </div>
            </CardContent>
        </Card>
    )
}
