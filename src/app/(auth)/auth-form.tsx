"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/misc";
import type { AuthState } from "./actions";

type FieldDef = { name: string; label: string; type?: string; autoComplete?: string };

export function AuthForm({
  action,
  fields,
  submitLabel,
}: {
  action: (s: AuthState, f: FormData) => Promise<AuthState>;
  fields: FieldDef[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-4">
      {fields.map((f) => (
        <Field key={f.name} label={f.label} htmlFor={f.name}>
          <Input id={f.name} name={f.name} type={f.type ?? "text"} autoComplete={f.autoComplete} required={f.name !== "token"} />
        </Field>
      ))}
      {state?.error && <Notice tone="danger">{state.error}</Notice>}
      <Button type="submit" className="w-full" loading={pending}>
        {submitLabel}
      </Button>
    </form>
  );
}
