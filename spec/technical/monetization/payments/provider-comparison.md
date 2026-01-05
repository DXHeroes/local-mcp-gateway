# Payment Provider Comparison

Comparison of payment providers for Local MCP Gateway.

## Overview

This document compares major payment providers for SaaS subscription billing, with focus on EU-based businesses.

---

## Provider Summary

| Provider | Type | Best For |
|----------|------|----------|
| **Paddle** | Merchant of Record | EU SaaS, tax simplicity |
| **Stripe** | Payment processor | Control, B2B, complex billing |
| **LemonSqueezy** | Merchant of Record | Indie/small teams |

---

## Detailed Comparison

### Pricing & Fees

| Feature | Paddle | Stripe | LemonSqueezy |
|---------|--------|--------|--------------|
| **Transaction fee** | 5% + $0.50 | 2.9% + $0.30 | 5% + $0.50 |
| **Subscription fee** | Included | +0.5% | Included |
| **Currency conversion** | Included | 1% | Included |
| **Chargeback fee** | $0 | $15 | $0 |
| **Monthly fee** | $0 | $0 | $0 |

### Tax Handling

| Feature | Paddle | Stripe | LemonSqueezy |
|---------|--------|--------|--------------|
| **EU VAT** | Automatic | Stripe Tax ($) | Automatic |
| **US Sales Tax** | Automatic | Stripe Tax ($) | Automatic |
| **Tax remittance** | They handle | You handle | They handle |
| **Tax invoices** | Provided | You create | Provided |
| **Reverse charge** | Automatic | Manual | Automatic |

### Merchant of Record

| Feature | Paddle | Stripe | LemonSqueezy |
|---------|--------|--------|--------------|
| **MoR status** | Yes | No | Yes |
| **Legal entity** | Paddle | You | LemonSqueezy |
| **VAT registration** | Not needed | Required in EU | Not needed |
| **Compliance** | They handle | You handle | They handle |

### Features

| Feature | Paddle | Stripe | LemonSqueezy |
|---------|--------|--------|--------------|
| **Subscriptions** | Yes | Yes | Yes |
| **Usage billing** | Limited | Excellent | Limited |
| **One-time payments** | Yes | Yes | Yes |
| **License keys** | Yes | No (DIY) | Yes |
| **Checkout page** | Hosted | Embedded/Hosted | Hosted |
| **Customer portal** | Yes | Yes | Yes |
| **Dunning** | Automatic | Configurable | Automatic |
| **API quality** | Good | Excellent | Good |
| **Webhooks** | Yes | Yes | Yes |

### B2B Features

| Feature | Paddle | Stripe | LemonSqueezy |
|---------|--------|--------|--------------|
| **Custom invoicing** | Limited | Excellent | Limited |
| **PO numbers** | Yes | Yes | Basic |
| **Net terms** | No | Yes | No |
| **Multi-currency** | Yes | Yes | Yes |
| **Tax exemption** | Manual | Automatic | Manual |

---

## Recommendation

### For Local MCP Gateway: **Paddle** (Primary)

**Reasons:**

1. **Merchant of Record** - No need to register for VAT in each EU country
2. **Automatic tax handling** - EU VAT, US sales tax handled automatically
3. **Simpler compliance** - Paddle is the seller, handles all legal requirements
4. **License key support** - Built-in support for software licenses
5. **Good for self-serve SaaS** - Checkout flow optimized for subscriptions

**Considerations:**

- Higher fees (5% vs 2.9%)
- Less control over checkout
- Limited usage-based billing
- Paddle is the customer's vendor (not you)

### Alternative: **Stripe**

**Use Stripe if:**

1. **B2B focus** - Need custom invoicing, PO numbers, net terms
2. **Usage billing** - Metered/usage-based pricing is important
3. **Control needed** - Want full control over checkout experience
4. **Lower fees** - Volume justifies complexity
5. **Already have EU entity** - VAT registration not a blocker

**Setup with Stripe:**

- Register for VAT in countries where you have customers (or use OSS)
- Enable Stripe Tax (additional cost)
- Handle tax remittance yourself
- Create compliant invoices

