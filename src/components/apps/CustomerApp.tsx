"use client";

import { BellRing, CreditCard, ReceiptText, Sparkles } from "lucide-react";
import QRCode from "qrcode";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CommandError, sendQrCommand, useLive } from "@/lib/client";
import { formatRupees } from "@/lib/format";
import type { QrView } from "@/lib/pos/views";
import { OrderPad } from "../OrderPad";
import { Button, Card, Chip, ErrorText, Field, Loading, Sheet } from "../ui";
import { DEMO_DEPLOYMENT } from "@/lib/demo";

const STEPS: Record<string, { label: string; className: string }> = {
  awaiting: { label: "Waiting for staff to confirm", className: "bg-pink" },
  held: { label: "On hold", className: "bg-canvas" },
  new: { label: "Received", className: "bg-pink" },
  preparing: { label: "Preparing", className: "bg-mustard" },
  ready: { label: "Ready", className: "bg-lime" },
  served: { label: "Served", className: "bg-olive" },
  comp: { label: "On the house", className: "bg-periwinkle" },
};

function NiroSheet({ base, onClose, onDone }: { base: string; onClose: () => void; onDone: () => void }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [loyalty, setLoyalty] = useState(false);
  const [offers, setOffers] = useState(false);
  const [error, setError] = useState("");
  return (
    <Sheet title="Sign in with Niro.Cards" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">Optional. You can order without it. Niro is in demo mode here.</p>
        <Field label="Phone number" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} hint="Demo member: 9000000001" />
        {sent && <Field label="One-time code" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value)} hint={DEMO_DEPLOYMENT ? "Demo code: 123456" : undefined} />}
        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1 font-medium">Choose what your number is used for</legend>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" className="size-5 accent-ink" checked={loyalty} onChange={(event) => setLoyalty(event.target.checked)} />
            Earn and use loyalty points on my orders
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" className="size-5 accent-ink" checked={offers} onChange={(event) => setOffers(event.target.checked)} />
            Send me offers (optional)
          </label>
        </fieldset>
        <ErrorText>{error}</ErrorText>
        {!sent ? (
          <Button disabled={phone.length < 10} onClick={() => setSent(true)}>Send code</Button>
        ) : (
          <Button
            disabled={!otp || !loyalty}
            onClick={async () => {
              setError("");
              try {
                await sendQrCommand(base, "qr_niro_signin", { phone, otp, loyalty, offers });
                onDone();
                onClose();
              } catch (problem) {
                setError(problem instanceof CommandError ? problem.message : "Could not sign in");
              }
            }}
          >
            Sign in
          </Button>
        )}
      </div>
    </Sheet>
  );
}

function PaySheet({ base, onClose, onDone }: { base: string; onClose: () => void; onDone: (paid: boolean) => void }) {
  // One key per opened sheet, so a repeated request returns the same payment instead of a second one.
  const [key] = useState(() => crypto.randomUUID());
  const [pay, setPay] = useState<{ paymentId: string; billNo: string; amountP: number } | null>(null);
  const [svg, setSvg] = useState("");
  const [state, setState] = useState<"waiting" | "failed" | "paid">("waiting");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const started = await sendQrCommand<{ paymentId: string; billNo: string; amountP: number }>(base, "qr_pay_start", { key });
        if (cancelled) return;
        setPay(started);
        // Deliberately not a upi:// link: nothing can be paid until a provider is connected.
        setSvg(await QRCode.toString(`breadpos-simulated-upi:${started.paymentId}:${started.amountP}`, { type: "svg", margin: 1 }));
      } catch (problem) {
        setError(problem instanceof CommandError ? problem.message : "Could not start the payment");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [base, key]);

  const close = async () => {
    if (pay && state !== "paid") await sendQrCommand(base, "qr_pay_cancel", { paymentId: pay.paymentId }).catch(() => undefined);
    onDone(state === "paid");
    onClose();
  };

  const event = async (kind: "success" | "failure") => {
    setError("");
    try {
      await sendQrCommand(base, "qr_pay_event", { paymentId: pay?.paymentId, event: kind });
      setState(kind === "success" ? "paid" : "failed");
    } catch (problem) {
      setError(problem instanceof CommandError ? problem.message : "That did not work");
    }
  };

  return (
    <Sheet title={pay ? `Pay ${formatRupees(pay.amountP / 100)}` : "Pay"} onClose={close}>
      <div className="flex flex-col items-center gap-3 text-center">
        {state === "waiting" && (
          <>
            {svg ? <div className="size-48" dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="size-48 rounded-2xl bg-canvas" />}
            {pay && <p className="text-sm text-muted">Bill {pay.billNo}. The amount is fixed in this code.</p>}
          </>
        )}
        {state === "failed" && <Chip className="bg-pink">Payment failed. You can try again, or pay at the counter.</Chip>}
        {state === "paid" && <Chip className="bg-lime">Paid. Thank you!</Chip>}
        <ErrorText>{error}</ErrorText>
        {state === "waiting" && pay && (
          <div className="w-full rounded-2xl bg-canvas p-3">
            <p className="mb-2 text-xs text-muted">Demo payment: no real UPI provider is connected yet, so nothing is charged.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="lime" onClick={() => event("success")}>Simulate success</Button>
              <Button variant="soft" onClick={() => event("failure")}>Simulate failure</Button>
            </div>
          </div>
        )}
        <Button variant={state === "paid" ? "primary" : "soft"} onClick={close}>{state === "paid" ? "Done" : "Close and pay at the counter"}</Button>
      </div>
    </Sheet>
  );
}

