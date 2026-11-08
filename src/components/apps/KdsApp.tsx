"use client";

import { Ban, Printer, Undo2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { beep, speak } from "@/lib/audio";
import { CommandError, minutesSince, sendCommand, timeLabel, useLive } from "@/lib/client";
import type { KdsView } from "@/lib/pos/views";
import { useHost } from "@/lib/client/host";
import { AppFrame } from "../AppFrame";
import { KotDoc, PrintNow } from "../PrintDocs";
import { SoundToggle } from "../SoundToggle";
import { Button, Chip, EmptyState, ErrorText, Loading, PageTitle, Segmented, Sheet } from "../ui";

const REPEAT_MS = 30_000;
type Ticket = KdsView["tickets"][number];

const ageClass = (minutes: number) => (minutes >= 20 ? "bg-pink" : minutes >= 10 ? "bg-mustard" : "bg-card");

const announcement = (ticket: Ticket) =>
  `${ticket.tableLabel}. ${ticket.lines
    .filter((line) => line.status === "new")
    .map((line) => `${line.qty} ${line.name}`)
    .join(", ")}`;

function TicketCard({ ticket, now, onAction, onPrint }: { ticket: Ticket; now: number; onAction: (type: string, args: unknown) => void; onPrint: (ticket: Ticket) => void }) {
  const hasNew = ticket.lines.some((line) => line.status === "new");
  const hasPreparing = ticket.lines.some((line) => line.status === "preparing");
  const done = !hasNew && !hasPreparing;
  const minutes = minutesSince(ticket.at, now);

  return (
    <article className={`flex flex-col gap-3 rounded-3xl p-4 ${done ? "bg-olive" : ageClass(minutes)}`}>
      <header className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xl font-bold">{ticket.tableLabel}</h3>
          <p className="text-xs">
            KOT {ticket.no} · Order {ticket.checkNo} · Round {ticket.round}
          </p>
        </div>
        <Chip className="bg-ink text-white">{minutes} min</Chip>
      </header>
      {ticket.alert && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-ink p-2 pl-3 text-sm text-white">
          <span className="font-semibold">{ticket.alert}</span>
          <Button variant="lime" onClick={() => onAction("ack_kot", { kotId: ticket.id })}>
            Got it
          </Button>
        </div>
      )}
      <ul className="flex flex-col gap-1">
        {ticket.lines.map((line) => (
          <li key={line.id}>
            <button
              type="button"
              disabled={!["new", "preparing"].includes(line.status)}
              onClick={() => onAction("bump_line", { lineId: line.id })}
              aria-label={`${line.qty} ${line.name}, ${line.status}. Move on one step.`}
              className={`tap flex min-h-11 w-full flex-col justify-center rounded-2xl bg-white/60 px-3 py-1 text-left disabled:bg-transparent ${line.status === "void" ? "text-muted line-through" : ""}`}
            >
              <span className="flex items-center justify-between gap-2 font-semibold">
                {line.qty} x {line.name}
                {["ready", "served"].includes(line.status) && <Chip className="bg-lime">Done</Chip>}
                {line.status === "preparing" && <Chip className="bg-card">Cooking</Chip>}
              </span>
              {line.mods.length > 0 && <span className="text-xs">{line.mods.join(", ")}</span>}
              {line.note && <span className="text-xs font-semibold">Note: {line.note}</span>}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-wrap gap-2">
        {hasNew && <Button onClick={() => onAction("bump_kot", { kotId: ticket.id })}>Accept</Button>}
        {!hasNew && hasPreparing && (
          <Button variant="lime" onClick={() => onAction("bump_kot", { kotId: ticket.id })}>
            Ready
          </Button>
        )}
        {done && ticket.readyAt && ticket.lines.some((line) => line.status === "ready") && (
          <Button variant="soft" onClick={() => onAction("recall_kot", { kotId: ticket.id })}>
            <Undo2 size={18} strokeWidth={1.5} aria-hidden />
            Recall
          </Button>
        )}
        <Button variant="ghost" aria-label={`Print KOT ${ticket.no}`} onClick={() => onPrint(ticket)}>
          <Printer size={18} strokeWidth={1.5} aria-hidden />
          Print
        </Button>
      </div>
    </article>
  );
}

function AvailabilitySheet({ data, onAction, onClose }: { data: KdsView; onAction: (type: string, args: unknown) => void; onClose: () => void }) {
  return (
    <Sheet title="Sold out" onClose={onClose} wide>
      <p className="mb-3 text-sm text-muted">Applies to captains, QR ordering and the till straight away. &quot;Today&quot; comes back at day close.</p>
      <ul className="divide-y divide-dashed divide-hairline">
        {data.availability.map((item) => {
          const off = item.soldOut !== "none" && (item.soldOut !== "until" || (item.soldOutUntil ?? 0) > data.now);
          return (
            <li key={item.id} className="py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {item.name}
                  {item.stockBlocked && <Chip className="ml-2 bg-mustard">Out of stock</Chip>}
                  {off && <Chip className="ml-2 bg-pink">{item.soldOut === "until" ? `Until ${timeLabel(item.soldOutUntil ?? 0)}` : item.soldOut === "day" ? "Today" : "Until turned on"}</Chip>}
                </span>
                <span className="flex flex-wrap gap-1">
                  {off ? (
                    <Button variant="lime" onClick={() => onAction("set_availability", { itemId: item.id, mode: "available" })}>
                      Back on
                    </Button>
                  ) : (
                    <>
                      <Button variant="soft" onClick={() => onAction("set_availability", { itemId: item.id, mode: "hours", hours: 2 })}>2 hours</Button>
                      <Button variant="soft" onClick={() => onAction("set_availability", { itemId: item.id, mode: "day" })}>Today</Button>
                      <Button variant="soft" onClick={() => onAction("set_availability", { itemId: item.id, mode: "indefinite" })}>Until on</Button>
                    </>
                  )}
                  {item.stockBlocked && (
                    <Button variant="ghost" onClick={() => onAction("set_availability", { itemId: item.id, mode: "available", ignoreStock: true })}>
                      Sell anyway
                    </Button>
                  )}
                </span>
              </div>
              {item.options.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {item.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={!option.available}
                      onClick={() => onAction("set_availability", { modifierId: option.id, mode: option.available ? "indefinite" : "available" })}
                      className={`tap min-h-11 rounded-pill px-3 text-xs ${option.available ? "bg-canvas" : "bg-pink line-through"}`}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

export function KdsApp() {
  const host = useHost("kitchen");
  const { data, me, offline, refresh } = useLive<KdsView>(`/api/app/${host.app}/view/kds`, host.login);
  const [station, setStation] = useState("all");
  const [sound, setSound] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [printing, setPrinting] = useState<{ ticket: Ticket; duplicate: boolean } | null>(null);
  const [error, setError] = useState("");
  const seen = useRef<Set<string> | null>(null);
  const printed = useRef(new Set<string>());

  const tickets = useMemo(() => (data?.tickets ?? []).filter((ticket) => station === "all" || ticket.stationId === station).sort((a, b) => a.at - b.at), [data?.tickets, station]);
  const newTickets = tickets.filter((ticket) => ticket.lines.some((line) => line.status === "new"));
  const newKey = newTickets.map((ticket) => ticket.id).join(",");

  useEffect(() => {
    if (!data) return;
    const ids = new Set(data.tickets.map((ticket) => ticket.id));
    if (seen.current && sound) {
      for (const ticket of data.tickets.filter((row) => !seen.current!.has(row.id))) {
        beep();
        speak(`New order. ${announcement(ticket)}`);
      }
    }
    seen.current = ids;
  }, [data, sound]);

  // Keeps repeating every 30 seconds while any ticket has not been accepted.
  useEffect(() => {
    if (!sound || !newKey) return;
    const timer = setInterval(() => {
      beep();
      speak(`Waiting. ${newTickets.map(announcement).join(". ")}`);
    }, REPEAT_MS);
    return () => clearInterval(timer);
    // Restart only when the waiting tickets change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sound, newKey]);

  const act = async (type: string, args: unknown) => {
    setError("");
    try {
      await sendCommand(host.app, type, args);
      await refresh();
    } catch (problem) {
      setError(problem instanceof CommandError ? problem.message : "That did not work");
    }
  };
  const print = async (ticket: Ticket) => {
    const duplicate = printed.current.has(ticket.id) || ticket.reprints > 0;
    printed.current.add(ticket.id);
    if (duplicate) await act("reprint_kot", { kotId: ticket.id });
    setPrinting({ ticket, duplicate });
  };


  const allDay = new Map<string, number>();
  for (const ticket of tickets) {
    for (const line of ticket.lines) {
      if (["new", "preparing"].includes(line.status)) allDay.set(line.name, (allDay.get(line.name) ?? 0) + line.qty);
    }
  }

  return (
    <AppFrame app={host.app} tabs={[]} me={me} offline={offline}>
      {!data ? (
        <Loading />
      ) : (
        <>
          <PageTitle muted="Kitchen" strong="board">
            <SoundToggle enabled={sound} onChange={setSound} />
            <Button variant="soft" className="bg-card" onClick={() => setShowAvailability(true)}>
              <Ban size={18} strokeWidth={1.5} aria-hidden />
              Sold out
            </Button>
          </PageTitle>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Segmented label="Station" value={station} onChange={setStation} options={[{ value: "all", label: "All" }, ...data.stations.map((row) => ({ value: row.id, label: row.name }))]} />
            {allDay.size > 0 && (
              <p className="text-xs text-muted">
                To make: {[...allDay.entries()].map(([name, qty]) => `${qty} ${name}`).join(", ")}
              </p>
            )}
          </div>
          <ErrorText>{error}</ErrorText>
          {tickets.length === 0 && <EmptyState>All clear. New tickets appear here.</EmptyState>}
          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} now={data.now} onAction={act} onPrint={print} />
            ))}
          </div>
          {showAvailability && <AvailabilitySheet data={data} onAction={act} onClose={() => setShowAvailability(false)} />}
        </>
      )}
      {printing && (
        <PrintNow onDone={() => setPrinting(null)}>
          <KotDoc kot={printing.ticket} duplicate={printing.duplicate} />
        </PrintNow>
      )}
    </AppFrame>
  );
}
