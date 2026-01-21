"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { addMonths, subMonths, format, isSameMonth, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface CalendarHeaderProps {
    currentDate: Date;
}

export function CalendarHeader({ currentDate }: CalendarHeaderProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [preset, setPreset] = useState<string>("month");

    const handleDateChange = (date: Date | undefined) => {
        if (date) {
            const params = new URLSearchParams(searchParams);
            params.set("date", date.toISOString());
            router.push(`?${params.toString()}`);
            setIsCalendarOpen(false);
        }
    };

    const handlePresetChange = (value: string) => {
        setPreset(value);
        const today = new Date();

        if (value === "today") {
            handleDateChange(today);
        } else if (value === "yesterday") {
            handleDateChange(subDays(today, 1));
        } else if (value === "7") {
            handleDateChange(subDays(today, 6));
        } else if (value === "14") {
            handleDateChange(subDays(today, 13));
        } else if (value === "30") {
            handleDateChange(today);
        } else if (value === "month") {
            handleDateChange(today);
        }
    };

    const handlePrevMonth = () => {
        const newDate = subMonths(currentDate, 1);
        handleDateChange(newDate);
    };

    const handleNextMonth = () => {
        const newDate = addMonths(currentDate, 1);
        handleDateChange(newDate);
    };

    const handleToday = () => {
        const today = new Date();
        handleDateChange(today);
    };

    const isCurrentMonth = isSameMonth(currentDate, new Date());

    return (
        <div className="flex items-center gap-2">
            {/* Period Preset Selector */}
            <Select value={preset} onValueChange={handlePresetChange}>
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="yesterday">Ontem</SelectItem>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="14">Últimos 14 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="month">Este Mês</SelectItem>
                </SelectContent>
            </Select>

            {/* Month Navigation */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevMonth}
                    className="h-8 w-8 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                "h-8 px-3 font-semibold text-sm min-w-[140px]",
                                "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                            <span className="capitalize">
                                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                            </span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                        <Calendar
                            mode="single"
                            selected={currentDate}
                            onSelect={handleDateChange}
                            initialFocus
                            locale={ptBR}
                        />
                    </PopoverContent>
                </Popover>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextMonth}
                    className="h-8 w-8 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToday}
                    disabled={isCurrentMonth}
                    className={cn(
                        "h-8 px-2 text-xs font-medium",
                        isCurrentMonth
                            ? "text-slate-400 dark:text-slate-600"
                            : "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    )}
                >
                    Hoje
                </Button>
            </div>
        </div>
    );
}

