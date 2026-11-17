# Arquitetura: sistema próprio de cardápio digital e pedidos (reconstrução das funcionalidades centrais do Anota AI)

Escopo: o fluxo do cliente (S01 a S10) e o painel do lojista (A01 a A06) do `recon.md`.
Regras do projeto: nenhum vínculo com o iFood; nada de código, marca, textos ou APIs privadas do original; só APIs oficiais e públicas com as suas próprias chaves.

## Stack

| camada | escolha | por quê |
| --- | --- | --- |
| web | Next.js (App Router) + TypeScript | uma base de código para o cardápio público e para o painel; renderização rápida no celular |
| estilo | Tailwind, com tokens da `/replica-design` | cor de destaque por loja vira uma variável CSS |
| mobile | PWA (sem app nativo na primeira versão) | o lojista instala o painel na tela inicial e o cliente só abre o link; app de loja fica para depois |
| banco | Postgres no Supabase, região São Paulo | um banco só, RLS por loja, menor latência para o público brasileiro |
| ORM | Drizzle | tipos a partir do schema; SQL continua legível |
| auth | Supabase Auth (só lojistas) | o cliente final não tem conta: é identificado por WhatsApp e nome |
| tempo real | Supabase Realtime | o painel recebe pedido novo sem recarregar |
| pagamentos | **primeira versão: só na entrega**, na maquininha do entregador (ou no balcão, na retirada e no consumo no local). Sem pagamento pelo site | decisão do projeto. O sistema só registra a forma escolhida; nenhum dinheiro passa por ele. O Pix pelo site, com o Mercado Pago na conta de cada lojista (OAuth), entra numa fase posterior e já está desenhado neste documento |
| cobrança da assinatura | conta própria da plataforma (Mercado Pago ou outro provedor com cobrança recorrente), separada das contas das lojas | o valor das vendas e a mensalidade nunca se misturam |
| e-mail | Resend | recuperação de senha, convites e avisos ao lojista |
| jobs | `pg_cron` do Supabase para o que roda a cada minuto; Vercel Cron para o resto | o cron da Vercel tem limites por plano, e expirar Pix pede execução por minuto |
| arquivos | Supabase Storage com redimensionamento no envio | fotos de produto e logos; limite de tamanho e conversão para WebP |
| WhatsApp | botão "Enviar pedido pelo WhatsApp" na tela de pedido feito, que abre a conversa com a loja com a mensagem pronta (`wa.me`) | decisão do projeto: só vai para o WhatsApp se o cliente enviar. Sem custo, sem API da Meta e sem envio automático |
| impressão | comanda em bobina de 80 mm, impressa pelo navegador do painel, ligada por uma caixa de seleção nas configurações | decisão do projeto. Sem impressora, o pedido só aparece na tela |
| hospedagem | Vercel + Supabase | gerenciado, barato com poucas lojas |

Um banco, sem microsserviços. O cliente não precisa da arquitetura do original, precisa das funcionalidades.

## Banco de dados

21 tabelas em `schema.sql` (sintaxe validada com um parser de Postgres; falta rodar num banco de verdade). Dinheiro em centavos inteiros, horários em `timestamptz`, status por restrição `check`, índice em toda chave estrangeira e em cada coluna filtrada.

- Loja e acesso: `stores`, `store_members`, `store_hours`
- Cardápio: `categories`, `products`, `option_groups`, `product_option_groups`, `options`, `delivery_zones`, `coupons`
- Clientes e pedidos: `customers`, `addresses`, `orders`, `order_items`, `order_events`
- Pagamentos: `payments`, `webhook_events`, `store_payment_accounts` (tokens do Mercado Pago de cada loja, criptografados)
- Avisos: `notifications`
- SaaS: `plans`, `subscriptions`

Regras que o banco garante, em vez da tela:
- Produto e categoria, complemento e grupo, pedido e cliente são sempre da mesma loja (chave estrangeira composta com `store_id`).
- `total = subtotal + entrega + taxa de conveniência − desconto` é uma restrição da tabela de pedidos.
- Número do pedido por loja sem repetir (`next_order_number` trava a linha da loja) e chave de idempotência única por loja contra pedido duplicado.
- Um pedido só pode ter um pagamento confirmado (índice único parcial) e o mesmo evento do provedor não é processado duas vezes (`webhook_events`).
- Itens do pedido guardam nome e preço da hora da venda; editar o cardápio não muda pedido antigo.
- Pix vencido: `expire_pending_pix()` cancela o pagamento e o pedido que ainda aguardava.
- LGPD: `anonymize_customer()` remove nome, telefone e endereço sem apagar o histórico de vendas da loja.

