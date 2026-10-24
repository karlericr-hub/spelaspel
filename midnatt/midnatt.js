"use strict";

/* =====================================================
   KODER – ändra här för att anpassa spelet till ert hus
   ===================================================== */
const UPPDRAG1_KOD = "821537";        // 6 siffror (skrivs spegelvänt på den fysiska lappen)

// Uppdrag 2: sju bilder (chiffer) som var och en översätts till en bokstav.
// Ordet visar VAR nästa ledtråd finns. Där hittar man den riktiga koden nedan.
// UPPDRAG2_SVAR måste ha lika många bokstäver som antalet bilder nedan.
const UPPDRAG2_BILDER = ["🦖", "🦉", "☀️", "🍋", "🏠", "🐿️", "🔑"];
const UPPDRAG2_SVAR = "DUSCHEN";      // 7 bokstäver – det gömda ordet i chiffret
const UPPDRAG2_KOD = "729";           // Röd, Grön, Blå – koden på lappen där ordet visar (duschen)

// Uppdrag 3: barnen räknar tre saker (ytterdörrar, lampor, gula böcker) och får
// tre siffror. Siffrorna översätts sedan till bokstäver med chiffernyckeln nedan
// (siffra → slumpvald bokstav) och det är bokstäverna som matas in.
const UPPDRAG3_KOD = "358";           // Ytterdörrar, lampor, gula böcker
const UPPDRAG4_KOD = "462";           // Siffrorna på föremålen på kattvinden
const UPPDRAG5_SVAR = ["TVÄTTMASKINEN", "TVÄTTMASKIN", "I TVÄTTMASKINEN"];

// Rubiks kub finns inte som emoji – ritas som liten 3x3-figur i stället.
const RUBIK_SVG =
  '<svg viewBox="0 0 100 100" width="1em" height="1em" aria-hidden="true">' +
  '<rect x="2" y="2" width="96" height="96" rx="14" fill="#0b0f0d" stroke="#000" stroke-width="2"/>' +
  '<g>' +
  '<rect x="8"  y="8"  width="24" height="24" rx="4" fill="#ef4444"/>' +
  '<rect x="38" y="8"  width="24" height="24" rx="4" fill="#f8fafc"/>' +
  '<rect x="68" y="8"  width="24" height="24" rx="4" fill="#22c55e"/>' +
  '<rect x="8"  y="38" width="24" height="24" rx="4" fill="#eab308"/>' +
  '<rect x="38" y="38" width="24" height="24" rx="4" fill="#f97316"/>' +
  '<rect x="68" y="38" width="24" height="24" rx="4" fill="#3b82f6"/>' +
  '<rect x="8"  y="68" width="24" height="24" rx="4" fill="#3b82f6"/>' +
  '<rect x="38" y="68" width="24" height="24" rx="4" fill="#22c55e"/>' +
  '<rect x="68" y="68" width="24" height="24" rx="4" fill="#ef4444"/>' +
  '</g></svg>';

// Föremålen på kattvinden (uppdrag 4) – byt emoji/namn efter vad ni lägger ut
const UPPDRAG4_FOREMAL = [
  { emoji: "📕", namn: "BOKEN" },
  { emoji: "✏️", namn: "PENNAN" },
  { svg: RUBIK_SVG, namn: "RUBIKS KUB" }
];

// Fönsterbilden i uppdrag 2:s ledtråd är en emoji, precis som bilderna i uppdraget.
const LEDTRAD2_BILD = "🪟";

// Ledtrådar – en per uppdrag. Ett värde kan vara en textsträng eller { html: "..." }.
// Under hela spelet får spelarna använda max MAX_LEDTRADAR stycken.
const LEDTRADAR = {
  "screen-m1": "Spegel, spegel på väggen där, säger mig vad svaret är.",
  "screen-m2": { html:
    '<div class="hint-visual">' +
      '<div class="cipher-card hint-card">' + LEDTRAD2_BILD + '</div>' +
      '<span class="hint-equals">= F</span>' +
    '</div>' },
  "screen-m3": "En siffra kan också vara en bokstav.",
  "screen-m4": "På övervåningen, i sovrummet, innanför en lucka.",
  "screen-m5": "Något som finns i tvättstugan."
};
const MAX_LEDTRADAR = 2;

/* ===================================================== */

const SCREENS = ["screen-intro", "screen-m1", "screen-m2", "screen-m3", "screen-m4", "screen-m5", "screen-final"];
const STORAGE_KEY = "operation-midnatt-progress";

let currentScreen = 0;
let transitioning = false;
let ledtradarUsed = 0;       // antal förbrukade ledtrådar totalt
let ledtradarOppnade = {};   // uppdrag vars ledtråd redan låsts upp (återöppna gratis)

