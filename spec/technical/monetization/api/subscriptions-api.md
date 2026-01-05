# Subscriptions API

API endpoints for subscription management.

## Overview

The Subscriptions API handles subscription lifecycle, billing, and usage tracking for Cloud SaaS customers.

---

## Authentication

All endpoints require authentication:

```http
Authorization: Bearer <session_token>
```

---

## Endpoints

### Get Current Subscription

```http
GET /api/v1/subscription
```

Returns the active subscription for the authenticated user.

**Response:**

```json
{
  "subscription": {
    "id": "sub_xxx",
    "tier": "pro",
    "status": "active",
    "billingCycle": "monthly",
    "currentPeriodStart": "2025-01-01T00:00:00Z",
    "currentPeriodEnd": "2025-02-01T00:00:00Z",
    "cancelAtPeriodEnd": false,
    "trialEnd": null
  },
  "limits": {
    "profiles": { "used": 5, "limit": 10 },
    "servers": { "used": 12, "limit": null },
    "dailyRequests": { "used": 15420, "limit": 50000 }
  },
  "features": {
    "externalServers": true,
    "customServers": true,
    "webhooks": true,
    "auditLogs": false
  }
}
```

**Response (no subscription):**

```json
{
  "subscription": {
    "tier": "free",
    "status": "active"
  },
  "limits": {
    "profiles": { "used": 1, "limit": 1 },
    "servers": { "used": 2, "limit": 3 },
    "dailyRequests": { "used": 245, "limit": 1000 }
  },
  "features": {
    "externalServers": false,
    "customServers": false
  }
}
```

---

### Create Checkout Session

```http
POST /api/v1/subscription/checkout
```

Creates a Paddle/Stripe checkout session for subscription purchase.

**Request:**

```json
{
  "tier": "pro",
  "billingCycle": "monthly",
  "successUrl": "https://app.example.com/billing/success",
  "cancelUrl": "https://app.example.com/billing/cancel"
}
```

**Response:**

```json
{
  "checkoutUrl": "https://checkout.paddle.com/xxx",
  "checkoutId": "chk_xxx"
}
```

---

### Update Subscription (Upgrade/Downgrade)

```http
PUT /api/v1/subscription
```

Changes the subscription tier.

**Request:**

```json
{
  "tier": "team",
  "billingCycle": "annual"
}
```

**Response:**

```json
{
  "subscription": {
    "id": "sub_xxx",
    "tier": "team",
    "status": "active",
    "effectiveFrom": "2025-02-01T00:00:00Z",
    "prorationAmount": -1500
  },
  "message": "Subscription will be upgraded at the start of next billing period"
}
```

---

### Cancel Subscription

```http
POST /api/v1/subscription/cancel
```

Cancels the subscription.

**Request:**

```json
{
  "immediately": false,
  "reason": "too_expensive",
  "feedback": "Would use again if price was lower"
}
```

**Response:**

```json
{
  "subscription": {
    "id": "sub_xxx",
    "status": "active",
    "cancelAtPeriodEnd": true,
    "currentPeriodEnd": "2025-02-01T00:00:00Z"
  },
  "message": "Subscription will be canceled on 2025-02-01"
}
```

---

### Reactivate Subscription

```http
POST /api/v1/subscription/reactivate
```

Reactivates a canceled subscription before period end.

**Response:**

```json
{
  "subscription": {
    "id": "sub_xxx",
    "status": "active",
    "cancelAtPeriodEnd": false
  },
  "message": "Subscription reactivated"
}
```

---

### Get Billing Portal

```http
GET /api/v1/subscription/portal
```

Returns a URL to the payment provider's billing portal.

**Response:**

```json
{
  "portalUrl": "https://billing.paddle.com/portal/xxx",
  "expiresAt": "2025-01-12T12:00:00Z"
}
```

---

### Get Invoices

```http
GET /api/v1/subscription/invoices
```

Returns list of invoices.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 10 | Max invoices to return |
| offset | number | 0 | Pagination offset |
| status | string | all | Filter by status |

**Response:**

```json
{
  "invoices": [
    {
      "id": "inv_xxx",
      "invoiceNumber": "INV-2025-001",
      "status": "paid",
      "totalCents": 2900,
      "currency": "usd",
      "periodStart": "2025-01-01T00:00:00Z",
      "periodEnd": "2025-02-01T00:00:00Z",
      "paidAt": "2025-01-01T00:00:00Z",
      "invoicePdfUrl": "https://..."
    }
  ],
  "total": 12,
  "hasMore": true
}
```

---

### Get Usage

```http
GET /api/v1/subscription/usage
```

Returns current usage statistics.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| period | string | current | `current`, `previous`, or date range |

**Response:**

```json
{
  "period": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-02-01T00:00:00Z"
  },
  "usage": {
    "profiles": {
      "current": 5,
      "limit": 10,
      "percentage": 50
    },
    "servers": {
      "current": 12,
      "limit": null,
      "percentage": null
    },
    "dailyRequests": {
      "current": 15420,
      "limit": 50000,
      "percentage": 31,
      "history": [
        { "date": "2025-01-10", "count": 12500 },
        { "date": "2025-01-11", "count": 15420 }
      ]
    }
  }
}
```

---

## Webhook Events

### Paddle Webhooks

```http
POST /api/webhooks/paddle
```

Handles Paddle webhook events.

**Signature Verification:**

```typescript
const isValid = Paddle.webhooks.verify(
  request.body,
  request.headers['paddle-signature'],
  PADDLE_WEBHOOK_SECRET
);
```

**Handled Events:**

| Event | Action |
|-------|--------|
| `subscription.created` | Create subscription record |
| `subscription.updated` | Update subscription status |
| `subscription.canceled` | Mark as canceled |
| `subscription.paused` | Mark as paused |
| `transaction.completed` | Create invoice record |
| `transaction.payment_failed` | Mark as past_due |

---

## Error Responses

### Subscription Errors

| Code | HTTP | Description |
|------|------|-------------|
| `subscription_not_found` | 404 | No active subscription |
| `already_subscribed` | 409 | Already has paid subscription |
| `downgrade_not_allowed` | 400 | Cannot downgrade mid-period |
| `payment_required` | 402 | Payment method needed |

### Usage Errors

| Code | HTTP | Description |
|------|------|-------------|
| `quota_exceeded` | 402 | Usage limit reached |
| `rate_limited` | 429 | Too many requests |

**Error Response Format:**

```json
{
  "error": {
    "code": "quota_exceeded",
    "message": "Daily request limit reached. Upgrade to Pro for more requests.",
    "details": {
      "limit": 1000,
      "used": 1000,
      "resetsAt": "2025-01-12T00:00:00Z"
    },
    "upgradeUrl": "/settings/billing"
  }
}
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| GET /subscription | 60/min |
| POST /checkout | 10/min |
| PUT /subscription | 5/min |
| POST /cancel | 5/min |

---

## See Also

- [Subscriptions Schema](../database/subscriptions-schema.md) - Database schema
- [Provider Comparison](../payments/provider-comparison.md) - Payment providers
- [Pricing Tiers](../../business/pricing/pricing-tiers.md) - Tier details
