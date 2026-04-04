

## Diagnóstico

### 1. Como o sistema detecta que todos terminaram?
Na linha 56 de `QuizMultiplayerGame.tsx`: `setAllDone(data.every((p) => p.finished))`. Verifica o campo `finished` de todos os participantes via query ao banco.

### 2. Resultado exibido quando o primeiro ou todos terminam?
**Quando o primeiro termina.** Linhas 30-31: `handleFinish` seta `finished=true` e `result` imediatamente. Linha 72: `if (finished && result)` renderiza `QuizResult` com o ranking. O banner "Aguardando outros jogadores..." aparece (linha 75-79), mas o ranking já está visível com os outros jogadores mostrando score 0 — porque eles ainda não atualizaram o banco.

### 3. Como o estado é armazenado?
Cada jogador atualiza `quiz_participants` com `score`, `total`, `finished=true` e `time_taken` somente ao terminar todas as perguntas (linha 34-40). Realtime subscription (linha 62-67) escuta updates e re-fetcha o ranking.

### 4. O problema
O ranking é renderizado imediatamente quando o jogador local termina, mostrando os outros com score 0. A UX correta seria: mostrar apenas uma tela de espera até `allDone=true`, e só então revelar o ranking completo.

---

## Plano de Correção

### Arquivo: `src/components/quiz/QuizMultiplayerGame.tsx`

Alterar o bloco de renderização pós-finish (linhas 72-87):

- **Quando `finished && !allDone`**: mostrar apenas o resultado pessoal do jogador (score, %, tempo) com o spinner "Aguardando outros jogadores...", **sem o ranking**.
- **Quando `finished && allDone`**: mostrar o `QuizResult` completo com o ranking final.

Concretamente:
```
if (finished && result) {
  if (!allDone) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2 rounded-lg bg-accent/10 p-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Aguardando outros jogadores...
        </div>
        <QuizResult result={result} onPlayAgain={() => {}} />
        {/* Sem rankings prop — não mostra ranking parcial */}
      </div>
    );
  }
  return (
    <QuizResult
      result={result}
      onPlayAgain={() => onFinish(result)}
      rankings={rankings}
    />
  );
}
```

- Enquanto espera: mostra o resultado pessoal sem ranking e sem botão funcional de "Jogar Novamente"
- Quando todos terminam: mostra resultado completo com ranking e botão ativo

### Escopo
Apenas `src/components/quiz/QuizMultiplayerGame.tsx`. Nenhuma outra funcionalidade alterada.