/* ---------- Ljud (WebAudio, inga filer behövs) ---------- */
let audioCtx = null;
function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}
function tone(freq, start, dur, type, vol) {
  const ac = ctx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, ac.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(vol, ac.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + dur + 0.05);
}
function soundOk() {
  try {
    tone(660, 0, 0.12, "sine", 0.15);
    tone(880, 0.11, 0.14, "sine", 0.15);
    tone(1320, 0.24, 0.25, "sine", 0.12);
  } catch (e) {}
}
function soundErr() {
  try {
    tone(220, 0, 0.18, "square", 0.06);
    tone(160, 0.16, 0.25, "square", 0.06);
  } catch (e) {}
}
function soundFanfare() {
  try {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.14, 0.28, "triangle", 0.14));
    tone(1319, 0.6, 0.5, "triangle", 0.12);
  } catch (e) {}
}
function soundKey(freq) {
  try { tone(freq || 1200, 0, 0.035, "square", 0.03); } catch (e) {}
}

/* ---------- Bakgrundsmusik (WebAudio, mystisk och subtil) ---------- */
let musicGain = null;
let musicRunning = false;
let musicMuted = false;
let musicTimer = null;
let musicStep = 0;
let musicNextTime = 0;
const MUSIC_BPM = 64;
const MUSIC_STEP = 60 / MUSIC_BPM / 2;   // långsamma åttondelar (~0.47 s)
const MUSIC_LEVEL = 0.13;

// A-moll, glest och mystiskt. 16 steg = en lång, svävande slinga. 0 = tyst.
const A1=55, E2=82.41, F2=87.31, G2=98, A2=110, C3=130.81, D3=146.83;
const MUSIC_BASS = [A2,0,0,0, 0,0,0,F2, 0,0,0,G2, 0,0,E2,0];
const B4=493.88, C5=523.25, D5=587.33, E5=659.25;
// Sparsamt "speldose"-motiv som svävar ovanpå dronen
const MUSIC_LEAD = [0,0,E5,0, 0,C5,0,0, B4,0,0,0, 0,D5,0,0];

function musicVoice(freq, time, dur, type, vol, attack) {
  const ac = ctx();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(vol, time + (attack || 0.02));
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(g).connect(musicGain);
  osc.start(time);
  osc.stop(time + dur + 0.05);
}
// Låg dron som andas fram och tillbaka under hela slingan
function musicDrone(time, dur) {
  musicVoice(A1, time, dur, "sine", 0.055, 1.4);
  musicVoice(E2, time, dur, "sine", 0.03, 1.8);   // ren kvint – lätt spänning
}
// Mjukt, avlägset "tick" istället för trumma – som en klocka i mörkret
function musicTick(time) {
  const ac = ctx();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  osc.frequency.value = 1500;
  g.gain.setValueAtTime(0.02, time);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);
  osc.connect(g).connect(musicGain);
  osc.start(time);
  osc.stop(time + 0.1);
}
function musicScheduleStep(step, time) {
  if (step === 0) musicDrone(time, MUSIC_STEP * 16);   // ny dron varje slinga
  const bass = MUSIC_BASS[step];
  if (bass) musicVoice(bass, time, MUSIC_STEP * 6, "triangle", 0.085, 0.18);
  const lead = MUSIC_LEAD[step];
  if (lead) musicVoice(lead, time, MUSIC_STEP * 4, "sine", 0.06, 0.05);
  if (step === 0 || step === 8) musicTick(time);       // svag, gles puls
}
function musicScheduler() {
  const ac = ctx();
  while (musicNextTime < ac.currentTime + 0.18) {
    musicScheduleStep(musicStep, musicNextTime);
    musicNextTime += MUSIC_STEP;
    musicStep = (musicStep + 1) % 16;
  }
}
function startMusic() {
  if (musicRunning) return;
  const ac = ctx();
  musicRunning = true;
  musicGain = ac.createGain();
  musicGain.gain.value = musicMuted ? 0 : MUSIC_LEVEL;
  musicGain.connect(ac.destination);
  musicStep = 0;
  musicNextTime = ac.currentTime + 0.1;
  musicScheduler();
  musicTimer = setInterval(musicScheduler, 30);
}
function stopMusic() {
  musicRunning = false;
  clearInterval(musicTimer);
  musicTimer = null;
  if (musicGain) {
    try {
      const ac = ctx();
      musicGain.gain.setValueAtTime(musicGain.gain.value, ac.currentTime);
      musicGain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.4);
    } catch (e) {}
    const g = musicGain;
    setTimeout(() => { try { g.disconnect(); } catch (e) {} }, 600);
    musicGain = null;
  }
}
function setMusicMuted(m) {
  musicMuted = m;
  const btn = document.getElementById("music-toggle");
  if (btn) {
    btn.textContent = m ? "🔇" : "🔊";
    btn.classList.toggle("off", m);
  }
  if (musicGain) {
    try {
      const ac = ctx();
      musicGain.gain.cancelScheduledValues(ac.currentTime);
      musicGain.gain.setValueAtTime(m ? 0 : MUSIC_LEVEL, ac.currentTime);
    } catch (e) {}
  }
  try { localStorage.setItem("midnatt_music_muted", m ? "1" : "0"); } catch (e) {}
}
function updateMusic() {
  // Musik på kuvert/intro (0) och uppdragen (1–5), men inte på vinstskärmen (6).
  if (currentScreen >= 0 && currentScreen <= 5) startMusic();
  else stopMusic();
}
document.getElementById("music-toggle").addEventListener("click", () => setMusicMuted(!musicMuted));
try { musicMuted = localStorage.getItem("midnatt_music_muted") === "1"; } catch (e) {}
setMusicMuted(musicMuted);

