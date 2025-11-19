# CI/CD Workflows - Správné nastavení

## Přehled workflows

### 1. `ci-cd.yml` - Continuous Integration & Docker Deployment
**Trigger**: Push nebo PR na `main` nebo `develop`

**Co dělá**:
- ✅ **Quality checks** (vždy):
  - Lint & typecheck
  - Unit & integration testy
  - Coverage check (90% threshold)
  - Build verification
  - E2E testy
  
- 🐳 **Docker publishing** (jen main branch):
  - Build & push backend image
  - Build & push frontend image
  - Tags: `latest` + `git-sha`

**NPM publishing**: ❌ **NE** - to dělá release-please!

---

### 2. `release-please.yml` - Automated Versioning & NPM Publishing
**Trigger**: Push na `main`

**Co dělá**:
1. **Monitoring commits**: Sleduje conventional commits
2. **Release PR**: Vytváří/update Release PR s:
   - Changelog
   - Version bumps
3. **NPM Publishing**: Publishuje do npm **pouze když se Release PR mergne**

---

## Workflow jak to funguje

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Developer: git push origin feature-branch                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Create PR to main                                         │
│    → ci-cd.yml runs: lint, test, build, e2e                 │
│    → Docker publish: NO (not main branch)                   │
│    → NPM publish: NO (not via release-please)               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Merge PR to main                                          │
│    → ci-cd.yml runs: all checks + Docker publish            │
│    → release-please.yml: Creates/updates Release PR         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Review Release PR (auto-generated changelog + versions)  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Merge Release PR                                          │
│    → release-please.yml: NPM publishing triggered!          │
│    → GitHub Release created with tag                        │
└─────────────────────────────────────────────────────────────┘
```

## Klíčové rozdíly oproti původnímu nastavení

### ❌ PŘED (duplicitní publishing):
- `ci-cd.yml`: Publish NPM při každém pushu do main
- `release-please.yml`: Publish NPM při release
- **Problém**: Stejné balíčky publikovány 2x!

### ✅ PO (správně):
- `ci-cd.yml`: **Jen Docker** images při pushu do main
- `release-please.yml`: **NPM publishing** pouze přes Release PR
- **Benefit**: Kontrolovaný release process s changelogy

## Conventional Commits

Pro správné fungování release-please používejte:

```bash
feat: add new feature      # Minor version bump (0.1.0 → 0.2.0)
fix: bug fix               # Patch version bump (0.1.0 → 0.1.1)
feat!: breaking change     # Major version bump (0.1.0 → 1.0.0)
docs: update README        # No version bump, jen v changelogu
chore: update deps         # No version bump
```

## GitHub Secrets potřebné

- `NPM_TOKEN` - pro npm publishing (z npmjs.com)
- `DOCKER_USERNAME` - Docker Hub username (mělo by být "dxheroes")
- `DOCKER_PASSWORD` - Docker Hub access token
- `CODECOV_TOKEN` - (optional) pro coverage reports

## Testování nastavení

1. **Test CI checks**: Vytvořte PR → měly by běžet všechny testy
2. **Test Docker**: Merge do main → měly se publikovat Docker images
3. **Test Release**: 
   - Commit s `feat:` a mergněte
   - Měl se vytvořit Release PR
   - Merge Release PR → npm publish
