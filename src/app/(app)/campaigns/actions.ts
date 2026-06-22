"use server";

import { revalidatePath } from "next/cache";
import { getActiveWorkspace } from "@/lib/workspace";
import { clientForWorkspace } from "@/lib/credentials";

export interface LaunchSequenceStep {
  subject: string;
  body: string;
  delayDays: number;
}
export interface LaunchSchedule {
  timezone: string;
  daysOfWeek: number[];
  startHour: string;
  endHour: string;
  minTimeBtwEmails: number;
  maxLeadsPerDay: number;
}
export interface LaunchLead {
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}
export interface LaunchPayload {
  name: string;
  sequence: LaunchSequenceStep[];
  schedule: LaunchSchedule;
  senderIds: string[];
  leads: LaunchLead[];
  launch: boolean;
}
export interface LaunchResult {
  ok?: boolean;
  demo?: boolean;
  error?: string;
  message?: string;
  campaignId?: number;
}

/**
 * Orchestrates a full Smartlead campaign for the signed-in client's workspace:
 * create → sequence → schedule → assign senders → add leads → (optionally) start.
 * Runs under that workspace's client-scoped key, so it's automatically isolated.
 */
export async function launchCampaign(payload: LaunchPayload): Promise<LaunchResult> {
  const name = payload.name.trim();
  if (!name) return { error: "Campaign name is required." };
  if (payload.sequence.length === 0) return { error: "Add at least one email step." };
  if (payload.leads.length === 0) return { error: "Add at least one lead." };

  const ws = await getActiveWorkspace();
  const client = await clientForWorkspace(ws);

  // Demo / not-yet-connected workspace: validate and report, don't send.
  if (!client) {
    return {
      ok: true,
      demo: true,
      message: `Demo: validated “${name}” — ${payload.sequence.length} step(s), ${payload.leads.length} lead(s), ${payload.senderIds.length} sender(s). Connect this client to Smartlead to actually launch.`,
    };
  }

  try {
    const { id } = await client.createCampaign(name, ws.smartleadClientId ?? undefined);

    await client.saveSequence(
      id,
      payload.sequence.map((s, i) => ({
        seqNumber: i + 1,
        subject: s.subject,
        emailBody: s.body,
        delayDays: i === 0 ? 0 : s.delayDays,
      }))
    );

    await client.updateSchedule(id, payload.schedule);

    const senderIds = payload.senderIds.map((s) => Number(s)).filter((n) => Number.isFinite(n));
    if (senderIds.length) await client.assignEmailAccounts(id, senderIds);

    const { uploaded } = await client.addLeads(id, payload.leads);

    if (payload.launch) await client.updateStatus(id, "START");

    revalidatePath("/campaigns");
    return {
      ok: true,
      campaignId: id,
      message: payload.launch
        ? `Launched “${name}” — ${uploaded} leads imported and sending started.`
        : `Saved “${name}” as a draft — ${uploaded} leads imported. Start it from the campaign list when ready.`,
    };
  } catch (e) {
    return { error: `Smartlead error: ${(e as Error).message}` };
  }
}
