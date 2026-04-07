

## Plano: Pergunta bônus por rodada (Brasileirão)

### Abordagem
Usar as colunas existentes `bonus_question`/`bonus_result` em `matches`. Sem nova tabela, sem migração.

### Mudanças

**1. `src/pages/Admin.tsx`** — Aba Jogos

- Adicionar seção "Pergunta bônus por rodada" acima ou abaixo da lista de jogos
- UI: Select de rodada (lista dinâmica das `round_name` distintas dos matches existentes) + dropdown de pergunta bônus (mesmas opções atuais + "Nenhuma")
- Botão "Salvar pergunta da rodada"
- Ao salvar: `UPDATE matches SET bonus_question = X WHERE round_name = Y` (ou `null` se "Nenhuma")
- Para resultado: Select de rodada + toggle Sim/Não + botão salvar → `UPDATE matches SET bonus_result = Z WHERE round_name = Y`
- Remover o dropdown de `bonus_question` individual do formulário de criação de jogo (campo por jogo)

**2. `src/pages/BolaoDetail.tsx`** — Card de palpite

- Nenhuma mudança necessária na exibição — a pergunta já é lida de `match.bonus_question` e exibida no card. Como todos os jogos da rodada terão a mesma pergunta, o comportamento visual já está correto.

**3. Nenhuma migração de banco** — colunas já existem.

### Resultado
- Admin define pergunta bônus por rodada inteira em vez de jogo a jogo
- Usuário vê a mesma pergunta em todos os jogos da rodada
- Pontuação (+2/-1) continua funcionando igual

