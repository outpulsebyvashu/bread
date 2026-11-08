"use client";

import { useState, type ReactNode } from "react";
import { CommandError } from "@/lib/client";
import type { Approvalish } from "@/lib/pos/types";
import type { Role } from "@/lib/roles";
import { Button, ErrorText, Field, Sheet } from "./ui";

// Reason list plus, for anyone below manager, a manager PIN right here on their own session.
export function ApprovalSheet({
  title,
  detail,
  reasons,
  role,
  pinOptional,
  confirmLabel = "Confirm",
  extra,
  onSubmit,
  onClose,
}: {
  title: string;
  detail?: string;
  reasons: string[];
  role: Role | undefined;
  pinOptional?: boolean;
  confirmLabel?: string;
  extra?: ReactNode;
  onSubmit: (approval: Approvalish) => Promise<unknown>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [other, setOther] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const needsPin = role !== "manager" && role !== "admin";

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const finalReason = reason === "Other" ? `Other: ${other.trim()}` : reason;
      await onSubmit({ reason: finalReason, pin: pin || undefined });
      onClose();
    } catch (problem) {
      setError(problem instanceof CommandError ? problem.message : "That did not work");
      setPin("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title={title} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {detail && <p className="text-sm text-muted">{detail}</p>}
        {extra}
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Reason</legend>
          <div className="flex flex-wrap gap-2">
            {reasons.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={reason === option}
                onClick={() => setReason(option)}
                className={`tap min-h-11 rounded-pill px-4 text-sm ${reason === option ? "bg-ink text-white" : "bg-canvas"}`}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>
        {reason === "Other" && <Field label="Say what happened" value={other} onChange={(event) => setOther(event.target.value)} />}
        {needsPin && (
          <Field
            label={pinOptional ? "Manager PIN (needed above your limit)" : "Manager PIN"}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            hint="Demo manager PIN: 1234"
          />
        )}
        <ErrorText>{error}</ErrorText>
        <Button onClick={submit} disabled={busy || !reason || (reason === "Other" && !other.trim())}>
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}