/* ---------- Progress ---------- */
const pipsEl = document.getElementById("progress-pips");
for (let i = 0; i < 5; i++) {
  const pip = document.createElement("span");
  pip.className = "pip";
  pipsEl.appendChild(pip);
}
function updateProgress() {
  const progressEl = document.getElementById("progress");
  const label = document.getElementById("progress-label");
  if (currentScreen === 0) {
    progressEl.style.visibility = "hidden";
    return;
  }
  progressEl.style.visibility = "visible";
  const mission = Math.min(currentScreen, 5);
  label.textContent = "UPPDRAG " + mission + "/5";
  if (currentScreen === 6) label.textContent = "UPPDRAG 5/5";
  pipsEl.querySelectorAll(".pip").forEach((pip, i) => {
    pip.classList.toggle("done", i < currentScreen - 1 || currentScreen === 6);
    pip.classList.toggle("active", i === currentScreen - 1 && currentScreen < 6);
  });
}

/* ---------- Skärmväxling ---------- */
function showScreen(index, instant) {
  const next = document.getElementById(SCREENS[index]);
  const prev = document.getElementById(SCREENS[currentScreen]);
  if (instant) {
    prev.classList.remove("visible", "leaving");
    next.classList.add("visible");
    currentScreen = index;
    updateProgress();
    afterShow(index);
    return;
  }
  if (transitioning) return;
  transitioning = true;
  prev.classList.remove("visible");
  prev.classList.add("leaving");
  setTimeout(() => {
    prev.classList.remove("leaving");
    next.classList.add("visible");
    currentScreen = index;
    updateProgress();
    transitioning = false;
    afterShow(index);
  }, 400);
}

function afterShow(index) {
  saveProgress();
  updateHintUI();
  updateMusic();
  if (index === 6) {
    soundFanfare();
    startConfetti();
  }
  // Fokusera första tomma rutan i uppdraget
  const screen = document.getElementById(SCREENS[index]);
  const firstInput = screen.querySelector("input");
  if (firstInput) setTimeout(() => firstInput.focus(), 150);
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      screen: currentScreen,
      hintsUsed: ledtradarUsed,
      hintsOpened: Object.keys(ledtradarOppnade)
    }));
  } catch (e) {}
}
function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return 0;
    // Bakåtkompatibelt: tidigare versioner sparade bara skärmindexet som en siffra
    if (/^\d+$/.test(raw.trim())) {
      const v = parseInt(raw, 10);
      return (v >= 1 && v < SCREENS.length) ? v : 0;
    }
    const data = JSON.parse(raw);
    ledtradarUsed = Math.min(MAX_LEDTRADAR, Math.max(0, data.hintsUsed | 0));
    ledtradarOppnade = {};
    (data.hintsOpened || []).forEach(k => { ledtradarOppnade[k] = true; });
    const v = data.screen | 0;
    return (v >= 1 && v < SCREENS.length) ? v : 0;
  } catch (e) {}
  return 0;
}

/* ---------- Sifferrutor ---------- */
function buildDigitBoxes(containerId, count, colors, onComplete) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const boxes = [];
  for (let i = 0; i < count; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "numeric";
    input.maxLength = 1;
    input.autocomplete = "off";
    input.className = "code-box" + (colors && colors[i] ? " " + colors[i] : "");
    container.appendChild(input);
    boxes.push(input);

    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 1);
      if (input.value) {
        soundKey();
        if (i < count - 1) boxes[i + 1].focus();
        else if (boxes.every(b => b.value)) onComplete(boxes.map(b => b.value).join(""));
      }
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && i > 0) {
        boxes[i - 1].focus();
        boxes[i - 1].value = "";
        e.preventDefault();
      }
    });
    input.addEventListener("focus", () => input.select());
  }
  return boxes;
}

