"use client";

import Link from "next/link";
import { SubPageLayout } from "@/components/landing/sub-page-layout";
import { ContributeForm } from "@/components/contribute-form";
import { useLanguage } from "@/lib/language-context";

export default function MithelfenPage() {
  const { t } = useLanguage();
  const tc = t.contribute;

  return (
    <SubPageLayout>
      <span className="eyebrow-pill">🤝 {tc.kicker}</span>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-50 md:text-5xl">
        {tc.title}
      </h1>
      <p className="mt-3 max-w-xl text-base text-neutral-300 md:text-lg">{tc.sub}</p>

      <div className="mt-10">
        <ContributeForm />
      </div>

      <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-widest text-neutral-500">
        🛡️ Anonym · Kein Login · Kein Tracking ·{" "}
        <Link
          href="/datenschutz"
          className="text-neutral-400 underline-offset-2 hover:text-neutral-200 hover:underline"
        >
          Datenschutz
        </Link>
      </p>
    </SubPageLayout>
  );
}
