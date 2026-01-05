# License Key Validation

Technical specification for license key validation.

## Overview

License validation supports both online (API-based) and offline (cryptographic) modes to accommodate various deployment scenarios.

---

## Validation Modes

| Mode | Use Case | Requirements |
|------|----------|--------------|
| **Online** | Standard deployments | Internet access |
| **Offline** | Air-gapped environments | Offline token |
| **Hybrid** | Intermittent connectivity | Periodic online check |

---

## Online Validation

### Flow Diagram

```
Application                         License Server
     │                                    │
     │── POST /api/v1/license/validate ──▶│
     │   { key, instanceId, metadata }    │
     │                                    │
     │                                    │── Lookup key hash
     │                                    │── Check status
     │                                    │── Verify limits
     │                                    │── Update activation
     │                                    │
     │◀── { valid, license, features } ───│
     │                                    │
     │   Cache result (24h)               │
     │                                    │
     │   [Next day]                       │
     │                                    │
     │── POST /validate ─────────────────▶│
     │                                    │
```

### Implementation

```typescript
interface ValidationRequest {
  key: string;
  instanceId: string;
  metadata?: {
    hostname?: string;
    osType?: string;
    osVersion?: string;
    appVersion?: string;
  };
}

interface ValidationResponse {
  valid: boolean;
  reason?: string;
  license?: {
    tier: string;
    status: string;
    validUntil?: string;
  };
  limits?: {
    users?: number;
    profiles?: number;
    servers?: number;
  };
  features?: string[];
  activation?: {
    instanceId: string;
    activationsUsed: number;
    activationsLimit: number;
  };
}

async function validateOnline(request: ValidationRequest): Promise<ValidationResponse> {
  try {
    const response = await fetch(`${LICENSE_SERVER}/api/v1/license/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    const result = await response.json();

    if (result.valid) {
      // Cache successful validation
      await cacheValidation(request.key, result, 24 * 60 * 60);
    }

    return result;
  } catch (error) {
    // Network error - try cached result
    const cached = await getCachedValidation(request.key);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    // No cache - enter grace period
    return {
      valid: true,
      gracePeriod: true,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    };
  }
}
```

### Server-Side Validation

```typescript
async function handleValidation(request: ValidationRequest): Promise<ValidationResponse> {
  // Parse key
  const { keyHash, keyPrefix } = parseDisplayKey(request.key);

  // Lookup license
  const license = await db.query.licenseKeys.findFirst({
    where: eq(licenseKeys.keyHash, keyHash)
  });

  if (!license) {
    await logValidation(keyPrefix, request.instanceId, false, 'not_found');
    return { valid: false, reason: 'not_found' };
  }

  // Check status
  if (license.status === 'revoked') {
    await logValidation(license.id, request.instanceId, false, 'revoked');
    return { valid: false, reason: 'revoked' };
  }

  // Check expiration
  if (license.validUntil && license.validUntil < Date.now()) {
    await logValidation(license.id, request.instanceId, false, 'expired');
    return { valid: false, reason: 'expired' };
  }

  // Check activation limit
  const activations = await db.query.licenseActivations.findMany({
    where: and(
      eq(licenseActivations.licenseKeyId, license.id),
      eq(licenseActivations.isActive, true)
    )
  });

  const existingActivation = activations.find(
    a => a.instanceId === request.instanceId
  );

  if (!existingActivation && activations.length >= license.maxActivations) {
    await logValidation(license.id, request.instanceId, false, 'activation_limit');
    return { valid: false, reason: 'activation_limit' };
  }

  // Update or create activation
  await upsertActivation(license.id, request.instanceId, request.metadata);

  // Log success
  await logValidation(license.id, request.instanceId, true);

  return {
    valid: true,
    license: {
      tier: license.tier,
      status: license.status,
      validUntil: license.validUntil?.toISOString()
    },
    limits: {
      users: license.maxUsers,
      profiles: license.maxProfiles,
      servers: license.maxServers
    },
    features: JSON.parse(license.features),
    activation: {
      instanceId: request.instanceId,
      activationsUsed: activations.length + (existingActivation ? 0 : 1),
      activationsLimit: license.maxActivations
    }
  };
}
```

---

## Offline Validation

### Using Embedded Public Key

For air-gapped environments, validate cryptographically:

```typescript
import { verify } from '@noble/ed25519';

// Public key embedded in application binary
const PUBLIC_KEY = 'embedded_public_key_hex';

