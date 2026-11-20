import type { Metadata } from "next";
import { translate } from "@marketplace/shared";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: translate("login.title") };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="card auth-card">
      <LoginForm next={next} />
    </div>
  );
}
