import assert from "node:assert/strict";
import { test } from "node:test";
import { signHandoff, signSession, signSso, verifyHandoff, verifySession, verifySso } from "./token.ts";

const NOW = 1_800_000_000_000;
const who = { staffId: "s_cashier", role: "cashier" as const };

test("a session works for its own app only", async () => {
  const token = await signSession({ ...who, app: "pos", exp: NOW + 1000 });
  assert.equal((await verifySession(token, "pos", NOW))?.staffId, "s_cashier");
  assert.equal(await verifySession(token, "manager", NOW), null);
  assert.equal(await verifySession(token, "pos", NOW + 2000), null);
});

test("the three kinds of token cannot stand in for each other", async () => {
  const exp = NOW + 60_000;
  const handoff = await signHandoff({ ...who, app: "pos", exp, nonce: "n1" });
  const sso = await signSso({ ...who, app: "auth", exp });
  const session = await signSession({ ...who, app: "pos", exp });
  assert.equal(await verifySession(handoff, "pos", NOW), null);
  assert.equal(await verifySession(sso, "pos", NOW), null);
  assert.equal(await verifyHandoff(session, NOW), null);
  assert.equal(await verifyHandoff(sso, NOW), null);
  assert.equal(await verifySso(session, NOW), null);
  assert.equal(await verifySso(handoff, NOW), null);
  assert.equal((await verifyHandoff(handoff, NOW))?.nonce, "n1");
  assert.equal(await verifyHandoff(handoff, exp + 1), null);
});

test("a changed or unsigned token is refused", async () => {
  const token = await signHandoff({ ...who, app: "pos", exp: NOW + 60_000, nonce: "n2" });
  const [body, signature] = token.split(".");
  const forged = JSON.parse(atob(body.replaceAll("-", "+").replaceAll("_", "/")));
  forged.role = "admin";
  const swapped = btoa(JSON.stringify(forged)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  assert.equal(await verifyHandoff(`${swapped}.${signature}`, NOW), null);
  assert.equal(await verifyHandoff(`${body}.`, NOW), null);
  assert.equal(await verifyHandoff(undefined, NOW), null);
  assert.equal(await verifyHandoff("garbage", NOW), null);
});
