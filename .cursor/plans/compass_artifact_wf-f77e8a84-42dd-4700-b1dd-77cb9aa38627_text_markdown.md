# Degradace Tool Calling u LLM: Konkrétní Data a Benchmarky

Výkon tool calling u velkých jazykových modelů **klesá dramaticky** s rostoucím počtem dostupných nástrojů – od **7% až po 85%** v závislosti na scénáři. Kritický práh nastává kolem **30-50 nástrojů**, kdy accuracy začíná prudce klesat. Bez optimalizačních technik dosahuje baseline accuracy při 100+ nástrojích pouhých **13,62%**. Tato data pocházejí z akademických benchmarků (Berkeley BFCL, LongFuncEval, RAG-MCP) i produkčních systémů (GitHub Copilot, Anthropic).

## Kvantifikovaný pokles výkonu podle počtu nástrojů

Studie **LongFuncEval** (arXiv:2505.10570, duben 2025) poskytuje nejpřesnější měření degradace: **7-85% pokles výkonu** s rostoucím počtem nástrojů v katalogu. Dodatečně dokumentuje **7-91% degradaci** při prodlužování odpovědí API a **13-40% degradaci** při delších multi-turn konverzacích.

Experiment **RAG-MCP** (arXiv:2505.03275, květen 2025) testoval škálování od 1 do 100+ nástrojů s těmito výsledky:

| Pozice nástroje v promptu | Úspěšnost |
|---------------------------|-----------|
| Pozice 1-30 | >90% |
| Pozice 31-70 | Intermitentní selhání |
| Pozice 100+ | Dominantní selhávání |

Baseline accuracy při zahrnutí všech nástrojů do promptu činila pouze **13,62%**. Po aplikaci RAG-based filtrování vzrostla na **43,13%** – trojnásobné zlepšení.

## Srovnání modelů na Berkeley Function Calling Leaderboard

Berkeley Function Calling Leaderboard (BFCL v4) je de facto standard pro měření function calling schopností, testující přes 100 modelů na 2000 párech otázka-funkce-odpověď.

| Pořadí | Model | Celková Accuracy | Single-Turn | Multi-Turn |
|--------|-------|------------------|-------------|------------|
| 1 | GLM-4.5 | 72,01% | – | – |
| 2 | Claude Opus 4.1 | **71,21%** | 89,02% | 58,38% |
| 4 | Claude Sonnet 4.5 | **68,68%** | 88,56% | 60,88% |
| 9 | GPT-5 | **61,6%** | – | – |

Kritický poznatek: **single-turn accuracy** dosahuje 86-89%, zatímco **multi-turn accuracy** klesá na 51-61%. Komplexnější scénáře s paralelním voláním více funkcí vykazují nejnižší výkon – pouhých **50-85%** u top modelů.

## GitHub Copilot: Produkční case study s 40+ nástroji

GitHub v listopadu 2025 publikoval detailní case study dokumentující problémy s tool calling ve VS Code Copilot. Výchozí sada činila **~40 vestavěných nástrojů**, s MCP servery rostla do **stovek**.

| Metrika | Hodnota |
|---------|---------|
| Pokles resolution rate | **2-5 procentních bodů** na SWE-Lancer benchmarku |
| Redukce latence | **400 ms** průměrně |
| Redukce TTFT | **190 ms** průměrně |
| Tool Use Coverage (embedding) | **94,5%** vs. 69% (statický seznam) |

Pozorované behaviorální problémy zahrnovaly ignorování explicitních instrukcí, nesprávné použití nástrojů a volání nepotřebných nástrojů. Řešením bylo snížení z 40 na **13 základních nástrojů** a implementace embedding-based routingu, který zvýšil úspěšnost výběru z 19% na **72%**.

## LangChain ReAct benchmark odhaluje kolaps GPT-4o

Studie LangChain (únor 2025) testovala agenty napříč doménami s dramatickými výsledky:

| Model | 1 doména | 7 domén | 14 domén |
|-------|----------|---------|----------|
| GPT-4o | 52% | **2%** | – |
| Claude 3.5 Sonnet | 53% | 43% | 38% |
| o1 | 71% | 62% | 61% |
| o3-mini | 68% | 40% | 35% |

