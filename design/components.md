# Componentes: sistema de cardápio digital e pedidos

Fonte: inventário de componentes do `recon.md` (S01–S10) e os 14 prints enviados.
Tokens em `tokens.json` / `tokens.css`. Ícones: um pacote aberto (Lucide, MIT) —
nunca os ícones originais. Ilustração do "pedido adicionado" (S04): desenhada
do zero, nunca a arte do original. Fonte: Inter (aberta), no lugar de qualquer
fonte licenciada que a Anota AI use — não dá para confirmar qual é só pelos
prints, então Inter é a escolha segura.

```
BottomBar
  variantes   cliente (Início, Pedidos, Carrinho), nenhuma por enquanto no lojista (ver Admin Nav)
  tamanhos    altura fixa 64px + área segura do celular (env(safe-area-inset-bottom))
  estados     item ativo (accent-text + sublinhado), item inativo (muted), badge de contagem no Carrinho
  tokens      bg surface, border-top border, ícone 22px, texto xs/600
  a11y        <nav> com aria-label, item ativo com aria-current="page"
  usado em    S01, S02 (telas do cliente até o carrinho)

StoreHeader
  variantes   expandido (capa + logo, S01), compacto (sem capa, S02 em diante)
  estados     rolando (compacto substitui o expandido com transição motion.base)
  tokens      capa com gradiente escuro embaixo (para o nome não perder contraste
              sobre qualquer foto), logo circular com borda border-input, selo de
              status (success = aberto, muted = fechado) + texto xs
  a11y        logo com alt do nome da loja; selo de aberto/fechado não é só cor,
              tem o texto "Aberto até Xh" ou "Fechado"
  usado em    S01, S02

CategoryTabs
  variantes   fixa no topo ao rolar (sticky), com ícone de "ver todas" à esquerda
  estados     aba ativa (accent-text, sublinhado 2px), inativa (muted), rolagem
              horizontal com indicador de mais conteúdo (sombra lateral sutil)
  tokens      bg surface, aba ativa accent-text sobre bg, fonte sm/600
  a11y        <nav> com role="tablist" seria ideal, mas um conjunto de links com
              aria-current é suficiente e mais simples de testar
  usado em    S01, S02

BestSellerCard (carrossel "Os mais pedidos" / "Peça também")
  variantes   com foto, sem foto (mostra só o nome, fundo surface-raised)
  tamanhos    140×180px aprox., rolagem horizontal com snap
  estados     padrão, sem estoque (sold_out: foto esmaecida + selo "Esgotado")
  tokens      radius lg, shadow card, botão + circular (accent, on-accent) no
              canto, nome sm/600, preço sm/400 muted
  a11y        <button> com aria-label "Adicionar {{produto}}", não só o ícone +
  usado em    S01, S05

ProductRow
  variantes   com descrição, sem descrição, com foto, sem foto
  estados     padrão, esgotado (texto riscado + "Esgotado" em vez do preço)
  tokens      divisor border entre linhas, nome base/600, descrição sm/400 muted
              (2 linhas, depois reticências), preço base/700
  a11y        a linha inteira é um alvo de toque (min 44px de altura)
  usado em    S02

SearchField
  variantes   busca da loja (S01, abre por cima do conteúdo), busca de complementos
              (S03, embutida)
  estados     vazio (placeholder muted), com texto, sem resultado
  tokens      bg surface, border border-input no foco (2px, accent), radius md
  a11y        <input type="search"> com label visualmente oculto, não só placeholder
  usado em    S01, S03

ThemeToggle
  variantes   sol (claro) / lua (escuro)
  estados     claro, escuro — troca data-theme na raiz, salva em localStorage
  tokens      ícone 20px, bg transparente, hover bg surface
  a11y        <button aria-pressed> com aria-label "Alternar tema"
  usado em    S01, S02

OptionGroup
  variantes   seleção única (rádio, max_select=1), múltipla com limite (checkbox
              até N), obrigatório (selo "Obrigatório" ao lado do nome do grupo)
  estados     opção disponível, selecionada, esgotada (desabilitada + "Esgotado"),
              limite atingido (demais botões + desabilitados, não escondidos)
  tokens      nome do grupo base/700 + subtítulo sm/400 muted ("Escolha até N
              itens"), botão + circular 32px accent/on-accent, selecionada vira
              botão − com fundo accent
  a11y        contagem viva anunciada ("3 de 10 selecionados") para leitor de
              tela; erro de obrigatório não preenchido é anunciado, não só vermelho
  usado em    S03

StickyCTA (barra inferior fixa com valor)
  variantes   com total (Avançar R$ 23,00), sem total (Avançar)
  estados     ativo, desabilitado (quantidade zero, campo obrigatório vazio,
              nenhuma opção escolhida), carregando (recalculando o quote)
  tokens      bg accent, texto on-accent base/700, altura 56px, radius md,
              padding horizontal space-4, valor alinhado à direita
  a11y        o texto desabilitado explica o motivo perto do botão, não só o
              botão cinza ("Escolha uma forma de receber o pedido")
  usado em    S03, S05, S06, S07, S08, S09

AddedToCartModal
  variantes   única, centralizada
  estados     aberto, fechando (motion.base)
  tokens      bg surface-raised, radius lg, shadow pop, ilustração própria
              (sacola), stepper de quantidade, campo de observação (textarea sm)
  a11y        foco vai para o modal ao abrir, Esc fecha, foco volta ao botão que
              abriu; fundo com aria-hidden enquanto o modal está aberto
  usado em    S04

QuantityStepper
  variantes   no modal (S04), na linha do carrinho (S05)
  estados     mínimo 1 (botão − vira lixeira ao chegar em 1, no carrinho), máximo
              por estoque se houver controle de estoque
  tokens      botões 32px circulares, border border-input, número base/700 no meio
  a11y        <button aria-label="Diminuir quantidade"> / "Aumentar quantidade";
              o valor atual em aria-live="polite"
  usado em    S04, S05

CartLineItem
  variantes   com foto, sem foto
  estados     padrão, removendo (animação de saída antes de sumir)
  tokens      thumbnail 56×56 radius sm, nome sm/600, preço sm/700, ícone de
              editar (lápis) e excluir (lixeira) à direita
  usado em    S05

IdentifyForm (WhatsApp + nome, sem senha)
  variantes   única
  estados     vazio (CTA desabilitado), parcialmente preenchido, válido, erro de
              formato de telefone
  tokens      campo de telefone com máscara (XX) 9XXXX-XXXX, campo de nome,
              aviso "Ambiente seguro" (badge success) no cabeçalho
  a11y        máscara anunciada ao leitor de tela como formato esperado, não só
              visual; erro de validação ligado ao campo por aria-describedby
  usado em    S06

FulfillmentOption (card de entrega / retirada / consumo no local)
  variantes   entrega (com previsão e taxa), retirada (selo "Grátis"), consumo
              no local (campo de mesa)
  estados     disponível, indisponível (loja não entrega nesta área — mostrar o
              motivo, não escondido), selecionado (borda accent 2px)
  tokens      radix card, radio customizado, ícone por tipo (casa, loja, talheres)
  a11y        grupo de rádio real (<fieldset><legend>), não divs com onClick
  usado em    S07

PaymentMethodOption
  variantes   pagar agora (destaque "Mais rápido" em success), pagar na entrega
              (acordeão com opções internas: na maquininha, dinheiro com troco)
  estados     disponível, selecionado, desabilitado com o motivo ("Pagamento
              online chega em breve" enquanto online_payments_enabled = false)
  tokens      igual ao FulfillmentOption, selo kind="info" em accent-text
  usado em    S08

SummaryRow (endereço, pagamento, cupom — cada um com "Trocar"/"Aplicar")
  variantes   com link de ação, sem link de ação
  estados     preenchido, vazio (placeholder "Adicionar cupom")
  tokens      ícone à esquerda (24px muted), texto base + link accent-text sm/700
  usado em    S07, S08, S09

OrderTotals
  variantes   com desconto, sem desconto, com taxa de entrega, sem taxa
  tokens      linhas sm/400 muted, linha de total base/800 text, divisor border
              antes do total
  usado em    S05, S07, S08, S09

PixPayCard (fase posterior — pagamento online desligado por enquanto)
  variantes   aguardando, pago, expirado
  estados     contador regressivo (aria-live="off", mas com texto alternativo
              lido uma vez por minuto, não a cada segundo), botão copiar com
              confirmação "Copiado!"
  tokens      selo "Ambiente seguro" (success), anel decorrente em accent
  usado em    S10 (hoje fora de uso; entra junto com o Mercado Pago)

WhatsAppOrderButton (decisão do projeto: o cliente envia, a loja não envia sozinha)
  variantes   única, no final da tela de pedido feito (S11, nova)
  estados     padrão, enviado (desabilita por alguns segundos para evitar duplo envio)
  tokens      bg success (verde do próprio WhatsApp fica só no ícone, nunca como
              marca do produto), texto on-accent, ícone de WhatsApp (open-source)
  a11y        <a> real para wa.me, não <div onClick>; abre em nova guia no desktop

OrderStatusBadge
  variantes   aguardando, recebido, aceito, preparando, pronto, saiu para
              entrega, concluído, cancelado, recusado
  tokens      cor por status (neutro → accent → warning → success; cancelado e
              recusado em danger), sempre texto + cor, nunca só a cor
  usado em    S11 (cliente), A02 (painel do lojista)

AdminOrderCard (painel em tempo real, A02)
  variantes   pedido novo (destaque com borda accent + pulso sutil até o lojista
              abrir), em andamento, concluído/arquivado
  estados     normal, com som ativo pendente de confirmação ("Toque para ativar
              o som de novos pedidos" — navegadores bloqueiam som automático)
  tokens      bg surface-raised, borda accent 2px quando novo, botões de ação
              (Aceitar success, Recusar danger) base/700
  a11y        pedido novo é anunciado por aria-live="assertive" além do som, para
              quem usa leitor de tela ou está com o som desligado
  usado em    A02

AdminNav (barra lateral ou superior do painel)
  variantes   desktop (lateral), tablet/celular (inferior, como o BottomBar do
              cliente mas com itens do lojista: Pedidos, Cardápio, Configurações,
              Relatórios)
  tokens      igual ao BottomBar no mobile; no desktop, lateral 240px bg surface
  usado em    A01–A06

PrintSettingToggle (caixa de seleção "Imprimir comanda quando chegar pedido")
  variantes   ligado, desligado
  estados     ligado sem impressora detectável (o navegador não sabe dizer isso
              de verdade — mostrar um aviso neutro "Confirme ao imprimir o
              primeiro pedido", não uma promessa que o código não pode cumprir)
  tokens      switch padrão (accent quando ligado), texto de ajuda sm muted
  usado em    A04 (configurações)

ComandaPrint (folha impressa, fora do tema — sempre clara, para qualquer impressora)
  variantes   bobina 80mm (monoespaçada, largura fixa ~42 colunas), A4 (fase
              posterior, se algum lojista pedir)
  tokens      preto sobre branco, sem cor nenhuma (impressora térmica não imprime
              cor), fonte mono, logo da loja em preto e branco se houver
  usado em    gerado a partir de um pedido aceito, pelo painel (A02)
```

## Próximo (build)

Construir os primitivos acima numa rota isolada (`/design` ou Storybook) antes
de montar qualquer tela, com um print da página como conferência. Base
acessível sugerida: shadcn/ui sobre Radix (o stack já escolhido é Next.js).
Depois disso, `/replica-build` monta S01 em diante a partir do `recon.md`.
