

## Plano: Corrigir join multiplayer e redesenhar convite

### Problema
Race condition no auto-join via URL `/quiz/sala/:code` — auth não carregado no mount causa erro "Sala não encontrada".

### Mudanças

**1. `src/App.tsx`** — Remover a rota `/quiz/sala/:code`

**2. `src/pages/Quiz.tsx`** — Remover `useParams`, `initialCode`, referência a `code`. Estado inicial sempre `"menu"`. Remover prop `initialCode` do `QuizMultiplayerLobby`.

**3. `src/components/quiz/QuizMultiplayerLobby.tsx`**
- Remover prop `initialCode` da interface e do componente
- Remover `useEffect` de auto-join
- Remover `extractCodeFromInput` e `getInviteLink`
- Remover import de `LinkIcon`
- Substituir card de link de convite por:

```text
┌─────────────────────────────────────────┐
│  🏆 Te convido para um duelo no Quiz    │
│  Copa 2026! Entre com o código abaixo   │
│  em chute-certo-2026.lovable.app/quiz   │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │         A1B2C3D4                │    │
│  │   (text-3xl font-bold mono     │    │
│  │    bg-primary/10 border-primary)│    │
│  └─────────────────────────────────┘    │
│                                         │
│  [ 📋 Copiar convite ]                  │
└─────────────────────────────────────────┘
```

- `copyInvite` copia: `"🏆 Te convido para um duelo no Quiz Copa 2026! Entre com o código abaixo em chute-certo-2026.lovable.app/quiz\n\nCódigo: A1B2C3D4"`
- Input de "Entrar em Sala" aceita apenas código plain, sem parsing de URL
- Estado `mode` sempre começa em `"create"` (sem `initialCode`)

### Escopo
3 arquivos. Nenhuma outra funcionalidade alterada. Bug do ranking já corrigido anteriormente.

