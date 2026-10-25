import React from 'react';
import ControlTowerDemo from './components/ControlTowerDemo';
import Warehouse3DScene from './components/Warehouse3DScene';
import Tilt3DCard from './components/Tilt3DCard';

interface MetricCard {
  label: string;
  value: string;
  detail: string;
}

const SUMMARY_METRICS: MetricCard[] = [
  {
    label: 'Active Tenants & RBAC Scopes',
    value: 'RLS + Scoped Grants',
    detail: 'Tenant-isolated memberships with warehouse and merchant role boundaries',
  },
  {
    label: 'Sellable Inventory Conservation',
    value: 'available = on_hand - reserved - quarantined - damaged',
    detail: 'Immutable movement ledger with idempotency keys and row-locked reservations',
  },
  {
    label: 'Inbound ASN & Putaway',
    value: 'ASN -> Quarantine -> Putaway',
    detail: 'Received units stay quarantined until verified putaway into STORAGE bins',
  },
  {
    label: 'Outbound Order & Carrier Pipeline',
    value: 'ALLOCATED -> PICKED -> PACKED -> SHIPPED',
    detail: '100-way concurrent allocation protection + HMAC-verified carrier webhooks',
  },
];

const WORKFLOW_MODULES = [
  {
    phase: 'P1',
    name: 'Identity, Multi-Tenancy & RBAC',
    endpoints: 'GET /api/v1/me, GET /api/v1/tenants/current, POST/GET /api/v1/merchants',
    status: 'Active',
  },
  {
    phase: 'P2',
    name: 'Warehouses, Bins, Catalog & ASN Receiving',
    endpoints:
      'POST/GET /api/v1/warehouses, POST/GET /api/v1/skus, POST /api/v1/asns, POST /api/v1/putaway-tasks/:id/complete',
    status: 'Active',
  },
  {
    phase: 'P3',
    name: 'Orders, Atomic Reservations & Concurrency Control',
    endpoints:
      'POST/GET /api/v1/orders, POST /api/v1/orders/:id/cancel, GET /api/v1/inventory/availability',
    status: 'Active',
  },
  {
    phase: 'P4',
    name: 'Floor Picking, Packing & Carrier Label Dispatch',
    endpoints:
      'GET /api/v1/pick-tasks, POST /api/v1/pick-tasks/:id/confirm, POST /api/v1/orders/:id/pack, POST /api/v1/orders/:id/ship',
    status: 'Active',
  },
  {
    phase: 'P5-P6',
    name: 'Returns (RMA), Webhooks, Dashboards & Audit Ledger',
    endpoints:
      'POST /api/v1/returns, POST /api/v1/returns/:id/inspect, POST /api/v1/webhooks/carrier/:provider, GET /api/v1/dashboard/metrics, GET /api/v1/audit/events',
    status: 'Active',
  },
];

const BENTO_FEATURES = [
  {
    tag: 'Zero-Oversell Guarantee',
    title: 'Mathematical Inventory Conservation',
    description:
      'Every warehouse SKU balance enforces available = on_hand - reserved - quarantined - damaged >= 0 inside serialized row locks with mandatory Idempotency-Key deduplication.',
  },
  {
    tag: 'Defense-in-Depth Isolation',
    title: 'Dual-Layer Tenant & PostgreSQL RLS',
    description:
      'Requests are authorized at the Fastify RBAC guard by merchant/warehouse grants and enforced in PostgreSQL via FORCE ROW LEVEL SECURITY (app.tenant_id).',
  },
  {
    tag: 'Inbound Quality Gate',
    title: 'Quarantine-First ASN Receiving',
    description:
      'Dock receipts increment on_hand and quarantined simultaneously—preventing premature order allocation until floor operators scan-verify putaway into STORAGE bins.',
  },
  {
    tag: 'High-Throughput Floor Execution',
    title: 'Scan-Verified Pick, Pack & Ship',
    description:
      'Guided bin-to-carton workflows verify barcode scans at every state transition before dispatching idempotent carrier shipping labels.',
  },
  {
    tag: 'Cryptographic Edge Security',
    title: 'HMAC-SHA256 Carrier Webhooks & Outbox',
    description:
      'Timestamp-windowed replay protection and HMAC signature verification feed an immutable transactional outbox with consumer-deduplicated relay.',
  },
  {
    tag: 'Automated 3PL Monetization',
    title: 'Event-Metered Activity Billing',
    description:
      'Every storage putaway, pick confirmation, label dispatch, and RMA inspection automatically records auditable tenant/merchant billing ledger events.',
  },
];

