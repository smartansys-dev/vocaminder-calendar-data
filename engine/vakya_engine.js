/* Panchanga engine: Vakya (two calibrations to printed Tamil Vakya almanacs) + Drik.
   Vakya: Vakyakarana day count, Vararuci-model Chandravakyas, bhupa solar table,
   calibrated to printed almanacs (true sunrise via chara + bhujantara).
   Drik: needs global `Astronomy` (astronomy-engine). */
(function (root) {
  'use strict';
  const R = Math.PI / 180, D = 180 / Math.PI;
  const mod = (x, m) => ((x % m) + m) % m;
  const dms = (d, m = 0, s = 0) => d + m / 60 + s / 3600;

  /* ---------- names ---------- */
  const TITHI_TA = ['பிரதமை','துவிதியை','திருதியை','சதுர்த்தி','பஞ்சமி','சஷ்டி','சப்தமி','அஷ்டமி','நவமி','தசமி','ஏகாதசி','துவாதசி','திரயோதசி','சதுர்த்தசி'];
  const TITHI_EN = ['Prathamai','Dwitiyai','Thrithiyai','Chathurthi','Panchami','Shashti','Saptami','Ashtami','Navami','Dasami','Ekadasi','Dwadasi','Trayodasi','Chathurdasi'];
  function tithiName(i) {
    if (i === 14) return { ta: 'பௌர்ணமி', en: 'Pournami', paksha: '' };
    if (i === 29) return { ta: 'அமாவாசை', en: 'Amavasai', paksha: '' };
    const s = i < 15;
    return { ta: TITHI_TA[i % 15], en: TITHI_EN[i % 15], paksha: s ? 'Shukla' : 'Krishna', pakshaTa: s ? 'வளர்பிறை' : 'தேய்பிறை' };
  }
  const NAK_TA = ['அசுவினி','பரணி','கார்த்திகை','ரோகிணி','மிருகசீரிடம்','திருவாதிரை','புனர்பூசம்','பூசம்','ஆயில்யம்','மகம்','பூரம்','உத்திரம்','அஸ்தம்','சித்திரை','சுவாதி','விசாகம்','அனுஷம்','கேட்டை','மூலம்','பூராடம்','உத்திராடம்','திருவோணம்','அவிட்டம்','சதயம்','பூரட்டாதி','உத்திரட்டாதி','ரேவதி'];
  const NAK_EN = ['Ashwini','Bharani','Karthigai','Rohini','Mirugasirisham','Thiruvathirai','Punarpoosam','Poosam','Ayilyam','Magam','Pooram','Uthiram','Hastham','Chithirai','Swathi','Visakam','Anusham','Kettai','Moolam','Pooradam','Uthradam','Thiruvonam','Avittam','Sathayam','Poorattathi','Uthrattathi','Revathi'];
  const YOGA_EN = ['Vishkambha','Priti','Ayushman','Saubhagya','Sobhana','Atiganda','Sukarma','Dhriti','Shoola','Ganda','Vriddhi','Dhruva','Vyaghata','Harshana','Vajra','Siddhi','Vyatipata','Variyan','Parigha','Siva','Siddha','Sadhya','Subha','Sukla','Brahma','Indra','Vaidhriti'];
  const KAR = ['Bava','Balava','Kaulava','Taitila','Gara','Vanij','Vishti'];
  const karanaName = h => h === 0 ? 'Kimstughna' : h >= 57 ? ['Shakuni','Chatushpada','Naga'][h - 57] : KAR[(h - 1) % 7];
  const VARA_TA = ['ஞாயிறு','திங்கள்','செவ்வாய்','புதன்','வியாழன்','வெள்ளி','சனி'];
  const VARA_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const ANGA = {
    T: { span: 12, count: 30, name: i => tithiName(i) },
    N: { span: 360 / 27, count: 27, name: i => ({ ta: NAK_TA[i], en: NAK_EN[i] }) },
    Y: { span: 360 / 27, count: 27, name: i => ({ ta: YOGA_EN[i], en: YOGA_EN[i] }) },
    K: { span: 6, count: 60, name: i => ({ ta: karanaName(i), en: karanaName(i) }) },
    R: { span: 30, count: 12, name: i => ({ ta: String(i), en: String(i) }) }      // v5.2.10: Moon's rāśi (for Chandrāṣṭamam)
  };

  /* ---------- civil date helpers ---------- */
  function jd0(y, m, d) { if (m <= 2) { y -= 1; m += 12; } const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5; }
  const ymd = s => s.split('-').map(Number);           // 'YYYY-MM-DD'
  function addDays(s, n) { const [y, m, d] = ymd(s); const t = new Date(Date.UTC(y, m - 1, d + n)); return t.toISOString().slice(0, 10); }
  const weekday = s => { const [y, m, d] = ymd(s); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };

  /* =============== VAKYA =============== */
  const EPOCH = 588465.5;                               // Kali day 0 (Friday)
  const C1 = dms(9 * 30 + 27, 48, 10), C2 = dms(11 * 30 + 7, 31, 1), C3 = dms(27, 44, 6), C0 = dms(7 * 30 + 2, 0, 7);
  const MM = (9 * 360 + C3) / 248, MA = 9 * 360 / 248, EPI = 31.5 / 360;
  const vakyaTable = [];
  for (let r = 0; r <= 249; r++) vakyaTable.push(Math.round((r * MM - Math.asin(EPI * Math.sin(r * MA * R)) * D) * 60) / 60);
  function vMoon(A) {
    const n = A - 1600984; const q1 = Math.floor(n / 12372); let rem = n - q1 * 12372;
    const q2 = Math.floor(rem / 3031); rem -= q2 * 3031; const q3 = Math.floor(rem / 248); const r = rem - q3 * 248;
    const base = q1 * C1 + q2 * C2 + q3 * C3 + C0 + vakyaTable[r];
    const gm = vakyaTable[r + 1] - vakyaTable[r]; const vin = q3 ? 32 * q3 - 8 * q2 : -8 * q2;
    return mod(base + (gm - dms(13, 11)) * vin / 3600, 360);
  }
  const BHUPA = [0,14,32,54,78,105,133,163,194,224,254,284,311,335,358,376,391,403,411,415,416,412,406,398,386,374,361,347,334,322,311,303,297,295,296,301,309,322];
  const mesha = K => 365 * K + K / 4 + (5 * K - 1237) / 576;
  function sinceMesha(A) { let K = Math.floor(A / 365.25) + 2; while (mesha(K) > A) K--; return A - mesha(K); }
  function vSun(A) { const d = sinceMesha(A); const i = Math.floor(d / 10), f = (d - 10 * i) / 10;
    return mod(d - (BHUPA[i] + (BHUPA[i + 1] - BHUPA[i]) * f) / 60, 360); }
  const AYAN_V = 24.2, LAT_V = 13.42;
  function chara(A, lat = LAT_V) { const dec = Math.asin(Math.sin(23.44 * R) * Math.sin((vSun(A) + AYAN_V) * R));
    return Math.asin(Math.tan(lat * R) * Math.tan(dec)) * D * 4; }           // minutes, + = sunrise earlier
  function bhujantara(A) { const d = sinceMesha(A); return mod(vSun(A) - d * 360 / 365.25875 + 180, 360) * 4 - 720; } // minutes
  const PROFILES = {
    vakya:    { label: 'Vakya',             T: [2.19, 3.55, 121.7], N: [2.02, 3.01, 109.9] },
    vakya2:   { label: 'Vakya (alternate)', T: [2.19, 3.55, 115.7], N: [2.02, 3.01, 108.7] }
  };
  const calibFor = (p, anga) => PROFILES[p][anga === 'K' ? 'T' : (anga === 'Y' || anga === 'R') ? 'N' : anga];
  function vValues(A) { const S = vSun(A), M = vMoon(A); return { T: mod(M - S, 360), N: M, Y: mod(M + S, 360), K: mod(M - S, 360), R: M }; }
  // raw boundary crossings during Vakya day A, with calibrated absolute time (Kali days)
  function vBoundaries(A, profile, anga) {
    const a0 = vValues(A)[anga], a1raw = vValues(A + 1)[anga];
    let a1 = a1raw; while (a1 < a0) a1 += 360;
    const sp = ANGA[anga].span, [ca, cb, cc] = calibFor(profile, anga);
    const corr = (ca * chara(A) - cb * bhujantara(A) - cc) / 3600;           // days
    const out = []; let i = Math.floor(a0 / sp);
    while ((i + 1) * sp <= a1 && out.length < 4) { const f = ((i + 1) * sp - a0) / (a1 - a0);
      out.push({ index: mod(i, ANGA[anga].count), t: A + f + corr + calib2(A, f, a1 - a0, profile) }); i++; }
    return out;
  }
  /* v5.2.16 calibration (offline audit, Oct 2026). Residual term fitted to the 14 Apr 2026 - 13 Apr 2027 printed
     tithi/nakshatra endings: s = annual time term (minutes; sin/cos of the Vakya Sun longitude); m = Moon term
     (minutes x deg/day; sin/cos of the lunar anomaly at the event) divided by the anga's daily motion.
     Both reference calibrations give the same Moon term (about 1.5 arc-minutes). Re-check against each new year's print. */
  const CAL2 = {
    vakya: { s: [-0.950, 0.924], m: [-4.106, 36.244] },
    vakya2: { s: [-0.750, 0.799], m: [-4.879, 36.905] }
  };
  function anomDay(A) { const n = A - 1600984; let rem = n - Math.floor(n / 12372) * 12372; rem -= Math.floor(rem / 3031) * 3031; return rem - Math.floor(rem / 248) * 248; }
  function calib2(A, f, rate, profile) { const k = CAL2[profile]; if (!k) return 0;
    const S = vSun(A) * R, a = (anomDay(A) + f) * MA * R;
    return -(k.s[0] * Math.sin(S) + k.s[1] * Math.cos(S) + (k.m[0] * Math.sin(a) + k.m[1] * Math.cos(a)) / rate) / 1440; }
  const dayLenNaz = A => 30 + 2 * chara(A, 11.0) / 24;                      // matches the printed ahas (day length) within 1 vināḍi                      // ahas in nazhigai

  /* Vākya saṅkrāntis (Vākyakaraṇa 1.3–5: śrīr-guṇa-mitra offsets from Meṣa, mod 7, in days–nāzhigai–vināḍi) */
  const SANK_OFF = [[2,55,32],[6,19,44],[2,56,22],[6,24,34],[2,26,44],[4,54,6],[6,48,13],[1,18,37],[2,39,30],[4,6,46],[5,55,10],[1,15,31]].map(([d, n, v]) => d + n / 60 + v / 3600);
  function bhupaReach(m) { let lo = 0, hi = 370; for (let k = 0; k < 50; k++) { const mid = (lo + hi) / 2, i = Math.floor(mid / 10), f = (mid - 10 * i) / 10;
      const lam = mid - (BHUPA[i] + (BHUPA[i + 1] - BHUPA[i]) * f) / 60; if (lam < 30 * m) lo = mid; else hi = mid; } return lo; }
  function kaliToDate(n) { const t = new Date(Math.round((EPOCH + n - 2440587.5) * 864e5)); return t.toISOString().slice(0, 10); }
  // all Vākya saṅkrāntis of Kali year K: [{rasi, date, f}] — f = fraction of the Vākya day after sunrise
  function vSankrantis(K) {
    const M = mesha(K), out = [{rasi: 0, k: M}];
    for (let m = 1; m <= 11; m++) { const off = SANK_OFF[m - 1], k = Math.round((bhupaReach(m) - off) / 7); out.push({rasi: m, k: M + off + 7 * k}); }
    return out.map(x => { const n = Math.floor(x.k); return {rasi: x.rasi, date: kaliToDate(n), f: x.k - n}; });
  }
  function vSankrantiFrom(dateStr, count) {
    const A = Math.floor(jd0(...ymd(dateStr)) - EPOCH); let K = Math.floor(A / 365.25) + 1; while (mesha(K) > A - 40) K--;
    const all = []; for (let k = K; k < K + 3; k++) all.push(...vSankrantis(k));
    return all.filter(s => s.date >= addDays(dateStr, -2)).slice(0, count);
  }

  /* =============== DRIK =============== */
  const AST = () => root.Astronomy;
  function lahiri(date) { const jd = date.getTime() / 864e5 + 2440587.5, pA = T => 5028.796195 * T + 1.1054348 * T * T;   // v5.2.16: same Lahiri as the main app
    return 23.245524743 + (pA((jd - 2451545) / 36525) - pA((2435553.5 - 2451545) / 36525)) / 3600 + nutLon(jd); }   // v5.2.23: plus nutation, as lahiriTrue()
  function nutLon(jd) { const T = (jd - 2451545) / 36525, O = (125.04452 - 1934.136261 * T) * R, L = (280.4665 + 36000.7698 * T) * R, M = (218.3165 + 481267.8813 * T) * R;
    return (-17.20 * Math.sin(O) - 1.32 * Math.sin(2 * L) - 0.23 * Math.sin(2 * M) + 0.21 * Math.sin(2 * O)) / 3600; }   // nutation in longitude, degrees
  function dValues(date) { const A = AST(); const ay = lahiri(date);
    const S = mod(A.SunPosition(date).elon - ay, 360), M = mod(A.EclipticGeoMoon(date).lon - ay, 360);
    return { T: mod(M - S, 360), N: M, Y: mod(M + S, 360), K: mod(M - S, 360), R: M }; }
  function dSunrise(dateStr, lat, lon, tz) { const A = AST(); const [y, m, d] = ymd(dateStr);
    const start = new Date(Date.UTC(y, m - 1, d) - tz * 6e4); const obs = new A.Observer(lat, lon, 0);
    const rise = A.SearchRiseSet(A.Body.Sun, obs, +1, start, 1); const set = rise && A.SearchRiseSet(A.Body.Sun, obs, -1, rise.date, 1);
    return rise && { rise: rise.date, set: set ? set.date : null }; }
  function dBoundaries(t0, t1, anga) {
    const sp = ANGA[anga].span, idx = t => Math.floor(dValues(t)[anga] / sp);
    const out = []; const step = 36e5; let a = t0, ia = idx(a);
    for (let b = new Date(Math.min(+t0 + step, +t1)); +a < +t1; b = new Date(Math.min(+b + step, +t1))) {
      const ib = idx(b);
      if (ib !== ia) { let lo = +a, hi = +b; while (hi - lo > 1000) { const mid = (lo + hi) / 2; if (idx(new Date(mid)) === ia) lo = mid; else hi = mid; }
        out.push({ index: mod(ia, ANGA[anga].count), t: hi }); ia = idx(new Date(hi)); a = new Date(hi); b = new Date(Math.min(+a + step, +t1)); if (ib === ia) { a = b; continue; } continue; }
      a = b; ia = ib; if (+a >= +t1) break;
    }
    return out;
  }

  /* =============== common day model =============== */
  // returns { system, date, vara, startLabel, length, aparahna:[f0,f1], events:{T:[{index,f,clock}],...}, current:{...} }
  function fmtClock(minutesFromMidnight) { let m = Math.round(minutesFromMidnight); m = mod(m, 1440);
    const h = Math.floor(m / 60), mi = m % 60; return `${(h % 12) || 12}:${String(mi).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; }
  const fmtNaz = f => { const v = Math.round(f * 3600); const n = Math.floor(v / 60), s = v % 60; return `${String(n).padStart(2, '0')}-${String(s).padStart(2, '0')}`; };
  function vakyaDay(dateStr, profile, angas = ['T','N','Y','K']) {
    const A = Math.floor(jd0(...ymd(dateStr)) - EPOCH);
    const events = {}, current = {};
    for (const g of angas) {
      const all = [A - 1, A, A + 1].flatMap(x => vBoundaries(x, profile, g));
      const ev = all.filter(e => e.t >= A && e.t < A + 1).sort((p, q) => p.t - q.t);
      events[g] = ev.map(e => { const f = e.t - A; return { index: e.index, name: ANGA[g].name(e.index), f, naz: fmtNaz(f), clock: fmtClock(360 + f * 1440) }; });
      const after = all.filter(e => e.t >= A + 1).sort((p, q) => p.t - q.t)[0];
      const prev = all.filter(e => e.t < A).sort((p, q) => q.t - p.t)[0];
      current[g] = ev.length ? null : (after ? after.index : prev ? mod(prev.index + 1, ANGA[g].count) : null);
      if (!ev.length) current[g] = { index: current[g], name: ANGA[g].name(current[g]) };
    }
    const L = dayLenNaz(A) / 60;
    return { system: profile, label: PROFILES[profile].label, date: dateStr, vara: weekday(dateStr),
      sunriseLabel: '6:00 AM (printed convention)', dayFrac: L, aparahna: [0.6 * L, 0.8 * L],
      clockOf: f => fmtClock(360 + f * 1440), nazOf: fmtNaz, events, current, _A: A };
  }
  function drikDay(dateStr, lat, lon, tz = 330, angas = ['T','N','Y','K']) {
    const s0 = dSunrise(dateStr, lat, lon, tz), s1 = dSunrise(addDays(dateStr, 1), lat, lon, tz);
    const t0 = s0.rise, t1 = s1.rise, span = t1 - t0;
    const toF = t => (t - t0) / span;
    const clockOf = f => { const t = new Date(+t0 + f * span); return fmtClock((t.getTime() / 6e4 + tz) % 1440); };
    const events = {}, current = {};
    for (const g of angas) {
      const ev = dBoundaries(t0, t1, g);
      events[g] = ev.map(e => { const f = toF(e.t); return { index: e.index, name: ANGA[g].name(e.index), f, naz: fmtNaz(f), clock: clockOf(f) }; });
      if (!ev.length) { const i = mod(Math.floor(dValues(t0)[g] / ANGA[g].span), ANGA[g].count); current[g] = { index: i, name: ANGA[g].name(i) }; } else current[g] = null;
    }
    const dayF = (s0.set - t0) / span;
    return { system: 'drik', label: 'Drik', date: dateStr, vara: weekday(dateStr), sunrise: t0, sunset: s0.set,
      sunriseLabel: fmtClock((t0.getTime() / 6e4 + tz) % 1440), dayFrac: dayF, aparahna: [0.6 * dayF, 0.8 * dayF],
      clockOf, nazOf: fmtNaz, events, current, _t0: t0, _span: span };
  }
  // tithi segments within the day as [{index,name,f0,f1}]
  function segments(day, g = 'T') {
    const ev = day.events[g]; const out = []; let f0 = 0;
    for (const e of ev) { out.push({ index: e.index, name: e.name, f0, f1: e.f }); f0 = e.f; }
    const nextIdx = ev.length ? mod(ev[ev.length - 1].index + 1, ANGA[g].count) : day.current[g].index;
    out.push({ index: nextIdx, name: ANGA[g].name(nextIdx), f0, f1: 1, open: true });
    return out;
  }
  function overlap(a0, a1, b0, b1) { return Math.max(0, Math.min(a1, b1) - Math.max(a0, b0)); }
  // aparahna-rule day for a tithi index around a date (search -2..+2 days)
  function pitruDay(dayFn, dateStr, tithiIdx, closeMin) {
    const days = [-2, -1, 0, 1, 2].map(k => dayFn(addDays(dateStr, k)));
    const cands = days.map(d => { const seg = segments(d).filter(s => s.index === tithiIdx);
      const ov = seg.reduce((s, x) => s + overlap(x.f0, x.f1, d.aparahna[0], d.aparahna[1]), 0);
      const edges = seg.flatMap(x => [x.f0, x.f1]).filter(f => f > 0 && f < 1);
      const close = edges.some(f => Math.min(Math.abs(f - d.aparahna[0]), Math.abs(f - d.aparahna[1])) * 1440 <= closeMin);
      return { day: d, present: seg.length > 0, ov, close }; }).filter(c => c.present);
    if (!cands.length) return null;
    const withOv = cands.filter(c => c.ov > 0);
    let pick = withOv.length ? withOv.reduce((b, c) => (c.ov > b.ov + 1e-9 ? c : b)) : cands[0];
    return { date: pick.day.date, day: pick.day, close: cands.some(c => c.close), candidates: cands.map(c => ({ date: c.day.date, aparahnaMin: Math.round(c.ov * 1440) })) };
  }
    function sunSidereal(day) { if (day.system === 'drik') { const A = AST(); return mod(A.SunPosition(day._t0).elon - lahiri(day._t0), 360); } return vSun(day._A); }
  root.Panchanga = { sunSidereal, vakyaDay, drikDay, segments, pitruDay, tithiName, addDays, VARA_TA, VARA_EN, PROFILES,
    vSankrantiFrom, _internal: { vMoon, vSun, vakyaTable, chara, bhujantara, jd0, EPOCH, vValues, vSankrantis } };
})(typeof window !== 'undefined' ? window : globalThis);


// VocaMinder adapter: same sunset rule as upstream tdfNextSankrantis.
function monthStarts(year) {
  if (!Number.isInteger(year) || year < 2025 || year > 2051) throw new RangeError('Experimental range: 2025–2051');
  const P = globalThis.Panchanga;
  const rows = P.vSankrantiFrom(`${year}-04-01`, 13).map(s => ({tamilMonth:s.rasi+1, gregorianDate:s.f > P.vakyaDay(s.date,'vakya',[]).dayFrac ? P.addDays(s.date,1) : s.date}));
  if(rows.length !== 13 || rows.some((r,i)=>r.tamilMonth!==i%12+1)) throw Error('Unexpected month sequence');
  return rows;
}
module.exports = {monthStarts};
