import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createRequire } from "node:module";
import { test } from "node:test";
import { verifyWebhookAuth, parsePaymentPayload } from "../src/lib/payments.js";
import { validCheckoutUrl } from "../src/lib/checkout.js";
import { validateSessionToken, type CurrentAccount } from "../src/lib/session-validation.js";
import { questionApiSchema, examApiSchema } from "../src/lib/admin-validations.js";
import { resetPasswordSchema } from "../src/lib/validations.js";
const require = createRequire(import.meta.url);

test("webhook authentication rejects forgeries and prevents signature downgrade", () => {
  const previous = process.env.PAYMENT_WEBHOOK_SECRET;
  const legacy = process.env.AFRIPAY_WEBHOOK_SECRET;
  try {
    process.env.PAYMENT_WEBHOOK_SECRET = "test-secret-never-used-outside-tests";
    const body = '{"status":"paid","amount":3000}';
    const signature = createHmac("sha256", process.env.PAYMENT_WEBHOOK_SECRET).update(body).digest("hex");
    assert.equal(verifyWebhookAuth(new Headers(), body).ok, false);
    assert.equal(verifyWebhookAuth(new Headers({ "x-afripay-signature": "sha256=" + signature }), body).ok, true);
    assert.equal(verifyWebhookAuth(new Headers({ "x-afripay-signature": signature }), body.replace("3000","1")).ok, false);
    assert.equal(verifyWebhookAuth(new Headers({ "x-webhook-secret": process.env.PAYMENT_WEBHOOK_SECRET }), body).ok, true);
    assert.equal(verifyWebhookAuth(new Headers({ authorization: "Bearer " + process.env.PAYMENT_WEBHOOK_SECRET }), body).ok, true);
    assert.equal(verifyWebhookAuth(new Headers(), body, process.env.PAYMENT_WEBHOOK_SECRET).ok, true);
    assert.equal(verifyWebhookAuth(new Headers(), body, "wrong-key").ok, false);
    assert.equal(verifyWebhookAuth(new Headers({ "x-afripay-signature": "sha256=bad" }), body, process.env.PAYMENT_WEBHOOK_SECRET).ok, false);
    for (const invalid of ["", "sha256=bad", "0".repeat(64)]) {
      assert.equal(verifyWebhookAuth(new Headers({ "x-afripay-signature": invalid, "x-webhook-secret": process.env.PAYMENT_WEBHOOK_SECRET }), body).ok, false);
    }
    delete process.env.PAYMENT_WEBHOOK_SECRET;
    delete process.env.AFRIPAY_WEBHOOK_SECRET;
    assert.deepEqual(verifyWebhookAuth(new Headers(), body), { ok: false, reason: "not_configured" });
  } finally {
    if (previous === undefined) delete process.env.PAYMENT_WEBHOOK_SECRET; else process.env.PAYMENT_WEBHOOK_SECRET = previous;
    if (legacy === undefined) delete process.env.AFRIPAY_WEBHOOK_SECRET; else process.env.AFRIPAY_WEBHOOK_SECRET = legacy;
  }
});

test("webhook parsing validates paid amounts and accepts relay encodings", () => {
  const json = parsePaymentPayload(JSON.stringify({ clientToken: "ML_order", paymentStatus: "paid", transactionId: "txn", amount: 3000, currency: "rwf" }), "application/json");
  assert.equal(json.amount, 3000);
  assert.equal(json.currency, "RWF");
  assert.equal(json.transactionId, "txn");
  const afripay = parsePaymentPayload("status=success&amount=3000&currency=RWF&transaction_ref=AFP1&payment_method=momo&client_token=ML_order", "application/x-www-form-urlencoded");
  assert.equal(afripay.transactionId, "AFP1");
  assert.equal(afripay.amount, 3000);
  assert.equal(parsePaymentPayload("client_token=ML_order&status=paid&transaction_id=txn&amount=1500.00&currency=RWF", "application/x-www-form-urlencoded").amount, 1500);
  for (const amount of ["-1", "Infinity", "NaN", "1e3", "1.123", 0, null]) {
    assert.equal(parsePaymentPayload(JSON.stringify({ amount }), "application/json").amount, null);
  }
  assert.equal(parsePaymentPayload("{invalid", "application/json").clientToken, "");
});