function handleCode(boxes, code, correctCode, feedbackId, nextScreen) {
  const feedback = document.getElementById(feedbackId);
  const panel = feedback.closest(".panel");
  if (code === correctCode) {
    feedback.textContent = "✔ ÅTKOMST BEVILJAD";
    feedback.className = "feedback ok";
    panel.classList.add("flash-ok");
    soundOk();
    boxes.forEach(b => b.disabled = true);
    setTimeout(() => {
      panel.classList.remove("flash-ok");
      showScreen(nextScreen);
    }, 1400);
  } else {
    feedback.textContent = "✖ ÅTKOMST NEKAD – FÖRSÖK IGEN";
    feedback.className = "feedback err";
    panel.classList.add("shake");
    soundErr();
    setTimeout(() => {
      panel.classList.remove("shake");
      boxes.forEach(b => { b.value = ""; b.disabled = false; });
      boxes[0].focus();
    }, 500);
    setTimeout(() => { feedback.textContent = ""; feedback.className = "feedback"; }, 2500);
  }
}

/* ---------- Bokstavsrutor (samma beteende som sifferrutor, men bokstäver) ---------- */
function buildLetterBoxes(containerId, count, onComplete) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const boxes = [];
  for (let i = 0; i < count; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "text";
    input.maxLength = 1;
    input.autocomplete = "off";
    input.autocapitalize = "characters";
    input.spellcheck = false;
    input.className = "code-box";
    container.appendChild(input);
    boxes.push(input);

    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^A-Za-zÅÄÖåäö]/g, "").toUpperCase().slice(0, 1);
      if (input.value) {
        soundKey();
        if (i < count - 1) boxes[i + 1].focus();
        else if (boxes.every(b => b.value)) onComplete(boxes.map(b => b.value).join(""));
      }
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && i > 0) {
        boxes[i - 1].focus();
        boxes[i - 1].value = "";
        e.preventDefault();
      }
    });
    input.addEventListener("focus", () => input.select());
  }
  return boxes;
}

/* ---------- Uppdrag 3: chiffernyckel (siffra → slumpvald bokstav) ---------- */
// Nyckeln slumpas om vid varje sidladdning. Den visas alltid på skärmen, så
// barnen kan översätta sina tre observerade siffror till bokstäver.
let UPPDRAG3_CHIFFER = {};

function genereraChiffer() {
  const alfabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  // Fisher–Yates: blanda och plocka tio unika bokstäver
  for (let i = alfabet.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [alfabet[i], alfabet[j]] = [alfabet[j], alfabet[i]];
  }
  const chiffer = {};
  for (let d = 0; d < 10; d++) chiffer[d] = alfabet[d];
  return chiffer;
}

function buildM3Key() {
  const key = document.getElementById("m3-key");
  key.innerHTML = "";
  const table = document.createElement("table");
  table.className = "cipher-table";
  const digitRow = document.createElement("tr");
  const letterRow = document.createElement("tr");
  for (let d = 0; d < 10; d++) {
    const digit = document.createElement("td");
    digit.className = "key-digit";
    digit.textContent = d;
    const letter = document.createElement("td");
    letter.className = "key-letter";
    letter.textContent = UPPDRAG3_CHIFFER[d];
    digitRow.appendChild(digit);
    letterRow.appendChild(letter);
  }
  table.appendChild(digitRow);
  table.appendChild(letterRow);
  key.appendChild(table);
}

// Rätt svar = de observerade siffrorna översatta via chiffernyckeln.
function chifferSvar() {
  return UPPDRAG3_KOD.split("").map(d => UPPDRAG3_CHIFFER[d]).join("");
}

/* ---------- Uppdrag 2: bildchiffer → gömt ord (ledtråd, inte slutförande) ---------- */
function buildM2Word() {
  const grid = document.getElementById("m2-grid");
  const letters = document.getElementById("m2-letters");
  grid.innerHTML = "";
  letters.innerHTML = "";
  const boxes = [];
  const count = UPPDRAG2_BILDER.length;
  const svar = UPPDRAG2_SVAR.toUpperCase();

  UPPDRAG2_BILDER.forEach((emoji, i) => {
    const col = document.createElement("div");
    col.className = "cipher-col";

    const card = document.createElement("div");
    card.className = "cipher-card";
    card.textContent = emoji;

    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "text";
    input.maxLength = 1;
    input.autocomplete = "off";
    input.autocapitalize = "characters";
    input.spellcheck = false;
    input.className = "letter-box";

    col.appendChild(card);
    grid.appendChild(col);
    letters.appendChild(input);
    boxes.push(input);

    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^A-Za-zÅÄÖåäö]/g, "").toUpperCase().slice(0, 1);
      if (input.value) {
        soundKey();
        if (i < count - 1) boxes[i + 1].focus();
        else if (boxes.every(b => b.value)) checkM2Word(boxes, svar);
      }
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && i > 0) {
        boxes[i - 1].focus();
        boxes[i - 1].value = "";
        e.preventDefault();
      }
    });
    input.addEventListener("focus", () => input.select());
  });

  m2LetterBoxes = boxes;
}

