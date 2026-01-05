# Monetization Technical Documentation

Technical architecture for Local MCP Gateway monetization system.

## Overview

This section documents the technical design for implementing monetization features including user management, subscriptions, billing, and license key validation.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Frontend                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │   Auth UI   │  │ Billing UI  │  │ License UI  │  │  Admin UI    │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Backend API                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │  Auth API   │  │Subscription │  │ License API │  │  Metering    │   │
│  │             │  │    API      │  │             │  │    API       │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
            │  Database   │  │   Payment   │  │   License   │
            │  (SQLite)   │  │   Gateway   │  │   Server    │
            │             │  │   (Paddle)  │  │             │
            └─────────────┘  └─────────────┘  └─────────────┘
```

---

## Documentation Index

### Database

| Document | Description |
|----------|-------------|
| [Users Schema](./database/users-schema.md) | Users and organizations |
| [Subscriptions Schema](./database/subscriptions-schema.md) | Subscriptions and invoices |
| [License Keys Schema](./database/license-keys-schema.md) | Self-hosted licenses |

### API

| Document | Description |
|----------|-------------|
| [Subscriptions API](./api/subscriptions-api.md) | Subscription management |
| [License API](./api/license-api.md) | License operations |

### Payments

| Document | Description |
|----------|-------------|
| [Provider Comparison](./payments/provider-comparison.md) | Stripe vs Paddle vs LemonSqueezy |

### Licensing

| Document | Description |
|----------|-------------|
| [Key Generation](./licensing/key-generation.md) | License key format |
| [Key Validation](./licensing/key-validation.md) | Validation flow |

---

## Key Components

### 1. User Authentication

**Purpose**: Identify and authenticate users for both Cloud and license management.

**Implementation**:
- Email/password authentication
- OAuth (GitHub, Google)
- Session management with JWT

### 2. Subscription Management

**Purpose**: Handle Cloud SaaS subscriptions.

**Implementation**:
- Integration with Paddle (recommended) or Stripe
- Webhook handlers for subscription events
- Quota enforcement based on tier

### 3. License Key System

**Purpose**: Validate self-hosted commercial licenses.

**Implementation**:
- Cryptographic license key generation
- Online and offline validation
- Feature gating based on license

### 4. Usage Metering

**Purpose**: Track and enforce usage limits.

**Implementation**:
- Request counting per subscription
- Profile/server counting
- Rate limiting per tier

---

## Data Flow

### Cloud Subscription Flow

```
User → Signup → Free Tier
         │
         ▼
     Hit Limit → Upgrade Prompt
         │
         ▼
   Paddle Checkout → Webhook → Activate Pro
         │
         ▼
    Monthly Billing → Webhook → Renew/Suspend
```

### Self-Hosted License Flow

```
Customer → Purchase → Generate Key
              │
              ▼
         Deliver Key → Enter in App
              │
              ▼
         Validate Key → Activate Features
              │
              ▼
         Periodic Revalidation
```

---

## Technology Choices

| Component | Technology | Reason |
|-----------|------------|--------|
| Auth | Lucia Auth | Type-safe, flexible |
| Payments | Paddle | EU MoR, handles VAT |
| Database | SQLite + Drizzle | Existing stack |
| License Keys | Ed25519 | Offline validation |
| Session | JWT | Stateless, scalable |

---

## Security Considerations

### Authentication

- Password hashing with Argon2
- Rate limiting on auth endpoints
- Secure session tokens

### Payment

- No credit card data stored
- Paddle handles PCI compliance
- Webhook signature verification

### License Keys

- Ed25519 signing (not just encryption)
- Tamper-evident payload
- Revocation support

---

## Implementation Priority

### Phase 1: Foundation

1. User authentication
2. Basic subscription tiers
3. Paddle integration

### Phase 2: Licensing

4. License key generation
5. Online validation
6. Feature gating

### Phase 3: Advanced

7. Usage metering
8. Team management
9. Admin dashboard

---

## See Also

- [Business Model](../../business/README.md) - Business requirements
- [Pricing Tiers](../../business/pricing/pricing-tiers.md) - Tier definitions
- [Database Schema](../database/schema.md) - Existing schema
