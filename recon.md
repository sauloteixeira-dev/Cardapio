# Mapa de recon: pedido.anota.ai, cardápio digital de loja (web, celular)

Escopo: fluxo do cliente no cardápio digital (ver o cardápio, montar o pedido, identificar-se, escolher entrega ou retirada, pagar) e o painel do lojista que recebe e administra os pedidos.
Para: um SaaS próprio, vendido a outras lojas por um preço menor que o da Anota AI.
Data: 2026-11-15
Estado: lado do cliente mapeado por 14 prints (S01 a S10). Lado do lojista e telas citadas abaixo como "não vistas" ainda são inferência de fontes públicas.

## Fontes

| # | fonte | URL | notas |
| --- | --- | --- | --- |
| 1 | prints do usuário da página pública de uma loja (14 capturas, celular) | pedido.anota.ai/loja/burgueria-do-kick | fonte principal de S01 a S10. O site bloqueia leitura automatizada, então não foi acessado por mim. Prints são só referência e ficam em replica/screens/ |
| 2 | página da Saipos sobre a integração com a Anota AI | https://saipos.com/anota-ai | terceiro; lista cardápio digital, atendente virtual, gerenciador de pedidos e planos |
| 3 | artigo da Saipos sobre como funciona a Anota AI | https://saipos.com/integracoes/anota-ai/anota-ai-telefone | terceiro; cita Pix automatizado, plano fidelidade, ponto de venda, relatórios e QR Code nas mesas |
| 4 | guia SULTS de sistemas para restaurantes (PDF) | https://www.sults.com.br/sults/downloads/artigos/gestao/segmentos/5-melhores-sistemas-de-gestao-para-restaurantes.pdf | terceiro; descreve links de cardápio para pedir sem cadastro e o gerenciador de pedidos |
| 5 | manual de integração da Teknisa com a Anota AI (PDF) | https://universidade.teknisa.com/wp-content/uploads/2025/12/Manual_AnotaAi.pdf | terceiro; útil para o modelo de dados do cardápio |
| 6 | PDF do programa de parceiros da Anota AI | https://anota.ai/home/wp-content/uploads/2022/02/Seja-parceiro-Anota-AI.pdf | oficial, mas de 2022 e voltado a parceiros |
| 7 | central de ajuda, changelog, listagem em loja de apps, vídeos | (ainda não localizados) | procurar a seguir; é a melhor fonte para o painel do lojista |

## Núcleo do produto

Um link de cardápio que transforma a visita do cliente em pedido pago, sem cadastro com senha, e entrega o pedido pronto para o lojista conduzir.

## Telas (lado do cliente, vistas nos prints)

| ID | tela | como chegar | propósito | componentes principais | estados vistos |
| --- | --- | --- | --- | --- | --- |
| S01 | Home do cardápio | link /loja/<slug> | ver a loja, as categorias e os mais pedidos | capa e logo, nome, busca, tema, compartilhar, status Aberto até, pedido mínimo, Mais informações, abas de categoria, carrossel Os mais pedidos, barra inferior | carregada; item com foto e item sem foto |
| S02 | Lista de uma categoria | aba de categoria | escolher um produto | cabeçalho compacto, abas fixas, linhas de produto com nome, descrição e preço | com e sem descrição |
| S03 | Detalhe do produto | toque no produto | ver o produto e escolher complementos | foto, nome, preço, descrição, busca, grupo de complementos com limite, botão + por opção, rodapé Avançar com total | complementos sem seleção |
| S04 | Item adicionado | Avançar em S03 | ajustar quantidade e observação | modal com confirmação, stepper de quantidade, campo de observações, Avançar para o carrinho, Continuar comprando | padrão |
| S05 | Carrinho | Avançar para o carrinho ou aba Carrinho | revisar o pedido | linha do item com editar e excluir, stepper, carrossel Peça também, Adicionar mais produtos, Avançar com total | com 1 item |
| S06 | Identifique-se | Avançar em S05 | identificar o cliente | campo de WhatsApp com máscara, campo de nome e sobrenome, Avançar, aviso de ambiente protegido | vazio (botão desabilitado); preenchido (botão habilitado) |
| S07 | Finalizar pedido: onde receber | Avançar em S06 | escolher entrega, retirada ou consumo no local | card Será entregue para com Trocar, três opções com prazo ou Grátis, subtotal e total, botão desabilitado até escolher | nenhuma opção escolhida |
| S08 | Finalizar pedido: como pagar | após escolher onde receber | escolher a forma de pagamento | previsão de tempo, grupo Pagar agora com Pix, Nubank e cartão de crédito, grupo Pagar na entrega recolhido, totais, link da política de privacidade | nenhuma forma escolhida (botão desabilitado) |
| S09 | Finalizar pedido: resumo | após escolher o pagamento | revisar e ir para o pagamento | endereço da loja com Trocar, previsão, pagamento escolhido com Trocar, cupom com Aplicar, observações recolhidas, subtotal, taxa de conveniência, total, Ir para o pagamento | retirada com Pix |
| S10 | Pagamento Pix | Ir para o pagamento | pagar | selo Ambiente seguro, status Aguardando o pagamento, contador circular de cerca de 5 minutos, código copia e cola, botão Copiar código | aguardando |