const PRICING_TIERS = [
  {
    name: 'Growth 3PL Node',
    price: '$490',
    period: '/month',
    subtitle: 'For emerging fulfillment centers scaling multi-merchant operations.',
    featured: false,
    highlights: [
      'Up to 2 Warehouse Facilities & 15 Merchants',
      'Conservation-Locked Inventory Ledger',
      'ASN Quarantine & Guided Putaway',
      'Standard Carrier Webhooks (FedEx, UPS, USPS, DHL)',
      'Immutable Audit Trail (90-Day Retention)',
    ],
    cta: 'Start 14-Day Sandbox',
  },
  {
    name: 'Enterprise Control Tower',
    price: '$1,490',
    period: '/month',
    subtitle: 'For high-volume multi-node 3PL networks requiring strict SLAs & billing automation.',
    featured: true,
    highlights: [
      'Unlimited Warehouses, Storage Bins & Merchants',
      '100-Way Concurrent Order Reservation Engine',
      'PostgreSQL RLS + Scoped Warehouse/Merchant RBAC',
      'Transactional Outbox Relay & Event-Metered 3PL Billing',
      'RMA Returns Disposition & 7-Year Audit Retention',
    ],
    cta: 'Launch Control Tower',
  },
  {
    name: 'Dedicated Sovereign Cloud',
    price: 'Custom',
    period: 'deployment',
    subtitle: 'Single-tenant VPC or on-premise hardware for regulated logistics operators.',
    featured: false,
    highlights: [
      'Dedicated PostgreSQL Cluster with Custom RLS Policies',
      'Hardware Barcode Scanner & WMS ERP Bridges',
      'Custom SLA (99.995%) & 24/7 Principal Engineer Channel',
      'Zero-Cloud Local AI Review & Compliance Gate',
      'Full Source & Migration Auditability',
    ],
    cta: 'Contact Architecture Team',
  },
];

