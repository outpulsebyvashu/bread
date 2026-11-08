import type { SupabaseClient } from "@supabase/supabase-js";

const DEBOUNCE_MS = 250;
const POLL_MS = 30_000;

// Calls `refetch` when any of `tables` changes (debounced), every 30 s as a
// fallback, and when the tab regains focus. Returns an unsubscribe function.
export function watch(supabase: SupabaseClient, tables: string[], refetch: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debounced = () => {
    clearTimeout(timer);
    timer = setTimeout(refetch, DEBOUNCE_MS);
  };

  const channel = supabase.channel(`watch:${tables.join(",")}`);
  for (const table of tables) {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, debounced);
  }
  channel.subscribe();

  const poll = setInterval(refetch, POLL_MS);
  const onVisible = () => {
    if (document.visibilityState === "visible") refetch();
  };
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    clearTimeout(timer);
    clearInterval(poll);
    document.removeEventListener("visibilitychange", onVisible);
    supabase.removeChannel(channel);
  };
}