// Kollar det gömda ordet. Rätt ord slutför INTE uppdraget – det visar bara
// vart man ska gå för att hitta den riktiga koden (729) längre ner.
function checkM2Word(boxes, svar) {
  const fb = document.getElementById("m2-word-feedback");
  const guess = boxes.map(b => b.value).join("");
  if (guess === svar) {
    fb.textContent = "✔ RÄTT ORD – GÅ DIT OCH HITTA KODEN!";
    fb.className = "feedback ok";
    soundOk();
  } else {
    fb.textContent = "✖ FEL ORD – TÄNK SOM EN SPION";
    fb.className = "feedback err";
    soundErr();
    setTimeout(() => { fb.textContent = ""; fb.className = "feedback"; }, 2500);
  }
}

/* ---------- Bygg uppdragen ---------- */
let m1Boxes, m2Boxes, m2LetterBoxes, m3Boxes, m4Boxes;

function buildMissions() {
  m1Boxes = buildDigitBoxes("m1-boxes", UPPDRAG1_KOD.length, null,
    (code) => handleCode(m1Boxes, code, UPPDRAG1_KOD, "m1-feedback", 2));

  buildM2Word();
  m2Boxes = buildDigitBoxes("m2-boxes", UPPDRAG2_KOD.length, ["c-red", "c-green", "c-blue"],
    (code) => handleCode(m2Boxes, code, UPPDRAG2_KOD, "m2-feedback", 3));

  UPPDRAG3_CHIFFER = genereraChiffer();
  buildM3Key();
  m3Boxes = buildLetterBoxes("m3-boxes", UPPDRAG3_KOD.length,
    (code) => handleCode(m3Boxes, code, chifferSvar(), "m3-feedback", 4));

  // Uppdrag 4: rutor med föremålsbild ovanför
  const objRow = document.getElementById("m4-objects");
  objRow.innerHTML = "";
  const m4Inputs = [];
  UPPDRAG4_FOREMAL.forEach((obj, i) => {
    const col = document.createElement("div");
    col.className = "obj-col";
    const icon = document.createElement("div");
    icon.className = "obj-icon";
    if (obj.svg) icon.innerHTML = obj.svg;
    else icon.textContent = obj.emoji;
    icon.title = obj.namn;
    col.appendChild(icon);
    objRow.appendChild(col);
    m4Inputs.push(col);
  });
  // Skapa själva sifferrutorna i en dold container och flytta in dem under ikonerna
  const tmp = document.createElement("div");
  tmp.id = "m4-boxes-tmp";
  tmp.style.display = "none";
  document.body.appendChild(tmp);
  m4Boxes = buildDigitBoxes("m4-boxes-tmp", UPPDRAG4_KOD.length, null,
    (code) => handleCode(m4Boxes, code, UPPDRAG4_KOD, "m4-feedback", 5));
  m4Boxes.forEach((box, i) => m4Inputs[i].appendChild(box));
  tmp.remove();
}

/* ---------- Uppdrag 5 (textsvar) ---------- */
function normalize(s) {
  return s.toUpperCase().replace(/[^A-ZÅÄÖ]/g, "");
}
function checkM5() {
  const input = document.getElementById("m5-input");
  const feedback = document.getElementById("m5-feedback");
  const panel = feedback.closest(".panel");
  const guess = normalize(input.value);
  if (!guess) return;
  const ok = UPPDRAG5_SVAR.some(a => normalize(a) === guess);
  if (ok) {
    feedback.textContent = "✔ ÅTKOMST BEVILJAD – GÅ DIT, AGENTER!";
    feedback.className = "feedback ok";
    panel.classList.add("flash-ok");
    soundOk();
    input.disabled = true;
    setTimeout(() => {
      panel.classList.remove("flash-ok");
      showScreen(6);
    }, 1600);
  } else {
    feedback.textContent = "✖ ÅTKOMST NEKAD – TÄNK SOM EN SPION";
    feedback.className = "feedback err";
    panel.classList.add("shake");
    soundErr();
    setTimeout(() => {
      panel.classList.remove("shake");
      input.value = "";
      input.focus();
    }, 500);
    setTimeout(() => { feedback.textContent = ""; feedback.className = "feedback"; }, 2500);
  }
}
document.getElementById("btn-m5-check").addEventListener("click", checkM5);
// Enter på m5 hanteras av den centrala tangentbords-routern (se nedan).

