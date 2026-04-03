
Diagnóstico

- A cor dourada/amarelada clara não vem de `outline`; ela vem do estado `:hover` aplicado às alternativas.
- A classe exata que produz esse preenchimento claro é `"[&]:hover:bg-accent/5"` em `src/components/quiz/QuizOptions.tsx:42`.
- Ela usa o token `accent`, que no tema está em `src/index.css:12` como `--accent: 40 50% 54%` — justamente o dourado do app.
- Além disso, o `Button` compartilhado também injeta hover dourado via `variant="outline"` em `src/components/ui/button.tsx:14`: `hover:bg-accent hover:text-accent-foreground`.
- Ou seja: hoje existem 2 hovers dourados. O que mais bate com o “amarelado claro” é o local `bg-accent/5`.
- Não há `focus:bg-*` nesse botão. O único estilo de foco no `Button` é `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (`src/components/ui/button.tsx:8`), que gera um halo/ring, não esse preenchimento claro.
- Isso explica por que as tentativas anteriores falharam: `-webkit-tap-highlight-color` e `outline: none` não removem `:hover`. E o `blur()` atual usa `event.target`, que pode ser um `<span>` interno, não o `<button>`.

Trecho causador no componente de alternativas

```tsx
// src/components/quiz/QuizOptions.tsx:39-46
<Button
  key={i}
  variant={variant}
  className="h-auto justify-start whitespace-normal px-4 py-3 text-left text-sm tap-highlight-none focus:outline-none focus-visible:outline-none active:outline-none [&]:focus:bg-transparent [&]:hover:bg-accent/5"
  style={{ WebkitTapHighlightColor: 'transparent' }}
  onClick={() => onSelect(option)}
  onTouchEnd={handleTouchEnd}
  disabled={showResult}
/>
```

Trecho herdado do botão base que também contribui

```tsx
// src/components/ui/button.tsx:7-15
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ...",
  {
    variants: {
      variant: {
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      },
    },
  },
);
```

Correção específica para esse trecho

- Remover `"[&]:hover:bg-accent/5"` do `QuizOptions`.
- No mesmo `className`, sobrescrever o hover e o ring herdados do `Button` para deixar a alternativa neutra no estado normal:

```tsx
className="h-auto justify-start whitespace-normal px-4 py-3 text-left text-sm tap-highlight-none focus:outline-none active:outline-none hover:bg-background hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
```

Ajuste recomendado

- Se quiser a correção mais limpa e definitiva, o ideal é não reutilizar o `outline` padrão para as alternativas neutras do quiz.
- Crie um variant próprio de botão para quiz, sem:
  - `hover:bg-accent`
  - `hover:text-accent-foreground`
  - `focus-visible:ring-ring`

Conclusão

- O destaque dourado claro que persiste no iOS está sendo causado pelo hover dourado do próprio botão, principalmente `"[&]:hover:bg-accent/5"` em `QuizOptions`.
- O `focus-visible:ring-*` pode até gerar halo, mas não é o responsável principal por esse preenchimento amarelado.
- Se você quiser, o próximo passo certo é eu te passar um patch mínimo só nesses 2 pontos, sem mexer em mais nada do app.
