

## Plano: Corrigir tela branca após login com Google

### Causa raiz
Dois problemas combinados:
1. **Auth.tsx não redireciona usuários já logados** — falta um `if (user) return <Navigate to="/" />` no componente Auth
2. **Falha silenciosa no fetchProfile** — se o trigger `handle_new_user` não criou o profile (ou demorou), `fetchProfile` retorna `null` e o `isLoading` pode não resolver corretamente, ou `ProtectedRoute` fica em loop de redirect para `/set-username`

### Mudanças

**1. `src/pages/Auth.tsx`**
- Adicionar import do `useAuth`
- No início do componente, verificar se já existe user autenticado: `if (user) return <Navigate to="/" replace />`
- Isso garante que após o callback do Google, se o user já está logado, ele é redirecionado automaticamente

**2. `src/contexts/AuthContext.tsx`**
- Em `fetchProfile`, adicionar tratamento para caso o profile não exista ainda (retry ou fallback)
- Garantir que `isLoading` sempre resolve para `false`, mesmo se `fetchProfile` ou `fetchIsAdmin` falharem (adicionar try/catch)

### Resultado
- Usuário Google é redirecionado para `/` após autenticação
- Sem tela branca mesmo se profile demorar para ser criado
- Nenhuma funcionalidade existente alterada

