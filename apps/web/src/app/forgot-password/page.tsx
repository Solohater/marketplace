import type { Metadata } from "next";
import { translate } from "@marketplace/shared";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = { title: translate("forgot.title") };

export default function ForgotPasswordPage() {
  return (
    <div className="card auth-card">
      <ForgotPasswordForm />
    </div>
  );
}
