# Cardápio digital e pedidos — SaaS próprio

Projeto de reconstrução de funcionalidades (nunca de código, textos ou marca) feito com o
pacote de skills "replica". Cada arquivo é a saída de uma etapa; a ordem de leitura é esta:

| etapa | arquivo | o que é |
| --- | --- | --- |
| 1. recon | `recon.md`, `features.csv` | mapa de telas, fluxos e matriz de features |
| 2. arquitetura | `architecture.md`, `schema.sql` | stack, banco de dados, API, ordem de construção |
| 3. design | `design/tokens.json`, `design/tokens.css`, `design/tailwind.config.ts`, `design/components.md` | cores, tipografia e specs de 22 componentes |
| 4. build | `clone/` | o código: um projeto Next.js de verdade (fatia vertical) |
| — | `build-log.md` | o que já foi construído, o que falta, o que deu mais trabalho que o esperado |

Regra do projeto, válida para tudo: **nenhum vínculo com o iFood**, em nenhuma camada.

## Decisões já tomadas (valem para quem continuar isto)

- Pagamento: só na entrega, na maquininha do entregador (ou no balcão). Pix e cartão online
  (Mercado Pago, na conta de cada lojista) estão desenhados no `architecture.md` e no
  `schema.sql`, mas desligados — fica para uma fase posterior.
- Impressão: comanda em bobina de 80 mm, ligada por uma caixa de seleção nas configurações.
  Sem impressora, o pedido só aparece na tela.
- WhatsApp: quem envia a confirmação é o cliente, por um botão que abre a conversa já com
  a mensagem pronta. Nada sai sozinho nesta fase.

## O código (`clone/`)

```bash
cd clone
npm install
npm run dev
# http://localhost:3000/loja/burgueria-exemplo
# http://localhost:3000/admin/pedidos
```

Já verificado: `npm run build` e `npx tsc --noEmit` sem erros, fluxo testado de ponta a
ponta pela API (ver `build-log.md` > Verificação). Os dados ainda vivem em memória
(`clone/lib/data.ts`) — é a próxima etapa, `/replica-backend`, que liga isso ao Postgres do
`schema.sql`.

## Para usar em mais de um computador (GitHub)

Depois de extrair este zip, dentro da pasta:

```bash
git init
git add .
git commit -m "Primeira versão: recon, arquitetura, design e fatia vertical"
git branch -M main
git remote add origin https://github.com/<seu-usuário>/<nome-do-repo>.git
git push -u origin main
```

No outro computador, só `git clone` e, dentro de `clone/`, `npm install`.
Nada de senha ou chave neste zip — quando o projeto ganhar login e pagamento online,
essas chaves vão num arquivo `clone/.env.local`, que o `.gitignore` já deixa de fora do
Git de propósito.
