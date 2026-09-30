import { deleteAppointment, getAppointment, getEnrollment, saveAppointment, saveEnrollment } from "@/lib/courses";
import { error, json, requireAdmin } from "@/lib/http";
import { cleanAppt } from "@/lib/appt";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const a = await getAppointment(id);
  if (!a) return error("Not found.", 404);
  const b = await req.json().catch(() => ({}));
  const next = cleanAppt({ ...b, enrollmentId: a.enrollmentId, countsAsSession: a.countsAsSession }, a);
  await saveAppointment(next);
  return json(next);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const a = await getAppointment(id);
  if (!a) return json({ ok: true });
  if (a.countsAsSession && a.enrollmentId) {
    const e = await getEnrollment(a.enrollmentId);
    if (e) {
      e.sessionsUsed = Math.max(0, e.sessionsUsed - 1);
      await saveEnrollment(e);
    }
  }
  await deleteAppointment(id);
  return json({ ok: true });
}
