# License Model

Dual licensing approach for Local MCP Gateway.

## Overview

Local MCP Gateway uses a **dual license model** similar to successful projects like Elastic, MongoDB, and Sentry. This allows open development while protecting against exploitation.

---

## Why Dual Licensing?

### The Challenge

Open source projects face a dilemma:
- **Too permissive**: Large companies use software without contributing back
- **Too restrictive**: Limits adoption and community growth

### Our Solution

Two licenses that serve different needs:

1. **Source-Available** - Free for non-commercial use
2. **Commercial** - Paid license for business use

---

## License Comparison

| Aspect | Source-Available | Commercial |
|--------|------------------|------------|
| **View source code** | Yes | Yes |
| **Modify code** | Yes | Yes |
| **Self-host (personal)** | Yes | Yes |
| **Self-host (company)** | No | Yes |
| **Use in production** | Non-commercial only | Yes |
| **Offer as hosted service** | No | No |
| **Priority support** | No | Yes |
| **SLA** | No | Yes |
| **Price** | Free | From $99/year |

---

## Source-Available License

Based on **Elastic License 2.0** model:

### Permitted Uses

- Personal projects and experimentation
- Academic and educational use
- Non-profit organizations (with application)
- Internal evaluation (30-day trial)
- Contributing to the project

### Restrictions

1. **No commercial use** - Cannot use in revenue-generating activities
2. **No managed service** - Cannot offer as SaaS to third parties
3. **No license circumvention** - Cannot remove or bypass license checks
4. **No distribution** - Cannot redistribute without license

### Definition of Commercial Use

Commercial use includes:
- Deployment within a company (any size)
- Use in products or services that generate revenue
- Use to support internal business operations
- Consulting or professional services using the software

---

## Commercial License

For legitimate business use:

### Rights Granted

- Deploy in production environments
- Use for commercial purposes
- Modify and customize
- Receive support and updates
- SLA guarantees (Enterprise tier)

### License Tiers

| Tier | Price | Use Case |
|------|-------|----------|
| **Startup** | $99/year | Companies <20 employees, <$1M revenue |
| **Business** | $499/year | Companies <100 employees |
| **Enterprise** | Custom | Large organizations, custom terms |

### What's NOT Permitted

Even with commercial license:
- Offering as a managed service (SaaS)
- Reselling the software
- Sub-licensing to third parties

---

## License Selection Guide

### Use Source-Available If:

- You're an individual developer
- Working on personal projects
- Learning or experimenting
- Non-profit organization
- Academic/research use

### Use Commercial If:

- You're a company deploying internally
- Using for business operations
- Need support and SLA
- Want guaranteed updates

---

## Compliance

### How We Verify

1. **Self-hosted**: License key required for commercial features
2. **Cloud**: Built into subscription

### Grace Period

- 30-day evaluation without license
- Email notification before enforcement
- No automatic shutdown

### Violations

If we detect unlicensed commercial use:
1. Contact to discuss licensing
2. Offer reasonable terms
3. Escalate only if necessary

---

## Frequently Asked Questions

### Can I use this for a client project?

**As a contractor**: If you're building something for a client, the client needs the commercial license, not you.

### What about startups?

Startups under 20 employees and $1M revenue qualify for the **Startup tier** at $99/year.

### Can I contribute to the project?

Contributions are welcome under the Source-Available license. By contributing, you agree that your contributions may be used under both licenses.

### What if we grow past the tier limits?

Upgrade to the next tier. We'll prorate the remaining time.

---

## License Text

Full license texts:
- [Source-Available License](./source-available-license.md)
- [Commercial License](./commercial-license.md)

---

## See Also

- [Pricing Tiers](../pricing/pricing-tiers.md) - Detailed pricing
- [Enterprise](../customers/enterprise.md) - Enterprise licensing