export default function Home() {
  return (
    <div>
      {/* Navigation */}
      <nav className="navbar" aria-label="Primary Navigation">
        <div className="container navbar-inner">
          <div className="brand">
            <span className="brand-mark">NX</span>
            <span>Fullfillment SaaS</span>
          </div>

          <div className="nav-links">
            <a href="#spatial-twin">3D Digital Twin</a>
            <a href="#control-tower">Interactive Control Tower</a>
            <a href="#invariants">Invariants</a>
            <a href="#capabilities">Architecture</a>
            <a href="#api-surface">API Surface</a>
            <a href="#pricing">Pricing</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="status-pill">
              <span className="status-dot" />
              All 3PL Nodes Operational
            </span>
            <a href="#control-tower" className="btn btn-primary btn-sm">
              Try Live Simulator
            </a>
          </div>
        </div>
      </nav>

      <main className="container">
        {/* Hero Section */}
        <header className="hero">
          <div className="hero-badge">
            <span>⚡ Next-Gen Multi-Tenant 3PL Platform • Fastify 5 + Next.js 16 + PostgreSQL RLS</span>
          </div>
          <h1 className="hero-title">
            Fullfillment SaaS — <span className="gradient-text">Operations Control Tower</span>
          </h1>
          <p className="hero-subtitle">
            Multi-tenant 3PL warehouse, inventory conservation, receiving, order fulfillment, shipping, and returns
            platform engineered for zero oversells and cryptographic auditability.
          </p>

          <div className="hero-actions">
            <a href="#control-tower" className="btn btn-primary">
              Launch Interactive Warehouse Simulator →
            </a>
            <a href="#api-surface" className="btn btn-secondary">
              Explore Protected API Surface
            </a>
          </div>

          {/* Interactive 3D Warehouse Digital Twin */}
          <section id="spatial-twin" aria-label="Interactive 3D Warehouse Digital Twin" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
            <Warehouse3DScene />
          </section>

          {/* Summary Metrics / Platform Invariants */}
          <section id="invariants" aria-labelledby="metrics-heading" style={{ textAlign: 'left', marginTop: '2rem' }}>
            <h2
              id="metrics-heading"
              style={{
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#38bdf8',
                marginBottom: '1rem',
                fontWeight: 700,
              }}
            >
              Platform Invariants & Operational Controls
            </h2>
            <div className="kpi-strip">
              {SUMMARY_METRICS.map((card) => (
                <Tilt3DCard key={card.label} className="kpi-card" intensity={10}>
                  <h3 style={{ fontSize: '0.88rem', color: '#94a3b8', fontWeight: 600 }}>{card.label}</h3>
                  <p
                    style={{
                      margin: '0.45rem 0',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      color: '#f8fafc',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    }}
                  >
                    {card.value}
                  </p>
                  <p style={{ fontSize: '0.82rem', color: '#64748b' }}>{card.detail}</p>
                </Tilt3DCard>
              ))}
            </div>
          </section>
        </header>

        {/* Interactive Control Tower Section */}
        <section id="control-tower" className="section" aria-labelledby="tower-heading">
          <div className="section-header">
            <div className="section-eyebrow">Live Product Sandbox</div>
            <h2 id="tower-heading" className="section-title">
              Test Drive the Operations Control Tower
            </h2>
            <p className="section-desc">
              Simulate dock-to-stock ASN receiving, putaway verification, atomic order reservations, floor scan-picking,
              and multi-tenant PostgreSQL RLS boundaries right in your browser.
            </p>
          </div>

          <ControlTowerDemo />
        </section>

        {/* Architectural Capabilities Bento Grid */}
        <section id="capabilities" className="section" aria-labelledby="bento-heading">
          <div className="section-header">
            <div className="section-eyebrow">Engineered for High-Trust Logistics</div>
            <h2 id="bento-heading" className="section-title">
              Six Pillars of Deterministic Fulfillment
            </h2>
            <p className="section-desc">
              Built from the ground up to eliminate race conditions, cross-tenant leakage, and unbilled warehouse
              activity.
            </p>
          </div>

          <div className="bento-grid">
            {BENTO_FEATURES.map((feat) => (
              <article key={feat.title} className="bento-card">
                <span className="bento-tag">{feat.tag}</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>{feat.title}</h3>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{feat.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Implemented Service Capabilities & API Surface */}
        <section id="api-surface" className="section" aria-labelledby="modules-heading">
          <div className="section-header">
            <div className="section-eyebrow">Verified Backend Contracts</div>
            <h2 id="modules-heading" className="section-title">
              Implemented Service Capabilities & API Surface
            </h2>
            <p className="section-desc">
              Every endpoint is protected by bearer principal resolution, scoped RBAC guards, and idempotency keys on
              state-mutating operations.
            </p>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.78)',
              border: '1px solid rgba(148, 163, 184, 0.14)',
              borderRadius: '0.95rem',
              overflowX: 'auto',
            }}
          >
            <table className="api-table">
              <thead>
                <tr>
                  <th>Phase</th>
                  <th>Capability</th>
                  <th>Protected Endpoints</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {WORKFLOW_MODULES.map((mod) => (
                  <tr key={mod.phase}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{mod.phase}</td>
                    <td style={{ fontWeight: 600 }}>{mod.name}</td>
                    <td>
                      <span className="code-chip">{mod.endpoints}</span>
                    </td>
                    <td style={{ color: '#34d399', fontWeight: 700 }}>{mod.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="section" aria-labelledby="pricing-heading">
          <div className="section-header">
            <div className="section-eyebrow">Predictable 3PL Economics</div>
            <h2 id="pricing-heading" className="section-title">
              Scale From Single Warehouse to Global Fulfillment Network
            </h2>
            <p className="section-desc">
              Start small with a single warehouse node and expand seamlessly as your merchant volume grows.
            </p>
          </div>

          <div className="pricing-grid">
            {PRICING_TIERS.map((tier) => (
              <article key={tier.name} className={`pricing-card ${tier.featured ? 'featured' : ''}`}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{tier.name}</h3>
                    {tier.featured && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          background: 'rgba(56, 189, 248, 0.18)',
                          color: '#38bdf8',
                        }}
                      >
                        MOST POPULAR
                      </span>
                    )}
                  </div>
                  <div className="price-amount">
                    {tier.price}
                    <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#94a3b8' }}> {tier.period}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#94a3b8' }}>{tier.subtitle}</p>

                  <ul className="feature-list">
                    {tier.highlights.map((item) => (
                      <li key={item} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <span style={{ color: '#34d399', fontWeight: 800 }}>✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href="#control-tower"
                  className={`btn ${tier.featured ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%' }}
                >
                  {tier.cta}
                </a>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(148, 163, 184, 0.14)',
          padding: '2.5rem 0',
          marginTop: '3rem',
          color: '#64748b',
          fontSize: '0.85rem',
        }}
      >
        <div
          className="container"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
        >
          <div>
            <strong style={{ color: '#e2e8f0' }}>Fullfillment SaaS — Operations Control Tower</strong> • Multi-Tenant
            3PL Infrastructure
          </div>
          <div>Repository: yanivr78/fulfillment-saas-web • Built with Next.js & TypeScript</div>
        </div>
      </footer>
    </div>
  );
}
