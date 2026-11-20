import type { Metadata } from "next";
import { translate } from "@marketplace/shared";
import { VerifyEmailForm } from "@/components/verify-email-form";

export const metadata: Metadata = { title: translate("verifyEmail.title") };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="card auth-card">
      <VerifyEmailForm token={token} />
    </div>
  );
}
