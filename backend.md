# Backend — do `lib/data.ts` em memória ao Postgres de verdade

Saída da etapa `/replica-backend`, a partir do que `architecture.md` e `schema.sql` já
tinham desenhado. Fecha o maior risco apontado em `build-log.md`: o painel do lojista
(`/admin/pedidos`) estava público, sem login nenhum.

## O que mudou

| Antes (fatia vertical) | Agora |
| --- | --- |
| `clone/lib/data.ts` guardava tudo em memória (reiniciava a cada `npm run dev`) | `clone/lib/data.ts` lê e escreve no Postgres (Supabase) de verdade |
| `/admin/pedidos` era público — qualquer um com a URL via e mexia nos pedidos | `clone/middleware.ts` exige login; sem sessão, vai para `/admin/entrar` |
| Sem conceito de "usuário" | Supabase Auth (e-mail + senha); `store_members` liga o usuário à loja |
| Nenhuma validação de entrada nas rotas | `clone/lib/zod-schemas.ts` valida o corpo de toda rota de `/api` |

As funções do cliente final continuam em `lib/data.ts`, com a mesma assinatura de antes —
só o corpo trocou de memória para consultas ao banco. As do painel do lojista foram para
`lib/admin-data.ts`, um arquivo novo: elas usam o cliente Supabase ligado à sessão de quem
está logado, para a RLS (`is_store_member`) decidir de verdade o que cada lojista vê e
muda — não é mais só a rota que "promete" filtrar pela loja certa.

## Subir o banco

1. Crie um projeto em [supabase.com](https://supabase.com) (plano gratuito serve para
   testar). Região recomendada: São Paulo (`sa-east-1`), pela latência com o Brasil.
2. No **SQL Editor** do projeto, cole e rode o conteúdo de
   `clone/supabase/migrations/0001_init.sql` (é o `schema.sql` da arquitetura, como a
   primeira migration real).
3. Rode também `clone/supabase/seed.sql` — cria a loja de exemplo `burgueria-exemplo` com
   os mesmos produtos que já apareciam na fatia vertical.
4. Em **Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (secreta — nunca aparece no navegador)
5. Dentro de `clone/`, copie `.env.example` para `.env.local` e cole os três valores.

## Primeiro acesso do lojista

Não existe cadastro público ainda (de propósito — ver "Não feito nesta passagem"). Para
entrar no painel:

1. No Supabase, vá em **Authentication → Users → Add user** e crie um usuário com e-mail e
   senha (ou peça para o próprio lojista se cadastrar por lá, por enquanto).
2. Copie o `id` (uuid) desse usuário.
3. No **SQL Editor**, ligue esse usuário à loja de exemplo:
   ```sql
   insert into store_members (store_id, user_id, role)
   select id, '<uuid-do-usuário>'::uuid, 'owner' from stores where slug = 'burgueria-exemplo';
   ```
4. Rode o projeto (`npm install && npm run dev`) e entre em `/admin/entrar` com esse e-mail
   e senha. Vai cair em `/admin/pedidos`, agora atrás de login.

## Painel do dono da plataforma (`/admin/plataforma`)

Separado do painel do lojista: lista todas as lojas cadastradas e cria lojas novas (já com o
login do dono) sem precisar mexer no SQL Editor. Só quem está na tabela `platform_admins`
entra — um lojista comum logado recebe 403 ao tentar.

Pra se tornar admin da plataforma (normalmente só você, quem vende o SaaS):
```sql
insert into platform_admins (user_id)
values ('<seu-uuid-de-usuário>') on conflict do nothing;
```
(o uuid é o mesmo de **Authentication → Users** no Supabase.)

Depois disso, entre em `/admin/entrar` com esse usuário e o link "Plataforma" aparece no
painel de pedidos. De lá, "+ Nova loja" cria a loja e o usuário do dono dela num só passo —
mostra a senha provisória uma vez só, pra você repassar.

Ainda não feito aqui: trocar de loja sem digitar a URL (`/admin/pedidos?loja=slug`), editar
ou desativar uma loja existente, e o próprio lojista se cadastrar sozinho (ver "Não feito
nesta passagem" abaixo — é a próxima peça natural quando o SaaS ganhar cobrança).

## Checklist de segurança

- [x] secrets só em variáveis de ambiente (`.env.local`), `.gitignore` já tinha `.env*`
- [x] nada de chave de serviço no bundle do navegador (`lib/supabase/service.ts` só é
      importado por código de servidor — rotas de API)
- [x] entrada validada no servidor (zod) em toda rota de `/api/s/*` e `/api/admin/*`
- [x] autorização checada em toda leitura/escrita do painel — testado com RLS
      (`is_store_member`), não só na rota: um usuário sem vínculo com a loja não recebe os
      pedidos dela, mesmo pedindo pelo `slug` certo
- [ ] limite de requisições (rate limit) em login, em `/api/s/[slug]/customer` e em criar
      pedido — ainda não feito, ver abaixo
- [x] webhooks: não há nenhum nesta fase (sem Mercado Pago/Stripe ligados ainda)
- [ ] upload de imagem: ainda não existe (cardápio sem foto nesta fatia)
- [x] nenhum dado de pedido ou cliente aparece em URL (só o `public_token` de
      acompanhamento, que é longo e aleatório — isso é intencional)
- [ ] `npm audit` com as novas dependências — rodar na verificação final (ver build-log.md)
- [ ] política de privacidade listando os processadores (Supabase, e quando entrarem,
      Mercado Pago/Resend) — ainda não escrita

## Não feito nesta passagem (fica para depois)

- **Pagamentos (Stripe para a assinatura do SaaS, Mercado Pago para cada loja):** decisão
  do projeto, registrada desde `architecture.md`. O pedido do cliente final já é
  pago-na-entrega (sem gateway nenhum); a cobrança do SaaS em si (Stripe) também não foi
  construída — não houve pedido para isso ainda, e misturar os dois agora juntaria dois
  riscos (cobrar lojista + processar pedido) numa etapa só. Quando entrar, segue o roteiro
  padrão: Stripe Checkout + Customer Portal para a assinatura, Mercado Pago OAuth (já
  desenhado em `store_payment_accounts`) para cada loja.
- **E-mail transacional:** sem Resend/Postmark ainda — não há nada que precise de e-mail
  nesta fase (confirmação é por WhatsApp, decisão do projeto).
- **Cadastro público do lojista:** hoje a conta é criada por você, pelo painel
  `/admin/plataforma` (ver acima) — não pelo próprio lojista. Uma tela de autocadastro é a
  próxima peça natural quando o SaaS ganhar um plano para assinar.
- **Rate limiting:** login, identificação por WhatsApp e criação de pedido ainda aceitam
  qualquer volume de tentativas. Importante antes de abrir para lojistas de verdade.
- **Exclusão de conta (LGPD):** a função `anonymize_customer()` já existe no banco
  (`schema.sql`), mas não há rota nem botão que a chame ainda.
- **Papéis "manager"/"staff":** `store_members.role` já aceita isso, mas toda a RLS hoje
  trata qualquer membro da loja como podendo fazer tudo — sem diferença por papel ainda.

## Próximo passo

`/replica-test`: clicar em cada fluxo (cliente e painel) e escrever os testes de ponta a
ponta, agora que há banco e login de verdade para testar contra.
