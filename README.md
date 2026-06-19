# Mileage

A static website that helps you get more output per credit/token across
Higgsfield, Magnific (Freepik), Claude and ChatGPT. No build step, no
dependencies, no API, no account — just HTML, CSS and vanilla JavaScript.

## What's inside

| Tab | What it does |
| --- | --- |
| **Tool picker** | Pick a task, get the tool + model + setting that does the job without overspending. Filter by category, search by keyword. |
| **Recipes** | Per-use-case settings tuned for quality-per-credit, with a meter showing roughly what the wasteful default costs you. |
| **Inputs** | What to feed each tool so you get it right on the first paid try. |
| **Rule Book** | "If you're making ___, then always ___." Filterable checklist of hard rules, defaults and anti-patterns. |
| **Plan picker** | Estimate your monthly credit burn, enter the plans a platform offers, and it ranks them — cheapest plan that covers you, best value per credit, and flags overbuying or shortfalls. Inputs are saved in your browser. |

## Run it locally

Double-click `index.html`, or serve the folder:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy on GitHub Pages

1. Create a new repository on GitHub (public is simplest for Pages).
2. Put these files in the repo root and push:
   ```
   index.html
   styles.css
   data.js
   app.js
   README.md
   ```
   ```bash
   git init
   git add .
   git commit -m "Mileage site"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   pick **main** / **/ (root)**, save.
4. Wait ~1 minute, then open `https://USERNAME.github.io/REPO/`.

That's the whole deploy. Everyone on the team uses the same URL; nothing to install.

## Keeping it current

All the content lives in **`data.js`** — that's the only file you edit to update
guidance. Each section is plain data with comments:

- `platforms` — the badges and their dot colours
- `picker` — task → recommendation rows (`cost` is 1 low / 2 med / 3 high)
- `recipes` — optimal vs overkill settings (`save` is 0–1, share of credits saved)
- `inputs` — feed-it / avoid lists per platform
- `rules` — the rule book (`tag` is `always` / `default` / `avoid`)

Edit, commit, push — Pages redeploys automatically.

## Notes

- Cost pills, recipe meters and rule numbers are **illustrative**, not live pricing.
  Models and prices on these platforms change fast, so re-verify before trusting a figure.
- The Plan picker saves your usage and plan inputs in your browser only
  (`localStorage`), so a refresh won't lose them. It stores nothing online.
- The prompt optimizer from the earlier prototype is intentionally left out, since
  it needs a model API. If you ever want it back, it would need either a per-user
  API key or a small shared proxy.
