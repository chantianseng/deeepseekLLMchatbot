# Free AI Chat — GitHub Pages + Cloudflare Worker

A WeChat-style AI chat web app designed for a **$0 starting setup** using:

- GitHub Pages for the front-end
- Cloudflare Workers Free for a secure API proxy
- OpenRouter's `openrouter/free` router for free-model inference

The OpenRouter API key is stored as a **Cloudflare Worker secret**, not in `index.html`.

> **Important:** Free models have provider/rate limits and availability can change. This is not unlimited AI. The default model router is `openrouter/free`; it chooses from the free models currently available on OpenRouter.

## Folder structure

```text
free-ai-chat-github/
├── index.html
├── README.md
└── worker/
    ├── worker.js
    └── wrangler.toml
```

## Part 1 — Create the OpenRouter key

1. Create an OpenRouter account.
2. Create an API key.
3. Keep the key private. Do **not** paste it into GitHub or `index.html`.

OpenRouter documents the OpenAI-compatible endpoint at:
`https://openrouter.ai/api/v1/chat/completions`

The default model used by this project is:
`openrouter/free`

## Part 2 — Create the Cloudflare Worker

The easiest method is the Cloudflare dashboard; you do not need a local Node.js installation.

1. Open Cloudflare Dashboard.
2. Go to **Workers & Pages**.
3. Create a Worker.
4. Open the Worker's code editor / Quick Edit.
5. Replace the default code with the complete contents of `worker/worker.js`.
6. Deploy/save it.
7. Open the Worker **Settings → Variables and Secrets**.
8. Add a secret named exactly:

```text
OPENROUTER_API_KEY
```

Paste your OpenRouter API key as the secret value.

### Optional security setting

After your GitHub Pages site is live, create a Worker text variable:

```text
ALLOWED_ORIGIN = https://YOUR-USERNAME.github.io
```

For a repository Pages URL, use the full origin only, for example:

```text
https://myname.github.io
```

Do not include `/my-repository` in `ALLOWED_ORIGIN`.

Then redeploy the Worker.

## Part 3 — Put the front-end on GitHub Pages

1. Create a new GitHub repository.
2. Upload `index.html` to the repository root.
3. Open the repository's **Settings → Pages**.
4. Under the deployment source, select the branch containing `index.html` and the root folder.
5. Save.
6. GitHub will give you a Pages address similar to:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/
```

## Part 4 — Connect the website to your Worker

Open your GitHub Pages site.

1. Click the **⚙ Settings** button in the lower-left corner.
2. Enter your Worker URL, for example:

```text
https://free-ai-chat-worker.YOUR-SUBDOMAIN.workers.dev
```

3. Click **Save & test**.
4. The status at the bottom-left should change to **Connected**.
5. Start a chat.

## Where does the secret live?

```text
GitHub Pages
    │
    │ /chat request
    ▼
Cloudflare Worker
    │
    │ OPENROUTER_API_KEY secret
    ▼
OpenRouter
    │
    ▼
Free model selected by openrouter/free
```

The secret is never embedded in the public GitHub page.

## Optional: use Wrangler instead of the dashboard

Install Wrangler, then from the `worker` folder run:

```bash
npx wrangler login
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler deploy
```

You can also set optional variables in `wrangler.toml`.

## If the chat says "Request failed"

Check these in order:

1. Open the Worker URL with `/health` appended. It should return JSON similar to:

```json
{"ok":true,"service":"free-ai-chat-worker"}
```

2. Confirm `OPENROUTER_API_KEY` exists as a **secret** in the Worker.
3. Confirm the GitHub site is using the correct Worker URL in **⚙ Settings**.
4. Check the Worker logs in Cloudflare.
5. Check OpenRouter's free-model availability and rate limits.

## Cost expectation

This project is designed to operate within the free tiers. Cloudflare's Workers Free plan has request limits, and OpenRouter's free models are subject to their own availability and rate limits. There is no guarantee of unlimited requests or permanent availability of a particular free model.

## Customization

The user interface is contained in `index.html`, so you can change colors, layout, title, icons, and text without modifying the Worker.

The default Worker model is controlled by:

```text
FREE_MODEL=openrouter/free
```

If OpenRouter changes the available free model router or you want to use a specific free model later, change that variable without exposing your API key to the browser.
