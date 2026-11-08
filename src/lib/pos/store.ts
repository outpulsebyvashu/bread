import "server-only";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createDemoState } from "./demo";
import { dispatch, drainNiroOutbox } from "./engine";
import { DEMO_STAFF_PHONES } from "./seed";
import type { Actor, PosState } from "./types";

// Local stand-in for the database: one state object, saved to a gitignored file.
// A single process only. Supabase replaces this file at the final stage.
const DIR = join(process.cwd(), ".data");
const FILE = join(DIR, "breadpos.json");
const NIRO_RETRY_MS = 20_000;

type Holder = { state?: PosState; lastDrain: number };
const holder = ((globalThis as { __breadpos?: Holder }).__breadpos ??= { lastDrain: 0 });

function save(state: PosState) {
  mkdirSync(DIR, { recursive: true });
  const temp = `${FILE}.tmp`;
  writeFileSync(temp, JSON.stringify(state));
  renameSync(temp, FILE);
}

export function readState(): PosState {
  if (!holder.state) {
    holder.state = existsSync(FILE) ? (JSON.parse(readFileSync(FILE, "utf8")) as PosState) : createDemoState(Date.now());
    if (!existsSync(FILE)) save(holder.state);
    // Saved demo data from before phone sign-in.
    for (const staff of holder.state.staff) staff.phone ??= DEMO_STAFF_PHONES[staff.id] ?? "";
    holder.state.settings.demoMode ??= true;
  }
  return holder.state;
}

export function runCommand(actor: Actor, type: string, args: unknown) {
  const { state, result } = dispatch(readState(), actor, type, args, Date.now());
  drainNiroOutbox(state);
  holder.state = state;
  save(state);
  return result;
}

// For changes that must be kept even when the action fails, such as a wrong PIN at login.
export function mutateState<T>(change: (state: PosState) => T): T {
  const state = readState();
  try {
    return change(state);
  } finally {
    save(state);
  }
}

// Retries queued Niro deliveries while the app is in use. Worker replaces this at the Supabase stage.
export function tickOutbox(now: number) {
  if (now - holder.lastDrain < NIRO_RETRY_MS) return;
  holder.lastDrain = now;
  const state = readState();
  if (drainNiroOutbox(state)) save(state);
}

export function resetDemo() {
  holder.state = createDemoState(Date.now());
  save(holder.state);
}
