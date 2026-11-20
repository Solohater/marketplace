import Link from "next/link";
import { translate } from "@marketplace/shared";

export default function HomePage() {
  return (
    <section className="hero">
      <h1>{translate("home.title")}</h1>
      <p>{translate("home.subtitle")}</p>
      <div className="hero-actions">
        <Link className="btn btn-primary" href="/register">
          {translate("home.register")}
        </Link>
        <Link className="btn" href="/login">
          {translate("home.login")}
        </Link>
      </div>
    </section>
  );
}
