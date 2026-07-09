/* ==========================================================================
   Paper Pillbox — all logic runs in the browser. Nothing is ever sent anywhere.
   ========================================================================== */
"use strict";

/* ---------- Constants ---------- */

const STORAGE_KEY = "paperpillbox:v1";
const MAX_MEDS = 200;
const MAX_FIELD = 200;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SLOTS = [
  { id: "morning", label: "Morning" },
  { id: "noon", label: "Noon" },
  { id: "evening", label: "Evening" },
  { id: "bedtime", label: "Bedtime" },
];

const SLOT_LABELS = {
  morning: "Morning",
  noon: "Noon",
  evening: "Evening",
  bedtime: "Bedtime",
  prn: "Only as needed",
};

const TEXT_SIZES = ["standard", "large", "xl"];
const ORIENTATIONS = ["portrait", "landscape"];

/* Simple line icons, drawn with currentColor so each band tints its own. */
const SLOT_ICONS = {
  morning:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 18h18"/><path d="M7.5 18a4.5 4.5 0 0 1 9 0"/><path d="M12 3.5v4"/><path d="m9.5 5.5 2.5-2.5 2.5 2.5"/><path d="m5 11.5-1.5-1"/><path d="m19 11.5 1.5-1"/></svg>',
  noon:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19"/></svg>',
  evening:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 18h18"/><path d="M7.5 18a4.5 4.5 0 0 1 9 0"/><path d="M12 7.5v-4"/><path d="M9.5 5.5 12 8l2.5-2.5"/><path d="m5 11.5-1.5-1"/><path d="m19 11.5 1.5-1"/></svg>',
  bedtime:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/><path d="m17.5 4.5.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6Z"/></svg>',
  prn:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 7.2v9.6M7.8 9.6l8.4 4.8M16.2 9.6l-8.4 4.8"/></svg>',
};

const COLORS = [
  { id: "white", label: "White", hex: "#FFFFFF" },
  { id: "cream", label: "Cream", hex: "#F3E7C6" },
  { id: "yellow", label: "Yellow", hex: "#F0CE4E" },
  { id: "orange", label: "Orange", hex: "#E8963F" },
  { id: "pink", label: "Pink", hex: "#ECA6B8" },
  { id: "red", label: "Red", hex: "#C6473E" },
  { id: "purple", label: "Purple", hex: "#8E6BB5" },
  { id: "blue", label: "Blue", hex: "#4A7EC0" },
  { id: "teal", label: "Teal", hex: "#3E9C97" },
  { id: "green", label: "Green", hex: "#4E9B6F" },
  { id: "brown", label: "Brown", hex: "#8A5A3B" },
  { id: "gray", label: "Gray", hex: "#9AA3A0" },
];

const SHAPE_LABELS = {
  unknown: "Not sure yet",
  round: "Round tablet",
  oval: "Oval tablet",
  capsule: "Capsule",
  liquid: "Liquid",
  drops: "Drops",
  inhaler: "Inhaler",
  injection: "Injection",
  patch: "Patch",
  cream: "Cream or gel",
  other: "Something else",
};

const SHAPE_IDS = Object.keys(SHAPE_LABELS);
const COLOR_IDS = COLORS.map((c) => c.id);
const SLOT_IDS = Object.keys(SLOT_LABELS);

/* ---------- Pill chips ---------- */

