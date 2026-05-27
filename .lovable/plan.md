## Objetivo
Deixar o repositório seguro para ser publicado como público no GitHub.

## Diagnóstico
- `.gitignore` **não inclui `.env`**.
- `.env` contém apenas valores públicos (project ID, URL e anon/publishable key) — todos seguros de expor.
- Nenhum segredo real (`SUPABASE_SERVICE_ROLE_KEY`, `APIFOOTBALL_KEY`, `LOVABLE_API_KEY`) está hardcoded; são lidos só via `Deno.env.get(...)` nas edge functions.
- RLS já foi endurecida na rodada anterior de segurança.

## Ações
1. **Adicionar `.env` ao `.gitignore`** como boa prática (mesmo que o conteúdo atual seja seguro, evita que futuras chaves sensíveis sejam commitadas por engano). Acrescentar também `.env.local`, `.env.*.local`.
2. **(Recomendado, feito por você localmente)** Auditar o histórico do git antes de publicar:
   ```
   git log --all --full-history -- .env
   git log -p --all -S 'SERVICE_ROLE_KEY'
   git log -p --all -S 'APIFOOTBALL_KEY'
   git log -p --all -S 'LOVABLE_API_KEY'
   ```
   Se aparecer apenas a anon key, pode publicar.
3. **Opcional mas recomendado**: rotacionar `APIFOOTBALL_KEY` no dashboard da API-Football após tornar público, só por precaução. O `LOVABLE_API_KEY` e `SUPABASE_SERVICE_ROLE_KEY` podem ser rotacionados por aqui se desejar (`rotate_lovable_api_key`, `rotate_api_keys`).
4. **Após publicar**, rodar mais um security scan para confirmar que nada novo apareceu.

## O que NÃO precisa ser feito
- Remover a anon key do código — ela é projetada para ser pública.
- Esconder o project ID do Supabase — também é público (aparece na URL do app publicado).

## Próximo passo
Confirme se quer que eu aplique a atualização do `.gitignore` (item 1). Os itens 2–4 são ações suas no terminal local / dashboard.
