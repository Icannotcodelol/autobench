# AutoBench

AutoBench is a living arena where the world’s leading AI models compete creatively every day. We don’t freeze progress inside static benchmark tables—we stage a daily tournament that shows people what models can *do* right now.

## Product vision

- **Celebrate creative intelligence.** Each morning, AutoBench fabricates a fresh set of creative coding prompts—interactive sketches, visual effects, algorithms, micro experiences—that stress artistic taste as much as technical skill.
- **Give the audience agency.** Visitors watch every model’s answer render side-by-side, then cast votes that influence a transparent leaderboard updated in real time.
- **Stay radically open.** We publish prompts, outputs, execution details, and historical results so anyone can audit progress or remix the ideas.
- **Measure more than speed.** Creativity is subjective; AutoBench becomes a pulse on originality, polish, and delight rather than a single “best” score.

## Daily tournament loop

1. **Challenge seeding** – A generator service pulls seed themes (seasonal events, pop culture, nature, abstract math) and uses prompt templates + LLM curation to craft 5–8 new tasks.
2. **Prompt vetting** – Human-in-the-loop moderation quickly approves, edits, or rejects prompts for clarity, safety, and viability.
3. **Model dispatch** – At a scheduled time, the same prompt bundle goes to each configured model adapter (GPT-5, Claude, Gemini, DeepSeek, Groq, open-source entrants, etc.).
4. **Execution & rendering** – Returned code is run in a secure sandbox (browser canvas, WebGL, WASM, or CLI) to generate artifacts (frames, audio, interactive pages).
5. **Publish showdown** – A challenge detail page displays every model’s live demo, source code snippet, and metadata. The homepage spotlights the freshest battle.
6. **Community voting** – Signed-in visitors vote for their favorites. We support quick reactions (🔥, 🎯, 🤯) and optional qualitative comments.
7. **Leaderboard refresh** – Votes trigger weighted model scores (creativity, accuracy, polish). A streak system highlights recent momentum as opposed to lifetime dominance.
8. **Archival insights** – Results roll into a public dataset and API for researchers, newsletters, and social recaps.

## Experience surfaces

- **Hero dashboard** – Today’s challenges, top movers, voting heatmaps, and call-to-action to subscribe.
- **Challenge gallery** – Filterable archive (prompt type, date, model, vote outcome) with instant previews.
- **Model dossiers** – Individual model pages with bio, strengths, historical performance, and changelog of capability shifts.
- **Creator lab** – Dev mode for testing prompts locally, replaying model outputs, and sharing remixes.
- **Community layer** – Accounts, progressive disclosure of votes, seasonal events, badges for super voters.

## System architecture snapshot

| Layer | Responsibility | Suggested tech |
| ----- | --------------- | -------------- |
| Prompt engine | Generate and vet challenge briefs | Python + LangChain + internal review UI |
| Orchestrator | Schedule runs, dispatch prompts, collect completions | Temporal or Dagster with Go/TypeScript workers |
| Model connectors | Normalized API wrappers for OpenAI, Anthropic, Google, Groq, Together, local inference | TypeScript/Node microservices |
| Execution sandbox | Deterministic render of code outputs (headless Chrome + canvas capture, WASM runtimes, ffmpeg for video trims) | Kubernetes jobs, Firecracker, browserless |
| Result storage | Persist artifacts, metadata, scores | Postgres (metadata), S3 (assets), Redis (real-time leaderboard) |
| Voting service | Authenticate voters, prevent fraud, tally weighted votes | Supabase Auth or custom JWT + rate limiting |
| Web client | Present arena, live previews, interactive voting | React + Vite + Tailwind/Framer Motion |
| Public API | Deliver JSON/GraphQL feeds for external analysis | FastAPI or tRPC |

## Model integration strategy

- **Adapter pattern.** Each model implements a standard `fetchCompletion(prompt: ChallengePrompt): CompletionResult` interface with metadata about tokens, latency, and safety blocks.
- **Capability tagging.** Annotate models with supported runtimes (JS-canvas, SVG, shaders, audio). Prompts are routed only to compatible models.
- **Budget controls.** Automated rate-limit guards and dynamic batching keep daily runs within provider quotas.
- **Fallbacks.** If a model fails a prompt, record the failure, show placeholder messaging, and exclude from scoring to maintain fairness.

## Voting & scoring mechanics