function chipSvg(shape, colorId) {
  const color = (COLORS.find((c) => c.id === colorId) || COLORS[0]).hex;
  const S = 'stroke="#3A4442" stroke-width="1.6"';
  let body = "";
  switch (shape) {
    /* Asserts neither shape nor color: the user never told us either. */
    case "unknown":
      body = `<rect x="6" y="14" width="28" height="12" rx="6" fill="none" stroke="#3A4442" stroke-width="1.6" stroke-dasharray="3 2.5"/>`;
      break;
    case "round":
      body = `<circle cx="20" cy="20" r="13" fill="${color}" ${S}/><path d="M8.5 20h23" stroke="#3A4442" stroke-width="1.2" opacity="0.5"/>`;
      break;
    case "oval":
      body = `<ellipse cx="20" cy="20" rx="15" ry="9.5" fill="${color}" ${S}/>`;
      break;
    case "capsule":
      body = `<rect x="5" y="13" width="30" height="14" rx="7" fill="#FFFFFF" ${S}/><path d="M20 13h8a7 7 0 0 1 0 14h-8Z" fill="${color}" stroke="#3A4442" stroke-width="1.2"/>`;
      break;
    case "liquid":
      body = `<rect x="15" y="5.5" width="10" height="5" rx="1.5" fill="#3A4442"/><rect x="11" y="10.5" width="18" height="24" rx="3" fill="#FFFFFF" ${S}/><path d="M12.5 21h15v11a1.5 1.5 0 0 1-1.5 1.5H14a1.5 1.5 0 0 1-1.5-1.5Z" fill="${color}"/>`;
      break;
    case "drops":
      body = `<path d="M20 5.5C20 5.5 9.5 18.5 9.5 25a10.5 10.5 0 0 0 21 0C30.5 18.5 20 5.5 20 5.5Z" fill="${color}" ${S}/>`;
      break;
    case "inhaler":
      body = `<rect x="13" y="6" width="10" height="17" rx="2" fill="${color}" ${S}/><path d="M13 23h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2Z" fill="#FFFFFF" ${S}/>`;
      break;
    case "injection":
      body = `<path d="M4 18.5h4v3H4Z" fill="#3A4442"/><rect x="8" y="15.5" width="18" height="9" rx="2" fill="#FFFFFF" ${S}/><rect x="10.5" y="18" width="9" height="4" fill="${color}"/><path d="M26 20h9" stroke="#3A4442" stroke-width="1.8"/>`;
      break;
    case "patch":
      body = `<rect x="8" y="8" width="24" height="24" rx="5" fill="${color}" ${S}/><rect x="14" y="14" width="12" height="12" rx="2.5" fill="#FFFFFF" opacity="0.55"/>`;
      break;
    case "cream":
      body = `<rect x="29" y="15.5" width="6" height="9" rx="1.5" fill="#3A4442"/><path d="M6 13.5h20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6l1.5-6.5Z" fill="${color}" ${S}/>`;
      break;
    default:
      body = `<rect x="9" y="9" width="22" height="22" rx="5" fill="${color}" ${S} transform="rotate(45 20 20)"/>`;
  }
  return `<svg viewBox="0 0 40 40" role="img" aria-hidden="true" focusable="false">${body}</svg>`;
}

/* A grayscale laser flattens several pill colors to the same gray, so the
   appearance is also spelled out in text beside the chip. */
function appearanceText(med) {
  if (med.shape === "unknown") return "";
  const color = COLORS.find((c) => c.id === med.color);
  const shape = SHAPE_LABELS[med.shape] || "";
  return [color ? color.label.toLowerCase() : "", shape.toLowerCase()].filter(Boolean).join(" ");
}

/* ---------- State ---------- */

const defaultState = () => ({
  person: { name: "", week: "", allergies: "", doctor: "", pharmacy: "" },
  meds: [],
  options: { textSize: "large", orientation: "portrait" },
});

let state = loadState();
let editingId = null;
let storageOk = true;
let lastDeleted = null;
let snackbarTimer = null;

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "id-" + Date.now() + "-" + Math.floor(Math.random() * 1e6);
}

/* Anything that has been outside this tab — localStorage, a backup file — is
   untrusted. Normalize it into exactly the shape the app expects, or drop it.
   This is what stops a hand-edited backup from injecting markup, poisoning a
   CSS selector, or leaving the app permanently unable to render. */
function cleanText(value) {
  return typeof value === "string" ? value.slice(0, MAX_FIELD) : "";
}

function cleanMed(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const name = cleanText(raw.name).trim();
  if (!name) return null;
  const times = Array.isArray(raw.times) ? raw.times.filter((t) => SLOT_IDS.indexOf(t) !== -1) : [];
  if (!times.length) return null;
  return {
    id: newId(),
    name,
    dose: cleanText(raw.dose),
    purpose: cleanText(raw.purpose),
    shape: SHAPE_IDS.indexOf(raw.shape) !== -1 ? raw.shape : "unknown",
    color: COLOR_IDS.indexOf(raw.color) !== -1 ? raw.color : "white",
    times,
    instructions: cleanText(raw.instructions),
    maxPerDay: cleanText(raw.maxPerDay),
    example: raw.example === true,
  };
}

