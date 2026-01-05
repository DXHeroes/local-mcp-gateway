# License Key Generation

Technical specification for license key generation.

## Overview

License keys are cryptographically signed tokens that encode license terms and can be validated both online and offline.

---

## Key Format

### Display Format

```
LMG-{TIER}-{PART1}-{PART2}-{PART3}-{PART4}-{CHECK}

Example: LMG-BUS-K9X2M-P4N7Q-R3V8T-J6W1Y-A5C2
```

**Components:**

| Component | Length | Description |
|-----------|--------|-------------|
| Prefix | 4 | `LMG-` (product identifier) |
| Tier | 3 | `STR`, `BUS`, `ENT` |
| Parts | 5×4 | Base32 encoded payload chunks |
| Check | 4 | CRC32 checksum |

### Internal Structure

The display key encodes a signed payload:

```
[PAYLOAD_BASE64].[SIGNATURE_BASE64]
```

Where payload is:

```json
{
  "v": 1,
  "lid": "550e8400-e29b-41d4-a716-446655440000",
  "tid": "business",
  "oid": "org-uuid-here",
  "uid": null,
  "lim": {
    "u": 100,
    "p": null,
    "s": null,
    "a": 3
  },
  "fea": ["ext", "cst", "whk"],
  "iat": 1704153600,
  "exp": 1735689600
}
```

**Payload Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `v` | number | Payload version |
| `lid` | string | License ID (UUID) |
| `tid` | string | Tier ID |
| `oid` | string? | Organization ID |
| `uid` | string? | User ID (if individual) |
| `lim.u` | number? | Max users |
| `lim.p` | number? | Max profiles |
| `lim.s` | number? | Max servers |
| `lim.a` | number | Max activations |
| `fea` | string[] | Feature codes |
| `iat` | number | Issued at (Unix timestamp) |
| `exp` | number? | Expires at (Unix timestamp) |

---

## Generation Algorithm

### Step 1: Create Payload

```typescript
interface LicensePayload {
  v: number;
  lid: string;
  tid: string;
  oid?: string;
  uid?: string;
  lim: {
    u?: number;
    p?: number;
    s?: number;
    a: number;
  };
  fea: string[];
  iat: number;
  exp?: number;
}

function createPayload(params: LicenseParams): LicensePayload {
  return {
    v: 1,
    lid: crypto.randomUUID(),
    tid: params.tier,
    oid: params.organizationId,
    uid: params.userId,
    lim: {
      u: params.maxUsers,
      p: params.maxProfiles,
      s: params.maxServers,
      a: params.maxActivations
    },
    fea: params.features,
    iat: Math.floor(Date.now() / 1000),
    exp: params.validUntil
      ? Math.floor(params.validUntil.getTime() / 1000)
      : undefined
  };
}
```

### Step 2: Sign Payload

Using Ed25519 for digital signatures:

```typescript
import { sign } from '@noble/ed25519';

async function signPayload(payload: LicensePayload): Promise<string> {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const signature = await sign(payloadBytes, PRIVATE_KEY);

  const payloadBase64 = base64UrlEncode(payloadBytes);
  const signatureBase64 = base64UrlEncode(signature);

  return `${payloadBase64}.${signatureBase64}`;
}
```

### Step 3: Format as Display Key

```typescript
function formatDisplayKey(signedPayload: string, tier: string): string {
  // Encode the signed payload
  const encoded = base32Encode(signedPayload);

  // Split into parts
  const parts = [];
  for (let i = 0; i < encoded.length; i += 5) {
    parts.push(encoded.slice(i, i + 5).padEnd(5, 'X'));
  }

  // Take first 4 parts (or pad if needed)
  const keyParts = parts.slice(0, 4);

  // Calculate checksum
  const checksum = crc32(signedPayload).toString(16).toUpperCase().slice(0, 4);

  // Tier prefix
  const tierPrefix = {
    startup: 'STR',
    business: 'BUS',
    enterprise: 'ENT'
  }[tier];

  return `LMG-${tierPrefix}-${keyParts.join('-')}-${checksum}`;
}
```

### Complete Generation Function

```typescript
async function generateLicenseKey(params: LicenseParams): Promise<{
  displayKey: string;
  payload: LicensePayload;
  keyHash: string;
}> {
  // Create payload
  const payload = createPayload(params);

  // Sign
  const signedPayload = await signPayload(payload);

  // Format
  const displayKey = formatDisplayKey(signedPayload, params.tier);

  // Hash for storage
  const keyHash = sha256(displayKey);

  return {
    displayKey,
    payload,
    keyHash
  };
}
```

---

## Key Components

### Ed25519 Keys

Generate key pair:

```typescript
import { utils } from '@noble/ed25519';

// Generate once, store securely
const privateKey = utils.randomPrivateKey();
const publicKey = await getPublicKey(privateKey);

// Store in environment/secrets:
// PRIVATE_KEY (hex) - Server only, never expose
// PUBLIC_KEY (hex) - Embed in application for offline validation
```

**Key Storage:**

| Key | Location | Access |
|-----|----------|--------|
| Private | Server secrets | License generation only |
| Public | Embedded in app | Offline validation |

### Base32 Encoding

Using Crockford's Base32 (no ambiguous characters):

```typescript
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function base32Encode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bits = '';

  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, '0');
  }

  let result = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    result += CROCKFORD_ALPHABET[parseInt(chunk, 2)];
  }

  return result;
}
```

### CRC32 Checksum

```typescript
function crc32(str: string): number {
  const bytes = new TextEncoder().encode(str);
  let crc = 0xFFFFFFFF;

  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }

  return crc ^ 0xFFFFFFFF;
}
```

---

## Security Considerations

### Key Length

- Ed25519 provides 128-bit security level
- Signature is 64 bytes
- Total key length ~200 characters (display format)

### Tampering Prevention

1. **Signature verification** - Any modification invalidates signature
2. **Checksum** - Quick rejection of typos
3. **Version field** - Future-proof against format changes

### Key Secrecy

- Private key must never be exposed
- Generate keys server-side only
- Log key prefix only, never full key
- Hash for database lookup

---

## Example Output

**Input:**

```typescript
generateLicenseKey({
  tier: 'business',
  organizationId: 'org_12345',
  maxUsers: 100,
  maxActivations: 3,
  features: ['external', 'custom', 'webhooks'],
  validUntil: new Date('2026-01-01')
});
```

**Output:**

```typescript
{
  displayKey: 'LMG-BUS-K9X2M-P4N7Q-R3V8T-J6W1Y-A5C2',
  payload: {
    v: 1,
    lid: '550e8400-e29b-41d4-a716-446655440000',
    tid: 'business',
    oid: 'org_12345',
    lim: { u: 100, a: 3 },
    fea: ['ext', 'cst', 'whk'],
    iat: 1704153600,
    exp: 1735689600
  },
  keyHash: 'sha256_hash_here'
}
```

---

## See Also

- [Key Validation](./key-validation.md) - Validation algorithm
- [License API](../api/license-api.md) - API endpoints
- [License Keys Schema](../database/license-keys-schema.md) - Database