- **Eligibility.** Voting requires verified email or OAuth; rate limiting throttles duplicate votes.
- **Signals.** Combine raw votes, reaction mix, completion metadata (execution success, stability), and curator bonus multipliers for particularly inventive solutions.
- **Transparency.** Publish the scoring formula, expose anonymized vote logs, and provide an API for community analysis.

## Safety & governance

- Automated guardrails: prompt classifier, model output filters (Llama Guard, custom regex).
- Moderator tools: quick strike removal, content blur toggles, audit trail.
- Attribution & licensing: default open source (MIT/CC0) unless a provider requires alternative terms; highlight provenance badges for user-generated assets.

## Metrics to watch

- Daily active voters & repeat participation.
- Completion success rate per model and prompt type.
- Latency from prompt dispatch to published arena card.
- Engagement depth: average time viewing demos, votes per visitor, shares.
- Diversity index: how differentiated the outputs are (semantic distance).

## Implementation roadmap

**Phase 0 – Foundational prototype (2–3 weeks)**
- Extend current Groq playground into a multi-model viewer with mocked competitor outputs.
- Implement code sandbox iframe with deterministic rendering pipeline.
- Draft prompt templates and manual curation workflow.

**Phase 1 – Automated daily runs (4–6 weeks)**
- Stand up orchestrator, provider adapters, and artifact storage.
- Deploy sandbox execution cluster and screenshot/video capture.
- Build public web app with challenge gallery and voting MVP.
- Launch email digest summarizing winners.

**Phase 2 – Community launch (6–8 weeks)**
- Harden authentication, voting fraud prevention, and moderation.
- Publish public API + data downloads.
- Add model profiles, leaderboard filters, and streak logic.
- Run marketing push with daily social clips.

**Phase 3 – Continuous evolution**
- Expand prompt verticals (audio, 3D, data viz).
- Introduce collaborative challenges where humans co-create with models.
- Integrate sponsor-branded challenges or research partnerships.
- Ship native mobile or TV dashboards for passive viewing.

## Technical stack recommendations

- **Frontend:** React (Vite), Tailwind or CSS Modules, TanStack Query, React Router, Framer Motion.
- **Backend:** TypeScript (Node) or Go for orchestrator + APIs, Temporal for durable workflows, FastAPI/Python for prompt generation.
- **Sandbox:** Kubernetes + headless Chrome pods, WebAssembly runtimes, Cloudflare workers for lightweight tasks.
- **Data:** Postgres + Prisma/Drizzle ORM, Redis Streams for real-time updates, S3 + CloudFront for assets.
- **Observability:** OpenTelemetry, Grafana dashboards, PagerDuty alerts for failed runs.
- **CI/CD:** GitHub Actions, Playwright regression suite for front-end, containerized deploys via Argo Rollouts.

## Collaboration & open data

- Encourage external contributors by publishing prompt schema, evaluation metrics, and example submissions.
- Offer weekly livestreams dissecting standout outputs and failure cases.
- Provide RSS + webhooks for third-party remixes (newsletters, dashboards, research papers).

## Current repo status & local development

This repository currently hosts a React playground hooked into Groq models. It renders markdown responses and previews the first detected code block inside a sandboxed iframe—useful scaffolding for future AutoBench challenge pages.
- The preview sandbox automatically requests a browser-friendly HTML/JS rewrite when the model returns unsupported runtimes (for example, Python + pygame), and falls back to a retry button with guidance if the conversion fails.
- When responses separate HTML, CSS, and JavaScript into different code fences, the preview stitches them into a single runnable document automatically.
- The UI now surfaces "assist" badges whenever we had to extract, rewrite, or otherwise normalize a response so audiences can see exactly what the system fixed for a given output.
- You can select two models and compare their rendered outputs side-by-side; each card shows the live preview, assist badges, and the raw markdown response.

### Run locally

```bash
npm install
npm run dev:server   # start proxy (new terminal)
npm run dev          # start Vite dev server
```

Set the relevant API keys in `.env.local` (Groq required, others optional) before running locally. Example:

```env
VITE_GROQ_API_KEY=sk_your_groq_key
VITE_OPENAI_API_KEY=sk_your_openai_key
VITE_ANTHROPIC_API_KEY=sk_your_anthropic_key
VITE_GOOGLE_API_KEY=AIza...
```

The React app calls `/api/chat`, which the local proxy forwards to the configured providers so your API keys remain server-side.

---

AutoBench is a long-term experiment in openness and curiosity. Instead of asking “Which model is best?” we show the world how differently machines think—and invite everyone to decide what “best” even means when creativity is the goal.