function normalizeState(raw) {
  const base = defaultState();
  const person = {};
  for (const key of Object.keys(base.person)) {
    person[key] = cleanText(raw && raw.person ? raw.person[key] : "");
  }
  const meds = Array.isArray(raw && raw.meds)
    ? raw.meds.slice(0, MAX_MEDS).map(cleanMed).filter(Boolean)
    : [];
  const options = (raw && raw.options) || {};
  return {
    person,
    meds,
    options: {
      textSize: TEXT_SIZES.indexOf(options.textSize) !== -1 ? options.textSize : "large",
      orientation: ORIENTATIONS.indexOf(options.orientation) !== -1 ? options.orientation : "portrait",
    },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return normalizeState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageOk = true;
    setSaveIndicator("Saved on this device");
  } catch {
    storageOk = false;
    setSaveIndicator("Can’t save on this device — your chart will disappear when you close this page. Use “Save a backup file” to keep it.");
  }
}

/* ---------- Helpers ---------- */

const $ = (sel) => document.querySelector(sel);

/* Global-regex form: replaceAll is ES2021 and this runs on old tablets. */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function todayLong() {
  return new Date().toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function medNotes(med) {
  const parts = [];
  const look = appearanceText(med);
  if (look) parts.push(look);
  if (med.instructions) parts.push(med.instructions);
  if (med.purpose) parts.push((parts.length ? "for " : "For ") + med.purpose);
  return parts.join(" — ");
}

/* PRN column: lead with what it's for, then how to take it. */
function prnWhen(med) {
  const parts = [];
  if (med.purpose) parts.push("For " + med.purpose);
  if (med.instructions) {
    parts.push(parts.length ? med.instructions.charAt(0).toLowerCase() + med.instructions.slice(1) : med.instructions);
  }
  return parts.join(" — ");
}

function hasExamples() {
  return state.meds.some((m) => m.example);
}

function setSaveIndicator(text) {
  const el = $("#save-indicator");
  el.textContent = text;
  el.classList.toggle("saved", storageOk && state.meds.length > 0);
}

/* ---------- Snackbar ---------- */

function showSnackbar(text, { undo = false } = {}) {
  const bar = $("#snackbar");
  const action = $("#snackbar-action");
  clearTimeout(snackbarTimer);
  $("#snackbar-text").textContent = text;
  action.hidden = !undo;
  bar.hidden = false;
  /* A snackbar carrying Undo is the only path back from a delete. It waits
     until the next message rather than racing a timer the user can't see. */
  if (!undo) {
    snackbarTimer = setTimeout(() => {
      bar.hidden = true;
      lastDeleted = null;
    }, 12000);
  }
}

function hideSnackbar() {
  clearTimeout(snackbarTimer);
  $("#snackbar").hidden = true;
  lastDeleted = null;
}

/* ---------- Rendering: medication list ---------- */

const PENCIL_ICON =
  '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" focusable="false"><path d="M13.6 2.6a2 2 0 0 1 2.8 0l1 1a2 2 0 0 1 0 2.8l-9.2 9.2-4.3 1.3a.6.6 0 0 1-.8-.8l1.3-4.3Zm1.4 1.4-1 1 1.8 1.8 1-1a.6.6 0 0 0 0-.8l-1-1a.6.6 0 0 0-.8 0Z"/></svg>';
const TRASH_ICON =
  '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" focusable="false"><path d="M8 2.5h4a1 1 0 0 1 1 1V4h3.5a.75.75 0 0 1 0 1.5h-.6l-.7 10.6a2 2 0 0 1-2 1.9H6.8a2 2 0 0 1-2-1.9L4.1 5.5h-.6a.75.75 0 0 1 0-1.5H7v-.5a1 1 0 0 1 1-1Zm.2 5a.75.75 0 0 0-1.5.1l.4 6a.75.75 0 0 0 1.5-.1Zm4.3-.7a.75.75 0 0 0-.8.7l-.4 6a.75.75 0 0 0 1.5.1l.4-6a.75.75 0 0 0-.7-.8Z"/></svg>';

function renderMedList() {
  const list = $("#med-list");
  const heading = $("#med-list-heading");

  heading.hidden = state.meds.length === 0;
  $("#example-offer").hidden = state.meds.length !== 0;
  $("#example-banner").hidden = !hasExamples();

  list.innerHTML = state.meds
    .map((med) => {
      const dose = med.dose ? ` <span class="med-item-dose">— ${escapeHtml(med.dose)}</span>` : "";
      const badges = SLOT_IDS.filter((slot) => med.times.includes(slot))
        .map((slot) => `<span class="time-badge ${slot}">${SLOT_LABELS[slot]}</span>`)
        .join("");
      const example = med.example ? '<span class="example-badge">Example</span>' : "";
      const editing = med.id === editingId ? " med-item-editing" : "";
      return `<li class="med-item${editing}" data-id="${escapeHtml(med.id)}">
        <span class="med-item-chip">${chipSvg(med.shape, med.color)}</span>
        <div class="med-item-body">
          <p class="med-item-name">${escapeHtml(med.name)}${dose}${example}</p>
          <div class="med-item-times">${badges}</div>
        </div>
        <div class="med-item-actions">
          <button type="button" class="icon-btn edit" aria-label="Edit ${escapeHtml(med.name)}">${PENCIL_ICON}</button>
          <button type="button" class="icon-btn delete" aria-label="Remove ${escapeHtml(med.name)}">${TRASH_ICON}</button>
        </div>
      </li>`;
    })
    .join("");
}

/* ---------- Rendering: the sheet ---------- */

function medCell(med, { withNotes = true } = {}) {
  const dose = med.dose ? ` <span class="med-dose">${escapeHtml(med.dose)}</span>` : "";
  const notes = withNotes ? medNotes(med) : appearanceText(med);
  const notesHtml = notes ? `<span class="med-notes">${escapeHtml(notes)}</span>` : "";
  return `<div class="med-cell">
    <span class="chip">${chipSvg(med.shape, med.color)}</span>
    <span class="med-text"><span class="med-name">${escapeHtml(med.name)}</span>${dose}${notesHtml}</span>
  </div>`;
}

/* Rides along in the repeating band so a loose continuation page can still be
   matched to a person. */
function identityLine() {
  const bits = [];
  if (state.person.name) bits.push(state.person.name);
  if (state.person.allergies) bits.push("allergies: " + state.person.allergies);
  return bits.join(" · ");
}

function bandCell(slotId, label, colspan) {
  const ident = identityLine();
  const identHtml = ident ? `<span class="slot-ident">${escapeHtml(ident)}</span>` : "";
  return `<tr class="band-row"><td colspan="${colspan}" aria-hidden="true"><span class="slot-head">${SLOT_ICONS[slotId]}<span class="slot-name">${label}</span>${identHtml}</span></td></tr>`;
}

function renderSheet() {
  const sheet = $("#sheet");
  sheet.dataset.size = state.options.textSize;
  sheet.dataset.orientation = state.options.orientation;

  const p = state.person;
  const title = p.name ? `Medication chart for ${escapeHtml(p.name)}` : "Medication chart";
  const week = p.week ? `<p class="sheet-week">Week of ${escapeHtml(p.week)}</p>` : "";

  const metaBits = [];
  if (p.allergies) metaBits.push(`<span class="allergies">Allergies: ${escapeHtml(p.allergies)}</span>`);
  if (p.doctor) metaBits.push(`<span>Doctor: ${escapeHtml(p.doctor)}</span>`);
  if (p.pharmacy) metaBits.push(`<span>Pharmacy: ${escapeHtml(p.pharmacy)}</span>`);
  const meta = metaBits.length ? `<div class="sheet-meta">${metaBits.join("")}</div>` : "";

  /* The preview is the print artifact, so the warning has to print too. */
  const sample = hasExamples()
    ? `<p class="sheet-sample">Sample chart — replace these with the real medications before using it.</p>`
    : "";

  let body = "";

  for (const slot of SLOTS) {
    const meds = state.meds.filter((m) => m.times.includes(slot.id));
    if (!meds.length) continue;
    const rows = meds
      .map(
        (med) => `<tr>
          <th scope="row" class="med">${medCell(med)}</th>
          ${DAYS.map(() => '<td class="checkcell"><span class="checkbox"></span></td>').join("")}
        </tr>`
      )
      .join("");
    /* The band lives inside <thead> so the browser repeats it on every printed
       page. A chart page that doesn't say "Morning" is a page you can't safely
       act on. The caption names the table for screen readers. */
    body += `<section class="slot slot-${slot.id}">
      <table>
        <caption class="visually-hidden">${slot.label} medications</caption>
        <thead>
          ${bandCell(slot.id, slot.label, DAYS.length + 1)}
          <tr>
            <th class="med-col" scope="col">Medicine</th>
            ${DAYS.map((d) => `<th class="day-col" scope="col">${d}</th>`).join("")}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
  }

  const prnMeds = state.meds.filter((m) => m.times.includes("prn"));
  if (prnMeds.length) {
    const rows = prnMeds
      .map(
        (med) => `<tr>
          <th scope="row" class="med">${medCell(med, { withNotes: false })}</th>
          <td>${escapeHtml(prnWhen(med) || "—")}</td>
          <td>${escapeHtml(med.maxPerDay || "—")}</td>
        </tr>`
      )
      .join("");
    body += `<section class="slot slot-prn">
      <table>
        <caption class="visually-hidden">Medications taken only as needed</caption>
        <thead>
          ${bandCell("prn", "Only as needed", 3)}
          <tr>
            <th scope="col" style="width:45%">Medicine</th>
            <th scope="col">When to use it</th>
            <th scope="col" style="width:24%">Do not use more than</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
  }

  if (!state.meds.length) {
    body = `<div class="sheet-empty">
      <strong>Your chart appears here as you build it</strong>
      Add your first medication in step 2 — this preview is exactly what will print.
    </div>`;
  }

  sheet.innerHTML = `
    <header class="sheet-head">
      <h2 class="sheet-title">${title}</h2>
      ${week}
    </header>
    ${meta}
    ${sample}
    ${body}
    <footer class="sheet-foot">
      <p class="safety">Always follow the directions from your doctor or pharmacist.</p>
      <p class="credit">Free &amp; private — paperpillbox.com · Printed <span id="print-date">${todayLong()}</span></p>
    </footer>`;

  updateSheetScale();
}

/* ---------- Sheet scaling (preview only; print uses real size) ---------- */

const SHEET_MIN_SCALE = 0.55; /* below this the preview is unreadable; scroll instead */

function updateSheetScale() {
  const viewport = $("#sheet-viewport");
  const sheet = $("#sheet");
  /* offsetWidth ignores the transform, so it is the sheet's true paper width. */
  const designWidth = sheet.offsetWidth;
  if (!designWidth) return;
  const scale = Math.max(SHEET_MIN_SCALE, Math.min(1, viewport.clientWidth / designWidth));
  sheet.style.transform = `scale(${scale})`;
  viewport.style.height = sheet.offsetHeight * scale + "px";
}

/* `@page { size: … }` accepts no custom property, so the rule is rewritten. */
function applyPageRule() {
  const orientation = state.options.orientation;
  $("#page-rule").textContent = `@page { size: ${orientation}; margin: 10mm 12mm; }`;
  $("#orientation-word").textContent = orientation;
}

/* ---------- Form ---------- */

function renderSwatches() {
  const wrap = $("#med-color");
  wrap.innerHTML = COLORS.map(
    (c, i) => `<label class="swatch">
      <input type="radio" name="med-color" value="${c.id}" ${i === 0 ? "checked" : ""} aria-label="${c.label}">
      <span class="swatch-dot" style="background:${c.hex}"></span>
    </label>`
  ).join("");
}

/* Compare values instead of building selector strings: an untrusted value must
   never reach querySelector, where bad syntax throws and takes the page down. */
function checkByValue(name, value) {
  document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.checked = input.value === value;
  });
}

