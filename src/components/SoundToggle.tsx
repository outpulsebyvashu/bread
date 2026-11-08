"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { unlockAudio } from "@/lib/audio";
import { Button } from "./ui";

// Browsers only allow sound after a tap, so every alerting screen has this button.
export function SoundToggle({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
  const [error, setError] = useState(false);
  return (
    <Button
      variant={enabled ? "lime" : "primary"}
      aria-pressed={enabled}
      onClick={async () => {
        if (enabled) return onChange(false);
        try {
          onChange(await unlockAudio());
          setError(false);
        } catch {
          setError(true);
        }
      }}
    >
      {enabled ? <Volume2 size={18} strokeWidth={1.5} aria-hidden /> : <VolumeX size={18} strokeWidth={1.5} aria-hidden />}
      {error ? "Sound unavailable" : enabled ? "Sound on" : "Enable sound"}
    </Button>
  );
}
