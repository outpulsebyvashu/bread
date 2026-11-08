import { actorFor, outletCode, PosError } from "@/lib/pos/engine";
import { errorResponse, noStore } from "@/lib/pos/http";
import { readState, runCommand } from "@/lib/pos/store";
import { view } from "@/lib/pos/views";

const guest = { role: null, staffId: null, name: "Guest" };

// Customer ordering for one table: /api/orders/{outlet-code}/{table-code}.
// The table code is the secret in the QR. The outlet code must match this outlet.
// Mock of the Niro-hosted route: the real Niro API is not confirmed, so nothing here reaches Niro.
function checkOutlet(outlet: string) {
  if (outlet.toLowerCase() !== outletCode(readState())) throw new PosError("This table QR is not valid", "bad_qr");
}

export async function GET(_request: Request, { params }: { params: Promise<{ outlet: string; table: string }> }) {
  const { outlet, table } = await params;
  try {
    checkOutlet(outlet);
    const state = readState();
    return noStore({ data: view(state, actorFor(state, null), "qr", Date.now(), { token: table }) });
  } catch (error) {
    return errorResponse(error);
  }
}

// Customers can only reach commands the engine marks public, and the table code comes from the address.
export async function POST(request: Request, { params }: { params: Promise<{ outlet: string; table: string }> }) {
  const { outlet, table } = await params;
  try {
    checkOutlet(outlet);
    const body = (await request.json()) as { type?: unknown; args?: Record<string, unknown> };
    return noStore({ result: runCommand(guest, String(body.type), { ...body.args, token: table }) ?? null });
  } catch (error) {
    return errorResponse(error);
  }
}
