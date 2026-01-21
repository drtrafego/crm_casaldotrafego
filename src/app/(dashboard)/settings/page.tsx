import { stackServerApp } from "@/stack";
import { SettingsView } from "@/components/features/settings/settings-view";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  let user = null;
  try {
    // Only attempt to fetch user if stack keys are present
    const hasStackKeys = !!process.env.NEXT_PUBLIC_STACK_PROJECT_ID && !!process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;
    if (hasStackKeys) {
      user = await stackServerApp.getUser().catch((e: any) => {
        console.error("Stack getUser failed:", e);
        return null;
      });
    }
  } catch (error) {
    console.error("Error in SettingsPage initialization:", error);
    user = null;
  }

  // In Single Tenant Mode, everyone uses the shared ID
  const orgId = "bilder_agency_shared";

  // Sanitize user for client component
  const sanitizedUser = user ? {
    displayName: user.displayName,
    primaryEmail: user.primaryEmail,
    profileImageUrl: user.profileImageUrl
  } : null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <SettingsView user={sanitizedUser} orgId={orgId} />
    </div>
  );
}
