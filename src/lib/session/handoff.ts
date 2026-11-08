import "server-only";

// Each hand-off pass works once. This list is memory on one server; with several servers it moves to the database.
const used = ((globalThis as { __breadHandoffs?: Map<string, number> }).__breadHandoffs ??= new Map<string, number>());

export function consumeHandoff(nonce: string | undefined, exp: number, now: number) {
  for (const [key, until] of used) if (until < now) used.delete(key);
  if (!nonce || used.has(nonce)) return false;
  used.set(nonce, exp);
  return true;
}
