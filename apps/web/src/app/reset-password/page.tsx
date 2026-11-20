import type { Metadata } from "next";
import { translate } from "@marketplace/shared";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = { title: translate("reset.title") };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="card auth-card">
      <ResetPasswordForm token={token} />
    </div>
  );
}