GPT-4o **zkolaboval na 2% accuracy** při škálování na 7 domén. Claude a o1 degradovaly gracefullněji, ale stále s významným poklesem. Llama-3.3-70B **úplně selhala** i v single-domain scénáři – zapomínala volat základní nástroje.

## Anthropic data o MCP a Claude tool calling

Anthropic dokumentoval v listopadu 2025 reálnou tokenovou spotřebu MCP serverů:

| MCP Server | Počet nástrojů | Spotřeba tokenů |
|------------|----------------|-----------------|
| GitHub | 35 | ~26K tokenů |
| Slack | 11 | ~21K tokenů |
| Jira | 17 | ~17K tokenů |
| Sentry | 5 | ~3K tokenů |

Interní testování odhalilo spotřebu **134K tokenů** definicemi nástrojů před optimalizací. Tool Search Tool přinesl zásadní zlepšení:

| Model | Bez Tool Search | S Tool Search |
|-------|-----------------|---------------|
| Claude Opus 4 | 49% | **74%** (+25 p.b.) |
| Claude Opus 4.5 | 79,5% | **88,1%** (+8,6 p.b.) |

Oficiální doporučení Anthropic stanovuje **30-50 nástrojů** jako práh, za kterým accuracy významně degraduje. Tool Search Tool redukuje tokenovou spotřebu o **85%** (z ~77K na ~8,7K tokenů).

## Mechanismy způsobující degradaci

Výzkum identifikuje několik příčin poklesu výkonu. **Prompt bloat** způsobuje saturaci context window definicemi nástrojů – průměrný nástroj spotřebuje **200-400 tokenů**, komplexní nástroj s 28 parametry až **1633 tokenů**. **Decision overhead** zvyšuje pravděpodobnost chyby s každou přidanou možností. Studie Tam et al. (2024) prokázala, že JSON output constraints samy o sobě snižují accuracy o **27,3 procentních bodů**.

Kontextová délka má měřitelný dopad: **16 procentních bodů** pokles accuracy při pouhých 1000 dodatečných tokenech, až **50 procentních bodů** při překročení 8000 tokenů (Modarressi et al., 2025). Pozorována je též poziční bias – nástroje později v seznamu jsou systematicky podhodnocovány.

## Praktická doporučení a limity

Konsensus z produkčních systémů stanovuje **5-10 nástrojů** jako komfortní operační rozsah:

| Počet nástrojů | Hodnocení |
|----------------|-----------|
| 1-3 | Bezpečný a efektivní |
| 4-10 | Realizovatelný, možné zpomalení |
| 10-30 | Vyžaduje optimalizaci |
| 30-50 | Kritický práh degradace |
| 50+ | Nutný Tool Search nebo routing |
| 100+ | Baseline ~14% bez optimalizace |

OpenAI stanovuje **hard limit 128 nástrojů** pro API, ale degradace nastává mnohem dříve. Anthropic podporuje až **10 000 nástrojů** v Tool Search Tool katalogu, ale doporučuje defer loading pro zřídka používané nástroje.

## Architektonická řešení pro škálování

Produkční systémy vyvinuly několik přístupů. **Embedding-based tool routing** (GitHub, Anthropic) indexuje popisy nástrojů jako embeddingy a používá sémantické vyhledávání – dosahuje 94,5% coverage oproti 69% u statického seznamu. **Hierarchické/virtuální nástroje** seskupují podobné nástroje pod rodičovské kategorie, které agent expanduje dle potřeby.

**Programmatic tool calling** (Anthropic) nechává Claude psát Python kód pro orchestraci nástrojů – mezivýsledky nevstupují do kontextu, což přináší **37% redukci tokenů**. Multi-agent architektury delegují specifické toolsety na specializované agenty.

## Závěr

Degradace tool calling je kvantifikovatelný a dokumentovaný fenomén. Klíčová čísla pro citaci: **7-85% pokles** výkonu s rostoucím počtem nástrojů (LongFuncEval), **13,62% baseline** při 100+ nástrojích (RAG-MCP), **2% kolaps** GPT-4o při škálování domén (LangChain), **30-50 nástrojů** jako kritický práh (Anthropic). Řešení vyžadují architektonické změny – embedding-based routing, Tool Search Tool, nebo multi-agent patterns. Prosté prompt engineering nestačí pro systémy překračující desítky nástrojů.