async function validateOffline(displayKey: string): Promise<OfflineValidationResult> {
  try {
    // Parse display key to get signed payload
    const signedPayload = parseDisplayKeyToPayload(displayKey);
    const [payloadBase64, signatureBase64] = signedPayload.split('.');

    // Decode
    const payloadBytes = base64UrlDecode(payloadBase64);
    const signature = base64UrlDecode(signatureBase64);

    // Verify signature
    const isValid = await verify(
      signature,
      payloadBytes,
      hexToBytes(PUBLIC_KEY)
    );

    if (!isValid) {
      return { valid: false, reason: 'invalid_signature' };
    }

    // Parse payload
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes));

    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return { valid: false, reason: 'expired' };
    }

    return {
      valid: true,
      payload,
      validUntil: payload.exp ? new Date(payload.exp * 1000) : null
    };
  } catch (error) {
    return { valid: false, reason: 'parse_error' };
  }
}
```

### Offline Token

For extended offline periods, pre-generate an offline token:

```typescript
interface OfflineToken {
  license: {
    id: string;
    tier: string;
    limits: object;
    features: string[];
  };
  instance: {
    id: string;
    validFrom: number;
    validUntil: number;
  };
  signature: string;
}

// Server generates offline token
async function generateOfflineToken(
  licenseKey: string,
  instanceId: string,
  validityDays: number
): Promise<OfflineToken> {
  const license = await validateLicenseKey(licenseKey, instanceId);

  if (!license.valid) {
    throw new Error('Invalid license');
  }

  const token = {
    license: {
      id: license.payload.lid,
      tier: license.payload.tid,
      limits: license.payload.lim,
      features: license.payload.fea
    },
    instance: {
      id: instanceId,
      validFrom: Date.now(),
      validUntil: Date.now() + validityDays * 24 * 60 * 60 * 1000
    }
  };

  const signature = await sign(
    JSON.stringify(token),
    PRIVATE_KEY
  );

  return {
    ...token,
    signature: base64UrlEncode(signature)
  };
}

// Client validates offline token
async function validateOfflineToken(token: OfflineToken): Promise<boolean> {
  // Verify signature
  const isValid = await verify(
    base64UrlDecode(token.signature),
    new TextEncoder().encode(JSON.stringify({
      license: token.license,
      instance: token.instance
    })),
    hexToBytes(PUBLIC_KEY)
  );

  if (!isValid) return false;

  // Check validity period
  const now = Date.now();
  if (now < token.instance.validFrom || now > token.instance.validUntil) {
    return false;
  }

  return true;
}
```

---

## Hybrid Validation

Combine online and offline for best UX:

```typescript
async function validateLicense(key: string, instanceId: string): Promise<ValidationResult> {
  // Try online first
  try {
    const online = await validateOnline({ key, instanceId });
    if (online.valid) {
      // Store for offline use
      await storeOfflineCache(key, online);
      return online;
    }
    return online;
  } catch (networkError) {
    // Offline fallback
    console.log('Network unavailable, using offline validation');

    // Check offline cache
    const cached = await getOfflineCache(key);
    if (cached && cached.expiresAt > Date.now()) {
      return { ...cached, fromCache: true };
    }

    // Try cryptographic validation
    const offline = await validateOffline(key);
    if (offline.valid) {
      // Grace period for activation check
      return {
        ...offline,
        gracePeriod: true,
        message: 'Running in offline mode. Connect to validate activation.'
      };
    }

    return offline;
  }
}
```

---

## Validation Schedule

### Recommended Schedule

| Event | Action |
|-------|--------|
| Application start | Validate (online preferred) |
| Every 24 hours | Re-validate online |
| Feature access | Check cached validation |
| Network restored | Sync validation |

### Grace Periods

| Scenario | Grace Period |
|----------|--------------|
| Network unavailable | 7 days |
| License expired | 0 days (immediate) |
| License revoked | 0 days (immediate) |
| Activation limit | 0 (no grace) |

---

## Feature Gating

```typescript
function isFeatureEnabled(feature: string): boolean {
  const validation = getCachedValidation();

  if (!validation?.valid) {
    return false;
  }

  return validation.features?.includes(feature) ?? false;
}

// Usage
if (isFeatureEnabled('external_servers')) {
  // Allow external stdio servers
}

if (isFeatureEnabled('webhooks')) {
  // Enable webhook functionality
}
```

---

## Error Handling

### User-Facing Messages

| Reason | Message |
|--------|---------|
| `not_found` | Invalid license key. Please check and try again. |
| `expired` | Your license has expired. Please renew to continue. |
| `revoked` | This license has been revoked. Contact support. |
| `activation_limit` | Maximum activations reached. Deactivate another instance or upgrade. |
| `invalid_signature` | License key appears to be corrupted or modified. |

### Degraded Mode

When validation fails:

```typescript
function handleValidationFailure(reason: string): void {
  switch (reason) {
    case 'network_error':
      // Continue with cached data, warn user
      showNotification('Running in offline mode');
      break;

    case 'expired':
      // Disable commercial features, allow basic use
      setTier('free');
      showUpgradePrompt();
      break;

    case 'revoked':
    case 'not_found':
      // Block commercial features
      setTier('free');
      showLicenseError();
      break;
  }
}
```

---

## See Also

- [Key Generation](./key-generation.md) - Key generation
- [License API](../api/license-api.md) - API endpoints
- [License Keys Schema](../database/license-keys-schema.md) - Database
