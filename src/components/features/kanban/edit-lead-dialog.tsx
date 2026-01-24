'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateLeadContent, getLeadHistory } from "@/server/actions/leads";
import { Lead } from "@/server/db/schema";
import { User, Phone, Mail, Building2, FileText, Save, X, DollarSign, Trash2, Megaphone, CalendarClock, History, ArrowRight, Plus, Pencil, MoreHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteLead } from "@/server/actions/leads";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EditLeadDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditLeadDialog({ lead, open, onOpenChange }: EditLeadDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Normalize source to match restricted Select options (Capitalized)
  const validSources = ["Google", "Meta", "Captação Ativa", "Organicos"];

  const getInitialSource = () => {
    let rawSource = lead.campaignSource;

    // Fallback normalization if campaignSource is missing
    if (!rawSource && lead.utmSource) {
      const utm = lead.utmSource.toLowerCase().trim();
      if (utm.includes('facebook') || utm.includes('meta') || utm.includes('instagram')) rawSource = "Meta";
      else if (utm.includes('google') || utm.includes('adwords')) rawSource = "Google";
    }

    if (!rawSource) return "no_source";
    const match = validSources.find(s => s.toLowerCase() === rawSource?.toLowerCase());
    return match || "no_source"; // Safety fallback
  };

  const [source, setSource] = useState(getInitialSource());
  const router = useRouter();

  // Fetch history when dialog opens
  useEffect(() => {
    if (open) {
      setLoadingHistory(true);
      getLeadHistory(lead.id)
        .then(data => setHistory(data))
        .catch(err => console.error("Failed to fetch history", err))
        .finally(() => setLoadingHistory(false));
    }
  }, [open, lead.id]);

  async function handleSubmit(formData: FormData) {
    const followUpDateValue = formData.get("followUpDate") as string;
    const data = {
      name: formData.get("name") as string,
      whatsapp: formData.get("whatsapp") as string,
      email: formData.get("email") as string,
      company: formData.get("company") as string,
      notes: formData.get("notes") as string,
      value: formData.get("value") as string,
      campaignSource: formData.get("campaignSource") as string,
      followUpDate: followUpDateValue ? new Date(followUpDateValue) : null,
      followUpNote: formData.get("followUpNote") as string || null,
      columnId: lead.columnId,
      position: lead.position,
    };

    console.log("Submitting edit with location:", { columnId: data.columnId, position: data.position });

    await updateLeadContent(lead.id, data);
    onOpenChange(false);
    router.refresh();
  }

  async function handleDelete() {
    await deleteLead(lead.id);
    onOpenChange(false);
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <Plus className="h-4 w-4 text-emerald-500" />;
      case 'move': return <ArrowRight className="h-4 w-4 text-blue-500" />;
      case 'update': return <Pencil className="h-4 w-4 text-amber-500" />;
      default: return <MoreHorizontal className="h-4 w-4 text-slate-400" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create': return 'Criado';
      case 'move': return 'Movido';
      case 'update': return 'Atualizado';
      default: return action;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-950 p-0 gap-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg h-[90vh] sm:h-auto flex flex-col">
        <DialogHeader className="p-6 pb-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <User className="h-5 w-5" />
            </div>
            Editar Lead
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400 ml-10">
            Gerencie o lead {lead.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-3.5 w-3.5" />
                Histórico
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details" className="flex-1 overflow-y-auto m-0">
            <form action={handleSubmit}>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" /> Nome
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={lead.name}
                      required
                      className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" /> Whatsapp
                    </Label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      defaultValue={lead.whatsapp || ""}
                      required
                      placeholder="(11) 99999-9999"
                      className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" /> Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={lead.email || ""}
                      className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" /> Empresa
                    </Label>
                    <Input
                      id="company"
                      name="company"
                      defaultValue={lead.company || ""}
                      className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="value" className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-slate-400" /> Valor (R$)
                    </Label>
                    <Input
                      id="value"
                      name="value"
                      type="number"
                      step="0.01"
                      defaultValue={lead.value || ""}
                      placeholder="0.00"
                      className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campaignSource" className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-slate-400" /> Origem
                    </Label>
                    <input type="hidden" name="campaignSource" value={source === "no_source" ? "" : source} />
                    <Select value={source || "no_source"} onValueChange={setSource}>
                      <SelectTrigger className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                        <SelectValue placeholder="Selecione a origem" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Google">Google</SelectItem>
                        <SelectItem value="Meta">Meta</SelectItem>
                        <SelectItem value="Captação Ativa">Captação Ativa</SelectItem>
                        <SelectItem value="Organicos">Orgânicos</SelectItem>
                        <SelectItem value="no_source">Sem Origem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Follow-up Section */}
                <div className="p-4 bg-sky-50 dark:bg-sky-950/30 rounded-lg border border-sky-100 dark:border-sky-900">
                  <h4 className="text-sm font-medium text-sky-700 dark:text-sky-300 mb-3 flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" /> Agendar Retorno
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="followUpDate" className="text-slate-700 dark:text-slate-300 text-sm">
                        Data do Retorno
                      </Label>
                      <Input
                        id="followUpDate"
                        name="followUpDate"
                        type="date"
                        defaultValue={lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : ""}
                        className="bg-white dark:bg-slate-900 border-sky-200 dark:border-sky-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="followUpNote" className="text-slate-700 dark:text-slate-300 text-sm">
                        Motivo (ex: Quer esperar 30 dias)
                      </Label>
                      <Input
                        id="followUpNote"
                        name="followUpNote"
                        defaultValue={lead.followUpNote || ""}
                        placeholder="Ex: Cliente viajando, retornar após férias"
                        className="bg-white dark:bg-slate-900 border-sky-200 dark:border-sky-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" /> Observações
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    defaultValue={lead.notes || ""}
                    className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-colors min-h-[100px] resize-none"
                  />
                </div>
              </div>

              <DialogFooter className="p-6 pt-2 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  {isDeleting ? (
                    <>
                      <span className="text-sm text-red-600 font-medium">Tem certeza?</span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Sim, excluir
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsDeleting(false)}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsDeleting(true)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir Lead
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <X className="mr-2 h-4 w-4" /> Cancelar
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 dark:shadow-none">
                    <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-y-auto m-0">
            <div className="p-6">
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <History className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>Nenhum histórico registrado ainda.</p>
                </div>
              ) : (
                <div className="relative border-l border-slate-200 dark:border-slate-800 ml-2 space-y-6">
                  {history.map((event) => (
                    <div key={event.id} className="ml-6 relative">
                      <div className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-slate-950 bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-500 transition-colors" />
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {getActionIcon(event.action)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {getActionLabel(event.action)}
                            </p>
                            <span className="text-xs text-slate-400">
                              {format(new Date(event.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {event.details}
                          </p>
                          {event.userId && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <div className="h-4 w-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[9px] font-bold">
                                U
                              </div>
                              <span className="text-xs text-slate-400">Usuário do Sistema</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter className="p-6 pt-2 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
