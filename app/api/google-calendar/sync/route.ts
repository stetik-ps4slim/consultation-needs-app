import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

type TokenRow = {
  id: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  event_ids: string[];
};

type ScheduleBlock = { id: number; start: string; end: string; activity: string };
type DaySchedule   = { blocks: ScheduleBlock[] };
type WeekSchedule  = Record<string, DaySchedule>;
type TwoWeekSchedule = { week1: WeekSchedule; week2: WeekSchedule };

type GoogleTokenRefresh = {
  access_token?: string;
  expires_in?: number;
  error?: string;
};

type GoogleEventResponse = { id?: string };

// ── Constants ─────────────────────────────────────────────────────────────────

const WEEK_DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] as const;

const DAY_OFFSET: Record<string, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3,
  friday: 4, saturday: 5, sunday: 6,
};

// Jazzay is based at Fitness First Richmond — Melbourne timezone
const TIMEZONE = "Australia/Melbourne";
const CALENDAR_ID = "primary";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeStringToISO(date: Date, timeStr: string): string | null {
  if (!timeStr || timeStr === "—") return null;
  const pm = timeStr.endsWith("pm");
  const [hStr, mStr] = timeStr.replace(/[ap]m$/, "").split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const h24 = pm ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
  const d = new Date(date);
  d.setHours(h24, m, 0, 0);
  return d.toISOString();
}

async function refreshAccessToken(row: TokenRow): Promise<{ token: string; updated: Partial<TokenRow> | null }> {
  // Token still valid (with 60s buffer)
  if (Date.now() < row.expires_at - 60_000) {
    return { token: row.access_token, updated: null };
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: row.refresh_token,
      grant_type: "refresh_token",
    }).toString(),
  });

  const data = (await res.json()) as GoogleTokenRefresh;

  if (!res.ok || !data.access_token) {
    throw new Error("Failed to refresh Google access token. Please reconnect Google Calendar.");
  }

  const updated: Partial<TokenRow> = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in ?? 3600) * 1000,
  };

  return { token: data.access_token, updated };
}

async function deleteGoogleEvent(token: string, eventId: string) {
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${eventId}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
  );
  // Silently ignore errors — event may already be deleted
}

async function createGoogleEvent(token: string, event: object): Promise<string | null> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!res.ok) return null;
  const data = (await res.json()) as GoogleEventResponse;
  return data.id ?? null;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { schedule: TwoWeekSchedule };
    const { schedule } = body;

    if (!schedule) {
      return NextResponse.json({ error: "No schedule data provided." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: row } = await supabase
      .from("google_tokens")
      .select("*")
      .eq("id", "singleton")
      .maybeSingle();

    if (!row) {
      return NextResponse.json({ error: "Google Calendar is not connected. Please connect first." }, { status: 401 });
    }

    const { token, updated } = await refreshAccessToken(row as TokenRow);

    if (updated) {
      await supabase.from("google_tokens").update(updated).eq("id", "singleton");
    }

    // 1. Delete all previously synced events
    const existingIds: string[] = (row as TokenRow).event_ids ?? [];
    await Promise.all(existingIds.map((id) => deleteGoogleEvent(token, id)));

    // 2. Anchor Week 1 to the current Monday
    const now = new Date();
    const dow = now.getDay(); // 0 = Sunday
    const daysToMonday = dow === 0 ? -6 : 1 - dow;
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() + daysToMonday);
    thisMonday.setHours(0, 0, 0, 0);

    // 3. Create fresh events for all blocks
    const newEventIds: string[] = [];

    for (const [wi, wk] of (["week1", "week2"] as const).entries()) {
      const weekSchedule = schedule[wk] ?? {};

      for (const day of WEEK_DAYS) {
        const blocks = weekSchedule[day]?.blocks ?? [];

        for (const block of blocks) {
          const eventDate = new Date(thisMonday);
          eventDate.setDate(thisMonday.getDate() + wi * 7 + DAY_OFFSET[day]);

          const startISO = timeStringToISO(eventDate, block.start);
          if (!startISO) continue; // Skip blocks with no start time

          const endISO = timeStringToISO(eventDate, block.end);

          const event = {
            summary: block.activity,
            description: "Upper Notch Coaching — Daily Schedule",
            start: endISO
              ? { dateTime: startISO, timeZone: TIMEZONE }
              : { date: eventDate.toISOString().slice(0, 10) },
            end: endISO
              ? { dateTime: endISO, timeZone: TIMEZONE }
              : { date: eventDate.toISOString().slice(0, 10) },
            colorId: "5", // banana/gold
          };

          const eventId = await createGoogleEvent(token, event);
          if (eventId) newEventIds.push(eventId);
        }
      }
    }

    // 4. Save new event IDs for next sync cleanup
    await supabase
      .from("google_tokens")
      .update({ event_ids: newEventIds, updated_at: new Date().toISOString() })
      .eq("id", "singleton");

    return NextResponse.json({
      message: `Synced ${newEventIds.length} events to Google Calendar.`,
      count: newEventIds.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed. Please try again." },
      { status: 500 }
    );
  }
}
