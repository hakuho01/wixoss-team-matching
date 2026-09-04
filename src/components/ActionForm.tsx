"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/actions/auth";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
};

export function ActionForm({ action, children, className }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className={className}>
      {state.error && (
        <p className="mb-3 rounded-md border border-red-400/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="mb-3 rounded-md border border-emerald-400/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          {state.success}
        </p>
      )}
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
    </form>
  );
}
