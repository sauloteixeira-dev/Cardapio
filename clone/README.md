# Cardápio digital — fatia vertical

Código gerado pela `/replica-build`, a partir de `replica/recon.md`,
`replica/architecture.md` e `replica/design/`. Nenhuma linha vem do original:
nomes, textos e estrutura de pastas são escritos do zero.

## O que já funciona (fatia vertical)

Uma loja de exemplo (`burgueria-exemplo`), de ponta a ponta, sem banco de
dados de verdade (os dados vivem na memória do processo — `lib/data.ts` — e
reiniciam quando o servidor reinicia):

1. Cliente abre `/loja/burgueria-exemplo`, vê o cardápio por categoria e "Os
   mais pedidos" (S01/S02).
2. Abre um produto, escolhe complementos, adiciona ao carrinho com
   observação (S03/S04).
3. Revisa o carrinho (S05), se identifica por WhatsApp e nome, sem senha
   (S06).
4. Escolhe retirada ou consumo no local — **entrega e pagamento online ainda
   estão desligados, por decisão do projeto** — e faz o pedido (S07).
5. Vê a confirmação, com o botão "Enviar pedido pelo WhatsApp" que abre a
   conversa com a loja (S11, nova).
6. O lojista abre `/admin/pedidos`, vê o pedido chegar (consulta a cada 4s),
   aceita ou recusa, avança o status e imprime a comanda em bobina de 80mm.

## Rodar localmente

```bash
npm install
npm run dev
# abra http://localhost:3000/loja/burgueria-exemplo
# e, numa outra aba, http://localhost:3000/admin/pedidos
```

## O que falta (ver replica/architecture.md > Ordem de construção)

- Banco de dados de verdade (`replica/schema.sql`) no lugar de `lib/data.ts`
  — é a `/replica-backend`. As funções de `lib/data.ts` já têm a assinatura
  que vão ter depois; só o corpo muda.
- Login do lojista (Supabase Auth) — hoje `/admin/pedidos` é público.
- Entrega com endereço e taxa por bairro.
- Mercado Pago na conta do lojista, Pix e cartão online (desenhado e
  desligado por `store.onlinePaymentsEnabled = false`).
- Cupom, busca, "Peça também", tema claro/escuro persistente, aba
  "Pedidos" com mais detalhe.
- Testes automatizados — `/replica-test`.

## Regras que valem para qualquer código novo aqui

- Nunca colar HTML, CSS, JavaScript, SVG ou imagem do original.
- Nenhuma cor, texto ou valor de pixel direto no componente — sempre pelos
  tokens de `app/tokens.css` / `tailwind.config.ts`.
- Nenhuma menção ao iFood, em nenhuma camada (regra do projeto, ver
  `replica/recon.md`).
