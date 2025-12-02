<!-- d9f47152-004c-4dbf-b3b4-81b6f086f076 3bcae54e-b68d-4e28-92ee-954652a92e17 -->
# XML Prompt - Kontext problému MCP nástrojů

## Cíl

Vytvořit XML soubor s **plným kontextem o problému** MCP nástrojů a podklady, aby AI mělo co nejvíce informací pro generování obsahu (LinkedIn post, článek, prezentace, dokumentace, atd.).

## Parametry výstupního souboru

- **Jazyk**: Čeština
- **Persóna autora**: Generická (power user)
- **Účel použití**: Pro jakýkoliv obsah (články, prezentace, dokumentace, social media)
- **Zmínka o řešení**: Naznačit že řešení existuje, ale nepropagovat

---

## Uživatelské vstupy (1:1 verbatim)

### Vstup 1 - Úvodní zadání

> Vyhledej mi všechny důležité informace pro to, abys vytvořil prompt v XML pro AI k vygenerování příspěvku na LinkedIn o problému, který tahle aplikace řeší bez toho, aniž bys aplikaci promoval. Do souboru. Buď pečlivý.

### Vstup 2 - Hlavní problém MCP

> Má to být post o tom, že dnešní MCP jsou problém, protože jsou omezené a je potřeba je sdružovat do profilů, aby je uživatel mohl využívat efektivně. MCP tool calling je nekvalitní čím více MCP nástrojů je k dispozici. Dokonce Cursor IDE umožňuje max 80 tools, takže když to překročím, tak se ty ostatní prostě ignorují a nepoužijí se. Zároveň pokud power user používá nebo testuje několi AI nástrojů jako třeba já - Antigravity IDE, Cursor IDE, Github Copilot, Claude Code, Claude Desktop, Gemini CLI, Cursor CLI, Codex CLI, Windsurf IDE, Kiro, tak je pak hrozně složité v každém nástroji upravovat ty MCP servery tak, abych používal zrovna to co potřebuju pro daný úkol. Tím pádem synchronizovat všechny MCP je nepořádek (mess). Local MCP Gateway umožňuje přidat do každého nástroje pouze jeden MCP server, který se konfiguruje v UI, takže pak na jenom místě změním nastavení a mám ve všech jen to, co potřebuji k dokončení daného úkoli (use-case).

### Vstup 3 - Observabilita a audit

> Ještě přidej informaci do plánu, že jako AI výzkumník/expert potřebuji vědět, jak se dané nástroje volají, jak často a co vracejí a tohle všechno je logované tak, abych měl auditní stopu a mohl se díky Local MCP Gateway na to podívat.

### Vstup 4 - Customizace popisů a halucinace

> Ještě tam přidej další výhodu. MCP tools mají vždy nějaký popis, který udává jak daný tool funguje, jenže uživatel ho může chtít využít specifickým způsobem a v určitou situaci. A tohle přesně AI LLM potřebuje vědět, aby ho mohl ve správnou chvíli správně zavolat. Proto je taky důležité v Local MCP Gateway umožnit vlastní override těchto descriptions pro uživatele tak, aby fungoval pro jeho případ použití. Jinak by se mohlo stát, že se ty nástroje vůbec nezavolají a to potichu způsobí AI halucinace.

### Vstup 5 - RBAC a enterprise bezpečnost

> Přidej ještě do plánu, že to také umožní RBAC pro uživatele tak, aby přistupovali do systémů pod svou rolí. To umožní enterprise firmám využívat MCP bezpečně.

### Vstup 6 - Custom MCP servery pro API bez MCP

> Taky ještě přidej tu kombinaci s tím, že lze připojit existující MCP servery, auditovat je, ale také vytvářet MCP servery pro služby, které mají API, ale nemají MCP. To otevře dveře na další služby a nemusí uživatelé čekat, až daný produkt MCP vytvoří a budou ho moci používat, protože prostě jen použijí API a wrapnoout ho do MCP serveru pro možnost použití AI.

### Vstup 7 - Profilování podle use-cases

> Ještě přidej proč Local MCP Gateway je vhodná - protože umožňuje sdružovat pro konkrétní use-cases MCP tooly tak, aby se použily jen ty, které jsou vhodné pro aktuální problém, který řeším. Tzn. můžu snadno přepnout profil a tím získat svou plnou sadu nástrojů pro vyřešení aktuálního úkolu. To může být různé - vývoj nebo třeba marketing pro SEO, marekting psaní a rešeřže, může to být sales a výzkum. Pro každý use-case je jeden profil, který má v UI konfigurované a nastavení MCP servery, takže nemusím konfigurovat všechny jednotlivě.

---

## Tvrdá data a benchmarky (z výzkumu)

### Kvantifikovaný pokles výkonu

- **7-85% pokles výkonu** s rostoucím počtem nástrojů (LongFuncEval, arXiv:2505.10570, duben 2025)
- **7-91% degradace** při prodlužování odpovědí API
- **13-40% degradace** při delších multi-turn konverzacích

