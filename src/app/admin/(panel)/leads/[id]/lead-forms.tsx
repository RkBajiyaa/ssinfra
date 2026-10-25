"use client";

import { useActionState } from "react";
import { updateLeadNotesAction, updateLeadStatusAction, type ActionState } from "@/lib/admin/actions";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/domain";
import { buttonClass } from "@/components/ui/button";

function Feedback({ state }: { state: ActionState }) {
  if (!state) return null;
  return (
    <p role="status" className={`text-sm font-medium ${state.ok ? "text-ok" : "text-danger"}`}>
      {state.message}
    </p>
  );
}

export function StatusForm({ id, status }: { id: string; status: LeadStatus }) {
  const [state, action, pending] = useActionState(updateLeadStatusAction, null);
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="id" value={id} />
      <fieldset>
        <legend className="sr-only">Lead status</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-1 xl:grid-cols-1">
          {LEAD_STATUSES.map((s) => (
            <label
              key={s.id}
              className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[3px] border border-line px-3 text-sm font-medium has-[:checked]:border-navy has-[:checked]:bg-navy has-[:checked]:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-turf"
            >
              <input type="radio" name="status" value={s.id} defaultChecked={s.id === status} className="size-4 accent-white" />
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={buttonClass("dark", "md")}>
          {pending ? "Saving…" : "Save status"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function NotesForm({ id, notes }: { id: string; notes: string | null }) {
  const [state, action, pending] = useActionState(updateLeadNotesAction, null);
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="id" value={id} />
      <label htmlFor="notes" className="sr-only">
        Internal notes
      </label>
      <textarea
        id="notes"
        name="notes"
        rows={6}
        maxLength={5000}
        defaultValue={notes ?? ""}
        placeholder="Call outcomes, site details, quotation reference… Only admins see these."
        className="block w-full rounded-[3px] border border-line bg-white px-3.5 py-3 text-[0.95rem] focus:outline-2 focus:outline-offset-0 focus:outline-turf"
      />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={buttonClass("dark", "md")}>
          {pending ? "Saving…" : "Save notes"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}
