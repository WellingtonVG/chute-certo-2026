

## Diagnóstico

O problema está na função `pickQuestions` (linha 352-372 de `quiz-data.ts`). O `FREQ_LIMITS` (linhas 175-187) limita cada categoria a 1-3 perguntas. Quando filtrado por nível, o total máximo possível fica abaixo do configurado:

- **Fácil**: champion(3) + host(2) + trivia_easy(2) = **7 máximo**
- **Médio**: runner_up(1) + best_player(3) + top_scorer_name(3) + trivia_medium(2) = **9 máximo**
- **Difícil**: top_scorer_goals(2) + top_scorer_country(2) + final_score(2) + trivia_hard(2) = **8 máximo**

O banco tem dezenas de perguntas por categoria (22 edições), mas o `FREQ_LIMITS` descarta a maioria delas.

## Correção proposta

**Arquivo:** `src/lib/quiz-data.ts`

1. **Substituir FREQ_LIMITS fixos por limites proporcionais ao total pedido.** Em vez de caps absolutos (1-3), usar a regra de 40% já existente como único limitador de variedade. Isso garante diversidade sem esgotar prematuramente.

2. **Adicionar fallback:** se após o primeiro passo o `selected.length < count`, fazer uma segunda passagem no pool ignorando os limites de categoria para preencher as vagas restantes (priorizando perguntas de edições ainda não usadas).

3. **Lógica concreta da `pickQuestions`:**

```
function pickQuestions(level, count):
  pool = shuffle(filterByLevel(generateAll()))
  maxPerCategory = max(2, ceil(count * 0.4))
  
  // Passo 1: selecionar respeitando limite de 40%
  selected = pick from pool where categoryCounts[cat] < maxPerCategory
  
  // Passo 2: se faltam perguntas, preencher com qualquer pergunta do pool
  if selected.length < count:
    for remaining in pool (not yet selected):
      selected.push until count reached
  
  return antiSpoiler(selected)
```

4. **Remover `FREQ_LIMITS`** — a regra de 40% por categoria já cumpre o papel de variedade. Os limites fixos são a causa direta do bug.

## Resultado esperado

- Quiz de 10 perguntas no nível fácil → 10 perguntas (4 champion, 4 host, 2 trivia)
- Quiz de 20 perguntas em qualquer nível → 20 perguntas garantidas
- Variedade mantida pela regra de 40%

## Escopo

Apenas `src/lib/quiz-data.ts` será alterado. Nenhuma outra funcionalidade do app é tocada.

