import { test } from "node:test";
import assert from "node:assert/strict";
import { compose, shouldIgnore } from "../src/reply.js";

const TO = "hey@xn--frggjadagur-pcb.fo";
// 2026-09-25 is a Friday; 12:00 Faroese summer time is 11:00 UTC.
const FRIDAY = new Date("2026-09-25T11:00:00Z");
const MONDAY = new Date("2026-09-28T11:00:00Z");

test("answers JA on a Friday and NEI otherwise", () => {
  assert.match(compose({ to: TO, now: FRIDAY }).text, /^JA\./);
  assert.match(compose({ to: TO, now: MONDAY }).text, /^NEI\.\n\nTað er mánadagur/);
});

test("uses Faroese time, not UTC", () => {
  // Thursday 23:30 UTC is already Friday 00:30 in the Faroes.
  assert.match(compose({ to: TO, now: new Date("2026-09-24T23:30:00Z") }).text, /^JA\./);
});

test("time travels via the local part", () => {
  const r = compose({ to: "2027-03-26@xn--frggjadagur-pcb.fo", now: MONDAY });
  assert.match(r.text, /^JA\.\n\nLangi fríggjadagur/);
  assert.match(r.text, /Tíðarferð: svarið galdar fríggjadagur 26\.3\.2027/);
  assert.doesNotMatch(r.text, /Klokkan í Føroyum/);
});

test("teases the misspelled domain and Danish/English subjects", () => {
  const r = compose({ to: "x@xn--frggjardagur-tfb.fo", subject: "Er det fredag? Friday?", now: MONDAY });
  assert.match(r.text, /Einki R/);
  assert.match(r.text, /erdetfredag\.dk/);
  assert.match(r.text, /JA = yes/);
});

test("builds a sane subject", () => {
  assert.equal(compose({ to: TO, now: MONDAY }).subject, "Re: Er tað fríggjadagur?");
  assert.equal(compose({ to: TO, subject: "Hey\r\n you", now: MONDAY }).subject, "Re: Hey you");
});

test("never puts raw subject HTML in the body", () => {
  const { html } = compose({ to: TO, subject: "<script>", now: MONDAY });
  assert.doesNotMatch(html, /<script>/);
});

test("ignores robots and mailing lists", () => {
  const h = (o) => new Headers(o);
  assert.ok(shouldIgnore("noreply@x.com", h({})));
  assert.ok(shouldIgnore("a@x.com", h({ "Auto-Submitted": "auto-replied" })));
  assert.ok(shouldIgnore("a@x.com", h({ Precedence: "bulk" })));
  assert.ok(shouldIgnore("a@x.com", h({ "List-Id": "<x.list>" })));
  assert.ok(!shouldIgnore("a@x.com", h({ "Auto-Submitted": "no" })));
  assert.ok(!shouldIgnore("bogi@x.com", h({})));
});