/* ---------- Startkuvert ---------- */
function showEnvelope() {
  const ov = document.getElementById("envelope-overlay");
  const env = document.getElementById("envelope");
  env.classList.remove("opening");
  ov.classList.remove("hide");
  ov.style.display = "flex";
  ov.style.opacity = "";
  ov.style.visibility = "";
}
function openEnvelope() {
  const ov = document.getElementById("envelope-overlay");
  const env = document.getElementById("envelope");
  if (env.classList.contains("opening")) return;   // redan öppnat
  ctx();          // väck ljudmotorn på användarklick (krav på plattor)
  soundOk();
  updateMusic();  // starta bakgrundsmusiken redan på kuvert-/introsidan
  env.classList.add("opening");
  setTimeout(() => ov.classList.add("hide"), 560);
  setTimeout(() => {
    ov.style.display = "none";
    ov.classList.remove("hide");
    env.classList.remove("opening");
    typeIntro();
  }, 1160);
}
document.getElementById("envelope-overlay").addEventListener("click", openEnvelope);

/* ---------- Intro med skrivmaskinseffekt ---------- */
const INTRO_TEXT =
  "Välkomna, agenter.\n\n" +
  "En okänd organisation har gömt ett HEMLIGT PAKET innan de försvann.\n\n" +
  "Organisationen har lämnat efter sig fem säkerhetssystem. " +
  "Endast skickliga spioner kan ta sig igenom dem.\n\n" +
  "Varje gång ni löser ett uppdrag får ni en kod som låser upp nästa säkerhetssystem.\n\n" +
  "Fastnar ni? I varje uppdrag finns en LEDTRÅD-knapp. Men var sparsamma – " +
  "under hela uppdraget får ni bara använda TVÅ ledtrådar.";

let typingTimer = null;
function typeIntro() {
  const el = document.getElementById("intro-text");
  const btn = document.getElementById("btn-start");
  el.textContent = "";
  btn.style.visibility = "hidden";
  let i = 0;
  clearInterval(typingTimer);
  typingTimer = setInterval(() => {
    if (i >= INTRO_TEXT.length) {
      clearInterval(typingTimer);
      btn.style.visibility = "visible";
      btn.focus();   // så att Enter kan starta uppdraget utan touch
      return;
    }
    const ch = INTRO_TEXT[i];
    el.textContent += ch;
    // Knappljud för varje synlig tecken (hoppa över mellanslag/radbrytningar)
    if (ch !== " " && ch !== "\n") {
      soundKey(1050 + Math.floor(Math.random() * 500));
    }
    i++;
  }, 22);
  // Låt en klickning hoppa över skrivandet
  el.parentElement.addEventListener("click", () => {
    if (i < INTRO_TEXT.length) {
      clearInterval(typingTimer);
      el.textContent = INTRO_TEXT;
      i = INTRO_TEXT.length;
      btn.style.visibility = "visible";
      btn.focus();
    }
  });
  el.style.whiteSpace = "pre-line";
}

document.getElementById("btn-start").addEventListener("click", () => {
  ctx(); // väck ljudmotorn på användarklick (krav på plattor)
  soundOk();
  showScreen(1);
});

/* ---------- Omstart ---------- */
document.getElementById("btn-restart").addEventListener("click", () => {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  ledtradarUsed = 0;
  ledtradarOppnade = {};
  updateHintUI();
  stopConfetti();
  document.getElementById("m5-input").value = "";
  document.getElementById("m5-input").disabled = false;
  document.getElementById("m5-feedback").textContent = "";
  ["m1-feedback", "m2-word-feedback", "m2-feedback", "m3-feedback", "m4-feedback"].forEach(id => {
    document.getElementById(id).textContent = "";
    document.getElementById(id).className = "feedback";
  });
  buildMissions();
  showScreen(0);
  showEnvelope();
});

/* ---------- Ledtrådar ---------- */
const hintOverlay = document.getElementById("hint-overlay");
const hintAsk = document.getElementById("hint-ask");
const hintShow = document.getElementById("hint-show");
const hintAskText = document.getElementById("hint-ask-text");
const hintText = document.getElementById("hint-text");
const hintConfirmBtn = document.getElementById("hint-confirm");
const hintCancelBtn = document.getElementById("hint-cancel");
let pendingHintScreen = null;

function hintsLeft() { return MAX_LEDTRADAR - ledtradarUsed; }

