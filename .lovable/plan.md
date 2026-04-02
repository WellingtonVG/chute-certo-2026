

## Bolão Copa 2026 — Plano de Implementação

### Design
- **Paleta elegante inspirada no Brasil**: verde profundo (#0A4D2C) para header e ações principais, dourado (#C9A84C) para destaques e números, superfícies brancas/claras para conteúdo, tipografia moderna (Inter)
- **Mobile-first**, limpo e minimalista — sem bandeiras ou visuais exagerados
- Tudo em **português brasileiro**

### Autenticação (Lovable Cloud)
- Login com email/senha, Google e Apple
- Fluxo de primeiro login: tela para definir **username único** (validação em tempo real)
- Tabela `profiles` com username, avatar e link ao `auth.users`
- Tabela `user_roles` para controle de admin

### Tela Inicial
- 4 botões grandes em grid:
  - **Bolão** → lista de bolões do usuário
  - **Calendário** → tabela de jogos
  - **Quiz** → desabilitado, badge "Em breve"
  - **Admin** → visível apenas para admin (verificado via `user_roles`)

### Bolão (funcionalidade principal)
- **Estrutura DB**: tabelas `boloes`, `bolao_members`, `predictions`, `season_predictions`, `matches`
- Admin cria bolões com nome e gera **link de convite único**
- Link de convite → página pública que pede login/cadastro antes de entrar no bolão
- **Palpites por jogo**: placar (gols casa : gols fora) + jogador que marca (campo de texto), travados no kickoff
- **Palpites de temporada**: campeão + artilheiro (15 pts cada), travados após o primeiro jogo
- **Pontuação**: placar exato (5 pts), resultado + saldo correto (3 pts), só resultado (1 pt), acerto jogador (+2 pts), erro jogador (-1 pt), ×1.5 no mata-mata (arredondado pra cima)
- **Ranking**: leaderboard completo por bolão, compartilhável como imagem (WhatsApp), histórico individual de palpites

### Calendário
- Tabela de jogos com data, horário (BRT), estádio e cidade
- Dados vindos da API-Football (edge function com a chave do RapidAPI)
- Opção de compartilhar/exportar

### Painel Admin
- Atualizar resultados manualmente (override da API)
- Criar novos bolões
- Gerenciar links de convite

### Integração API-Football
- Edge function que busca dados de jogos e resultados via RapidAPI
- Armazena no Supabase como cache
- Admin pode sobrescrever resultados manualmente

