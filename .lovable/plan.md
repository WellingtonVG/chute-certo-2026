

## Diagnóstico do Bug #1 — Quiz cancelado para outros jogadores

Analisei todo o fluxo multiplayer (`Quiz.tsx` → `QuizMultiplayerLobby.tsx` → `QuizMultiplayerGame.tsx` → `QuizGame.tsx`).

**Achado principal:** O `QuizGame.handleSelect` (linha 155-179) NÃO escreve no banco de dados por pergunta — apenas atualiza estado local. O único write ao DB acontece no `doFinish` (quando todas as perguntas acabam). Portanto, responder uma pergunta individual **não deveria** afetar outros jogadores via realtime.

**Causa mais provável:** Race condition no lobby. Quando o criador clama `startGame()`:
1. Atualiza room status → `"playing"` no DB
2. Chama `onStart(roomId, questions)` diretamente (linha 158 do lobby)
3. O realtime subscription do lobby **também** dispara `onStart(roomId, questions)` para **todos** (incluindo o criador), via payload na linha 126-129

Isso causa `handleMpStart` ser chamada múltiplas vezes, criando novas referências de array `mpQuestions` que causam **remount do `QuizMultiplayerGame`**, que por sua vez remonta o `QuizGame`, resetando todo o progresso.

Adicionalmente, o `onStart` callback passado ao lobby é recriado a cada render (não é memoizado), o que pode causar re-subscribes intermitentes ao canal realtime.

---

## Plano de Correção

### 1. Bug do quiz cancelado (3 arquivos)

**`Quiz.tsx`:**
- Memoizar `handleMpStart` com `useCallback` para estabilizar a referência
- Adicionar guard: se `screen === "mp-game"`, ignorar chamadas subsequentes a `handleMpStart`

**`QuizMultiplayerLobby.tsx`:**
- Adicionar flag `hasStarted` ref para garantir que `onStart` só é chamado uma vez por sessão
- No `startGame` do criador: remover a chamada direta `onStart()` — deixar APENAS o realtime trigger fazer a transição (assim todos transitam pelo mesmo caminho)

**`QuizMultiplayerGame.tsx`:**
- Nenhuma mudança necessária — o componente já está correto

### 2. Link de convite em vez de código numérico (3 arquivos)

**`QuizMultiplayerLobby.tsx`:**
- Ao criar sala, gerar URL: `{origin}/quiz/sala/{roomCode}`
- Botão "Copiar" copia o link completo em vez do código
- Manter campo de input para colar código/link manualmente (para compatibilidade)

**`App.tsx`:**
- Adicionar rota `/quiz/sala/:code` que renderiza `Quiz` com parâmetro de sala

**`Quiz.tsx`:**
- Ler parâmetro `code` da URL via `useParams`
- Se presente, pular menu e lobby → entrar direto na sala (join automático)
- Criar novo componente ou lógica inline `QuizJoinByLink` que: busca a sala pelo código, insere o jogador como participante, e mostra o lobby de espera

### Escopo
- `src/pages/Quiz.tsx`
- `src/components/quiz/QuizMultiplayerLobby.tsx`
- `src/App.tsx`
- Nenhuma outra funcionalidade alterada

