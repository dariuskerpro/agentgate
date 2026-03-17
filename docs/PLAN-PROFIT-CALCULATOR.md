# Profit Calculator — Lead Funnel Implementation Plan

> **Status:** Planning
> **Priority:** Medium — marketing tool, not core infra
> **Depends on:** Token pricing engine (PLAN-TOKEN-PRICING.md) for accurate rate data
> **Created:** 2026-03-16

---

## Purpose

Interactive web calculator at `agentgate.online/calculator` that lets potential sellers estimate their revenue from listing endpoints on AgentGate. Primary goal: **lead funnel** — get developers thinking in terms of "what would I earn?" and funnel them into the seller onboarding flow.

---

## User Flow

1. Developer lands on `/calculator`
2. Selects their model (dropdown: Claude Sonnet 4, GPT-4.1, Gemini Flash, etc.)
3. Selects their endpoint type (dropdown: code review, transcription, extraction, custom)
4. Enters expected usage:
   - Average requests per day (slider: 10 → 100,000)
   - Average input size (slider: 100 tokens → 100K tokens)
   - Average output size (slider: 100 tokens → 10K tokens)
5. Sets their markup (slider: 0% → 50%, default 3%)
6. Calculator shows in real-time:
   - **Revenue per call** (with breakdown: provider cost + your margin)
   - **Daily revenue** (requests × revenue per call)
   - **Monthly revenue** (daily × 30)
   - **Annual revenue** (monthly × 12)
   - **Provider cost vs your earnings** (visual split bar)
   - **Comparison:** "This is like charging $X/month for a SaaS — but with zero billing infrastructure"

---

## Calculator Inputs

### Model Selection
Dropdown populated from the provider rate table. Shows:
```
Anthropic Claude Sonnet 4    — $3.00 / $15.00 per 1M tokens
OpenAI GPT-4.1               — $2.00 / $8.00 per 1M tokens
OpenAI GPT-4.1 mini          — $0.40 / $1.60 per 1M tokens
Google Gemini 2.5 Flash      — $0.15 / $3.50 per 1M tokens
OpenAI Whisper               — $6.00 per hour
Custom                        — Enter your own rates
```

### Endpoint Type (presets for avg token sizes)
- Code Review — avg 5K in / 2K out
- Transcription — avg 10 min audio
- Document Analysis — avg 3K in / 1K out
- Chat/Q&A — avg 500 in / 500 out
- Custom — enter manually

### Usage Volume
- Requests per day: slider 10 → 100,000 (log scale)
- Can also input exact number

### Markup
- Slider: 0% → 50%
- Default: 3%
- Shows dollar amount at current config

---

## Calculator Outputs (real-time, animated counters)

### Per-Call Breakdown
```
Provider cost:     $0.04500
Your markup (3%):  $0.00135
Total charge:      $0.04635
Your profit:       $0.00135
```

### Revenue Projections
```
Per call:    $0.00135 profit
Daily:       $13.50   (10,000 calls × $0.00135)
Monthly:     $405.00
Annual:      $4,860.00
```

### Visual: Cost Split Bar
```
[████████████████████████████░░] 
 Provider: 97%          You: 3%
```

### Comparison Context
"That's like a SaaS charging $405/month — but you didn't build billing, auth, or a signup page."

### At Scale Projections (stretch section)
Show what happens at 10x and 100x volume:
```
Current:   10,000 calls/day  →  $405/mo
At 10x:    100,000 calls/day →  $4,050/mo  
At 100x:   1,000,000 calls/day → $40,500/mo
```

---

## Technical Implementation

### Frontend Only — No Backend Needed
- Pure client-side calculation
- Provider rates baked into the page at build time (or fetched from discovery API)
- React component with state for all inputs
- Animated number transitions (spring counters)
- Responsive — works on mobile

### Page: `apps/web/src/app/calculator/page.tsx`

### Components:
```
calculator/
  page.tsx              — Main page layout
  ModelSelector.tsx     — Dropdown with provider/model selection
  UsageSlider.tsx       — Log-scale slider for volume
  MarkupSlider.tsx      — Percentage slider with dollar preview
  ResultsPanel.tsx      — Revenue projections with animated counters
  CostBreakdown.tsx     — Per-call breakdown table
  ScaleProjection.tsx   — 1x/10x/100x comparison
  ComparisonBanner.tsx  — "That's like charging..." context
```

### Data: `calculator/rates.ts`
Static export of provider rates (synced from PLAN-TOKEN-PRICING.md table).
When token pricing engine is built, this can fetch from the API instead.

---

## CTA at Bottom

After the calculator results:

```
Ready to start earning?

[npm install @agent-gate/middleware]    ← copy button

1. Add middleware to your API (3 lines)
2. Set your wallet address
3. Deploy and start earning USDC

[Get Started →]  ← links to /docs/getting-started
```

---

## Navbar Integration

Add "Calculator" to navbar between "How It Works" and "Marketplace".

---

## SEO / Lead Funnel Value

- **Page title:** "AI API Profit Calculator — How Much Can You Earn? | AgentGate"
- **Meta description:** "Calculate how much you'd earn selling your AI API per-call. Pick your model, set your markup, see projected revenue. No billing system needed."
- **Target keywords:** "AI API monetization", "sell API per call", "API profit calculator"
- Shareable — people will screenshot their projections

---

## Design Notes

- Same dark theme as rest of site
- Sliders should use the violet/indigo gradient for the active track
- Revenue numbers in large gradient text (violet → indigo)
- Animated counters (numbers tick up/down as sliders move)
- Mobile: stack inputs above results (currently side-by-side)

---

## Implementation Order

1. Build `rates.ts` with static provider data
2. Build calculator page with all inputs
3. Build results panel with animated counters
4. Add CTA section
5. Add to navbar
6. Build and deploy
7. Test on mobile

---

## Success Criteria

- [ ] Developer can select model and see per-call revenue in <1 second
- [ ] Sliders update results in real-time (no submit button)
- [ ] Revenue projections show daily/monthly/annual
- [ ] CTA links to getting-started docs
- [ ] Works on mobile
- [ ] Page loads fast (no API calls needed — all client-side)
