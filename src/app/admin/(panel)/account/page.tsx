import { asc } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { requireAdmin } from "@/server/auth";
import PageHeader from "@/components/admin/PageHeader";
import AccountForms from "@/components/admin/AccountForms";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const me = await requireAdmin();
  const admins = await db
    .select({ id: schema.admins.id, email: schema.admins.email, name: schema.admins.name })
    .from(schema.admins)
    .orderBy(asc(schema.admins.id));
  return (
    <>
      <PageHeader title="Account" desc={`Signed in as ${me.email}`} />
      <AccountForms admins={admins} meId={Number(me.sub)} />
    </>
  );
}
