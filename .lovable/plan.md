
Diagnóstico provável

- O callback do Google em si não parece ser o principal problema. No código, o login usa `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`, então o retorno vai para a raiz do app.
- A causa mais forte da tela branca está no pós-login: há um loop de redirecionamento em `ProtectedRoute`.
- Hoje, qualquer usuário com username padrão `user_xxxx` é mandado para `/set-username`. Isso é exatamente o caso do primeiro login com Google, porque o trigger `handle_new_user()` cria o profile com username automático.
- Só que a própria rota `/set-username` também está envolvida pelo mesmo `ProtectedRoute`. Resultado: ao entrar em `/set-username`, o guard redireciona para `/set-username` de novo. Isso pode virar tela branca/loop silencioso.
- Há um segundo problema de robustez: o `AuthContext` tenta restaurar sessão + buscar profile ao mesmo tempo. Se o profile do primeiro login OAuth ainda não estiver disponível naquele instante, o app fica com sessão autenticada mas estado de profile inconsistente, sem retry nem fallback visível.

Plano de correção definitiva

1. Ajustar o guard de rota em `src/App.tsx`
- Separar “usuário autenticado” de “usuário precisa definir username”.
- Permitir acesso à rota `/set-username` quando o usuário já estiver logado.
- Aplicar o redirect para `/set-username` apenas nas outras rotas protegidas.
- Preservar a rota de origem (`from`) para o usuário voltar ao destino certo depois.

2. Fortalecer o bootstrap de autenticação em `src/contexts/AuthContext.tsx`
- Refatorar para que a app espere a sessão ficar pronta antes de decidir navegação.
- Tirar o fluxo assíncrono pesado de dentro de `onAuthStateChange`.
- Centralizar em uma função `loadUserState(session)` com `try/finally`.
- Garantir que `isLoading` sempre termine.
- Adicionar retry curto para buscar `profiles` no primeiro login Google, porque o profile pode demorar alguns instantes para existir.

3. Corrigir o fluxo de definição de username em `src/pages/SetUsername.tsx`
- Depois de salvar o username, voltar para a rota original (`state.from` ou `invite_redirect`) em vez de sempre ir para `/`.
- Isso evita quebrar o fluxo de convite/link compartilhado.

4. Revisão pequena em `src/pages/Auth.tsx`
- Manter o redirect de usuário autenticado.
- Confirmar que o destino pós-login continue consistente quando houver redirect salvo.

Resultado esperado

- Novo usuário do Google entra sem tela branca.
- Se cair em onboarding de username, a página abre normalmente.
- Depois de definir username, volta para o lugar correto do app.
- Se o profile demorar a ser criado, o app aguarda corretamente em vez de entrar em estado quebrado.

Arquivos a ajustar

- `src/App.tsx`
- `src/contexts/AuthContext.tsx`
- `src/pages/SetUsername.tsx`
- ajuste pequeno em `src/pages/Auth.tsx`

Detalhe técnico

```text
Fluxo atual:
Google login -> session ok -> profile criado com username "user_xxxx"
-> rota protegida manda para /set-username
-> /set-username também passa pelo mesmo ProtectedRoute
-> redirect para /set-username de novo
-> loop / tela branca

Fluxo corrigido:
Google login -> sessão pronta
-> profile carregado (com retry curto se necessário)
-> se username padrão e rota != /set-username, redireciona para /set-username
-> se já estiver em /set-username, libera a tela
-> após salvar username, retorna ao destino original
```
