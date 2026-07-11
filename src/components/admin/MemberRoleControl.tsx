"use client";

import { useRef } from "react";
import { useActionState } from "react";
import { updateMemberRole, type ActionState } from "@/app/(app)/admin/actions";
import type { MembershipRole } from "@/lib/types";

const ROLES: MembershipRole[] = ["owner", "manager", "viewer"];

/** Super-admin control to change a member's per-company role; submits on change. */
export function MemberRoleControl({
  workspaceId,
  userId,
  role,
}: {
  workspaceId: string;
  userId: string;
  role: MembershipRole;
}) {
  const [, action] = useActionState<ActionState, FormData>(updateMemberRole, {});
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="user_id" value={userId} />
      <select
        name="role"
        defaultValue={role}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-md border border-line bg-surface px-2 py-1 text-[11.5px] font-semibold capitalize text-strong outline-none focus:border-purple"
      >
        {ROLES.map((r) => (
          <option key={r} value={r} className="capitalize">
            {r}
          </option>
        ))}
      </select>
    </form>
  );
}