function selectedColor() {
  const checked = document.querySelector('input[name="med-color"]:checked');
  return checked ? checked.value : "white";
}

function selectedTimes() {
  return [...document.querySelectorAll("#med-times input:checked")].map((i) => i.value);
}

function updateChipPreview() {
  const shape = $("#med-shape").value;
  const color = selectedColor();
  $("#chip-preview").innerHTML = chipSvg(shape, color);
  const c = COLORS.find((x) => x.id === color);
  $("#swatch-name").textContent =
    shape === "unknown" ? "Not described yet" : `${c ? c.label : ""} · ${SHAPE_LABELS[shape] || ""}`;
}

function updateMaxField() {
  $("#max-per-day-field").hidden = !selectedTimes().includes("prn");
}

function readForm() {
  return {
    name: $("#med-name").value.trim(),
    dose: $("#med-dose").value.trim(),
    purpose: $("#med-purpose").value.trim(),
    shape: $("#med-shape").value,
    color: selectedColor(),
    times: selectedTimes(),
    instructions: $("#med-instructions").value.trim(),
    maxPerDay: $("#med-max").value.trim(),
  };
}

function fillForm(med) {
  $("#med-name").value = med.name;
  $("#med-dose").value = med.dose || "";
  $("#med-purpose").value = med.purpose || "";
  $("#med-shape").value = med.shape;
  checkByValue("med-color", med.color);
  document.querySelectorAll("#med-times input").forEach((input) => {
    input.checked = med.times.includes(input.value);
  });
  $("#med-instructions").value = med.instructions || "";
  $("#med-max").value = med.maxPerDay || "";
  updateChipPreview();
  updateMaxField();
}

