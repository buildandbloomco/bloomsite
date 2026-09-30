import { getSettings, saveSettings } from "@/lib/data";
import { error, json, requireAdmin } from "@/lib/http";
import type { Settings } from "@/lib/types";

const str = (v: unknown, max = 500) => String(v ?? "").slice(0, max);
const list = (v: unknown) => (Array.isArray(v) ? v.map((x) => str(x)).filter((x) => x.trim()) : []);

export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const b = await req.json().catch(() => null);
  if (!b) return error("Bad request.");
  const cur = await getSettings();
  const next: Settings = {
    ...cur,
    brandName: str(b.brandName, 120) || cur.brandName,
    tagline: str(b.tagline),
    email: str(b.email, 200),
    phone: str(b.phone, 60),
    website: str(b.website, 300),
    instagram: str(b.instagram, 300),
    location: str(b.location, 120),
    bookingUrl: str(b.bookingUrl, 500),
    bookingEmbed: !!b.bookingEmbed,
    beforeYouBook: list(b.beforeYouBook),
    defaultNextSteps: list(b.defaultNextSteps),
  };
  await saveSettings(next);
  return json(next);
}
