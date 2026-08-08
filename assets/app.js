// ---- Configuration ----------------------------------------------------
// Update these to point at a different sheet or change the campaign goal.
const CONFIG = {
  sheetId: "140b4PR_T0TbOX562xcjSungIhkkaFFJvf_HRXVNAT70",
  gid: "0",
  goal: 7500,
  currencySymbol: "$",
  autoRefreshMs: 3600000, // 1 hour — keep this high to avoid Google rate-limiting the CSV export
};

// The gviz endpoint is Google's public data-embedding API and is more
// reliable for anonymous cross-origin fetches than the plain /export
// endpoint, which occasionally redirects or errors for no visible reason.
const csvUrl = () =>
  `https://docs.google.com/spreadsheets/d/${CONFIG.sheetId}/gviz/tq?tqx=out:csv&gid=${CONFIG.gid}&cachebust=${Date.now()}`;

const CACHE_KEY = "jf2026-donor-cache";

// ---- DOM refs -----------------------------------------------------------
const els = {
  raisedAmount: document.getElementById("raisedAmount"),
  goalAmount: document.getElementById("goalAmount"),
  progressTrack: document.getElementById("progressTrack"),
  progressFill: document.getElementById("progressFill"),
  progressPercent: document.getElementById("progressPercent"),
  donorCount: document.getElementById("donorCount"),
  donorList: document.getElementById("donorList"),
  statusMessage: document.getElementById("statusMessage"),
  lastUpdated: document.getElementById("lastUpdated"),
};

// ---- CSV parsing ----------------------------------------------------------
// Minimal CSV parser that handles quoted fields containing commas/newlines.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function parseAmount(raw) {
  if (!raw) return NaN;
  const cleaned = raw.replace(/[^0-9.\-]/g, "");
  if (cleaned === "") return NaN;
  return parseFloat(cleaned);
}

function extractDonors(rows) {
  let headerIdx = -1;
  let nameCol = -1;
  let amountCol = -1;

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].map((c) => c.trim().toLowerCase());
    const nCol = cells.findIndex((c) => c === "name" || c.includes("donor"));
    const aCol = cells.findIndex((c) => c.includes("amount") || c.includes("donation"));
    if (nCol !== -1 && aCol !== -1) {
      headerIdx = i;
      nameCol = nCol;
      amountCol = aCol;
      break;
    }
  }

  if (headerIdx === -1) return [];

  const donors = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const cells = rows[i];
    const name = (cells[nameCol] || "").trim();
    const amount = parseAmount(cells[amountCol] || "");
    if (!name || isNaN(amount) || amount <= 0) continue;
    donors.push({ name, amount });
  }
  return donors;
}

// ---- Rendering ------------------------------------------------------------
function formatCurrency(n) {
  return CONFIG.currencySymbol + Math.round(n).toLocaleString("en-US");
}

function showStatus(message) {
  if (!message) {
    els.statusMessage.hidden = true;
    els.statusMessage.textContent = "";
    return;
  }
  els.statusMessage.hidden = false;
  els.statusMessage.textContent = message;
}

function render(donors) {
  const total = donors.reduce((sum, d) => sum + d.amount, 0);
  const pct = CONFIG.goal > 0 ? (total / CONFIG.goal) * 100 : 0;
  const displayPct = Math.min(pct, 100);

  els.raisedAmount.textContent = formatCurrency(total);
  els.goalAmount.textContent = formatCurrency(CONFIG.goal);
  els.progressFill.style.width = displayPct + "%";
  els.progressTrack.setAttribute("aria-valuenow", Math.round(pct));
  els.progressPercent.textContent = Math.round(pct) + "% funded";
  els.donorCount.textContent = donors.length + (donors.length === 1 ? " donor" : " donors");

  const sorted = [...donors].sort((a, b) => b.amount - a.amount);

  els.donorList.innerHTML = "";
  if (sorted.length === 0) {
    const li = document.createElement("li");
    li.className = "donor-empty";
    li.textContent = "No donations recorded yet. Be the first to contribute!";
    els.donorList.appendChild(li);
    return;
  }

  sorted.forEach((d, idx) => {
    const li = document.createElement("li");
    li.style.animationDelay = Math.min(idx * 40, 600) + "ms";

    const nameSpan = document.createElement("span");
    nameSpan.className = "donor-name";
    nameSpan.textContent = d.name;

    const amountSpan = document.createElement("span");
    amountSpan.className = "donor-amount";
    amountSpan.textContent = formatCurrency(d.amount);

    li.appendChild(nameSpan);
    li.appendChild(amountSpan);
    els.donorList.appendChild(li);
  });
}

// ---- Local cache (survives across page loads/visitors on this device) -----
function loadCachedDonors() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.donors) || parsed.donors.length === 0) return null;
    return parsed;
  } catch (err) {
    return null;
  }
}

function saveCachedDonors(donors) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ donors, ts: Date.now() }));
  } catch (err) {
    // localStorage unavailable (private browsing etc.) — not fatal.
  }
}

// ---- Data fetching ----------------------------------------------------------
let lastGoodDonors = null;

async function fetchDonorsOnce() {
  const res = await fetch(csvUrl(), { cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const text = await res.text();
  const rows = parseCSV(text);
  const donors = extractDonors(rows);
  return { donors, rows };
}

// Transient failures (network blips, an occasional bad response from
// Google) are common enough that a single attempt isn't reliable. Retry a
// couple of times with a short backoff before giving up for this cycle.
async function fetchDonorsWithRetry(maxAttempts = 3) {
  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fetchDonorsOnce();
      if (result.donors.length > 0 || result.rows.length === 0) return result;
      lastErr = new Error("Parsed 0 donors from a non-empty response");
    } catch (err) {
      lastErr = err;
    }
    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, attempt * 1500));
    }
  }
  throw lastErr;
}

async function loadData() {
  try {
    const { donors, rows } = await fetchDonorsWithRetry();

    if (donors.length === 0 && rows.length > 0) {
      showStatus(
        "Couldn't find donor data in the sheet. Make sure it has 'Name' and 'Amount' columns."
      );
      render(donors);
    } else {
      showStatus(null);
      lastGoodDonors = donors;
      saveCachedDonors(donors);
      render(donors);
    }

    els.lastUpdated.textContent = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (err) {
    if (lastGoodDonors && lastGoodDonors.length > 0) {
      showStatus(
        "Couldn't refresh live data just now, showing the last known totals."
      );
    } else {
      showStatus(
        "Couldn't load live data from Google Sheets right now. Make sure the sheet is shared as \"Anyone with the link can view\"."
      );
    }
    console.error("Failed to load donation data:", err);
  }
}

// Render any cached totals immediately so a slow/failed fetch never shows
// $0 to a visitor who's seen real numbers before on this device.
const cached = loadCachedDonors();
if (cached) {
  lastGoodDonors = cached.donors;
  render(cached.donors);
  els.lastUpdated.textContent =
    new Date(cached.ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) +
    " (cached)";
}

loadData();
setInterval(loadData, CONFIG.autoRefreshMs);
