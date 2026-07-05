import { isAuthed } from "@/lib/showcase-admin";
import PasswordForm from "./password-form";

export const dynamic = "force-dynamic";

export default async function StudioDashboardPage() {
  if (!(await isAuthed())) {
    return <PasswordForm />;
  }
  const { default: DashboardClient } = await import("./dashboard-client");
  return <DashboardClient />;
}
