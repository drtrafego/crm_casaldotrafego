"use client";

import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lead, Column as DbColumn } from "@/server/db/schema";
import { EditLeadDialog } from "@/components/features/kanban/edit-lead-dialog";
import { Search, ArrowUpDown, MessageCircle } from "lucide-react";
import { getWhatsAppLink, cn } from "@/lib/utils";

interface LeadsListProps {
  leads: Lead[];
  columns: DbColumn[];
}

export function LeadsList({ leads, columns }: LeadsListProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const totalValue = leads.reduce((sum, lead) => sum + parseFloat(lead.value || "0"), 0);
  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalValue);

  const tableColumns: ColumnDef<Lead>[] = [
    {
      accessorKey: "name",
      header: "Lead",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 max-w-[240px]">
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{row.getValue("name")}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{row.getValue("email") || "-"}</span>
        </div>
      ),
    },
    {
      accessorKey: "company",
      header: "Empresa",
      cell: ({ row }) => <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{row.getValue("company") || "-"}</span>,
    },
    {
      accessorKey: "columnId",
      header: "Status",
      cell: ({ row }) => {
        const colId = row.getValue("columnId") as string;
        const col = columns.find((c) => c.id === colId);
        const title = col?.title || "Unknown";
        const isWon = title.toLowerCase().includes("ganho") || title.toLowerCase().includes("won") || title.toLowerCase().includes("fechado");
        const isLost = title.toLowerCase().includes("perdido") || title.toLowerCase().includes("lost");
        const isNew = title.toLowerCase().includes("novo") || title.toLowerCase().includes("new");

        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
              isWon ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" :
                isLost ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" :
                  isNew ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" :
                    "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20"
            )}
          >
            {title}
          </span>
        );
      },
    },
    {
      accessorKey: "campaignSource",
      header: "Origem",
      cell: ({ row }) => {
        const source = row.getValue("campaignSource") as string;
        const sourceColors: Record<string, string> = {
          'Google': 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400',
          'Meta': 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-500/10 dark:text-sky-400',
          'Captação Ativa': 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400',
          'Organicos': 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400',
        };
        return source ? (
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border border-transparent", sourceColors[source] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')}>
            {source}
          </span>
        ) : (
          <span className="text-slate-300 dark:text-slate-600">-</span>
        );
      },
    },
    {
      accessorKey: "whatsapp",
      header: "Contato",
      cell: ({ row }) => {
        const whatsapp = row.getValue("whatsapp") as string;
        const whatsappLink = whatsapp ? getWhatsAppLink(whatsapp) : "";

        return (
          <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
            {whatsapp && whatsappLink ? (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center p-2 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                title="Conversar no WhatsApp"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        );
      }
    },
    {
      accessorKey: "followUpDate",
      header: "Próximo Passo",
      cell: ({ row }) => {
        const dateValue = row.getValue("followUpDate") as Date | null;
        if (!dateValue) return <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>;

        const date = new Date(dateValue);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const followDate = new Date(date);
        followDate.setHours(0, 0, 0, 0);

        const isOverdue = followDate < today;
        const isToday = followDate.getTime() === today.getTime();

        const formatted = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

        return (
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium border",
            isOverdue ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" :
              isToday ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30" :
                "bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full",
              isOverdue ? "bg-red-500" : isToday ? "bg-amber-500" : "bg-slate-400"
            )} />
            {formatted}
          </span>
        );
      },
    },
    {
      accessorKey: "value",
      header: () => <div className="text-right">Valor</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("value") || "0");
        const formatted = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(amount);
        return <div className="text-right font-mono text-sm font-medium text-slate-900 dark:text-slate-100">{formatted}</div>;
      },
    },
  ];

  const table = useReactTable({
    data: leads,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Todos os Leads</h2>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Filtrar por nome, email..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-9 h-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 rounded-lg text-sm"
            />
          </div>
        </div>

        <Table className="w-full">
          <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="h-10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => setEditingLead(row.original)}
                  className="group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800/50 last:border-0 transition-all duration-200"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-32 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-slate-300" />
                    <p>Nenhum lead encontrado com esses filtros.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {table.getRowModel().rows?.length > 0 && (
            <TableFooter className="bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <TableRow>
                <TableCell colSpan={tableColumns.length - 1} className="text-right font-semibold text-slate-600 dark:text-slate-400">
                  Total em Pipeline
                </TableCell>
                <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100 text-base">{formattedTotal}</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {editingLead && (
        <EditLeadDialog
          lead={editingLead}
          open={!!editingLead}
          onOpenChange={(open) => !open && setEditingLead(null)}
        />
      )}
    </div>
  );
}