test("checkout redirects accept only approved HTTPS destinations", () => {
  const previous = process.env.PAYMENT_CHECKOUT_ALLOWED_HOSTS;
  delete process.env.PAYMENT_CHECKOUT_ALLOWED_HOSTS;
  try {
    const relay = "https://sonamovie.example/api/checkout";
    assert.equal(validCheckoutUrl("https://sonamovie.example/orders/123", relay), "https://sonamovie.example/orders/123");
    assert.equal(validCheckoutUrl("https://www.afripay.africa/checkout/index.php", relay), "https://www.afripay.africa/checkout/index.php");
    for (const url of ["javascript:alert(1)", "http://sonamovie.example/orders/123", "https://evil.example/", "https://www.afripay.africa.evil.example/", "https://user:pass@sonamovie.example/"]) {
      assert.equal(validCheckoutUrl(url, relay), null);
    }
  } finally { if (previous !== undefined) process.env.PAYMENT_CHECKOUT_ALLOWED_HOSTS = previous; }
});

test("sessions re-check permissions, bans, deletion, replacement and lookup failures", async () => {
  const account: CurrentAccount = { name: "Student", email: "student@example.test", role: "STUDENT", is_banned: false, license_category: "medical_doctor", language: "FR" };
  const token = { id: "u", role: "ADMIN", sessionId: "active", deviceType: "desktop", language: "EN" };
  const lookup = {
    user: async () => ({ data: account, error: null }),
    session: async () => ({ data: { session_id: "active" }, error: null }),
  };
  const current = await validateSessionToken(token, lookup);
  assert.equal(current?.role, "STUDENT", "demotion must override stale ADMIN claim");
  assert.equal(current?.language, "FR", "current profile preference must override stale JWT");
  assert.equal(await validateSessionToken(token, { ...lookup, user: async () => ({ data: { ...account, is_banned: true }, error: null }) }), null);
  assert.equal(await validateSessionToken(token, { ...lookup, user: async () => ({ data: null, error: null }) }), null);
  assert.equal(await validateSessionToken(token, { ...lookup, session: async () => ({ data: { session_id: "new" }, error: null }) }), null);
  assert.equal(await validateSessionToken(token, { ...lookup, session: async () => ({ data: null, error: null }) }), null);
  assert.equal(await validateSessionToken(token, { ...lookup, user: async () => ({ data: account, error: "database unavailable" }) }), null);
  assert.equal(await validateSessionToken(token, { ...lookup, user: async () => { throw new Error("database unavailable"); } }), null);
  assert.equal(await validateSessionToken({ id: "u" }, lookup), null, "legacy untracked JWTs must be rejected");
});

test("admin validation rejects broken answer keys, unsafe fields, and duplicate questions", () => {
  const q = { language: "FR", text_fr: "Question française", category_id: "c", answers: [{ text_fr: "Oui", is_correct: true }, { text_fr: "Non", is_correct: false }] };
  assert.equal(questionApiSchema.safeParse(q).success, true);
  assert.equal(questionApiSchema.safeParse({ ...q, answers: q.answers.map((a) => ({ ...a, is_correct: true })) }).success, false);
  assert.equal(questionApiSchema.safeParse({ ...q, answers: [{ text_fr: "Oui", is_correct: true }, { text_fr: "", is_correct: false }] }).success, false);
  const exam = { title_en: "Exam", license_category: "medical_doctor", duration_minutes: 60, passing_score: 70, is_published: true, question_ids: ["q"] };
  assert.equal(examApiSchema.safeParse(exam).success, true);
  assert.equal(examApiSchema.safeParse({ ...exam, license_category: "" }).success, false, "exams must target a license category");
  assert.equal(examApiSchema.safeParse({ ...exam, duration_minutes: -1 }).success, false);
  assert.equal(examApiSchema.safeParse({ ...exam, is_free: "false" }).success, false);
  assert.equal(examApiSchema.safeParse({ ...exam, question_ids: ["q", "q"] }).success, false);
  assert.equal(examApiSchema.safeParse({ ...exam, question_ids: [] }).success, false);
  const password = "A1" + "é".repeat(36);
  assert.equal(resetPasswordSchema.safeParse({ password, confirmPassword: password }).success, false, "bcrypt must enforce bytes, not characters");
});

test("development brace mitigation preserves globs and rejects excessive recursive depth", () => {
  const braces = require("braces");
  assert.deepEqual(braces.expand("src/{app,lib}/*.ts"), ["src/app/*.ts", "src/lib/*.ts"]);
  assert.equal(braces.compile("{a,b}"), "(a|b)");
  const pattern = "{".repeat(20000) + "a,b" + "}".repeat(20000);
  for (const method of ["parse", "compile", "expand", "stringify"]) {
    assert.throws(() => braces[method](pattern), { name: "SyntaxError" });
  }
  let ast: { nodes: unknown[] } = { nodes: [] };
  for (let i = 0; i < 1000; i++) ast = { nodes: [ast] };
  for (const method of ["compile", "expand", "stringify"]) assert.throws(() => braces[method](ast), { name: "SyntaxError" });
});