Acesso: **RLS do Postgres**. O navegador do cliente só lê o cardápio ativo. Criar pedido, pagar e acompanhar passam por rotas do servidor, que validam tudo e usam a chave de serviço (que nunca vai para o navegador). O lojista lê e escreve só dados da própria loja, via `is_store_member()`. `webhook_events` e `store_payment_accounts` não têm política: ninguém acessa pelo navegador, e o painel só recebe o status da conexão por uma rota do servidor. Ainda falta refinar por papel (`staff` não deveria editar preço nem estornar).

## API

37 rotas. O cliente final fala com `/api/s/...` e `/api/o/...`; o lojista, com `/api/admin/...`.

| rota | faz | quem | entrada | saída | fluxo |
| --- | --- | --- | --- | --- | --- |
| GET /api/s/{slug}/menu | cardápio completo da loja (categorias, produtos, complementos, mais pedidos, status aberto ou fechado) | público | slug | loja, horário, categorias e produtos ativos | F01 F02 |
| GET /api/s/{slug}/search?q= | busca produtos pelo nome | público | slug, texto | lista de produtos | F01 |
| POST /api/s/{slug}/customer | identifica o cliente por WhatsApp e nome e grava um cookie assinado de sessão | público (limite por IP) | telefone, nome | cliente, cookie | F01 F02 |
| POST /api/s/{slug}/quote | recalcula o pedido no servidor: preços, complementos, mínimo, horário, zona, cupom, taxas | cliente | itens, tipo de entrega, bairro, cupom | subtotal, taxas, desconto, total, previsão, erros | F01 F02 |
| GET /api/s/{slug}/zones | lista bairros e taxas de entrega | público | slug | zonas ativas | F02 |
| POST /api/s/{slug}/coupon/validate | confere um cupom sem gastar uso | cliente | código, subtotal | desconto ou motivo da recusa | F01 |
| POST /api/s/{slug}/addresses | salva endereço do cliente | cliente | campos do endereço | endereço | F02 |
| POST /api/s/{slug}/orders | cria o pedido com os valores recalculados e uma chave de idempotência | cliente | itens, tipo, endereço, cupom, observação, chave | pedido (id, número, token público) | F01 F02 |
| POST /api/orders/{id}/payment | cria a cobrança (Pix, cartão ou pagar na entrega) no provedor | cliente do pedido | método | código Pix copia e cola e validade, ou link do cartão | F01 F02 |
| GET /api/o/{token} | status do pedido e do pagamento (a tela do cliente consulta a cada poucos segundos) | quem tem o token | token | status, pagamento, previsão | F01 F03 |
| POST /api/o/{token}/cancel | cliente cancela enquanto o pedido ainda não foi aceito | quem tem o token | motivo | pedido cancelado | F03 |
| GET /api/s/{slug}/my-orders | lista os pedidos deste aparelho (por tokens guardados no aparelho, não pelo telefone digitado) | cliente | cookie | pedidos recentes | F03 |
| POST /api/webhooks/mercado-pago/{storeId} | recebe o aviso de pagamento da conta daquela loja; confere a assinatura, consulta o pagamento no Mercado Pago com o token da loja (não confia no corpo do aviso) e só então atualiza | Mercado Pago (assinatura verificada) | aviso | 200 depois de gravar em webhook_events | F01 |
| POST /api/webhooks/billing | recebe eventos da assinatura da loja | provedor (assinatura verificada) | evento | 200 | F06 |
| POST /api/auth/* | login, recuperação de senha e convite de membro (Supabase Auth) | lojista | e-mail, senha | sessão | F04 F05 F06 |
| GET /api/admin/orders | lista pedidos da loja por status (e assina tempo real) | lojista | filtros | pedidos | F04 |
| PATCH /api/admin/orders/{id}/status | aceita, recusa, prepara, marca pronto, saiu, concluído ou cancelado e grava order_events | lojista | novo status, motivo | pedido | F04 |
| GET /api/admin/orders/{id}/ticket | comanda formatada para impressão | lojista | id | HTML de impressão | F04 |
| POST /api/admin/orders/{id}/refund | estorna um pagamento pago | lojista (owner ou manager) | valor | pagamento estornado | F04 |
| GET|POST|PATCH|DELETE /api/admin/categories | cria e organiza categorias | lojista | nome, ordem, ativa | categoria | F05 |
| GET|POST|PATCH|DELETE /api/admin/products | cria e edita produtos, marca esgotado, liga grupos de complementos | lojista | campos do produto | produto | F05 |
| POST /api/admin/uploads | gera URL de envio de imagem e valida tipo e tamanho | lojista | tipo, tamanho | URL assinada | F05 |
| GET|POST|PATCH|DELETE /api/admin/option-groups | grupos de complementos e suas opções | lojista | nome, mínimo, máximo, opções | grupo | F05 |
| PATCH /api/admin/store | dados da loja, pedido mínimo, formas de receber, pausar vendas | lojista | campos da loja | loja | F06 |
| PUT /api/admin/hours | horários de funcionamento por dia | lojista | faixas por dia | horários | F06 |
| GET|POST|PATCH|DELETE /api/admin/zones | bairros, taxas e prazos de entrega | lojista | bairro, taxa, prazo | zona | F06 |
| GET|POST|PATCH|DELETE /api/admin/coupons | cupons de desconto | lojista | código, tipo, valor, limites | cupom | F06 |
| GET /api/admin/payments/mercado-pago/connect | começa a ligação: redireciona o lojista para autorizar a conta dele no Mercado Pago (com `state` contra CSRF) | lojista (owner) | nada | redirecionamento | F06 |
| GET /api/admin/payments/mercado-pago/callback | recebe o código de autorização, troca pelos tokens e guarda criptografado | lojista (owner) | code, state | status conectado | F06 |
| GET /api/admin/payments/mercado-pago | mostra o status da conexão (conectado, expirado, revogado), sem devolver tokens | lojista | nada | status | F06 |
| DELETE /api/admin/payments/mercado-pago | desconecta e apaga os tokens | lojista (owner) | nada | confirmação | F06 |
| POST /api/admin/orders/{id}/whatsapp | devolve o link `wa.me` com a mensagem de confirmação pronta e registra o aviso | lojista | id | link e texto | F04 |
| POST /api/admin/orders/{id}/printed | marca o pedido como enviado para impressão (ou falha) | lojista | id, resultado | `printed_at`, `print_count` | F04 |
| POST /api/internal/notify | envia os avisos de WhatsApp na fila pela API oficial (fase 2); chamado por job | sistema | nada | avisos enviados | F01 |
| GET /api/admin/reports/sales | vendas por período, forma de pagamento e produto | lojista | de, até | totais e séries | F04 |
| POST /api/billing/subscribe | contrata ou troca o plano da loja | lojista (owner) | plano | link de cobrança | F06 |
| POST /api/me/privacy/delete-customer | atende pedido de exclusão do cliente final (anonimiza) | lojista (owner) | cliente | confirmação | F04 |

Na primeira versão ficam desligadas as rotas de pagamento online (`orders/{id}/payment` só registra "na entrega"), as de Mercado Pago, o webhook de pagamento, `orders/{id}/whatsapp` e `internal/notify`.

Webhooks de entrada: um por loja para o Mercado Pago (pagamento aprovado, expirado, recusado, estornado) e um para a cobrança da assinatura. Sempre com a assinatura verificada, gravados em `webhook_events` antes de agir, e o status real do pagamento é consultado no Mercado Pago com o token da loja.
Webhooks de saída: nenhum. Os avisos de WhatsApp saem pelo job `notify` (fase 2).

Jobs:
- `expire_pending_pix` a cada minuto (pg_cron): expira Pix vencido e cancela o pedido.
- Renovação de tokens do Mercado Pago das lojas antes de vencer, e aviso no painel ("reconecte seu Mercado Pago") quando a conexão expira ou é revogada. A validade e a renovação precisam ser confirmadas na documentação de OAuth do Mercado Pago.
- `notify` a cada minuto: envia os avisos de WhatsApp em fila (fase 2) e tenta de novo os que falharam.
- Limpeza diária: cancela pedidos `awaiting_payment` abandonados com mais de 1 hora.
- Cobrança diária: marca assinaturas `past_due` e avisa o lojista por e-mail.
- Relatório diário (opcional): resumo de vendas por loja.

## Do pedido feito à tela do lojista, à impressora e ao WhatsApp

Na primeira versão não há pagamento pelo site. Quando o cliente toca em "Fazer pedido", o servidor grava o pedido já como `received`, com a forma de pagamento "na entrega" (`payments.method = card_on_delivery`, status `pending`), e registra em `order_events`. Daí:

1. **Tela do lojista.** O painel (A02) assina o Realtime dos pedidos da própria loja. O pedido novo aparece no topo, com destaque e som. Se a conexão cair, o painel busca de novo ao reconectar e a cada 30 segundos como reserva. O cartão do pedido mostra "Pagar na entrega (maquininha)".
2. **Impressão em bobina de 80 mm.** Nas configurações há a caixa de seleção "Imprimir comanda quando chegar pedido" (`stores.auto_print`).
   - Marcada: o painel aberto no computador monta a comanda de 80 mm e manda imprimir. Conteúdo: número do pedido, hora, cliente e telefone, tipo (entrega, retirada ou no local), endereço, itens com complementos e observações, total e "cobrar na entrega".
   - Desmarcada, ou sem impressora: o pedido só aparece na tela. Há sempre o botão "Imprimir" em cada pedido.
   - O navegador não consegue saber se existe impressora nem imprimir sem mostrar a janela de impressão. Para sair direto, o lojista abre o painel no Chrome por um atalho com `--kiosk-printing`, que usa a impressora padrão do computador (a térmica de 80 mm precisa ser a padrão). Sem o atalho, a janela de impressão abre a cada pedido.
   - `printed_at` quer dizer "enviado para impressão": o navegador não confirma que o papel saiu. Se falhar, o pedido mostra "Não impresso".
3. **WhatsApp, só se o cliente enviar.** A tela de pedido feito tem o botão "Enviar pedido pelo WhatsApp", que abre a conversa com o número da loja (`stores.whatsapp`) e a mensagem pronta: número do pedido, itens, total, forma de pagamento e link de acompanhamento. Se o cliente não tocar, nada é enviado. O lojista responde pelo WhatsApp normal dele.
   - Isso dispensa a API da Meta, modelos aprovados e a caixa de consentimento. A tabela `notifications` e a coluna `orders.whatsapp_consent` ficam reservadas para um envio automático futuro.

**Fase posterior: Pix pelo site.** O lojista conecta a própria conta do Mercado Pago no painel (OAuth), o valor cai direto nela e o aviso de pagamento confirmado chega por webhook. As tabelas `store_payment_accounts` e `webhook_events`, as rotas `mercado-pago/*` e os jobs de Pix já estão no desenho, desligados por `stores.online_payments_enabled = false`.

## As partes que mordem

- **Preço nunca vem do navegador.** O servidor recalcula itens, complementos, taxas, cupom e total em `quote` e de novo em `orders`. O total que o cliente vê é só uma prévia.
- **Pedido falso.** Sem pagamento antecipado, qualquer pessoa pode fazer um pedido de brincadeira. Proteções: limite de pedidos por telefone e por IP, o lojista aceita ou recusa cada pedido, e pode ligar para confirmar. É o principal custo de adiar o Pix.
- **Dinheiro (fase posterior).** Cada lojista usa a própria conta do Mercado Pago e o valor da venda cai direto nela, então a plataforma não segura dinheiro de lojas. Isso reduz bastante o risco regulatório de ser um arranjo de pagamento, mas continua valendo conversar com um contador ou advogado. O lojista precisa ter conta no Mercado Pago apta a receber Pix e paga as tarifas dele ao Mercado Pago. Se um dia você quiser cobrar comissão sobre as vendas, o Checkout Transparente tem o parâmetro `application_fee`. Os tokens de cada loja são segredo: criptografados, nunca em log e nunca no navegador.
- **Idempotência.** Webhooks chegam duas vezes e na ordem errada; o cliente dá duplo clique em "Ir para o pagamento". Chave única em pedidos e em eventos de webhook, e as mudanças de status só avançam.
- **Validade do Pix (fase posterior).** O original mostra 5 minutos (S10), mas a documentação da API de Orders do Mercado Pago diz que a validade do Pix vai de 30 minutos a 30 dias (padrão 24 horas). Confirme isso na referência da API de pagamentos. Se for assim, o contador da tela deve mostrar a validade real (comece em 30 minutos), porque cancelar o pedido do nosso lado antes do Pix vencer abriria a possibilidade de o cliente pagar um pedido já cancelado. Se o pagamento chegar depois do cancelamento, a regra mais simples é estornar sozinho; teste esse caminho.
- **Corridas.** Produto esgotado entre o carrinho e o pagamento; cupom com limite de usos (`uses_count` atualizado de forma atômica); dois pedidos ao mesmo tempo na mesma loja.
- **Horário e fuso.** Horário de loja é local (`stores.timezone`), guardado como hora e dia da semana, e turnos que passam da meia-noite ("Aberto até 23h59" e depois) precisam de teste. Todo carimbo de tempo é UTC.
- **WhatsApp depende do cliente.** Se ele não tocar no botão, a loja não recebe nada pelo WhatsApp; o painel é a fonte oficial do pedido. O número da loja precisa estar cadastrado com DDI e DDD para o link funcionar.
- **Painel em tempo real.** Reconexão e sincronização depois de ficar sem internet; o navegador bloqueia som automático, então o painel precisa de um botão "ativar som" que o lojista toca uma vez; impressão de comanda por navegador primeiro, impressora térmica depois.
- **Aba Pedidos sem senha.** Listar pedidos pelo número digitado deixaria qualquer pessoa ver pedidos alheios. Por isso `my-orders` usa tokens guardados no aparelho. Recuperar o histórico em outro aparelho exigiria confirmar o WhatsApp (fase 3).
- **Abuso.** Pedidos falsos e tentativas em massa: limite de requisições por IP e por telefone, e validação de telefone. Para pedido mínimo baixo (R$ 2,00 na loja do exemplo), o risco de pedido de brincadeira é real.
- **LGPD.** Nome, telefone e endereço de clientes finais. A loja é a controladora e você a operadora: política de privacidade e termos próprios, retenção definida, exclusão por `anonymize_customer`.
- **Multi-loja.** Teste automatizado de que a loja A nunca lê nada da loja B; `slug` com nomes reservados (admin, api, app...) e validação.
- **Imagens.** Fotos grandes derrubam o cardápio no celular: redimensionar e converter no envio.
- **Marca.** O produto não pode mencionar a Anota AI nem o iFood em lugar nenhum (código, textos, SEO, loja de apps).

## Ordem de construção

1. **Fatia vertical.** Uma loja criada à mão, cardápio no celular, produto com complementos, carrinho, identificação, retirada com "pagar na entrega" e um painel simples que recebe o pedido.
   - Telas: S01, S02, S03, S04, S05, S06, S07 (só retirada), A02 simplificada.
   - Tabelas: `stores`, `categories`, `products`, `option_groups`, `product_option_groups`, `options`, `customers`, `orders`, `order_items`, `payments`.
   - Rotas: `menu`, `customer`, `quote`, `orders`, `GET /api/o/{token}`, `admin/orders` e `PATCH status`.
2. **Essenciais** (`must` do `features.csv`), por área:
   - Pedido na tela, impressão e WhatsApp: pedido novo no painel com som, comanda de 80 mm com a caixa de seleção nas configurações, botão "Enviar pedido pelo WhatsApp" na tela de pedido feito (S11 nova), pagamento só na entrega. Rota `orders/{id}/printed`.
   - Entrega: endereço, zonas e taxas (S07 completa). Tabelas: `addresses`, `delivery_zones`.
   - Lojista: login, editor de cardápio, horários e configurações, alerta sonoro, aceitar e recusar (A01, A03, A04, A02 completa). Tabelas: `store_members`, `store_hours`, `order_events`.
   - SaaS: várias lojas, convite de lojista, assinatura (`plans`, `subscriptions`, `billing/*`).
   - Jurídico: política de privacidade e termos próprios.
3. **Desejáveis** (`should`): cupons, "Peça também", busca, cartão online, pagar na entrega com troco, aba Pedidos, impressão de comanda, produto esgotado em um toque, relatórios, "Mais informações" da loja.
4. **Pagamento pelo site** (fase posterior): Mercado Pago do lojista por OAuth, Pix, webhooks por loja, expiração (S10). Tabelas `store_payment_accounts`, `webhook_events`; rotas `admin/payments/mercado-pago/*` e `webhooks/mercado-pago/{storeId}`.
5. **Opcionais** (`could`): tema claro e escuro, compartilhar, QR Code para mesas, fidelidade, cartão online, WhatsApp automático pela API oficial, agente de impressão térmica, atendente de WhatsApp, integração com PDV, entregadores.
6. **Correções da `/replica-entrepreneur`**, depois que ela rodar (por exemplo, a política de taxa para o cliente final e os pontos de dor com preço).
