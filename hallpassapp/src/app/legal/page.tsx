import Link from "next/link";
import type { Metadata } from "next";
import { LEGAL_CONTACT_EMAIL } from "@/lib/legal-contact";

export const metadata: Metadata = {
  title: "Legal & intellectual property | Hall Pass",
  description:
    "Copyright and intellectual property notice for the Hall Pass application.",
};

export default function LegalPage() {
  return (
    <div className="flex flex-1 flex-col px-4 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/"
          className="text-sm font-semibold text-[var(--hp-ink-muted)] hover:text-[var(--hp-ink)]"
        >
          ← Home
        </Link>
        <h1 className="mt-6 font-[family-name:var(--font-hp-display)] text-3xl font-semibold text-[var(--hp-ink)]">
          Legal &amp; intellectual property
        </h1>
        <div className="mt-8 space-y-5 text-sm leading-relaxed text-[var(--hp-ink-muted)]">
          <p className="text-[var(--hp-ink)]">
            © {new Date().getFullYear()} Hall Pass. All rights reserved.
          </p>
          <p>
            The Hall Pass name, logo, user interface, codebase, and original
            content on this site are owned by their respective rights holders
            and are protected by copyright and other intellectual property laws.
            Nothing herein grants a license to copy, modify, distribute, or
            exploit them without prior written permission, except as allowed by
            applicable law.
          </p>
          <p>
            Third-party names (including celebrities) and trademarks are the
            property of their owners; use here is for identification only and
            does not imply endorsement.
          </p>
          <p>
            For licensing, takedown requests, or other IP matters, contact:{" "}
            <a
              className="font-medium text-[var(--hp-rose)] underline-offset-2 hover:underline"
              href={`mailto:${LEGAL_CONTACT_EMAIL}?subject=Hall%20Pass%20—%20IP%20inquiry`}
            >
              {LEGAL_CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
