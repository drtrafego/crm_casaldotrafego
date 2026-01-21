"use client";

import * as React from "react";
import { addDays, format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateRangePickerProps {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
}

export function DateRangePickerWithPresets({ date, setDate }: DateRangePickerProps) {
  const [preset, setPreset] = React.useState<string>("30");

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const today = new Date();

    if (value === "today") {
      setDate({ from: today, to: today });
    } else if (value === "yesterday") {
      const yesterday = subDays(today, 1);
      setDate({ from: yesterday, to: yesterday });
    } else if (value === "all_time") {
      // From 01/01/2026 to Today
      setDate({ from: new Date(2026, 0, 1), to: today });
    } else {
      const days = parseInt(value);
      setDate({ from: subDays(today, days - 1), to: today });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="yesterday">Ontem</SelectItem>
          <SelectItem value="7">Últimos 7 dias</SelectItem>
          <SelectItem value="14">Últimos 14 dias</SelectItem>
          <SelectItem value="30">Últimos 30 dias</SelectItem>
          <SelectItem value="60">Últimos 60 dias</SelectItem>
          <SelectItem value="all_time">Todo o período</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              "flex h-9 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-start text-sm text-slate-700 shadow-sm transition-all",
              "hover:bg-slate-50 hover:border-slate-300",
              "dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:border-slate-700",
              !date && "text-slate-500 dark:text-slate-400"
            )}
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "dd/MM/y", { locale: ptBR })} -{" "}
                    {format(date.to, "dd/MM/y", { locale: ptBR })}
                  </>
                ) : (
                  format(date.from, "dd/MM/y", { locale: ptBR })
                )
              ) : (
                <span>Selecione uma data</span>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
