import type { Metadata } from "next";
import { translate } from "@marketplace/shared";
import { RegisterForm } from "@/components/register-form";

export const metadata: Metadata = { title: translate("register.title") };

export default function RegisterPage() {
  return (
    <div className="card auth-card">
      <RegisterForm />
    </div>
  );
}
