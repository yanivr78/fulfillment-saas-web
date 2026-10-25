# Fulfillment SaaS — Operations Control Tower & 3D Warehouse Digital Twin

Interactive static web showcase and browser simulator for the **Fulfillment SaaS** multi-tenant 3PL platform (`yanivr78/Fullfillment_SaaS`).

## Key Capabilities Demonstrated

1. **Interactive 3D Warehouse Digital Twin (`app/components/Warehouse3DScene.tsx`):**
   - 60fps HTML5 Canvas 3D spatial projection of 12 multi-tier high-bay storage racks (`A-01` to `C-04`) and 4 Autonomous Mobile Robots (`AMR-01` to `AMR-04`).
   - Interactive camera presets (`Orbit 3D`, `Isometric`, `Top Radar`, `Aisle Cam`) and live PostgreSQL Row-Level Security (`app.tenant_id`) tenant filtering.
2. **Operations Control Tower Simulator (`app/components/ControlTowerDemo.tsx`):**
   - Step-by-step browser simulation of dock-to-stock ASN quarantine receiving, guided putaway, 100-way concurrent order reservation, floor scan-picking, and HMAC-SHA256 carrier webhook verification.
   - Real-time enforcement of the core inventory conservation invariant:
     `available = on_hand - reserved - quarantined - damaged`
3. **3D Perspective Telemetry Cards (`app/components/Tilt3DCard.tsx`):**
   - Hardware-accelerated 3D perspective tilt and cursor-tracked radial glare cards.

## Local Development & Static Export

```bash
npm install
npm run dev
# Build static export into out/ for GitHub Pages:
npm run build
```

## Related Repositories

- **Core Monorepo (Private):** `yanivr78/Fullfillment_SaaS` — Fastify 5 API, PostgreSQL 16 migrations + RLS policies, worker outbox, and AWS CloudFormation infrastructure.
- **Personal Creative Showcase:** [`yanivr78/the-realm-of-yaniv-ron`](https://github.com/yanivr78/the-realm-of-yaniv-ron) — Personal creative 3D & Web Audio synthesis showcase.
