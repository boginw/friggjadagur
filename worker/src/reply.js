import { DAYS, pad, pick, wallTime, parseDato, verdict, countdown } from "../../friday.js";

const SITE = "https://fríggjadagur.fo";
const MISSPELT = "xn--frggjardagur-tfb.fo";

// Never answer robots, mailing lists or other auto-responders (RFC 3834),
// otherwise two bots can happily email each other forever.
export function shouldIgnore(from, headers) {
  const auto = (headers.get("auto-submitted") || "no").toLowerCase();
  return (
    /(no-?reply|mailer-daemon|postmaster|bounce)/i.test(from) ||
    auto !== "no" ||
    /^(bulk|list|junk)$/i.test(headers.get("precedence") || "") ||
    headers.has("list-id") ||
    headers.has("list-unsubscribe")
  );
}

const esc = (s) => s.replace(/[&<>"]/g, (c) => `&${{ "&": "amp", "<": "lt", ">": "gt", '"': "quot" }[c]};`);

// Build the reply to a mail sent to `to` with subject `subject`.
export function compose({ to, subject = "", now = new Date() }) {
  const [local = "", domain = ""] = to.toLowerCase().split("@");
  subject = subject.replace(/\s+/g, " ").trim();

  // Mail 2026-04-03@fríggjadagur.fo to ask about another day.
  const travel = parseDato(local);
  const t = travel !== null ? new Date(travel) : wallTime(now);
  const v = verdict(t);
  const answer = v.ja ? "JA" : "NEI";
  const sub = pick(v.sub);

  const ps = [];
  if (travel !== null) {
    ps.push(`⏳ Tíðarferð: svarið galdar ${DAYS[t.getUTCDay()]} ${t.getUTCDate()}.${t.getUTCMonth() + 1}.${t.getUTCFullYear()}.`);
  }
  if (domain === MISSPELT) ps.push("Tað heitir fríggjadagur. Einki R. 😉");
  if (/fredag/i.test(subject)) ps.push("Hetta er ikki erdetfredag.dk – her siga vit fríggjadagur. 🇫🇴");
  if (/friday/i.test(subject)) ps.push("JA = yes, NEI = no. You're welcome. 🐑");
  if (/^(baa+|mæ+|mae+|seydur|seyður)$/.test(local)) ps.push("Mæææææ! 🐑🐑🐑");
  if (v.ja && travel === null) ps.push("Hví sendir tú teldupost ein fríggjadag? Far heim.");

  const when = travel === null
    ? `Klokkan í Føroyum er ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}. ${countdown(t)}.`
    : "";

  const text = [
    v.fool ? `${v.ja ? "NEI" : "JA"}… ella, nei: ${answer}.` : `${answer}.`,
    sub,
    when,
    ...ps.map((p) => `PS: ${p}`),
    `Mæ,\nSeyðurin á ${SITE}`,
  ].filter(Boolean).join("\n\n");

  const headline = v.fool
    ? `<s style="opacity:.4">${v.ja ? "NEI" : "JA"}</s> ${answer}`
    : answer;
  const color = v.ja ? "#ef303e" : "#33414c";
  const html = `<!doctype html>
<html lang="fo"><body style="margin:0;padding:32px 16px;background:${v.ja ? "#ffffff" : "#dde3e8"};font-family:Helvetica,Arial,sans-serif;text-align:center;color:#33414c">
  <p style="margin:0;color:#6b7a86;font-size:16px">Er tað fríggjadagur?</p>
  <h1 style="margin:8px 0;font-family:'Arial Black',Impact,sans-serif;font-size:96px;line-height:1;color:${color};${v.ja ? "text-shadow:4px 4px 0 #005eb8;" : ""}">${headline}</h1>
  <p style="margin:0 0 24px;font-size:20px;font-weight:bold;color:${v.ja ? "#005eb8" : "#33414c"}">${esc(sub)}</p>
  ${when ? `<p style="margin:0 0 24px;color:#6b7a86;font-size:14px">${esc(when)}</p>` : ""}
  ${ps.map((p) => `<p style="margin:0 0 8px;font-size:14px">PS: ${esc(p)}</p>`).join("\n  ")}
  <p style="margin:32px 0 0;color:#6b7a86;font-size:14px">Mæ,<br>Seyðurin á <a href="${SITE}" style="color:#005eb8">fríggjadagur.fo</a> 🐑</p>
</body></html>`;

  return { subject: `Re: ${subject || "Er tað fríggjadagur?"}`, text, html };
}
