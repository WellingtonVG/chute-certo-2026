# ⚽ Chute Certo 2026

Bolão da Copa do Mundo 2026 — construído do zero por alguém que não é programador, usando IA como parceiro de desenvolvimento.

> Esse projeto nasceu de uma ideia simples: queria um bolão pra jogar com os amigos durante a Copa. Em vez de usar um app pronto, resolvi construir. Foi um projetinho de fim de semana que virou um sistema completo.

---

## O que é

Aplicação web mobile-first para bolões da Copa do Mundo 2026 (e do Brasileirão). Os participantes entram por link de convite, fazem seus palpites antes de cada jogo, acompanham o ranking em tempo real e disputam também no quiz de Copa do Mundo.

---

## Funcionalidades

**Bolão**
- Palpites por jogo com lockout automático no horário do kickoff
- Palpites especiais: campeão (30 pts), artilheiro (20 pts) e melhor jogador (25 pts)
- Ranking em tempo real com recálculo automático ao lançar resultados
- Feed de atividades do bolão
- Convites por link com expiração de 7 dias
- Suporte a múltiplos bolões por usuário

**Sistema de pontuação**
- Placar exato → 5 pts
- Resultado + saldo de gols correto → 3 pts
- Empate previsto corretamente → 2 pts
- Só o resultado (vitória/derrota) → 1 pt
- Artilheiro do jogo: acerto +2 pts / erro −1 pt
- Multiplicador ×1,5 em jogos de mata-mata
- Pergunta bônus por jogo: acerto +2 pts / erro −1 pt

**Quiz Copa do Mundo**
- Banco com perguntas cobrindo todas as 22 edições (1930–2022)
- Modos: Solo, Modo Tempo (1 minuto) e Multiplayer (desafio entre amigos)
- Três níveis de dificuldade

**Calendário**
- 104 jogos oficiais com horários em BRT
- Agrupados por fase, expansão automática da fase mais próxima

**Brasileirão**
- Suporte a bolões por rodada com pergunta bônus definida pelo admin

---

## Stack

| Camada | Tecnologia |
|---|---|
| Desenvolvimento | [Lovable](https://lovable.dev) |
| IA | Claude (Anthropic) |
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui + Radix UI |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Edge Functions) |
| Edge Functions | Deno |

Não sou desenvolvedor — usei Claude como parceiro de desenvolvimento e Lovable como plataforma de vibe-coding. O diferencial não foi conhecer a stack, foi saber o que queria construir e como direcionar a IA para chegar lá.

---

## Decisões de produto e técnicas

**Roles em tabela separada com SECURITY DEFINER**
Roles nunca ficam no perfil do usuário — ficam em `user_roles`, acessada via função `has_role()` com `SECURITY DEFINER` e `search_path` fixo. Evita escalada de privilégio e recursão infinita nas RLS policies.

**Agrupamento de jogos por fase**
O campo `round_name` da API veio vazio, então os jogos são agrupados por `stage` com labels em PT-BR. Por padrão só expande a fase mais próxima da data atual.

**Convites com expiração**
`invite_code` rotativo a cada 7 dias por bolão. Admin pode regerar via RPC `regenerate_invite_code` a qualquer momento.

**Palpites imutáveis por design**
Não existe política DELETE em `predictions` — uma vez salvo, o palpite não pode ser apagado. Decisão intencional para manter a integridade da competição.

**UX de navegação**
Se o usuário tem só um bolão, a aba "Bolão" leva direto pra tela do bolão (sem passar pela lista). Se tem mais de um, mostra a lista normalmente.

**RLS e Realtime**
Realtime via `postgres_changes` — aproveita as RLS das tabelas-fonte sem precisar de políticas extras em `realtime.messages`.

---

## Estrutura do projeto

```
src/
├── pages/          # Telas roteadas (Feed, Auth, BolaoDetail, Quiz, Admin...)
├── components/     # Componentes compartilhados + subpasta quiz/
├── contexts/       # AuthContext (sessão, perfil, role)
├── hooks/          # use-mobile, use-toast
└── lib/            # Utilitários (pontuação, agrupamento de fases, quiz-data)

supabase/
├── migrations/     # Histórico cronológico de schema, policies e funções
└── functions/      # Edge Functions Deno (sync-fixtures, generate-feed-events)
```

---

## Rodando localmente

```bash
# 1. Instalar dependências
bun install

# 2. Criar .env na raiz
VITE_SUPABASE_PROJECT_ID="seu-project-id"
VITE_SUPABASE_URL="https://seu-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sua-anon-key"

# 3. Aplicar migrations no seu Supabase (opcional)
supabase db push

# 4. Rodar
bun run dev
```

> As três variáveis acima são públicas por design (anon key do Supabase). A segurança real é garantida pelas RLS policies no banco.

Secrets de Edge Functions (`SUPABASE_SERVICE_ROLE_KEY`, `APIFOOTBALL_KEY`) são configurados no painel do Lovable Cloud — nunca no `.env` do frontend.

---

## Aprendizados

Esse projeto me ensinou mais sobre desenvolvimento de produto do que qualquer tutorial. Alguns pontos que ficaram:

- **RLS tem efeitos colaterais sutis**: revogar `EXECUTE` de uma função helper quebra silenciosamente todas as policies que dependem dela — aprendi isso da forma difícil.
- **Hardcodar pode ser a decisão certa**: os 104 jogos da Copa foram inseridos via SQL direto, não via API em tempo real. Mais simples, mais confiável, zero dependência externa na fase de grupos.
- **IA como parceiro, não como gerador de código**: o valor não está em gerar código, está em manter contexto, tomar decisões de produto e depurar problemas que surgem na integração entre partes.

---

## Contato

Se quiser entender melhor como foi feito, tentar algo parecido ou só conversar sobre o tema — me manda mensagem.

[LinkedIn](https://www.linkedin.com/in/tiagomottanovaeslopes/)