---

## Implementation Details

### Paddle Integration

**Subscription Products:**

| Product | Price ID | Billing |
|---------|----------|---------|
| Pro Monthly | `pri_pro_monthly` | $29/mo |
| Pro Annual | `pri_pro_annual` | $290/yr |
| Team Monthly | `pri_team_monthly` | $99/mo |
| Team Annual | `pri_team_annual` | $990/yr |

**Webhook Events:**

```typescript
// Paddle webhook handler
app.post('/api/webhooks/paddle', async (req, res) => {
  const event = Paddle.webhooks.unmarshal(
    req.body,
    req.headers['paddle-signature'],
    PADDLE_WEBHOOK_SECRET
  );

  switch (event.eventType) {
    case 'subscription.created':
      await handleSubscriptionCreated(event.data);
      break;
    case 'subscription.updated':
      await handleSubscriptionUpdated(event.data);
      break;
    case 'subscription.canceled':
      await handleSubscriptionCanceled(event.data);
      break;
    case 'transaction.completed':
      await handlePaymentCompleted(event.data);
      break;
  }

  res.status(200).send();
});
```

**Checkout Integration:**

```typescript
// Create checkout session
const checkout = await paddle.checkout.create({
  items: [{ priceId: 'pri_pro_monthly', quantity: 1 }],
  customer: { email: user.email },
  customData: { userId: user.id },
  returnUrl: 'https://app.example.com/billing/success'
});

// Frontend
Paddle.Checkout.open({
  settings: { theme: 'dark' },
  items: [{ priceId: 'pri_pro_monthly', quantity: 1 }]
});
```

### Stripe Integration

**Products and Prices:**

```typescript
// Create products
const proProduct = await stripe.products.create({
  name: 'Pro Plan',
  metadata: { tier: 'pro' }
});

const proMonthlyPrice = await stripe.prices.create({
  product: proProduct.id,
  unit_amount: 2900,
  currency: 'usd',
  recurring: { interval: 'month' }
});
```

**Checkout:**

```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: 'price_xxx', quantity: 1 }],
  success_url: 'https://app.example.com/billing/success',
  cancel_url: 'https://app.example.com/billing',
  customer_email: user.email,
  subscription_data: {
    metadata: { userId: user.id }
  },
  tax_id_collection: { enabled: true },
  automatic_tax: { enabled: true }
});
```

---

## License Sales

### Paddle Software Licensing

Paddle supports selling software licenses directly:

```typescript
const license = await paddle.licenses.generate({
  productId: 'pro_self_hosted',
  activations: 3
});

// Returns license key that can be validated via Paddle API
```

### Self-Managed Licenses

For more control, manage licenses yourself:

1. **Purchase triggers webhook** → Generate license key
2. **Store in database** → Track activations
3. **Validate via own API** → Cryptographic validation

---

## Migration Considerations

### From Stripe to Paddle

1. Export customer data
2. Cancel Stripe subscriptions at period end
3. Create new Paddle subscriptions
4. Notify customers of billing change

### From Paddle to Stripe

1. Export customer data
2. Register for VAT if needed
3. Migrate subscriptions
4. Update billing infrastructure

---

## Cost Analysis

### Example: 1000 customers, $29/mo average

**Paddle:**
```
Revenue: $29,000/mo
Fees: 5% + $0.50 = $1,950/mo
Net: $27,050/mo
```

**Stripe:**
```
Revenue: $29,000/mo
Stripe fee: 2.9% + $0.30 = $1,141/mo
Stripe Tax: ~$100/mo
Your VAT accounting: ~$200/mo (time/software)
Net: ~$27,559/mo
```

**Difference**: ~$500/mo (Stripe cheaper but more work)

---

## See Also

- [Subscriptions API](../api/subscriptions-api.md) - API endpoints
- [Subscriptions Schema](../database/subscriptions-schema.md) - Database
- [Pricing Tiers](../../business/pricing/pricing-tiers.md) - Tier pricing
