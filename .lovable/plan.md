# Connect Gemini + GitHub

## Goal
Two connections: (1) use your own Google Gemini API key for the app's AI features, (2) connect this project to GitHub so you can access your code and repo data.

## Part 1 — Your Gemini key
Today Hugo and McCloder run through the built-in Lovable AI gateway (no key needed). To use **your** Gemini key instead:

1. You get a Gemini API key from Google AI Studio (aistudio.google.com → Get API key). Free tier available.
2. I request it via the secure secret form (stored safely, never in code).
3. I update the two edge functions (`hugo-chat`, `generate-document`, optionally `mccloder`) to call the Gemini API directly with your key, keeping the same models and behavior.
4. Redeploy the functions.

Note: usage then bills against your Google account instead of Lovable AI credits.

## Part 2 — GitHub connection
Lovable has a built-in two-way GitHub sync:

1. In the editor: Plus (+) menu in the chat input → **GitHub** → **Connect project**.
2. Authorize the Lovable GitHub App on GitHub.
3. Pick your GitHub account/organization → **Create Repository**.
4. Done — every change syncs both ways in real time; you can clone, branch, and download the code from GitHub.

This step is done by you in the UI (one-time authorization) — no code changes needed.

## What I'll do after approval
- Request the Gemini API key via the secure form (only after you confirm you have it).
- Rewire the edge functions to Gemini with your key and redeploy.
- Walk you through the GitHub connect steps above.
