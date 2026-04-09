"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteContent } from "@/lib/site-content";

type FormState = {
  name: string;
  phone: string;
  email: string;
  goal: string;
};

const initialFormState: FormState = {
  name: "",
  phone: "",
  email: "",
  goal: ""
};

export function LeadFormSection() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setErrorMessage(data.error ?? "Please try again.");
        return;
      }

      setSuccessMessage(data.message ?? "Your consultation request has been submitted.");
      setForm(initialFormState);
    } catch (error) {
      console.error(error);
      setErrorMessage("We could not submit the form right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="lead-form" className="section-space">
      <div className="container-shell grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <SectionHeading
            eyebrow="Consultation"
            title={siteContent.leadForm.title}
            description={siteContent.leadForm.description}
          />
          <div className="mt-8 panel p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">
              Best Fit Clients
            </p>
            <ul className="mt-4 space-y-3 text-base leading-7 text-zinc-300">
              {siteContent.leadForm.fitPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="panel border-accent/25 p-6 shadow-glow sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-zinc-300">
                Full Name
              </label>
              <input
                id="name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base text-ink outline-none transition placeholder:text-zinc-500 focus:border-accent"
                placeholder="Your name"
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-zinc-300">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base text-ink outline-none transition placeholder:text-zinc-500 focus:border-accent"
                placeholder="Best contact number"
                autoComplete="tel"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-zinc-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base text-ink outline-none transition placeholder:text-zinc-500 focus:border-accent"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="goal" className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-zinc-300">
                Main Goal
              </label>
              <textarea
                id="goal"
                value={form.goal}
                onChange={(event) => setForm((current) => ({ ...current, goal: event.target.value }))}
                className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base text-ink outline-none transition placeholder:text-zinc-500 focus:border-accent"
                placeholder="Tell us what you want to achieve over the next 3-6 months."
                required
              />
            </div>

            {errorMessage ? (
              <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {successMessage}
              </p>
            ) : null}

            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Book My Consultation"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