### Telas esperadas mas ainda não vistas

Cadastro de endereço (opção Cadastrar novo endereço), Mais informações da loja, aba Pedidos (histórico e acompanhamento), menu de todas as categorias (ícone ao lado das abas), Pagar na entrega aberto, formulário de cartão, fluxo Nubank, Pix pago e Pix expirado, pedido confirmado, loja fechada, cupom aplicado ou inválido, produto com complemento obrigatório, produto esgotado.

### Telas do lojista (inferidas, nada visto)

| ID | tela | propósito | confiança |
| --- | --- | --- | --- |
| A01 | Login do lojista | entrar no painel | guess |
| A02 | Painel de pedidos | receber, aceitar e conduzir pedidos (fontes públicas citam um gerenciador de pedidos) | medium |
| A03 | Editor de cardápio | categorias, produtos, complementos, combos e promoções | medium |
| A04 | Configurações da loja | horários, taxas de entrega, formas de pagamento, pedido mínimo, dados da loja | guess |
| A05 | Relatórios | vendas por período | medium |
| A06 | Cupons e fidelidade | campanhas | guess |

## Fluxos

```
F01 Cliente faz um pedido com retirada e Pix
    S01 -> S03 -> S04 -> S05 -> S06 -> S07 -> S08 -> S09 -> S10
    cliques no caminho feliz: cerca de 9 toques até o código Pix (contagem aproximada: falta ver o botão entre S07 e S08)
    edge: loja fechada, produto esgotado, abaixo do pedido mínimo, Pix expira em cerca de 5 min, cupom inválido, cliente volta ao carrinho depois de S06

F02 Cliente faz um pedido com entrega
    mesmo caminho até S07, depois cadastro de endereço (não visto) e taxa de entrega (não vista)
    edge: endereço fora da área, taxa por bairro, previsão diferente da retirada

F03 Cliente consulta pedidos (aba Pedidos, não vista)

F04 Lojista recebe e conduz um pedido (inferido)
    A02: novo pedido -> aceitar -> em preparo -> saiu ou pronto -> entregue
    edge: recusar, cancelar, imprimir comanda, pedido pago e não pago

F05 Lojista monta o cardápio (inferido)
    A01 -> A03

F06 Lojista configura a loja e o pagamento (inferido)
    A01 -> A04
```

## Componentes

| componente | variantes | estados | usado em |
| --- | --- | --- | --- |
| Botão principal fixo no rodapé | com valor à direita (Avançar R$ 23,00) e sem valor | ativo, desabilitado | S03, S05, S06, S07, S08, S09 |
| Botão de texto | vermelho de ação | padrão | S04, S05 |
| Botão adicionar (+) | no cartão de produto e na opção de complemento | padrão | S01, S03, S05 |
| Cabeçalho da loja | expandido (capa) e compacto | rolagem | S01, S02 |
| Abas de categoria fixas | com ícone de menu à esquerda | ativa sublinhada | S01, S02 |
| Cartão de produto em carrossel | com foto, sem foto | padrão | S01, S05 |
| Linha de produto | com e sem descrição | padrão | S02 |
| Stepper de quantidade | com excluir quando há 1 | padrão | S04, S05 |
| Campo de texto | máscara de telefone, texto livre | vazio, foco, preenchido | S03, S04, S06 |
| Modal de confirmação | centralizado com ilustração | aberto | S04 |
| Opção escolhível em cartão | com subtítulo e selo (Grátis, Mais rápido) | selecionada, não selecionada | S07, S08 |
| Acordeão | Pagar na entrega, Observações | fechado, aberto | S08, S09 |
| Selo Ambiente seguro | verde | fixo | S06 a S10 |
| Barra inferior | Início, Pedidos, Carrinho | item ativo em destaque | S01, S02 |
| Contador circular | regressivo | correndo, expirado (não visto) | S10 |
| Campo com botão copiar | código Pix | padrão | S10 |
| Alternador de tema | sol e lua | claro, escuro | S01, S02 |
| Cor de destaque da loja | vermelho nas telas da loja | provavelmente configurável por loja (guess) | todas |

## Modelo de dados inferido