function updateHintUI() {
  const btn = document.getElementById("header-hint");
  // Ledtråds-knappen i headern visas bara på uppdragsskärmarna (1–5).
  const onMission = currentScreen >= 1 && currentScreen <= 5;
  btn.style.display = onMission ? "" : "none";
  if (!onMission) return;
  const opened = !!ledtradarOppnade[SCREENS[currentScreen]];
  btn.innerHTML = (opened ? "💡 VISA LEDTRÅD IGEN " : "💡 LEDTRÅD ") +
                  '<span class="key">(F1)</span>';
}

function openHintOverlay() { hintOverlay.classList.add("show"); }
function closeHintOverlay() {
  hintOverlay.classList.remove("show");
  pendingHintScreen = null;
}

function showHintBox(hint) {
  if (hint && typeof hint === "object" && hint.html) {
    hintText.innerHTML = hint.html;
  } else {
    hintText.textContent = hint;
  }
  hintAsk.style.display = "none";
  hintShow.style.display = "block";
  openHintOverlay();
}

function openHintFlow(screenId) {
  const text = LEDTRADAR[screenId];
  if (!text) return;
  // Redan upplåst på detta uppdrag -> visa gratis
  if (ledtradarOppnade[screenId]) {
    showHintBox(text);
    return;
  }
  hintShow.style.display = "none";
  hintAsk.style.display = "block";
  if (hintsLeft() <= 0) {
    pendingHintScreen = null;
    hintAskText.textContent = "Ni har inga ledtrådar kvar. Ni klarar det här, agenter!";
    hintConfirmBtn.style.display = "none";
    hintCancelBtn.textContent = "STÄNG";
  } else {
    pendingHintScreen = screenId;
    hintAskText.textContent = "Vill ni förbruka en av era ledtrådar? Ni har " +
      hintsLeft() + " kvar.";
    hintConfirmBtn.style.display = "";
    hintCancelBtn.textContent = "AVBRYT";
  }
  openHintOverlay();
}

function confirmHint() {
  if (!pendingHintScreen) return;
  const screenId = pendingHintScreen;
  pendingHintScreen = null;
  ledtradarUsed++;
  ledtradarOppnade[screenId] = true;
  saveProgress();
  soundKey();
  updateHintUI();
  showHintBox(LEDTRADAR[screenId]);
}

document.getElementById("header-hint").addEventListener("click", () => {
  if (currentScreen >= 1 && currentScreen <= 5) openHintFlow(SCREENS[currentScreen]);
});
hintConfirmBtn.addEventListener("click", confirmHint);
hintCancelBtn.addEventListener("click", closeHintOverlay);
document.getElementById("hint-close").addEventListener("click", closeHintOverlay);

/* ---------- Extern tangentbordsstyrning ----------
   Gör hela spelet körbart från ett fysiskt tangentbord (t.ex. Galaxy Tab):
   - Enter  = tryck på "gå vidare"-knappen för aktuell skärm/modal
   - F1     = LEDTRÅD för aktuellt uppdrag
   - Tab    = hoppa till nästa ifyllningsruta (Shift+Tab = föregående)
   - Escape = stäng ledtrådsrutan
   Vanlig inmatning (siffror/bokstäver) lämnas orörd. */

function envelopeVisible() {
  const ov = document.getElementById("envelope-overlay");
  const env = document.getElementById("envelope");
  // OBS: kolla den *beräknade* stilen – vid återupptaget spel döljs kuvertet
  // via CSS (display:none), inte via inline-stil.
  return getComputedStyle(ov).display !== "none" && !env.classList.contains("opening");
}
function hintOpen() { return hintOverlay.classList.contains("show"); }

// Skickar in aktuell kod för uppdrag 1–4, men bara om alla rutor är ifyllda
// (annars ignoreras Enter så man inte får ett falskt "ÅTKOMST NEKAD").
function submitMission(index) {
  let boxes, kod, fb, next;
  switch (index) {
    case 1: boxes = m1Boxes; kod = UPPDRAG1_KOD;  fb = "m1-feedback"; next = 2; break;
    case 2: boxes = m2Boxes; kod = UPPDRAG2_KOD;  fb = "m2-feedback"; next = 3; break;
    case 3: boxes = m3Boxes; kod = chifferSvar(); fb = "m3-feedback"; next = 4; break;
    case 4: boxes = m4Boxes; kod = UPPDRAG4_KOD;  fb = "m4-feedback"; next = 5; break;
    default: return;
  }
  if (!boxes || !boxes.length) return;
  if (!boxes.every(b => b.value)) return;               // ofullständig kod
  if (boxes.some(b => b.disabled)) return;              // redan löst/pågår
  handleCode(boxes, boxes.map(b => b.value).join(""), kod, fb, next);
}

