# Log de construção

Formato: ID | data | status | o que falta | o que foi mais difícil do que parecia.

## Casca e fatia vertical (2026-11-16)

| ID | tela | status | falta | observação |
| --- | --- | --- | --- | --- |
| shell | roteamento, tokens, camada de dados falsa | feito | — | camada de dados (`lib/data.ts`) já com a assinatura de função que o Postgres real vai ter |
| S01/S02 | home do cardápio + categorias | feito (dados de exemplo) | paginação para cardápios grandes, busca | implementadas como uma página só com filtro no cliente, como o original parece se comportar |
| S03/S04 | produto, complementos, modal de adicionado | feito | validação de grupo obrigatório ainda só impede avançar, sem destacar visualmente o grupo que falta | nada mais difícil que o esperado |
| S05 | carrinho | feito | "Peça também" (carrossel de venda adicional) | — |
| S06 | identificação por WhatsApp e nome | feito | limite de requisições por telefone/IP (entra com o backend real) | — |
| S07 | finalizar (entrega/retirada/local) | parcial — **entrega está desabilitada e o pagamento é só "na entrega"**, por decisão do projeto | ligar Mercado Pago, Pix, taxa de entrega | foi mais simples do que o arquitetado porque o pagamento online ficou de fora por enquanto; a tela vai ganhar um passo a mais quando ele entrar |
| S11 (nova) | pedido feito + botão de WhatsApp | feito | acompanhamento por Realtime (hoje é polling a cada 5s) | o link de wa.me tem limite de tamanho da URL — se o pedido tiver muitos itens, a mensagem pode ser cortada pelo navegador; vale testar com um pedido grande antes de confiar nisso em produção |
| F03 / "Pedidos" | histórico no aparelho | feito | pedidos de outro aparelho (fase com telefone confirmado) | — |
| A02 | painel do lojista | parcial — **sem login**, qualquer um que acesse a URL vê e mexe nos pedidos | Supabase Auth + RLS antes de ir ao ar | não é seguro publicar assim; é só para ver o fluxo |
| impressão | comanda em bobina 80mm | feito (modo "com janela") | modo silencioso depende do lojista configurar o atalho `--kiosk-printing` do Chrome, fora do controle do código | o navegador não confirma que o papel realmente saiu — `printed_at` só quer dizer "mandado para a impressora" |
| som de pedido novo | alerta sonoro | feito (clique único para ativar) | áudio de verdade (hoje é um som quase inaudível, só para provar que o mecanismo funciona) | navegadores bloqueiam som automático sem interação — por isso o botão "toque para ativar" |

## Não construído nesta passagem

Login e cadastro do lojista, editor de cardápio, configurações da loja (A01, A03, A04),
relatórios (A05), cupons (A06), Mercado Pago/Pix, entrega com zonas, "Mais informações" da
loja, tema claro/escuro persistente entre sessões, testes automatizados.

## Próximo passo

`/replica-backend`: ligar `lib/data.ts` ao Postgres de `replica/schema.sql`, Supabase Auth
para o painel, e — quando decidido — o Mercado Pago de cada loja.