### RAG-MCP experiment (arXiv:2505.03275, květen 2025)

| Pozice nástroje v promptu | Úspěšnost |
|---------------------------|-----------|
| Pozice 1-30 | >90% |
| Pozice 31-70 | Intermitentní selhání |
| Pozice 100+ | Dominantní selhávání |

- **Baseline accuracy při 100+ nástrojích: pouze 13,62%**
- Po RAG filtrování: 43,13% (trojnásobné zlepšení)

### Berkeley Function Calling Leaderboard (BFCL v4)

| Model | Single-Turn | Multi-Turn |
|-------|-------------|------------|
| Claude Opus 4.1 | 89,02% | 58,38% |
| Claude Sonnet 4.5 | 88,56% | 60,88% |

- **Single-turn: 86-89%** vs **Multi-turn: 51-61%**
- Paralelní volání více funkcí: pouhých **50-85%** u top modelů

### GitHub Copilot case study (listopad 2025)

- Výchozí sada: ~40 vestavěných nástrojů
- S MCP servery: stovky nástrojů
- **Pokles resolution rate: 2-5 procentních bodů**
- Řešení: snížení z 40 na **13 základních nástrojů**
- Embedding-based routing zvýšil úspěšnost z 19% na **72%**

### LangChain ReAct benchmark (únor 2025)

| Model | 1 doména | 7 domén | 14 domén |
|-------|----------|---------|----------|
| GPT-4o | 52% | **2%** | – |
| Claude 3.5 Sonnet | 53% | 43% | 38% |
| o1 | 71% | 62% | 61% |

- **GPT-4o zkolaboval na 2% accuracy** při škálování na 7 domén
- Llama-3.3-70B **úplně selhala** i v single-domain scénáři

### Anthropic data o tokenové spotřebě MCP

| MCP Server | Počet nástrojů | Spotřeba tokenů |
|------------|----------------|-----------------|
| GitHub | 35 | ~26K tokenů |
| Slack | 11 | ~21K tokenů |
| Jira | 17 | ~17K tokenů |
| Sentry | 5 | ~3K tokenů |

- Interní test: **134K tokenů** definicemi nástrojů před optimalizací
- Tool Search Tool: **85% redukce tokenů** (z ~77K na ~8,7K)
- Anthropic doporučení: **30-50 nástrojů jako kritický práh**

### Prompt bloat a token spotřeba

- Průměrný nástroj: **200-400 tokenů**
- Komplexní nástroj (28 parametrů): až **1633 tokenů**
- JSON output constraints: snížení accuracy o **27,3 procentních bodů** (Tam et al., 2024)
- **16 p.b. pokles** accuracy při 1000 dodatečných tokenech
- **50 p.b. pokles** při překročení 8000 tokenů

### Praktické limity

| Počet nástrojů | Hodnocení |
|----------------|-----------|
| 1-3 | Bezpečný a efektivní |
| 4-10 | Realizovatelný, možné zpomalení |
| 10-30 | Vyžaduje optimalizaci |
| 30-50 | Kritický práh degradace |
| 50+ | Nutný Tool Search nebo routing |
| 100+ | Baseline ~14% bez optimalizace |

- **OpenAI hard limit: 128 nástrojů**
- **Cursor IDE hard limit: 80 nástrojů** (po překročení se ignorují)

---

## Strukturovaný přehled problémů

### 1. Degradace kvality MCP tool callingu

- Čím více MCP nástrojů je k dispozici, tím horší je kvalita tool callingu
- AI modely mají problém efektivně vybírat správný nástroj z velkého množství
- **Dokumentováno: 7-85% pokles výkonu**

### 2. Technické limity AI nástrojů

- **Cursor IDE má limit 80 tools** - po překročení se ostatní nástroje ignorují a nepoužijí
- OpenAI API: hard limit 128 nástrojů
- Kritický práh degradace: 30-50 nástrojů
- Toto je tvrdý limit, který nutí uživatele redukovat počet nástrojů

### 3. Fragmentace napříč AI nástroji

Power uživatelé testující/používající více AI nástrojů:

- Antigravity IDE
- Cursor IDE
- GitHub Copilot
- Claude Code
- Claude Desktop
- Gemini CLI
- Cursor CLI
- Codex CLI
- Windsurf IDE
- Kiro

### 4. Synchronizační chaos

- V každém nástroji je nutné samostatně upravovat MCP servery
- Přepínání mezi use-cases vyžaduje ruční rekonfiguraci v každém nástroji
- Žádná centrální správa = chaos a ztráta času

### 5. Potřeba profilů podle use-cases

- MCP nástroje je potřeba sdružovat do profilů pro efektivní využití
- Profil pro konkrétní úkol = pouze relevantní nástroje = lepší kvalita AI odpovědí
- **GitHub řešení: snížení z 40 na 13 nástrojů zvýšilo úspěšnost**

### 6. Chybějící observabilita a audit trail

