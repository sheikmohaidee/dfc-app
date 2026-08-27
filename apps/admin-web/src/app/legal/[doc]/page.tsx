/**
 * Public policy pages.
 *
 * These are the URLs you paste into App Store Connect and the Play Console.
 * They are deliberately outside the auth wall — a store reviewer, and a person
 * who has already uninstalled the app, must both be able to read them.
 *
 * Google Play additionally requires a *web* URL where someone can request
 * account deletion without the app installed. That is /legal/delete-account.
 *
 * Content comes from @dfc/core, the same source the in-app screens render, so
 * the policy you link and the policy you ship cannot drift apart.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  COMPANY,
  POLICIES,
  POLICY_LIST,
  hasUnfilledPlaceholders,
  licences,
  type PolicyDocument,
} from '@dfc/core';

type Slug = PolicyDocument['id'];

const SLUGS: Slug[] = ['privacy', 'terms', 'refunds', 'delete-account'];

export function generateStaticParams() {
  return SLUGS.map((doc) => ({ doc }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ doc: string }>;
}): Promise<Metadata> {
  const { doc } = await params;
  const policy = POLICIES[doc as Slug];
  if (!policy) return { title: 'Not found' };
  return {
    title: `${policy.title} · ${COMPANY.tradingName}`,
    description: policy.summary,
    // Reviewers and users must be able to reach these; crawlers should too.
    robots: { index: true, follow: true },
  };
}

export default async function PolicyPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const policy = POLICIES[doc as Slug];
  if (!policy) notFound();

  const updated = new Date(policy.updated).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="mx-auto min-h-dvh max-w-[720px] px-6 py-12 sm:px-8 sm:py-16">
      <header className="flex flex-col gap-6 border-b pb-8">
        <Link href="/legal/privacy" className="flex w-fit items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-[13px] font-semibold tracking-tight text-primary-foreground">
            D
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[14px] font-semibold tracking-tight">
              {COMPANY.tradingName}
            </span>
            <span className="ta mt-1 text-[11px] text-placeholder">தினசரி உணவு கூரியர்</span>
          </span>
        </Link>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.03em]">
              {policy.title}
            </h1>
            <p className="ta text-[15px] text-muted-foreground">{policy.titleTa}</p>
          </div>
          <p className="max-w-[60ch] text-[15px] leading-relaxed text-body-strong">
            {policy.summary}
          </p>
          <p className="tnum text-[12px] text-placeholder">Last updated {updated}</p>
        </div>
      </header>

      {hasUnfilledPlaceholders() ? (
        <div className="mt-8 rounded-xl border border-verify-border bg-verify-tint p-4 text-[13px] leading-relaxed text-verify-fg">
          <strong className="font-semibold">Not ready to publish.</strong> Company details are
          still placeholders. Fill in <code className="tnum">COMPANY</code> in{' '}
          <code className="tnum">packages/core/src/legal.ts</code> and have a lawyer review this
          before linking it from a store listing — a policy containing a bracketed placeholder is
          an automatic rejection.
        </div>
      ) : null}

      <article className="mt-10 flex flex-col gap-9">
        {policy.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-3">
            <div>
              <h2 className="text-[19px] font-semibold tracking-[-0.02em]">{section.heading}</h2>
              {section.headingTa ? (
                <p className="ta mt-1 text-[13px] text-placeholder">{section.headingTa}</p>
              ) : null}
            </div>

            {section.body.map((para, i) => (
              <p key={i} className="max-w-[68ch] text-[15px] leading-[1.7] text-body-strong">
                {para}
              </p>
            ))}

            {section.bullets ? (
              <ul className="flex max-w-[68ch] flex-col gap-2.5 pt-1">
                {section.bullets.map((b, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-[10px] size-1.5 shrink-0 rounded-full bg-disabled" />
                    <span className="text-[15px] leading-[1.7] text-body-strong">{b}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </article>

      <footer className="mt-14 flex flex-col gap-5 border-t pt-8">
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {POLICY_LIST.map((p) => (
            <Link
              key={p.id}
              href={`/legal/${p.id}`}
              className={
                p.id === policy.id
                  ? 'text-[13px] font-medium text-foreground'
                  : 'text-[13px] text-muted-foreground underline-offset-4 hover:underline'
              }
            >
              {p.title}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-1 text-[12px] leading-relaxed text-placeholder">
          <span>
            {COMPANY.legalName} · {COMPANY.address}
          </span>
          <span className="tnum">
            {licences()
              .map((l) => `${l.label} ${l.value}`)
              .join(' · ')}
          </span>
          <span>
            Grievance Officer: {COMPANY.grievanceOfficer} ·{' '}
            <a href={`mailto:${COMPANY.privacyEmail}`} className="underline underline-offset-4">
              {COMPANY.privacyEmail}
            </a>{' '}
            · {COMPANY.grievancePhone}
          </span>
        </div>
      </footer>
    </main>
  );
}