export function CustomerApp() {
  const params = useParams();
  const base = `/api/orders/${encodeURIComponent(String(params.outlet ?? ""))}/${encodeURIComponent(String(params.table ?? ""))}`;
  const { data, fatal, refresh } = useLive<QrView>(base, undefined, 4000);
  const [niro, setNiro] = useState(false);
  const [paying, setPaying] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  if (fatal) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 p-6">
        <h1 className="text-3xl font-light tracking-tight">This QR code is not active</h1>
        <p className="mt-2 text-sm text-muted">Please ask a member of staff to help you order.</p>
      </main>
    );
  }
  if (!data) return <Loading />;

  const act = async (type: string, message: string) => {
    setError("");
    setNotice("");
    try {
      await sendQrCommand(base, type);
      setNotice(message);
      await refresh();
    } catch (problem) {
      setError(problem instanceof CommandError ? problem.message : "That did not work");
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4 sm:max-w-5xl sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-muted">{data.shopName}</p>
          <h1 className="text-4xl font-light tracking-tight">
            <span className="text-muted">Table</span> {data.tableLabel}
          </h1>
        </div>
        {data.demoMode && <Chip className="bg-mustard">Demo: payments are simulated</Chip>}
        {data.member ? (
          <Chip className="bg-lilac">
            <Sparkles size={14} strokeWidth={1.5} aria-hidden />
            {data.member.name} · {data.member.points} points
          </Chip>
        ) : (
          <Button variant="soft" className="bg-card" onClick={() => setNiro(true)}>
            <Sparkles size={18} strokeWidth={1.5} aria-hidden />
            Niro sign in
          </Button>
        )}
      </header>

      {data.order && (
        <Card className="bg-card">
          <h2 className="flex items-center justify-between gap-2 text-lg font-semibold">
            Your order {data.order.no}
            <span>{formatRupees(data.order.totalP / 100)}</span>
          </h2>
          {data.order.qrPending && <p className="mt-1 text-sm text-muted">A staff member will confirm your order shortly.</p>}
          <ul className="mt-2 divide-y divide-dashed divide-hairline">
            {data.order.lines.map((line) => (
              <li key={line.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0">
                  {line.qty} x {line.name}
                  {line.mods.length > 0 && <span className="block text-xs text-muted">{line.mods.join(", ")}</span>}
                </span>
                <Chip className={STEPS[line.status]?.className}>{STEPS[line.status]?.label}</Chip>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="soft" disabled={data.order.billRequested} onClick={() => act("qr_request_bill", "We have told the team you would like the bill.")}>
              <ReceiptText size={18} strokeWidth={1.5} aria-hidden />
              {data.order.billRequested ? "Bill requested" : "Ask for the bill"}
            </Button>
            {data.pay.enabled && (
              <Button onClick={() => setPaying(true)}>
                <CreditCard size={18} strokeWidth={1.5} aria-hidden />
                Pay now
              </Button>
            )}
            <Button variant="soft" disabled={data.order.waiterCalled} onClick={() => act("qr_call_waiter", "A captain is on the way.")}>
              <BellRing size={18} strokeWidth={1.5} aria-hidden />
              {data.order.waiterCalled ? "Captain called" : "Call a captain"}
            </Button>
          </div>
          {notice && <p role="status" className="mt-3 rounded-2xl bg-lime px-4 py-2 text-sm">{notice}</p>}
          <p className="mt-2 text-xs text-muted">{data.pay.enabled ? "Pay here, or at the counter." : "Please pay at the counter, or ask your captain."}</p>
        </Card>
      )}
      <ErrorText>{error}</ErrorText>
      {placed && !data.order && <p className="rounded-2xl bg-lime px-4 py-2 text-sm">Thank you. Your table is all settled.</p>}

      {data.rewards.length > 0 && (
        <Card className="bg-lilac">
          <h2 className="font-semibold">Rewards you can use</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.rewards.map((reward) => <Chip key={reward.id} className="bg-card">{reward.name} · {reward.cost} points</Chip>)}
          </div>
          <p className="mt-2 text-xs">Tell the cashier which one you want when you pay.</p>
        </Card>
      )}

      {/* Plain section: Card clips its contents, which would stop the cart bar staying on screen. */}
      <section className="rounded-card bg-card p-5 sm:p-6">
        <h2 className="mb-3 text-lg font-semibold">{data.order ? "Add more" : "Menu"}</h2>
        <OrderPad
          menu={data.menu}
          submitLabel="Place order"
          onSubmit={async (items) => {
            await sendQrCommand(base, "qr_place", { items });
            setPlaced(true);
            await refresh();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </section>
      {paying && (
        <PaySheet
          base={base}
          onClose={() => setPaying(false)}
          onDone={(paid) => {
            if (paid) {
              setPlaced(true);
              setNotice("Payment received. Thank you!");
            }
            refresh();
          }}
        />
      )}
      {niro && <NiroSheet base={base} onClose={() => setNiro(false)} onDone={refresh} />}
    </main>
  );
}
