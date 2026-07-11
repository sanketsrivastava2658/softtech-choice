"use client";

import { useActionState } from "react";
import { updateBranding, type ActionState } from "@/app/(app)/admin/actions";
import type { Workspace } from "@/lib/types";

export function BrandingForm({ ws }: { ws: Workspace }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    updateBranding,
    {}
  );

  return (
    <form action={action} className="flex flex-col gap-3 px-5 py-4">
      <input type="hidden" name="workspace_id" value={ws.id} />
      <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-strong">
        Display name
        <input
          name="display_name"
          defaultValue={ws.displayName ?? ""}
          placeholder={ws.name}
          className="rounded-lg border border-line px-3 py-2 text-[13.5px] outline-none focus:border-purple"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-strong">
        Logo URL
        <input
          name="logo_url"
          type="url"
          defaultValue={ws.logoUrl ?? ""}
          placeholder="https://…/logo.png"
          className="rounded-lg border border-line px-3 py-2 text-[13.5px] outline-none focus:border-purple"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-strong">
        Brand color (hex)
        <div className="flex items-center gap-2">
          <input
            name="brand_color"
            defaultValue={ws.brandColor ?? ""}
            placeholder="#7c3aed"
            className="num flex-1 rounded-lg border border-line px-3 py-2 text-[13.5px] outline-none focus:border-purple"
          />
          <span
            className="h-8 w-8 flex-none rounded-lg border border-line"
            style={{ backgroundColor: ws.brandColor || "transparent" }}
          />
        </div>
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-purple px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "…" : "Save branding"}
        </button>
        {state.error && <span className="text-[12.5px] text-red">{state.error}</span>}
        {state.ok && <span className="text-[12.5px] text-green">{state.message}</span>}
      </div>
    </form>
  );
}
