/* ==========================================================================
   Paper Pillbox — all logic runs in the browser. Nothing is ever sent anywhere.
   ========================================================================== */
"use strict";

/* ---------- Constants ---------- */

const STORAGE_KEY = "paperpillbox:v1";

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
  prn: "As needed",
};

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

/* ---------- Pill chips ---------- */

function chipSvg(shape, colorId) {
  const color = (COLORS.find((c) => c.id === colorId) || COLORS[0]).hex;
  const S = 'stroke="#3A4442" stroke-width="1.6"';
  let body = "";
  switch (shape) {
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

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    return {
      person: { ...base.person, ...(parsed.person || {}) },
      meds: Array.isArray(parsed.meds) ? parsed.meds : [],
      options: { ...base.options, ...(parsed.options || {}) },
    };
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
    setSaveIndicator("Couldn't save here — use “Save a backup file”");
  }
}

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "id-" + Date.now() + "-" + Math.floor(Math.random() * 1e6);
}

/* ---------- Helpers ---------- */

const $ = (sel) => document.querySelector(sel);

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function todayLong() {
  return new Date().toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function medNotes(med) {
  const parts = [];
  if (med.instructions) parts.push(med.instructions);
  if (med.purpose) parts.push((parts.length ? "for " : "For ") + med.purpose);
  return parts.join(" — ");
}

/* PRN column: lead with what it's for, then how to take it. */
function prnWhen(med) {
  const parts = [];
  if (med.purpose) parts.push("For " + med.purpose);
  if (med.instructions) parts.push(parts.length ? med.instructions.charAt(0).toLowerCase() + med.instructions.slice(1) : med.instructions);
  return parts.join(" — ");
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
  snackbarTimer = setTimeout(() => {
    bar.hidden = true;
    lastDeleted = null;
  }, 8000);
}

function hideSnackbar() {
  clearTimeout(snackbarTimer);
  $("#snackbar").hidden = true;
}

/* ---------- Rendering: medication list ---------- */

const PENCIL_ICON =
  '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" focusable="false"><path d="M13.6 2.6a2 2 0 0 1 2.8 0l1 1a2 2 0 0 1 0 2.8l-9.2 9.2-4.3 1.3a.6.6 0 0 1-.8-.8l1.3-4.3Zm1.4 1.4-1 1 1.8 1.8 1-1a.6.6 0 0 0 0-.8l-1-1a.6.6 0 0 0-.8 0Z"/></svg>';
const TRASH_ICON =
  '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" focusable="false"><path d="M8 2.5h4a1 1 0 0 1 1 1V4h3.5a.75.75 0 0 1 0 1.5h-.6l-.7 10.6a2 2 0 0 1-2 1.9H6.8a2 2 0 0 1-2-1.9L4.1 5.5h-.6a.75.75 0 0 1 0-1.5H7v-.5a1 1 0 0 1 1-1Zm.2 5a.75.75 0 0 0-1.5.1l.4 6a.75.75 0 0 0 1.5-.1Zm4.3-.7a.75.75 0 0 0-.8.7l-.4 6a.75.75 0 0 0 1.5.1l.4-6a.75.75 0 0 0-.7-.8Z"/></svg>';

function renderMedList() {
  const list = $("#med-list");
  const heading = $("#med-list-heading");
  const offer = $("#example-offer");

  heading.hidden = state.meds.length === 0;
  offer.hidden = state.meds.length !== 0;

  list.innerHTML = state.meds
    .map((med) => {
      const dose = med.dose ? ` <span class="med-item-dose">— ${escapeHtml(med.dose)}</span>` : "";
      const badges = Object.keys(SLOT_LABELS)
        .filter((slot) => med.times.includes(slot))
        .map((slot) => `<span class="time-badge ${slot}">${SLOT_LABELS[slot]}</span>`)
        .join("");
      const editing = med.id === editingId ? " med-item-editing" : "";
      return `<li class="med-item${editing}" data-id="${med.id}">
        <span class="med-item-chip">${chipSvg(med.shape, med.color)}</span>
        <div class="med-item-body">
          <p class="med-item-name">${escapeHtml(med.name)}${dose}</p>
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
  const notes = withNotes ? medNotes(med) : "";
  const notesHtml = notes ? `<span class="med-notes">${escapeHtml(notes)}</span>` : "";
  return `<div class="med-cell">
    <span class="chip">${chipSvg(med.shape, med.color)}</span>
    <span class="med-text"><span class="med-name">${escapeHtml(med.name)}</span>${dose}${notesHtml}</span>
  </div>`;
}

/* `@page { size: … }` accepts no custom property, so the rule is rewritten. */
function applyPageRule() {
  const orientation = state.options.orientation;
  $("#page-rule").textContent = `@page { size: ${orientation}; margin: 10mm 12mm; }`;
  $("#orientation-word").textContent = orientation;
}

function renderSheet() {
  const sheet = $("#sheet");
  sheet.dataset.size = state.options.textSize;
  sheet.dataset.orientation = state.options.orientation;

  const p = state.person;
  const title = p.name
    ? `Medication chart for ${escapeHtml(p.name)}`
    : "Medication chart";
  const week = p.week ? `<p class="sheet-week">Week of ${escapeHtml(p.week)}</p>` : "";

  const metaBits = [];
  if (p.allergies) metaBits.push(`<span class="allergies">Allergies: ${escapeHtml(p.allergies)}</span>`);
  if (p.doctor) metaBits.push(`<span>Doctor: ${escapeHtml(p.doctor)}</span>`);
  if (p.pharmacy) metaBits.push(`<span>Pharmacy: ${escapeHtml(p.pharmacy)}</span>`);
  const meta = metaBits.length ? `<div class="sheet-meta">${metaBits.join("")}</div>` : "";

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
       page. A chart page that doesn't say "Morning" is a chart page you can't
       safely act on. The caption names the table for screen readers. */
    body += `<section class="slot slot-${slot.id}">
      <table>
        <caption class="visually-hidden">${slot.label} medications</caption>
        <thead>
          <tr class="band-row"><td colspan="${DAYS.length + 1}" aria-hidden="true"><span class="slot-head">${SLOT_ICONS[slot.id]}${slot.label}</span></td></tr>
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
          <tr class="band-row"><td colspan="3" aria-hidden="true"><span class="slot-head">${SLOT_ICONS.prn}Only as needed</span></td></tr>
          <tr>
            <th scope="col" style="width:45%">Medicine</th>
            <th scope="col">When to use it</th>
            <th scope="col" style="width:22%">Most in 24 hours</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
  }

  if (!state.meds.length) {
    body = `<div class="sheet-empty">
      <strong>Your chart appears here as you build it</strong>
      Add a medication on the left — the preview is exactly what will print.
    </div>`;
  }

  sheet.innerHTML = `
    <header class="sheet-head">
      <h2 class="sheet-title">${title}</h2>
      ${week}
    </header>
    ${meta}
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

/* ---------- Form ---------- */

function renderSwatches() {
  const wrap = $("#med-color");
  wrap.innerHTML = COLORS.map(
    (c, i) => `<label class="swatch" title="${c.label}">
      <input type="radio" name="med-color" value="${c.id}" ${i === 0 ? "checked" : ""} aria-label="${c.label}">
      <span class="swatch-dot" style="background:${c.hex}"></span>
    </label>`
  ).join("");
}

function selectedColor() {
  const checked = document.querySelector('input[name="med-color"]:checked');
  return checked ? checked.value : "white";
}

function selectedTimes() {
  return [...document.querySelectorAll("#med-times input:checked")].map((i) => i.value);
}

function updateChipPreview() {
  $("#chip-preview").innerHTML = chipSvg($("#med-shape").value, selectedColor());
}

function updateMaxField() {
  const isPrn = selectedTimes().includes("prn");
  $("#max-per-day-field").hidden = !isPrn;
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
  const colorInput = document.querySelector(`input[name="med-color"][value="${med.color}"]`);
  if (colorInput) colorInput.checked = true;
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
  document.querySelector('input[name="med-color"][value="white"]').checked = true;
  clearFormErrors();
  updateChipPreview();
  updateMaxField();
}

function clearFormErrors() {
  $("#med-name-error").hidden = true;
  $("#med-times-error").hidden = true;
  $("#med-name").closest(".field").classList.remove("field-invalid");
}

function validateForm(data) {
  clearFormErrors();
  let firstInvalid = null;
  if (!data.name) {
    $("#med-name-error").hidden = false;
    $("#med-name").closest(".field").classList.add("field-invalid");
    firstInvalid = $("#med-name");
  }
  if (!data.times.length) {
    $("#med-times-error").hidden = false;
    if (!firstInvalid) firstInvalid = document.querySelector("#med-times input");
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
  { name: "Albuterol inhaler", dose: "2 puffs", purpose: "breathing", shape: "inhaler", color: "blue", times: ["prn"], instructions: "Shake well before each use", maxPerDay: "Up to 4 times a day" },
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
    try {
      const parsed = JSON.parse(reader.result);
      if (parsed.app !== "paperpillbox" || !parsed.data || !Array.isArray(parsed.data.meds)) {
        throw new Error("wrong shape");
      }
      const base = defaultState();
      state = {
        person: { ...base.person, ...(parsed.data.person || {}) },
        meds: parsed.data.meds,
        options: { ...base.options, ...(parsed.data.options || {}) },
      };
      setEditing(null);
      clearForm();
      renderAll();
      saveState();
      showSnackbar("Backup opened — your chart is back.");
    } catch {
      showSnackbar("That file doesn't look like a Paper Pillbox backup.");
    }
  };
  reader.readAsText(file);
}

/* ---------- Render everything ---------- */

function renderPersonFields() {
  document.querySelectorAll("[data-person]").forEach((input) => {
    input.value = state.person[input.dataset.person] || "";
  });
  const sizeInput = document.querySelector(`input[name="text-size"][value="${state.options.textSize}"]`);
  if (sizeInput) sizeInput.checked = true;
  const orientInput = document.querySelector(`input[name="orientation"][value="${state.options.orientation}"]`);
  if (orientInput) orientInput.checked = true;
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
    if (selectedTimes().length) $("#med-times-error").hidden = true;
  });
  $("#med-name").addEventListener("input", () => {
    if ($("#med-name").value.trim()) {
      $("#med-name-error").hidden = true;
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
      if (idx !== -1) state.meds[idx] = { ...state.meds[idx], ...data };
      showSnackbar(`${data.name} updated.`);
    } else {
      state.meds.push({ id: newId(), ...data });
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
      $("#med-form").scrollIntoView({ behavior: "smooth", block: "start" });
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
    }
  });

  $("#snackbar-action").addEventListener("click", () => {
    if (lastDeleted) {
      state.meds.splice(lastDeleted.idx, 0, lastDeleted.med);
      lastDeleted = null;
      renderAll();
      saveState();
    }
    hideSnackbar();
  });

  /* Example */
  $("#load-example").addEventListener("click", () => {
    state.meds = EXAMPLE_MEDS.map((m) => ({ id: newId(), ...m }));
    renderAll();
    saveState();
    showSnackbar("Example loaded — replace it with your own medications.");
  });

  /* Print */
  $("#print-btn").addEventListener("click", () => window.print());
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

  const dialog = $("#reset-dialog");
  $("#reset-btn").addEventListener("click", () => dialog.showModal());
  $("#reset-cancel").addEventListener("click", () => dialog.close());
  $("#reset-confirm").addEventListener("click", () => {
    state = defaultState();
    setEditing(null);
    clearForm();
    renderPersonFields();
    renderAll();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* nothing to clear */ }
    dialog.close();
    showSnackbar("Chart cleared. Fresh start.");
    setSaveIndicator("");
  });

  /* Preview scaling. Observe the pane, not the viewport — updateSheetScale
     writes the viewport's height, and observing it would feed back. */
  window.addEventListener("resize", updateSheetScale);
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(updateSheetScale).observe(document.querySelector(".preview-pane"));
  }
}

document.addEventListener("DOMContentLoaded", init);
