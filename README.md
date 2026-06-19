# Mileage

A static website that helps you get more output per credit/token across
Higgsfield, Freepik, Claude and ChatGPT. You tell it what you're making; it
recommends the **model** (Kling, Seedance, Nano Banana, Seedream, GPT Image…)
and the **settings** that look good without wasting credits.

No build step, no dependencies, no API, no account — just HTML, CSS and vanilla JS.

> **It doesn't touch prompts.** Rewriting or optimizing a prompt needs an AI of
> its own, so Mileage deliberately leaves that out and stays fast and offline.

## Tabs

| Tab | What it does |
| --- | --- |
| **Home** | Calm landing — what the site is, how it works, and where to start. |
| **Recommender** | Answer a couple of questions → get the model + settings for your case. The core of the site. |
| **Models** | Strengths, weaknesses and best-use of each underlying model, by Video / Image. |
| **Rule Book** | "If you're making ___, then always ___." Filterable checklist. |
| **Plans** | Estimate your monthly burn, enter the plans on offer, get the cheapest plan that covers you. Saved in your browser. |

## Run locally

Double-click `index.html`, or serve the folder:

```bash
python3 -m http.server 8000   # open http://localhost:8000
```

## Deploy on GitHub Pages

1. Create a repository on GitHub.
2. Put these files in the repo root and push:
   ```
   index.html  styles.css  data.js  app.js  README.md
   ```
   ```bash
   git init && git add . && git commit -m "Mileage"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO.git
   git push -u origin main
   ```
3. GitHub → **Settings → Pages → Source: Deploy from a branch → main / root**, save.
4. Open `https://USERNAME.github.io/REPO/` after ~1 minute.

## Keeping it current

Everything lives in **`data.js`** — the only file you edit:

- `platforms` — badges and dot colours
- `models` — the library; each has `type` (video/image), `tier` (1–3), `tags`
  (these drive the recommender), `strengths`, `weakness`, `bestFor`
- `recommend` — the recommender's questions and the settings/tips per path
- `rules` — the rule book (`tag`: always / default / avoid)
- `inputTips` — the feed-it / avoid tips shown with a recommendation

To add a model, drop a new object into `models` with the right `tags` and it
automatically becomes selectable in the Recommender and visible in Models.

Edit → commit → push. Pages redeploys on its own.

## Notes

- Model strengths, settings and credit figures are **illustrative**, not live
  pricing. These platforms change fast — re-verify before trusting a number.
- The Plan picker stores your inputs only in this browser (`localStorage`).
- No prompt optimizer: that needs a model API. If you ever want it, it would
  need either a per-user API key or a small shared proxy.