// Enter = primär åtgärd beroende på var man är
function triggerPrimaryAction() {
  if (envelopeVisible()) { openEnvelope(); return; }
  if (hintOpen()) {
    if (hintConfirmBtn.style.display !== "none" && pendingHintScreen) confirmHint();
    else closeHintOverlay();
    return;
  }
  if (currentScreen === 0) {
    const btn = document.getElementById("btn-start");
    if (btn.style.visibility !== "hidden") btn.click();
  } else if (currentScreen >= 1 && currentScreen <= 4) {
    submitMission(currentScreen);
  } else if (currentScreen === 5) {
    checkM5();
  }
  // Final (6): ingen åtgärd – undvik oavsiktlig omstart.
}

// Aktiva uppdragets svarsrutor (för Tab-navigering), eller null
function currentMissionBoxes() {
  switch (currentScreen) {
    case 1: return m1Boxes;
    case 2: return m2Boxes;
    case 3: return m3Boxes;
    case 4: return m4Boxes;
    default: return null;
  }
}

document.addEventListener("keydown", (e) => {
  // Låt modifierade genvägar (Ctrl/Cmd/Alt) vara i fred
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  if (e.key === "Enter") {
    e.preventDefault();
    triggerPrimaryAction();
    return;
  }

  if (e.key === "F1") {
    e.preventDefault();                     // blockera webbläsarens hjälp
    if (!hintOpen() && currentScreen >= 1 && currentScreen <= 5) {
      openHintFlow(SCREENS[currentScreen]);
    }
    return;
  }

  if (e.key === "Escape") {
    if (hintOpen()) { e.preventDefault(); closeHintOverlay(); }
    return;
  }

  if (e.key === "Tab") {
    const boxes = currentMissionBoxes();
    if (!boxes || boxes.length < 2 || hintOpen()) return;   // annars standard-Tab
    e.preventDefault();
    const active = document.activeElement;
    let idx = boxes.indexOf(active);
    if (idx === -1) idx = e.shiftKey ? boxes.length : -1;   // utanför -> hoppa in i ändan
    const dir = e.shiftKey ? -1 : 1;
    for (let step = 1; step <= boxes.length; step++) {
      const cand = boxes[(idx + dir * step + boxes.length * step) % boxes.length];
      if (cand && !cand.disabled) { cand.focus(); cand.select && cand.select(); break; }
    }
  }
});

/* ---------- Konfetti ---------- */
const confettiCanvas = document.getElementById("confetti-canvas");
const confettiCtx = confettiCanvas.getContext("2d");
let confettiParticles = [];
let confettiRunning = false;

function resizeConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeConfetti);
resizeConfetti();

function startConfetti() {
  const colors = ["#2bff88", "#ffc14d", "#4da3ff", "#ff4d5e", "#ffffff", "#b06bff"];
  confettiParticles = [];
  for (let i = 0; i < 180; i++) {
    confettiParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: -20 - Math.random() * confettiCanvas.height,
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy: 2 + Math.random() * 3.5,
      vx: -1.5 + Math.random() * 3,
      rot: Math.random() * Math.PI * 2,
      vr: -0.15 + Math.random() * 0.3
    });
  }
  if (!confettiRunning) {
    confettiRunning = true;
    requestAnimationFrame(confettiLoop);
  }
}
function stopConfetti() {
  confettiRunning = false;
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}
function confettiLoop() {
  if (!confettiRunning) return;
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiParticles.forEach(p => {
    p.y += p.vy;
    p.x += p.vx + Math.sin(p.y * 0.02);
    p.rot += p.vr;
    if (p.y > confettiCanvas.height + 20) {
      p.y = -20;
      p.x = Math.random() * confettiCanvas.width;
    }
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rot);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    confettiCtx.restore();
  });
  requestAnimationFrame(confettiLoop);
}

/* ---------- Start ---------- */
buildMissions();
const saved = loadProgress();
document.getElementById(SCREENS[saved]).classList.add("visible");
currentScreen = saved;
updateProgress();
updateHintUI();
if (saved === 0) {
  showEnvelope();          // visa kuvertet först – intro startar när det öppnas
} else if (saved === 6) {
  startConfetti();
} else {
  // Återupptaget uppdrag: sätt markören i första ifyllningsrutan direkt
  // (afterShow körs inte vid denna första inladdning).
  const firstInput = document.getElementById(SCREENS[saved]).querySelector("input");
  if (firstInput) setTimeout(() => firstInput.focus(), 150);
  // Återupptaget spel mitt i ett uppdrag: starta musiken vid första klicket
  // (webbläsare kräver en användargest innan ljud får spelas).
  const kickstart = () => {
    ctx();
    updateMusic();
    window.removeEventListener("pointerdown", kickstart);
    window.removeEventListener("keydown", kickstart);
  };
  window.addEventListener("pointerdown", kickstart);
  window.addEventListener("keydown", kickstart);
}