function clearForm() {
  $("#med-form").reset();
  checkByValue("med-color", "white");
  clearFormErrors();
  updateChipPreview();
  updateMaxField();
}

function showError(el, message) {
  el.textContent = message;
  el.hidden = false;
}

function clearFormErrors() {
  $("#med-name-error").hidden = true;
  $("#med-times-error").hidden = true;
  $("#med-name").removeAttribute("aria-invalid");
  $("#med-name").closest(".field").classList.remove("field-invalid");
  document.querySelectorAll("#med-times input").forEach((i) => i.removeAttribute("aria-invalid"));
}

function validateForm(data) {
  clearFormErrors();
  let firstInvalid = null;
  if (!data.name) {
    showError($("#med-name-error"), "Please enter the medication's name.");
    $("#med-name").setAttribute("aria-invalid", "true");
    $("#med-name").closest(".field").classList.add("field-invalid");
    firstInvalid = $("#med-name");
  }
  if (!data.times.length) {
    showError($("#med-times-error"), "Please pick at least one time of day.");
    const first = document.querySelector("#med-times input");
    first.setAttribute("aria-invalid", "true");
    if (!firstInvalid) firstInvalid = first;
  }
  if (firstInvalid) firstInvalid.focus();
  return !firstInvalid;
}

function setEditing(id) {
  editingId = id;
  const editing = id !== null;
  $("#med-submit").textContent = editing ? "Save changes" : "Add to chart";
  $("#med-cancel").hidden = !editing;
  renderMedList();
}

