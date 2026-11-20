import type { Metadata } from "next";
import { translate } from "@marketplace/shared";
import { VerifyPhoneForm } from "@/components/verify-phone-form";

export const metadata: Metadata = { title: translate("verifyPhone.title") };

export default async function VerifyPhonePage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>;
}) {
  const { phone } = await searchParams;
  return (
    <div className="card auth-card">
      <VerifyPhoneForm phone={phone} />
    </div>
  );
}