- Jak se nástroje volají - jaké parametry AI posílá
- Jak často se volají - frekvence použití
- Co vracejí - odpovědi a výsledky
- Auditní stopa - kompletní log pro analýzu a debugging

### 7. Generické popisy nástrojů a tiché halucinace

- MCP tools mají výchozí popisy
- Uživatel může chtít nástroj využít specifickým způsobem
- Bez možnosti override descriptions se nástroje nemusí zavolat
- To potichu způsobí AI halucinace
- **Poziční bias: nástroje později v seznamu jsou systematicky podhodnocovány**

### 8. Chybějící RBAC pro enterprise

- Enterprise firmy potřebují bezpečný přístup k MCP nástrojům
- Uživatelé by měli přistupovat do systémů pod svou rolí
- Bez RBAC nelze MCP bezpečně nasadit ve firemním prostředí

### 9. Služby s API, ale bez MCP

- Mnoho služeb má API, ale nemá MCP server
- Uživatelé musí čekat, až produkt vytvoří oficiální MCP
- Potřeba wrappovat API do vlastních MCP serverů pro okamžité použití s AI
- Kombinace: připojit existující MCP + vytvářet vlastní MCP pro API bez MCP podpory

---

## Informace z dokumentace aplikace

### Z what-is-local-mcp.md

**Problém:**

1. Fragmented Tools - nástroje roztroušené všude (CLI, API, OAuth)
2. Context Switching - manuální vkládání API klíčů do AI chatů
3. Connection Issues - HTTPS vs HTTP nekompatibilita
4. "One Size Fits All" - nelze přepínat kontexty

**Koncept řešení (bez propagace):**

1. Unified Interface - jeden MCP endpoint agregující více serverů
2. Profile Management - profily pro různé kontexty
3. Auth Handling - OAuth flows, bezpečné ukládání API klíčů
4. HTTPS Tunnels, Debug Logging
5. Custom MCP servery - TypeScript moduly pro vlastní implementace

### Z core-concepts.md

- MCP Protocol = "USB port pro AI"
- Profily = logické seskupení MCP serverů
- Proxy = routing, agregace, security
- TOON formát = 30-50% úspora tokenů

### Z security-model.md

- OAuth 2.1 pro připojení k third-party službám
- API klíče šifrované v databázi
- Input validace pomocí Zod schémat
- Rate limiting
---

## Příklady use-case profilů

Profilování umožňuje sdružovat MCP nástroje pro konkrétní úkoly:

| Profil | Use-case | Typické MCP nástroje |
|--------|----------|---------------------|
| **Development** | Vývoj softwaru | GitHub, Jira, Sentry, DB tools |
| **Marketing SEO** | SEO optimalizace | Google Analytics, Search Console, Ahrefs |
| **Marketing Writing** | Psaní a rešerše | Content tools, Research APIs |
| **Sales** | Prodej a výzkum | CRM, LinkedIn, Email tools |
| **Research** | Výzkum a analýza | Academic APIs, Data tools |

**Princip**: Jeden profil = jeden use-case = pouze relevantní nástroje

- Snadné přepnutí profilu = plná sada nástrojů pro aktuální úkol
- Konfigurace v UI na jednom místě
- Není potřeba konfigurovat každý AI nástroj jednotlivě

---

## Klíčová čísla pro citaci

- **7-85%** pokles výkonu s rostoucím počtem nástrojů (LongFuncEval)
- **13,62%** baseline accuracy při 100+ nástrojích (RAG-MCP)
- **2%** kolaps GPT-4o při škálování domén (LangChain)
- **30-50 nástrojů** jako kritický práh (Anthropic)
- **80 nástrojů** hard limit Cursor IDE
- **128 nástrojů** hard limit OpenAI API
- **85%** redukce tokenů pomocí Tool Search Tool
- **19% → 72%** zlepšení embedding-based routingem (GitHub)
- **40 → 13 nástrojů** = úspěšné řešení GitHub Copilot

---

## Zdroje

- LongFuncEval (arXiv:2505.10570, duben 2025)
- RAG-MCP (arXiv:2505.03275, květen 2025)
- Berkeley Function Calling Leaderboard (BFCL v4)
- GitHub Copilot Case Study (listopad 2025)
- LangChain ReAct Benchmark (únor 2025)
- Anthropic MCP Documentation (listopad 2025)
- Tam et al. (2024) - JSON output constraints study
- Modarressi et al. (2025) - Context length impact study

---

## Cílová skupina

- Vývojáři pracující s AI asistenty
- Power uživatelé testující více AI nástrojů
- AI výzkumníci a experti
- Tech leads a architekti
- Enterprise firmy vyžadující bezpečnost a RBAC
- Marketing, Sales, Research týmy využívající AI

## Výstupní soubor

`docs/prompts/mcp-problem-context.xml`

### To-dos

- [ ] Vytvořit složku docs/prompts pokud neexistuje
- [ ] Napsat XML soubor s plným kontextem včetně use-case profilů