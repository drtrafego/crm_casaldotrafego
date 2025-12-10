import { CrmSidebar } from "../../components/layout/crm-sidebar";
import { stackServerApp } from "../../stack";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const stackEnabled = !!process.env.NEXT_PUBLIC_STACK_PROJECT_ID && !!process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;
  if (stackEnabled) {
    const user = await stackServerApp.getUser();
    if (!user) {
      redirect("/login");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <CrmSidebar />
      <main className="ml-16 p-6 md:p-8 pt-6 min-h-[calc(100vh-4rem)]">
         <div className="w-full h-full">
            {children}
         </div>
      </main>
    </div>
  );
}
