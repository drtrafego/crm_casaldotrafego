import { getLeads, getColumns } from "@/server/actions/leads";
import { AnalyticsDashboard } from "@/components/features/crm/analytics-dashboard";

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const leads = await getLeads();
  const columns = await getColumns();

  return (
    <div className="p-6 h-full overflow-y-auto w-full max-w-[1600px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400">Visão geral interativa do desempenho do seu CRM.</p>
      </div>

      <AnalyticsDashboard initialLeads={leads as any} columns={columns} />
    </div>
  );
}
