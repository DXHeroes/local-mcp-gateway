# License API

API endpoints for license key management.

## Overview

The License API handles license key generation, validation, and management for self-hosted deployments.

---

## Public Endpoints

These endpoints are used by self-hosted instances.

### Validate License Key

```http
POST /api/v1/license/validate
```

Validates a license key and returns license details.

**Request:**

```json
{
  "key": "LMG-BUS-K9X2M-P4N7Q-R3V8T-J6W1Y-A5C2",
  "instanceId": "inst_abc123",
  "metadata": {
    "hostname": "server.example.com",
    "osType": "linux",
    "osVersion": "Ubuntu 22.04",
    "appVersion": "1.0.0"
  }
}
```

**Response (Valid):**

```json
{
  "valid": true,
  "license": {
    "tier": "business",
    "status": "active",
    "validUntil": "2026-01-12T00:00:00Z"
  },
  "limits": {
    "users": 100,
    "profiles": null,
    "servers": null
  },
  "features": [
    "external_servers",
    "custom_servers",
    "webhooks"
  ],
  "activation": {
    "instanceId": "inst_abc123",
    "activatedAt": "2025-01-12T00:00:00Z",
    "activationsUsed": 1,
    "activationsLimit": 3
  }
}
```

**Response (Invalid):**

```json
{
  "valid": false,
  "reason": "expired",
  "message": "License expired on 2025-01-01. Please renew.",
  "renewUrl": "https://app.example.com/licenses/xxx/renew"
}
```

**Reason Codes:**

| Reason | Description |
|--------|-------------|
| `not_found` | License key doesn't exist |
| `expired` | License validity period ended |
| `revoked` | License was revoked |
| `activation_limit` | Max activations reached |
| `invalid_signature` | Key tampering detected |

---

### Deactivate Instance

```http
POST /api/v1/license/deactivate
```

Deactivates a license on current instance.

**Request:**

```json
{
  "key": "LMG-BUS-K9X2M-P4N7Q-R3V8T-J6W1Y-A5C2",
  "instanceId": "inst_abc123"
}
```

**Response:**

```json
{
  "success": true,
  "activationsRemaining": 2
}
```

---

### Offline Validation

```http
POST /api/v1/license/offline-token
```

Generates an offline validation token for air-gapped environments.

**Request:**

```json
{
  "key": "LMG-BUS-K9X2M-P4N7Q-R3V8T-J6W1Y-A5C2",
  "instanceId": "inst_abc123",
  "validityDays": 30
}
```

**Response:**

```json
{
  "offlineToken": "eyJhbGciOiJFZDI1NTE5...",
  "validUntil": "2025-02-12T00:00:00Z",
  "instructions": "Store this token in LICENSE_OFFLINE_TOKEN environment variable"
}
```

---

## Authenticated Endpoints

These endpoints require user authentication.

### List My Licenses

```http
GET /api/v1/licenses
```

Returns all licenses owned by the authenticated user.

**Response:**

```json
{
  "licenses": [
    {
      "id": "lic_xxx",
      "tier": "business",
      "status": "active",
      "keyPrefix": "LMG-BUS-K9X2",
      "validFrom": "2025-01-01T00:00:00Z",
      "validUntil": "2026-01-01T00:00:00Z",
      "activations": {
        "used": 1,
        "limit": 3,
        "instances": [
          {
            "instanceId": "inst_abc123",
            "hostname": "server.example.com",
            "lastSeen": "2025-01-12T10:30:00Z"
          }
        ]
      },
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### Get License Details

```http
GET /api/v1/licenses/:id
```

Returns detailed information about a specific license.

**Response:**

```json
{
  "license": {
    "id": "lic_xxx",
    "tier": "business",
    "status": "active",
    "keyPrefix": "LMG-BUS-K9X2",
    "limits": {
      "users": 100,
      "profiles": null,
      "servers": null
    },
    "features": ["external_servers", "custom_servers", "webhooks"],
    "validFrom": "2025-01-01T00:00:00Z",
    "validUntil": "2026-01-01T00:00:00Z",
    "activations": {
      "used": 1,
      "limit": 3,
      "instances": [
        {
          "id": "act_xxx",
          "instanceId": "inst_abc123",
          "instanceName": "Production Server",
          "hostname": "server.example.com",
          "osType": "linux",
          "osVersion": "Ubuntu 22.04",
          "appVersion": "1.0.0",
          "firstActivated": "2025-01-01T00:00:00Z",
          "lastSeen": "2025-01-12T10:30:00Z",
          "isActive": true
        }
      ]
    },
    "organization": {
      "id": "org_xxx",
      "name": "Acme Corp"
    },
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

### Purchase License

```http
POST /api/v1/licenses/purchase
```

Creates a checkout session for license purchase.

**Request:**

```json
{
  "tier": "business",
  "organizationId": "org_xxx",
  "successUrl": "https://app.example.com/licenses/success",
  "cancelUrl": "https://app.example.com/licenses"
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

### Reveal License Key

```http
POST /api/v1/licenses/:id/reveal
```

Reveals the full license key (one-time view or limited views).

**Request:**

```json
{
  "reason": "lost_key"
}
```

**Response:**

```json
{
  "key": "LMG-BUS-K9X2M-P4N7Q-R3V8T-J6W1Y-A5C2",
  "viewsRemaining": 2,
  "expiresAt": "2025-01-12T12:00:00Z"
}
```

---

### Rename Activation

```http
PUT /api/v1/licenses/:id/activations/:activationId
```

Updates activation metadata.

**Request:**

```json
{
  "instanceName": "Production Server 1"
}
```

---

### Deactivate Remote Instance

```http
DELETE /api/v1/licenses/:id/activations/:activationId
```

Remotely deactivates an instance.

**Response:**

```json
{
  "success": true,
  "message": "Instance deactivated. It will stop working on next validation."
}
```

---

## Admin Endpoints

Requires admin authentication.

### Generate License Key

```http
POST /api/admin/licenses/generate
```

Generates a new license key.

**Request:**

```json
{
  "tier": "enterprise",
  "organizationId": "org_xxx",
  "validUntil": "2026-01-01T00:00:00Z",
  "maxUsers": null,
  "maxActivations": 10,
  "features": ["external", "custom", "webhooks", "ha", "air_gapped"],
  "notes": "Enterprise deal - custom terms"
}
```

**Response:**

```json
{
  "license": {
    "id": "lic_xxx",
    "keyPrefix": "LMG-ENT-X7Y2"
  },
  "key": "LMG-ENT-X7Y2M-P4N7Q-R3V8T-J6W1Y-A5C2"
}
```

---

### Revoke License

```http
POST /api/admin/licenses/:id/revoke
```

Revokes a license key.

**Request:**

```json
{
  "reason": "refund_requested",
  "notifyUser": true
}
```

---

### Extend License

```http
POST /api/admin/licenses/:id/extend
```

Extends license validity.

**Request:**

```json
{
  "days": 30,
  "reason": "Goodwill extension"
}
```

---

## Error Responses

| Code | HTTP | Description |
|------|------|-------------|
| `license_not_found` | 404 | License doesn't exist |
| `license_expired` | 402 | License has expired |
| `license_revoked` | 403 | License was revoked |
| `activation_limit` | 402 | Too many activations |
| `not_owner` | 403 | User doesn't own license |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /validate | 60/min per key |
| POST /offline-token | 10/day per key |
| GET /licenses | 60/min |

---

## See Also

- [License Keys Schema](../database/license-keys-schema.md) - Database schema
- [Key Generation](../licensing/key-generation.md) - Generation algorithm
- [Key Validation](../licensing/key-validation.md) - Validation flow
