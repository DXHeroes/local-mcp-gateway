# Business Model Documentation

Business model, pricing, and licensing documentation for Local MCP Gateway.

## Overview

Local MCP Gateway operates under a **dual monetization model**:

1. **Self-hosted** - Source-available license (commercial use requires payment)
2. **Cloud SaaS** - Managed service with monthly subscription

---

## Documentation Index

### Licensing

| Document | Description |
|----------|-------------|
| [License Model](./licensing/license-model.md) | Dual licensing approach |
| [Source-Available License](./licensing/source-available-license.md) | Non-commercial license terms |
| [Commercial License](./licensing/commercial-license.md) | Enterprise license agreement |

### Pricing

| Document | Description |
|----------|-------------|
| [Pricing Tiers](./pricing/pricing-tiers.md) | Cloud and self-hosted pricing |
| [Feature Matrix](./pricing/feature-matrix.md) | Feature comparison by tier |

### Customer Segments

| Document | Description |
|----------|-------------|
| [Individual Developers](./customers/individual-developers.md) | Personal use segment |
| [Startups & SMBs](./customers/startups-smbs.md) | Small business segment |
| [Enterprise](./customers/enterprise.md) | Large organization segment |

---

## Business Model Summary

### Cloud SaaS

Fully managed MCP Gateway service:

| Tier | Price | Target |
|------|-------|--------|
| **Free** | $0/month | Individual developers, hobbyists |
| **Pro** | $29/month | Professional developers |
| **Team** | $99/month | Small teams and startups |
| **Enterprise** | Custom | Large organizations |

### Self-Hosted

Run on your own infrastructure:

| Tier | Price | Target |
|------|-------|--------|
| **Personal** | Free | Non-commercial use |
| **Startup** | $99/year | Small companies (<20 employees) |
| **Business** | $499/year | Medium companies (<100 employees) |
| **Enterprise** | Custom | Large organizations |

---

## Key Business Objectives

1. **Maximize adoption** through generous free tier
2. **Convert power users** to paid plans via usage limits
3. **Capture enterprise value** through compliance and support features
4. **Protect IP** while maintaining developer goodwill

---

## Revenue Streams

1. **SaaS subscriptions** - Primary revenue (recurring)
2. **Self-hosted licenses** - Secondary revenue (annual)
3. **Enterprise support** - Professional services
4. **Custom development** - Enterprise integrations

---

## See Also

- [Technical Monetization](../technical/monetization/README.md) - Implementation details
- [Payment Gateway Comparison](../technical/monetization/payments/provider-comparison.md) - Stripe vs Paddle
