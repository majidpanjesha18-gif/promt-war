# RescueLoop AI

> **Tagline:** Predict surplus. Coordinate rescue. Verify impact.  
> **Category:** Food Surplus Intelligence & Autonomous Rescue Coordination Platform.

---

## 1. Overview & Problem Statement

Restaurants, catering providers, and supermarkets face uncertain day-to-day demand resulting in edible surplus food. Meanwhile, emergency shelters, food banks, and soup kitchens operate on thin margins and often fail to collect surplus before it becomes unsafe or expires.

**RescueLoop AI** is not a static dashboard or a chatbot. It is a **stateful, failure-aware AI rescue coordination system** that:
1. Analyzes daily historical sales and current available surplus.
2. Estimates surplus demand and flags items with urgent collection windows.
3. Performs strict deterministic eligibility filtering (verification status, operational availability, storage/cold-chain constraints, and intake capacity).
4. Ranks recipients using a transparent scoring function (collection feasibility, capacity fit, transit distance, urgency, and grounded reliability).
5. Generates structured proposed rescue plans requiring human coordinator approval before food allocation.
6. Handles simulated or real recipient pickup rejections end-to-end, preserving the audit trail and autonomously discovering alternative viable recipients.
7. Enforces valid chain-of-custody state transitions: `PROPOSED` &rarr; `APPROVED` &rarr; `PICKUP_CONFIRMED` &rarr; `DELIVERY_CONFIRMED`.
8. Measures verified impact strictly from confirmed deliveries without fabricating metrics.

---

## 2. Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript with strict type checking
- **Styling:** Tailwind CSS with custom forest green, lime, and neutral design system
- **Icons:** Lucide React
- **Data Visualization:** Recharts
- **Validation:** Zod schemas for runtime input validation and structured AI responses
- **Persistence:** Safe client-side `localStorage` with demo seed fallback and reset controls
- **Testing:** Vitest with 12 end-to-end business rule verification tests
- **AI Integration:** Google Gemini API (`@google/generative-ai`), accessed strictly server-side with deterministic fallback

---

## 3. Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v24 LTS)
- npm or pnpm

### Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env.local
```

Add your Google Gemini API key (optional for core operations; deterministic reasoning handles matching if omitted):
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

### Running the Application

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Run automated test suite:**
   ```bash
   npm test
   ```

4. **Run production build:**
   ```bash
   npm run build
   ```

---

## 4. Key Screens & Capabilities

1. **Overview Dashboard (`/`)**:
   - Real-time KPIs: available surplus, meals at risk (&lt;12 hrs), active missions, verified rescued meals, and waste avoided.
   - Interactive Recharts visualization of historical surplus trends.
   - Urgent attention alerts highlighting imminent expiration deadlines.
   - Recent agent trace events and decision logs.

2. **Surplus Inventory (`/inventory`)**:
   - Manage surplus food listings with quantities, preparation timestamps, and strict safe collection deadlines.
   - Configure certified storage types (`ambient`, `refrigerated`, `frozen`, `hot_hold`).
   - Add/edit listings with Zod-validated parameters and safety notes.

3. **Recipient Directory (`/recipients`)**:
   - Directory of certified community recipients (shelters, soup kitchens, food banks).
   - Capacity tracking: total capacity vs. currently allocated pending meals.
   - Operating hours and accepted dietary/category flags.
   - Safety toggles: verify or deactivate partners to inspect deterministic filtering.

4. **AI Agent Control Center (`/agent`)**:
   - The central operational hub for dispatchers.
   - Trigger the agent to analyze inventory, estimate surplus, and rank candidates.
   - Inspect proposed rescue plans with score breakdown bars.
   - AI Synthesis: Click **"Gemini Re-Analyze"** to generate trade-off and risk mitigation summaries with clear attribution.
   - Human-in-the-loop approval: Approve or decline plans.
   - **Simulate Rejection & Recovery**: Trigger recipient drop-offs to watch autonomous recovery propose immediate viable alternatives.
   - Immutable audit trail and event trace viewer.

5. **Rescue Missions (`/missions`)**:
   - State machine tracking: `PROPOSED` &rarr; `APPROVED` &rarr; `PICKUP_CONFIRMED` &rarr; `DELIVERY_CONFIRMED`.
   - Prevents delivery confirmation before pickup is recorded.
   - Detailed per-mission chronological history log.

6. **Analytics & Impact (`/analytics`)**:
   - Grounded impact reporting: food waste avoided (USDA ~0.45 kg/meal standard).
   - Does NOT count proposed or pending food as delivered.
   - Forecast accuracy rate grounded in actual historical sales data.

---

## 5. Security & Reliability

- **No client-side API keys:** Google Gemini credentials are only consumed within `/api/gemini/explain` server-side route.
- **Untrusted model output:** AI summaries are validated against Zod schemas and cannot directly mutate state, confirm deliveries, or bypass approval.
- **Over-allocation prevention:** The engine prevents assigning identical food quantities across concurrent active missions.
- **Deterministic safety overrides:** Ineligible, unverified, or unavailable recipients are rejected prior to scoring.
