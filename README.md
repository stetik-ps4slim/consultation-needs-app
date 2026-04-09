# Upper Notch Coaching

Premium, mobile-first landing page for a personal training business built with Next.js, Tailwind CSS, and Supabase.

## App Structure

```text
app/
  api/leads/route.ts        # Handles lead form submissions
  globals.css               # Global styles and design tokens
  layout.tsx                # Fonts, metadata, shared shell
  page.tsx                  # Landing page composition
components/
  sections/                 # Hero, about, services, testimonials, FAQ, lead form, CTA
  ui/                       # Reusable button, header, section heading
lib/
  supabase.ts               # Supabase admin client helper
  site-content.ts           # Central place to edit brand copy, prices, links
supabase/
  schema.sql                # Leads table schema
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and add your Supabase values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

3. Create the `leads` table in Supabase using `supabase/schema.sql`.

4. Run locally:

```bash
npm run dev
```

5. Deploy to Vercel and add the same environment variables in the project settings.

## Notes

- The form submits to `/api/leads` and stores `name`, `phone`, `email`, and `goal`.
- A success message is shown in the UI after submission.
- The service role key is only used server-side inside the API route.
- Edit business copy, package prices, testimonials, and the Calendly URL in `lib/site-content.ts`.

## Good Next Improvements

- Add an admin dashboard for lead management and follow-up status.
- Connect the form to email notifications or SMS alerts.
- Add real client photos, proof metrics, and a consultation calendar integration.
- Add analytics events for CTA clicks and form completion rate.
# consultation-needs-app
