import { requireAdmin } from "@/server/auth";
import { getSiteData } from "@/server/content";
import AdminNav from "@/components/admin/AdminNav";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const { dbError } = await getSiteData();
  return (
    <div className="min-h-svh bg-neutral-950 text-white md:pl-60">
      <AdminNav name={admin.name || admin.email} />
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-20 md:px-8 md:pt-8">
        {dbError && (
          <p className="mb-6 rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Database problem — the public site is showing demo content: {dbError}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