```
Loja            id, slug, nome, logo, capa, horário de funcionamento, aberta agora, pedido mínimo, endereço, cor de destaque
                evidência: S01, S09
                confiança: high

Categoria       id, loja, nome, ordem
                evidência: S01, S02
                confiança: high

Produto         id, categoria, nome, descrição, preço, foto (opcional), esgotado, ativo
                evidência: S01, S02, S03
                confiança: high

GrupoComplementos  id, produto, nome, mínimo, máximo, obrigatório
                evidência: S03 (grupo adicionais, até 10 itens)
                confiança: medium (mínimo e obrigatório são guess)

Complemento     id, grupo, nome, preço, foto (opcional)
                evidência: S03
                confiança: high

Cliente         telefone (WhatsApp), nome
                evidência: S06 (sem senha); S07 permite trocar o cliente
                confiança: high

Endereço        id, cliente, campos de endereço
                evidência: S07 (Cadastrar novo endereço)
                confiança: guess

Pedido          id, loja, cliente, tipo (entrega | retirada | consumo no local), status, subtotal, taxa de entrega, taxa de conveniência, desconto, total, previsão, observação
                evidência: S07, S09
                confiança: medium

ItemPedido      id, pedido, produto, quantidade, observação, complementos escolhidos, preço no momento do pedido
                evidência: S04, S05
                confiança: medium

Pagamento       id, pedido, método (pix | nubank | cartão | na entrega), status, valor, código Pix, expira em
                evidência: S08, S10
                confiança: medium

Cupom           id, loja, código, regras
                evidência: S09
                confiança: guess

ÁreaEntrega     id, loja, bairro ou raio, taxa
                evidência: S07 (prazo de entrega) e fontes públicas
                confiança: guess

UsuárioLojista  id, loja, e-mail, senha
                confiança: guess

Assinatura      id, loja, plano, status        (não é do original: é o seu SaaS)
```

Relações: Loja 1-n Categoria, Categoria 1-n Produto, Produto 1-n GrupoComplementos, GrupoComplementos 1-n Complemento, Cliente 1-n Pedido, Loja 1-n Pedido, Pedido 1-n ItemPedido, Pedido 1-1 ou 1-n Pagamento, Loja 1-n Cupom, Loja 1-n ÁreaEntrega, Loja 1-n UsuárioLojista, Loja 1-n Assinatura.

## Matriz de features

Ver `features.csv`. Total 54. Must: 27, should: 10, could: 13, skip: 4. Linhas com original "unverified": 12 (quase todas do painel do lojista).

## Fora do escopo (não pode ou não deve ser clonado)

- Nome, logo, textos, ilustrações, código e identidade visual da Anota AI. Tudo é reescrito do zero e a `/replica-brand` troca a marca.
- Conteúdo de cada loja: nome, fotos, cardápio e preços pertencem à loja.
- Logos de Pix e Nubank: usar só os materiais oficiais de cada marca, nunca imagens copiadas dos prints.
- A rede de parceiros e o programa de parceria da Anota AI.
- **Regra do projeto: nenhum vínculo com o iFood.** Sem integração, API, marca, menção ou acordo com o iFood, em nenhuma fase. Isso vale para o produto, o site de vendas e a loja de apps, e a `/replica-brand` e a `/replica-deploy` devem checar.
- Atendente virtual de WhatsApp com IA: possível, mas fica para depois da primeira versão.

## Tamanho

Telas: 10 do cliente vistas, cerca de 8 do cliente ainda não vistas, cerca de 6 do lojista. Fluxos: 6. Entidades: 13.
Partes difíceis:
1. Pix (e cartão) com um provedor de pagamento licenciado: webhooks, expiração de cerca de 5 minutos, conciliação e dinheiro caindo na conta de cada loja (subconta ou split). Receber o dinheiro das lojas por conta própria pode enquadrar sua empresa como arranjo de pagamento regulado, então vale falar com um contador ou advogado.
2. Pedidos em tempo real no painel do lojista, com alerta sonoro e impressão.
3. Multi-loja: isolamento de dados por loja, assinatura mensal, LGPD (nome, telefone e endereço de clientes finais).
Tamanho: L (cerca de um trimestre) para algo vendável; M (algumas semanas) para uma versão de uma loja só, sem pagamento online.

## Referência de preço (fonte de terceiros, confirmar em anota.ai)

A página da Saipos lista os planos da Anota AI como Start R$ 249,99, Advanced R$ 299,99 e Premium R$ 389,99, e avisa que há taxas e que os valores mudam. Nos prints, o cliente final pagou uma taxa de conveniência de R$ 0,99 sobre R$ 23,00 num pedido com Pix. A `/replica-entrepreneur` deve ler as avaliações reais para confirmar onde está a reclamação de preço.
