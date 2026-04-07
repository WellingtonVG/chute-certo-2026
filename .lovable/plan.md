

## Plano: Resultado bônus por jogo + recálculo automático

### Situação atual
- `MatchResultEditor` (aba Resultados) já mostra toggle Sim/Não para jogos com `bonus_question` — isso já funciona visualmente
- Seção "Definir resultado bônus por rodada" existe na aba Jogos (linhas 603-636) — precisa ser removida
- **Problema crítico**: quando o admin salva o resultado, os `bonus_points` dos palpites dos usuários NÃO são recalculados automaticamente. A RLS de `predictions` só permite UPDATE por `auth.uid() = user_id`, então o admin não consegue atualizar pontos de outros usuários diretamente

### Impacto na pontuação
- O ranking em `BolaoDetail.tsx` (linha 56) já soma `bonus_points` ao total
- Basta garantir que `bonus_points` seja preenchido corretamente em cada prediction quando o admin salva o resultado do jogo
- Regra: `bonus_answer === bonus_result` → +2 pts; `bonus_answer !== bonus_result` → -1 pt; sem resposta → 0

### Mudanças

**1. Migração SQL** — Criar função `calculate_bonus_points`
- Função `SECURITY DEFINER` que recebe `match_id` e `bonus_result`
- Atualiza todas as predictions daquele match: se `bonus_answer IS NOT NULL`, calcula +2 ou -1 conforme acerto
- Só admins podem chamar (check `has_role`)

**2. `src/pages/Admin.tsx`**
- Em `updateMatchResult`: após salvar o resultado do jogo, se `bonusResult` não for null, chamar `supabase.rpc('calculate_bonus_points', { match_id_input, bonus_result_input })`
- Remover seção "Definir resultado bônus por rodada" (linhas 603-636) e estados associados (`bonusResultRound`, `bonusResultAnswer`, `savingBonusResult`, `saveRoundBonusResult`)
- Manter seção "Definir pergunta por rodada" intacta

**3. Nenhuma mudança em `BolaoDetail.tsx`** — ranking já soma bonus_points

### Função SQL

```sql
CREATE OR REPLACE FUNCTION public.calculate_bonus_points(match_id_input uuid, bonus_result_input boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.predictions
  SET bonus_points = CASE
    WHEN bonus_answer IS NULL THEN 0
    WHEN bonus_answer = bonus_result_input THEN 2
    ELSE -1
  END
  WHERE match_id = match_id_input AND bonus_answer IS NOT NULL;
END;
$$;
```

### Resumo
- 1 migração (função SQL)
- 1 arquivo editado (Admin.tsx)
- Pergunta bônus continua definida por rodada
- Resultado bônus agora é por jogo (já estava no UI, falta só o recálculo)
- Pontuação recalculada automaticamente ao salvar resultado

