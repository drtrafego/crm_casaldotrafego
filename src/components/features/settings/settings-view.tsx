"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Bell, Link as LinkIcon, Copy, Check, LogOut, Settings as SettingsIcon, Webhook } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface SettingsViewProps {
    user: any;
    orgId: string;
}

export function SettingsView({ user, orgId }: SettingsViewProps) {
    const [copied, setCopied] = useState(false);
    const [jsonCopied, setJsonCopied] = useState(false);
    const { setTheme, theme } = useTheme();

    // Hardcoded to the production URL to avoid client-side hydration delays/errors
    const webhookUrl = "https://crm-casaldotrafego.vercel.app/api/webhooks/leads";

    const handleCopy = (text: string, setCopiedState: (val: boolean) => void) => {
        navigator.clipboard.writeText(text);
        setCopiedState(true);
        setTimeout(() => setCopiedState(false), 2000);
    };

    const webhookPayload = {
        name: "Nome do Cliente",
        email: "cliente@email.com",
        whatsapp: "11999999999",
        company: "Empresa LTDA",
        notes: "Interesse no plano premium...",
        campaignSource: "Instagram Ads",
        organizationId: orgId
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <SettingsIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                        Configurações <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full">v2.1 (Debug)</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">
                        Gerencie suas preferências e integrações
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar Navigation (Mock) could go here, but for now just stacking sections */}

                {/* Main Content */}
                <div className="lg:col-span-12 space-y-8">

                    {/* Profile Section */}
                    <section id="profile" className="scroll-mt-20">
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                                        <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <CardTitle>Perfil de Usuário</CardTitle>
                                        <CardDescription>Gerencie suas informações pessoais</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    <div className="flex flex-col items-center gap-3">
                                        <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-900 shadow-lg">
                                            <AvatarImage src={user?.profileImageUrl || ""} />
                                            <AvatarFallback className="text-2xl bg-indigo-100 text-indigo-700">
                                                {user?.displayName?.charAt(0) || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <Button variant="outline" size="sm" className="w-full">Alterar Foto</Button>
                                    </div>
                                    <div className="flex-1 space-y-4 w-full">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Nome Completo</Label>
                                                <Input id="name" defaultValue={user?.displayName || "Usuário Demo"} readOnly className="bg-slate-50 dark:bg-slate-900/50" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input id="email" defaultValue={user?.primaryEmail || "demo@bilderai.com"} readOnly className="bg-slate-50 dark:bg-slate-900/50" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Notifications Section */}
                    <section id="notifications">
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                                        <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <CardTitle>Notificações</CardTitle>
                                        <CardDescription>Escolha como você quer ser notificado</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-medium">Novos Leads</Label>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Receba um alerta quando um novo lead entrar.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-medium">Resumo Diário</Label>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Receba um resumo das atividades do dia por email.</p>
                                    </div>
                                    <Switch />
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Integrations Section */}
                    <section id="integrations">
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-sky-100 dark:bg-sky-900/20 rounded-lg">
                                        <Webhook className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                                    </div>
                                    <div>
                                        <CardTitle>Integrações & Webhooks</CardTitle>
                                        <CardDescription>Conecte seu CRM a ferramentas externas</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <Label className="text-base font-semibold flex items-center gap-2">
                                                    Webhook de Entrada
                                                    <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Ativo</span>
                                                </Label>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    Use este endpoint para enviar dados de formulários ou outras apps para o CRM.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 items-center mt-4">
                                            <div className="relative flex-1 group">
                                                <Input
                                                    readOnly
                                                    value={webhookUrl}
                                                    className="font-mono text-xs bg-white dark:bg-slate-950 pr-10 border-slate-300 dark:border-slate-700 h-11"
                                                />
                                                <div className="absolute right-3 top-3.5 text-slate-400 text-xs font-mono select-none">POST</div>
                                            </div>
                                            <Button
                                                variant={copied ? "default" : "outline"}
                                                size="icon"
                                                className={cn("h-11 w-11 transition-all", copied && "bg-green-600 border-green-600 hover:bg-green-700")}
                                                onClick={() => handleCopy(webhookUrl, setCopied)}
                                                title="Copiar URL"
                                            >
                                                {copied ? <Check className="h-5 w-5 text-white" /> : <Copy className="h-5 w-5" />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                        Exemplo de Payload (JSON)
                                    </Label>
                                    <div className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <div className="bg-slate-950 text-slate-50 p-4 font-mono text-xs overflow-x-auto">
                                            <pre className="text-emerald-400 leading-relaxed">
                                                {JSON.stringify(webhookPayload, null, 2)}
                                            </pre>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "absolute top-2 right-2 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all",
                                                jsonCopied && "text-green-400 hover:text-green-300"
                                            )}
                                            onClick={() => handleCopy(JSON.stringify(webhookPayload, null, 2), setJsonCopied)}
                                        >
                                            {jsonCopied ? (
                                                <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Copiado</span>
                                            ) : (
                                                <span className="flex items-center gap-1"><Copy className="h-3 w-3" /> Copiar JSON</span>
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <AlertCircleIcon />
                                        O campo <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-700 dark:text-slate-300">organizationId</code> é obrigatório.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                    {/* Appearance Section */}
                    <section id="appearance">
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                        <div className="h-5 w-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full" />
                                    </div>
                                    <div>
                                        <CardTitle>Aparência</CardTitle>
                                        <CardDescription>Customize o tema do sistema</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-base font-medium">Tema</Label>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Selecione sua preferência de visualização.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setTheme("light")}
                                            className={cn(
                                                "h-8 px-3 rounded-md transition-all",
                                                theme === "light" && "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                                            )}
                                        >
                                            <span className="flex items-center gap-2">☀️ Claro</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setTheme("dark")}
                                            className={cn(
                                                "h-8 px-3 rounded-md transition-all",
                                                theme === "dark" && "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                                            )}
                                        >
                                            <span className="flex items-center gap-2">🌑 Escuro</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setTheme("system")}
                                            className={cn(
                                                "h-8 px-3 rounded-md transition-all",
                                                theme === "system" && "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                                            )}
                                        >
                                            <span className="flex items-center gap-2">💻 Auto</span>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </div>
        </div>
    );
}

function AlertCircleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
    )
}
