import "server-only";
import { cookies } from "next/headers";
import { listWorkspaces } from "./data";
import type { Workspace } from "./types";
import { WS_COOKIE } from "./constants";

/**
 * Active client workspace for the current request. Comes from the `ot_ws`
 * cookie set by the client switcher; defaults to the first workspace the user
 * can see. Once Supabase auth lands this is intersected with the user's
 * memberships so a client_user can never select a workspace they don't own.
 */
export async function getActiveWorkspace(): Promise<Workspace> {
  const all = await listWorkspaces();
  const jar = await cookies();
  const id = jar.get(WS_COOKIE)?.value;
  return all.find((w) => w.id === id) ?? all[0];
}
