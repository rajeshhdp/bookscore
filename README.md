# Janmashtami 2026 Fundraiser

A static, live-updating fundraiser progress site for Janmashtami 2026 celebrations.

## How it works

- `index.html` / `assets/style.css` / `assets/app.js` make up a single static page.
- On load (and every 60 seconds after), the page fetches the donation data
  directly from a public Google Sheet as CSV, parses it in the browser, and
  renders the total raised, a progress bar toward the goal, and the donor list.
- No backend or build step is required — it's plain HTML/CSS/JS.

## Configuring

Edit the `CONFIG` object at the top of `assets/app.js`:

- `sheetId` — the Google Sheet's ID (from its URL).
- `gid` — the tab/sheet ID within the spreadsheet (default `0` = first tab).
- `goal` — the fundraising goal amount.
- `currencySymbol` — currency symbol used for formatting.
- `autoRefreshMs` — how often the page re-fetches data, in milliseconds.

The Google Sheet must have a header row containing columns named/containing
`Name` (or `Donor`) and `Amount` (or `Donation`). It must be shared as
**"Anyone with the link" → Viewer** for the site to read it client-side.

## Hosting on GitHub Pages

1. Go to the repo's **Settings → Pages**.
2. Under "Build and deployment", set **Source** to "Deploy from a branch".
3. Choose this branch and the `/ (root)` folder, then save.
4. GitHub will publish the site at `https://<owner>.github.io/<repo>/`.