/* ---------- Example ---------- */

const EXAMPLE_MEDS = [
  { name: "Metformin", dose: "500 mg · 1 tablet", purpose: "blood sugar", shape: "round", color: "white", times: ["morning", "evening"], instructions: "With food", maxPerDay: "" },
  { name: "Lisinopril", dose: "10 mg · 1 tablet", purpose: "blood pressure", shape: "round", color: "pink", times: ["morning"], instructions: "", maxPerDay: "" },
  { name: "Atorvastatin", dose: "20 mg · 1 tablet", purpose: "cholesterol", shape: "oval", color: "white", times: ["bedtime"], instructions: "", maxPerDay: "" },
  { name: "Vitamin D", dose: "1000 IU · 1 softgel", purpose: "", shape: "oval", color: "yellow", times: ["morning"], instructions: "", maxPerDay: "" },
  { name: "Albuterol inhaler", dose: "2 puffs", purpose: "breathing", shape: "inhaler", color: "blue", times: ["prn"], instructions: "Shake well before each use", maxPerDay: "4 times a day" },
];

/* ---------- Export / import ---------- */

function exportBackup() {
  const payload = { app: "paperpillbox", version: 1, savedAt: new Date().toISOString(), data: state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `paper-pillbox-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showSnackbar("Backup saved to your downloads folder.");
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let next;
    try {
      const parsed = JSON.parse(reader.result);
      if (parsed.app !== "paperpillbox" || !parsed.data || !Array.isArray(parsed.data.meds)) {
        throw new Error("not a Paper Pillbox backup");
      }
      next = normalizeState(parsed.data);
    } catch {
      showSnackbar("That file isn’t a Paper Pillbox backup — your chart hasn’t changed. Look in your downloads for a file named paper-pillbox-backup….json");
      return;
    }

    /* Opening a backup replaces everything. Say so before it happens. */
    if (state.meds.length) {
      const count = state.meds.length;
      const question = `Open this backup? It replaces the chart you have now (${count} medication${count === 1 ? "" : "s"}), and that can’t be undone.`;
      if (!window.confirm(question)) return;
    }

    state = next;
    setEditing(null);
    clearForm();
    renderPersonFields();
    renderAll();
    saveState();
    showSnackbar("Backup opened.");
  };
  reader.readAsText(file);
}

/* ---------- Reset ---------- */

function performReset() {
  state = defaultState();
  setEditing(null);
  clearForm();
  renderPersonFields();
  renderAll();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* nothing to clear */ }
  showSnackbar("Chart cleared. Fresh start.");
  setSaveIndicator("");
}

/* ---------- Render everything ---------- */

function renderPersonFields() {
  document.querySelectorAll("[data-person]").forEach((input) => {
    input.value = state.person[input.dataset.person] || "";
  });
  checkByValue("text-size", state.options.textSize);
  checkByValue("orientation", state.options.orientation);
}

function renderAll() {
  renderMedList();
  renderSheet();
  applyPageRule();
}

/* ---------- Events ---------- */

function init() {
  renderSwatches();
  renderPersonFields();
  renderAll();
  updateChipPreview();
  updateMaxField();
  if (state.meds.length) setSaveIndicator("Saved on this device");

  /* Person fields */
  document.querySelectorAll("[data-person]").forEach((input) => {
    input.addEventListener("input", () => {
      state.person[input.dataset.person] = input.value;
      renderSheet();
      saveState();
    });
  });

  /* Print size */
  document.querySelectorAll('input[name="text-size"]').forEach((input) => {
    input.addEventListener("change", () => {
      state.options.textSize = input.value;
      renderSheet();
      saveState();
    });
  });

  /* Paper direction */
  document.querySelectorAll('input[name="orientation"]').forEach((input) => {
    input.addEventListener("change", () => {
      state.options.orientation = input.value;
      renderSheet();
      applyPageRule();
      saveState();
    });
  });

  /* Form live bits */
  $("#med-shape").addEventListener("change", updateChipPreview);
  $("#med-color").addEventListener("change", updateChipPreview);
  $("#med-times").addEventListener("change", () => {
    updateMaxField();
    if (selectedTimes().length) {
      $("#med-times-error").hidden = true;
      document.querySelectorAll("#med-times input").forEach((i) => i.removeAttribute("aria-invalid"));
    }
  });
  $("#med-name").addEventListener("input", () => {
    if ($("#med-name").value.trim()) {
      $("#med-name-error").hidden = true;
      $("#med-name").removeAttribute("aria-invalid");
      $("#med-name").closest(".field").classList.remove("field-invalid");
    }
  });

  document.querySelectorAll(".quick-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const input = $("#med-instructions");
      const text = chip.dataset.chip;
      input.value = input.value
        ? input.value.replace(/\s*$/, "") + (input.value.includes(text) ? "" : (input.value.endsWith(".") ? " " : " · ") + text)
        : text;
      input.focus();
    });
  });

  /* Add / save medication */
  $("#med-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = readForm();
    if (!validateForm(data)) return;

    if (editingId) {
      const idx = state.meds.findIndex((m) => m.id === editingId);
      /* An edited example is the user's own medication now. */
      if (idx !== -1) state.meds[idx] = { ...state.meds[idx], ...data, example: false };
      showSnackbar(`${data.name} updated.`);
    } else {
      state.meds.push({ id: newId(), example: false, ...data });
      showSnackbar(`${data.name} added to the chart.`);
    }
    setEditing(null);
    clearForm();
    renderAll();
    saveState();
    $("#med-name").focus();
  });

  $("#med-cancel").addEventListener("click", () => {
    setEditing(null);
    clearForm();
  });

  /* Edit / delete */
  $("#med-list").addEventListener("click", (e) => {
    const item = e.target.closest(".med-item");
    if (!item) return;
    const med = state.meds.find((m) => m.id === item.dataset.id);
    if (!med) return;

    if (e.target.closest(".edit")) {
      setEditing(med.id);
      fillForm(med);
      $("#med-form").scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      $("#med-name").focus();
    }
    if (e.target.closest(".delete")) {
      const idx = state.meds.indexOf(med);
      lastDeleted = { med, idx };
      state.meds.splice(idx, 1);
      if (editingId === med.id) {
        setEditing(null);
        clearForm();
      }
      renderAll();
      saveState();
      showSnackbar(`${med.name} removed.`, { undo: true });
      /* Deleting the focused button strands focus on <body>. Put it back. */
      const remaining = document.querySelectorAll("#med-list .med-item .delete");
      if (remaining.length) remaining[Math.min(idx, remaining.length - 1)].focus();
      else $("#med-name").focus();
    }
  });

  $("#snackbar-action").addEventListener("click", () => {
    if (lastDeleted) {
      state.meds.splice(lastDeleted.idx, 0, lastDeleted.med);
      renderAll();
      saveState();
    }
    hideSnackbar();
    $("#med-name").focus();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#snackbar").hidden) hideSnackbar();
  });

  /* Example */
  $("#load-example").addEventListener("click", () => {
    state.meds = EXAMPLE_MEDS.map((m) => ({ id: newId(), ...m, example: true }));
    renderAll();
    saveState();
    showSnackbar("Example loaded — replace it with your own medications.");
  });

  $("#clear-example").addEventListener("click", () => {
    state.meds = state.meds.filter((m) => !m.example);
    renderAll();
    saveState();
    showSnackbar("Example medications cleared.");
  });

  /* Print */
  $("#print-btn").addEventListener("click", () => {
    if (!state.meds.length) {
      showSnackbar("Your chart is empty — add a medication first.");
      $("#med-name").focus();
      return;
    }
    window.print();
  });
  window.addEventListener("beforeprint", () => {
    const el = $("#print-date");
    if (el) el.textContent = todayLong();
  });

  /* Data actions */
  $("#export-btn").addEventListener("click", exportBackup);
  $("#import-btn").addEventListener("click", () => $("#import-input").click());
  $("#import-input").addEventListener("change", (e) => {
    if (e.target.files[0]) importBackup(e.target.files[0]);
    e.target.value = "";
  });

  /* Reset. Old tablets may lack <dialog>; never leave a live destructive
     button behind an inert dialog. */
  const dialog = $("#reset-dialog");
  const dialogOk = typeof dialog.showModal === "function";
  if (!dialogOk) dialog.hidden = true;

  $("#reset-btn").addEventListener("click", () => {
    if (dialogOk) dialog.showModal();
    else if (window.confirm("Start over? This clears the whole chart — every medication and every detail.")) performReset();
  });
  $("#reset-cancel").addEventListener("click", () => dialog.close());
  $("#reset-confirm").addEventListener("click", () => {
    performReset();
    dialog.close();
  });

  /* Preview scaling. Observe the pane, not the viewport — updateSheetScale
     writes the viewport's height, and observing it would feed back. */
  window.addEventListener("resize", updateSheetScale);
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(updateSheetScale).observe(document.querySelector(".preview-pane"));
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateSheetScale);
}

document.addEventListener("DOMContentLoaded", init);
