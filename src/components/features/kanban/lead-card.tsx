'use client';

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lead } from "@/server/db/schema";
import { cn, getWhatsAppLink } from "@/lib/utils";
import { Calendar, MessageCircle, Pencil, Megaphone } from "lucide-react";
import { useState } from "react";
import { EditLeadDialog } from "./edit-lead-dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { updateLeadContent } from "@/server/actions/leads";

interface LeadCardProps {
  lead: Lead;
}

const CAMPAIGN_SOURCES = [
  { label: "Google", value: "Google", color: "bg-blue-50 text-blue-700 border-blue-100" },
  { label: "Meta", value: "Meta", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  { label: "Captação Ativa", value: "Captação Ativa", color: "bg-amber-50 text-amber-700 border-amber-100" },
  { label: "Organicos", value: "Organicos", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
];

export function LeadCard({ lead }: LeadCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [openSourcePopover, setOpenSourcePopover] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: {
      type: "Lead",
      lead,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSourceSelect = async (source: string) => {
    setOpenSourcePopover(false);
    try {
      await updateLeadContent(lead.id, { campaignSource: source });
    } catch (error) {
      console.error("Failed to update source", error);
    }
  };

  const currentSource = CAMPAIGN_SOURCES.find(s => s.value === lead.campaignSource) ||
    (lead.campaignSource ? { label: lead.campaignSource, value: lead.campaignSource, color: "bg-slate-100 text-slate-700 border-slate-200" } : null);

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "opacity-50 ring-2 ring-indigo-500/20 rounded-lg rotate-2",
        )}
      >
        <Card className="bg-slate-50 border-dashed border-2 border-slate-300 h-[150px]" />
      </div>
    );
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="touch-none mb-3"
      >
        <Card
          className="group hover:shadow-md transition-all duration-200 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-grab active:cursor-grabbing"
          onClick={(e) => {
            if (!isDragging) {
              setShowEditDialog(true);
            }
          }}
        >
          <CardContent className="p-4 space-y-3">
            {/* Header with Tags & Source Selector */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                <Popover open={openSourcePopover} onOpenChange={setOpenSourcePopover}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="h-6 px-1.5 py-0 hover:bg-transparent p-0">
                      {currentSource ? (
                        <Badge variant="secondary" className={cn("px-1.5 py-0 text-[10px] font-medium hover:opacity-80 cursor-pointer", currentSource.color)}>
                          {currentSource.label}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="px-1.5 py-0 text-[10px] text-slate-400 border-dashed border-slate-300 hover:border-slate-400 hover:text-slate-500 cursor-pointer">
                          + Origem
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[160px]" align="start">
                    <Command>
                      <CommandList>
                        <CommandGroup>
                          {CAMPAIGN_SOURCES.map((source) => (
                            <CommandItem
                              key={source.value}
                              value={source.value}
                              onSelect={() => handleSourceSelect(source.value)}
                              className="text-xs"
                            >
                              <div className={cn("w-2 h-2 rounded-full mr-2", source.color.split(' ')[0].replace('bg-', 'bg-'))} />
                              {source.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!lead.whatsapp}
                        className={cn(
                          "h-6 w-6 -mt-1 transition-colors",
                          lead.whatsapp
                            ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                            : "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (lead.whatsapp) {
                            window.open(getWhatsAppLink(lead.whatsapp), '_blank');
                          }
                        }}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {lead.whatsapp ? "Conversar no WhatsApp" : "Sem WhatsApp cadastrado"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {lead.value && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(lead.value))}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-slate-400 hover:text-indigo-600 -mt-1 -mr-1 transition-opacity opacity-0 group-hover:opacity-100"
                  title="Editar Lead"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                {lead.name}
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 min-h-[1.5em]">
                {lead.notes || "Sem observações"}
              </p>
            </div>

            {/* Footer Info */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 border-2 border-white dark:border-slate-800">
                  <AvatarImage src={`https://avatar.vercel.sh/${lead.email}`} />
                  <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-600">
                    {lead.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{lead.name.split(' ')[0]}</span>
              </div>
              <div className="flex items-center gap-2">
                {lead.followUpDate && (() => {
                  const date = new Date(lead.followUpDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const followDate = new Date(date);
                  followDate.setHours(0, 0, 0, 0);
                  const isOverdue = followDate < today;
                  const isToday = followDate.getTime() === today.getTime();
                  return (
                    <span className={cn(
                      "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium",
                      isOverdue ? "bg-red-100 text-red-700" :
                        isToday ? "bg-amber-100 text-amber-700" :
                          "bg-sky-100 text-sky-700"
                    )}>
                      {isOverdue ? "⚠️" : isToday ? "📅" : "🕐"}
                      {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  );
                })()}
                <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(lead.createdAt).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <EditLeadDialog lead={lead} open={showEditDialog} onOpenChange={setShowEditDialog} />
    </>
  );
}
