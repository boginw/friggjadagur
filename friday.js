// Shared by the website (index.html) and the email worker (worker/).
//
// Times are "wall" times: a Date whose UTC fields hold the Faroese local
// clock. That keeps the date math simple and independent of where the code runs.

export const TZ = "Atlantic/Faroe";
export const DAYS = ["sunnudagur", "mánadagur", "týsdagur", "mikudagur", "hósdagur", "fríggjadagur", "leygardagur"];
export const pick = (xs) => (Array.isArray(xs) ? xs[Math.floor(Math.random() * xs.length)] : xs);
export const pad = (n) => String(n).padStart(2, "0");

const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ, hourCycle: "h23",
  year: "numeric", month: "numeric", day: "numeric",
  hour: "numeric", minute: "numeric", second: "numeric",
});

export function wallTime(date = new Date()) {
  const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, +x.value]));
  return new Date(Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second));
}

// "2026-04-03" or "2026-04-03T16:30" -> wall time in ms, else null.
export function parseDato(s) {
  const m = /^(\d{4})-(\d\d)-(\d\d)(?:T(\d\d):(\d\d))?$/.exec(s || "");
  return m ? Date.UTC(m[1], m[2] - 1, m[3], m[4] || 12, m[5] || 0) : null;
}

function easter(y) { // Anonymous Gregorian algorithm
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return Date.UTC(y, month - 1, day);
}

// --- The important part -----------------------------------------------------
// `sub` is a string, or an array to pick one from at random.
export function verdict(t) {
  const dow = t.getUTCDay(), h = t.getUTCHours();
  const y = t.getUTCFullYear(), mo = t.getUTCMonth() + 1, d = t.getUTCDate();
  const md = `${mo}-${d}`;
  const midnight = Date.UTC(y, mo - 1, d);
  const goodFriday = midnight === easter(y) - 2 * 864e5;
  const nov1 = new Date(Date.UTC(y, 10, 1)).getUTCDay();
  const blackFriday = mo === 11 && d === 1 + ((4 - nov1 + 7) % 7) + 22;

  if (dow === 5) {
    if (md === "4-1") return { ja: true, fool: true, sub: "Aprilsnarr! Ella… nei, tað er satt! 🐟" };
    if (goodFriday) return { ja: true, sub: "Langi fríggjadagur. Og hann er langur." };
    if (d === 13) return { ja: true, theme: "spooky", sub: "…men tann 13. Ver varin. 👻" };
    if (blackFriday) return { ja: true, sub: "Black Friday. Keyp einki." };
    if (md === "7-29") return { ja: true, sub: "OG tað er Ólavsøka! Betri verður tað ikki. 🎉" };
    if (md === "12-24") return { ja: true, sub: "…og jólaaftan. Glaðilig jól! 🎄" };
    if (h < 5) return { ja: true, sub: "…tøkniliga sæð. Far í song." };
    if (h >= 16) return { ja: true, sub: ["Klokkan er yvir fýra. Far heim!", "Vikuskiftið er byrjað. 🍻"] };
    return { ja: true, sub: ["Góðan fríggjadag!", "Endiliga.", "Vikuskiftið er í nánd.", "Tað er loyvt at gleða seg."] };
  }

  const holidays = {
    "1-1": "…men tað er nýggjársdagur. 🎆",
    "4-25": "…men tað er flaggdagur! 🇫🇴",
    "7-28": "…men tað er ólavsøkuaftan! 🎉",
    "7-29": "…men tað er Ólavsøka! 🎉",
    "12-24": "…men tað er jólaaftan. 🎄",
    "12-25": "…men tað er jóladagur. 🎄",
    "12-31": "…men tað er nýggjársaftan. 🎆",
  };
  if (md === "4-1") return { ja: false, fool: true, sub: "Aprilsnarr! 🐟" };
  if (holidays[md]) return { ja: false, sub: holidays[md] };

  const subs = {
    0: "Tað er sunnudagur. Fríggjadagur er langt burturi.",
    1: "Tað er mánadagur. Orsaka.",
    2: "Tað er týsdagur. Hald út.",
    3: "Tað er mikudagur. Hálvvegis.",
    4: h >= 18 ? "Næstan… í morgin!" : "Men í morgin!",
    6: "Tað var í gjár.",
  };
  return { ja: false, sub: subs[dow] };
}

// Time left until Friday starts, or until it ends if it is Friday.
export function countdown(t) {
  const day = t.getUTCDay();
  const midnight = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
  const target = day === 5 ? midnight + 864e5 : midnight + ((5 - day + 7) % 7) * 864e5;
  const left = Math.max(0, Math.floor((target - t) / 1000));
  const dd = Math.floor(left / 86400), rest = left % 86400;
  const clock = `${pad(Math.floor(rest / 3600))}:${pad(Math.floor(rest / 60) % 60)}:${pad(rest % 60)}`;
  return day === 5
    ? `Fríggjadagurin endar um ${clock}`
    : `Fríggjadagur um ${dd ? dd + "d " : ""}${clock}`;
}
