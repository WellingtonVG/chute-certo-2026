## Plano: Edge Function `sync-results`

Criar `supabase/functions/sync-results/index.ts` que sincroniza resultados finalizados da Copa do Mundo 2026 com a API football-data.org.

### Estrutura
- `verify_jwt = false` (pública, sem autenticação)
- CORS habilitado
- Usa `FOOTBALL_DATA_API_KEY` e `SUPABASE_SERVICE_ROLE_KEY` do env
- Cliente Supabase com service role (bypass RLS)

### Fluxo
1. **Mapear `api_football_id`**: GET `/competitions/WC/matches?season=2026`. Para cada jogo da API, faz match no banco por nome PT→EN (via `NAME_MAP`) + janela de ±2h em `match_date`. UPDATE quando `api_football_id IS NULL`.
2. **Snapshot artilharia (antes)**: GET `/competitions/WC/scorers?season=2026&limit=100` → `Map<playerName, goals>`.
3. **Sincronizar resultados**: GET `/competitions/WC/matches?season=2026&status=FINISHED`. Para cada jogo:
   - Skip se `is_manual_override = true` ou placar já bate
   - UPDATE `home_score`, `away_score`, `is_finished = true`
   - RPC `calculate_match_points(match_id)`
   - Coleta `match_id` em lista de atualizados
4. **Snapshot artilharia (depois)** + atribuir pontos de goleador:
   - Para cada match atualizado, busca predictions com `scorer_name`
   - Se gols do jogador aumentaram entre snapshots → `scorer_points = +2`, senão `-1`
   - UPDATE em `predictions`
   - Se ≥1 acerto, insere `feed_events` (`event_type='scorer_hit'`) por bolão envolvido
5. **Feed events finais**: para cada match atualizado, chama `generate-feed-events` via `fetch` ao endpoint da edge function.

### Resposta
```json
{ "mapped": N, "updated": N, "scorers_resolved": N }
```

### Detalhes técnicos
- `NAME_MAP` PT→EN (conforme spec); usar mapa invertido para casamento
- Comparação de nomes case-insensitive + trim
- Janela de tempo: `Math.abs(dbDate - apiDate) <= 2h`
- Tratamento de erro: try/catch global, retorna 500 com mensagem
- Logs de progresso via `console.log` para debugging em `edge_function_logs`

### Arquivos
- `supabase/functions/sync-results/index.ts` (novo)
- `supabase/config.toml` (adicionar bloco `[functions.sync-results] verify_jwt = false`)
