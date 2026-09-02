# Natanael Albino Festas

Landing page institucional da Natanael Albino Festas, publicada em `natanaelalbinofestas.com`.

## Estrutura

- `index.html`: página principal e metadados;
- `styles.css` e arquivos CSS especializados: identidade visual e responsividade;
- `script.js`: comportamento da interface e melhorias progressivas;
- `analytics.js`: consentimento, Google Analytics 4 e eventos de conversão;
- `analytics.css`: estilos compartilhados de consentimento e preferências de privacidade;
- `ANALYTICS_MEASUREMENT.md`: taxonomia de eventos, funis, atribuição e regras de qualidade de dados;
- `assets/`: imagens e ícones;
- `CNAME`: domínio personalizado do GitHub Pages.

## Publicação no GitHub Pages

Nas configurações do repositório, acesse **Settings → Pages** e selecione:

- **Source:** Deploy from a branch;
- **Branch:** `main`;
- **Folder:** `/ (root)`.

O domínio personalizado esperado é `natanaelalbinofestas.com`. Depois que o DNS estiver apontado para o GitHub Pages, mantenha **Enforce HTTPS** ativado.

## Analytics e mensuração

O site usa Google Analytics 4 com o ID `G-BGMFE51RB6` e consentimento explícito. A tag só é carregada após o visitante aceitar cookies de análise; sinais e armazenamento de publicidade permanecem desativados.

Eventos implementados:

- `whatsapp_click`: clique em qualquer link reconhecido como WhatsApp;
- `generate_lead`: lead iniciado por WhatsApp;
- `view_item`: visualização da seção do Método Orgânico na página principal;
- `begin_checkout`: abertura do checkout da Hotmart;
- `scroll_depth`: profundidade de 25%, 50%, 75% e 90%;
- `form_start`: início de formulário explicitamente instrumentado;
- `form_submit`: envio de formulário explicitamente instrumentado;
- `form_abandonment`: saída da página após iniciar e não enviar formulário;
- `sign_up`: disponível para ser disparado quando houver cadastro confirmado;
- `purchase`: disponível para ser disparado somente após confirmação real de pagamento.

A camada de Analytics está carregada na home e em todas as páginas de conteúdo e atendimento indexáveis atuais.

### Eventos principais no GA4

Recomenda-se marcar como eventos principais:

- `generate_lead`;
- `begin_checkout`, quando o início de compra for relevante como microconversão;
- `purchase`, somente depois de integrar uma confirmação real da Hotmart;
- `sign_up`, somente se um fluxo de cadastro for implementado e o cadastro concluído tiver valor de negócio.

`whatsapp_click`, `scroll_depth`, `form_start` e `form_abandonment` são eventos diagnósticos e não devem ser tratados automaticamente como conversões finais.

### Limitações atuais

O site estático ainda não possui formulário nem fluxo de cadastro próprio. Portanto, os eventos de formulário e `sign_up` estão preparados, mas não serão emitidos até esses fluxos existirem.

O clique para a Hotmart representa apenas `begin_checkout`. Uma venda não deve ser inferida a partir desse clique. O evento `purchase` exige confirmação da própria Hotmart, de uma página de confirmação confiável ou de uma integração de servidor.

Consulte `ANALYTICS_MEASUREMENT.md` para o desenho completo dos funis e da atribuição.

## SEO e Search Console

O site inclui títulos e descrições, URLs canônicas, Open Graph, dados estruturados, `robots.txt`, `sitemap.xml`, páginas orientadas a intenção de busca e links internos.

No Google Search Console:

1. mantenha a propriedade de `https://natanaelalbinofestas.com/` verificada;
2. mantenha `https://natanaelalbinofestas.com/sitemap.xml` enviado;
3. acompanhe indexação, consultas, páginas, países, dispositivos e Core Web Vitals;
4. vincule a propriedade do Search Console ao fluxo Web correspondente do GA4 para analisar consultas e páginas de destino junto dos dados de comportamento.

## Privacidade

Nenhum nome, e-mail, telefone, texto de formulário ou outro dado pessoal deve ser enviado ao Google Analytics. Parâmetros de campanha e eventos devem conter apenas informações de marketing e contexto da interface.
