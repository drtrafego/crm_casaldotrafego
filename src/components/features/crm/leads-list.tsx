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
      header: "Nome",
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "company",
      header: "Empresa",
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

        return (
          <span
            className={cn(
              "inline-block rounded-full px-2 py-1 text-xs font-semibold",
              isWon ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                isLost ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            )}
          >
            {title}
          </span>
        );
      },
    },
    {
      accessorKey: "whatsapp",
      header: "WhatsApp",
      cell: ({ row }) => {
        const whatsapp = row.getValue("whatsapp") as string;
        const whatsappLink = whatsapp ? getWhatsAppLink(whatsapp) : "";

        return (
          <div className="flex items-center gap-2">
            {whatsapp && whatsappLink ? (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors"
                title="Conversar no WhatsApp"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            ) : (
              <span className="text-slate-300 dark:text-slate-600">-</span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "campaignSource",
      header: "Origem",
      cell: ({ row }) => {
        const source = row.getValue("campaignSource") as string;
        const sourceColors: Record<string, string> = {
          'Google': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          'Meta': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
          'Captação Ativa': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
          'Organicos': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        };
        return source ? (
          <span className={cn("inline-block rounded-full px-2 py-1 text-xs font-medium", sourceColors[source] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')}>
            {source}
          </span>
        ) : (
          <span className="text-slate-300 dark:text-slate-600">-</span>
        );
      },
    },
    {
      accessorKey: "followUpDate",
      header: "Retorno",
      cell: ({ row }) => {
        const dateValue = row.getValue("followUpDate") as Date | null;
        if (!dateValue) return <span className="text-slate-300 dark:text-slate-600">-</span>;

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
            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
            isOverdue ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
              isToday ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
          )}>
            {isOverdue ? "⚠️" : isToday ? "📅" : "🕐"} {formatted}
          </span>
        );
      },
    },
    {
      accessorKey: "value",
      header: ({ column }) => {
        return (
          <div className="text-right">Valor</div>
        );
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("value") || "0");
        const formatted = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(amount);
        return <div className="text-right font-medium text-slate-700 dark:text-slate-300">{formatted}</div>;
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
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Meus Leads</h2>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Filtrar leads..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-8 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
            />
          </div>
        </div>

        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                  className="cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  className="h-24 text-center"
                >
                  Nenhum lead encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} className="text-right font-semibold">
                Total
              </TableCell>
              <TableCell className="text-right font-bold text-foreground">{formattedTotal}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
        <p className="mt-4 text-center text-sm text-muted-foreground">resumo do pipeline de leads</p>
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
