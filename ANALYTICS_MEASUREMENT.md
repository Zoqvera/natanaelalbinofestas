# Analytics e mensuração

Este documento define o modelo de mensuração do site Natanael Albino Festas. O objetivo é distinguir navegação, intenção, lead e receita confirmada sem inflar conversões.

## Princípios

1. Eventos devem representar fatos observáveis.
2. Um clique externo não confirma uma ação concluída fora do site.
3. Nenhum dado pessoal ou conteúdo digitado em formulários deve ser enviado ao GA4.
4. Parâmetros devem ter significado estável entre páginas.
5. Eventos de diagnóstico e eventos de negócio devem permanecer distintos.
6. Implementações futuras devem reutilizar a camada central de `analytics.js`.

## Taxonomia de eventos

| Evento | Momento | Finalidade |
| --- | --- | --- |
| `page_view` | página visualizada | base de aquisição e navegação |
| `scroll_depth` | 25%, 50%, 75% ou 90% da página | profundidade de consumo |
| `whatsapp_click` | clique em link do WhatsApp | interação específica com o canal |
| `generate_lead` | início de contato pelo WhatsApp | conversão de lead |
| `view_item` | seção do Método Orgânico visualizada | interesse no curso |
| `begin_checkout` | checkout da Hotmart aberto | intenção de compra |
| `form_start` | primeiro foco ou preenchimento de formulário instrumentado | início de formulário |
| `form_submit` | formulário enviado | conclusão do formulário no navegador |
| `form_abandonment` | página abandonada após início sem envio | diagnóstico de fricção |
| `sign_up` | cadastro confirmado | conclusão de cadastro |
| `purchase` | pagamento realmente confirmado | receita |

## Parâmetros padronizados

Eventos de links podem incluir:

- `page_path`;
- `page_title`;
- `cta_location`;
- `link_domain`;
- `link_url`;
- `link_text`;
- `method`.

Eventos de formulário podem incluir:

- `form_id`;
- `form_name`;
- `form_destination`;
- `form_type`;
- `page_path`;
- `page_title`.

Nunca enviar valores preenchidos, nome, telefone, e-mail ou qualquer identificador pessoal.

## Funil de contratação de decoração

Funil principal:

1. `page_view`;
2. engajamento com a página, analisado por `scroll_depth` quando útil;
3. `whatsapp_click`;
4. `generate_lead`.

`whatsapp_click` e `generate_lead` ocorrem no mesmo clique por motivos analíticos diferentes: o primeiro permite estudar o canal e a posição do CTA; o segundo representa a conversão de lead recomendada para análise de negócio.

Dimensões úteis para segmentar o funil:

- página de entrada;
- source / medium;
- default channel group;
- campaign;
- dispositivo;
- cidade ou região agregada disponibilizada pelo GA4;
- `cta_location`.

## Funil do Método Orgânico

Funil atual:

1. `page_view`;
2. `view_item`;
3. `begin_checkout`.

Funil completo, após integração de pagamento:

1. `page_view`;
2. `view_item`;
3. `begin_checkout`;
4. `purchase`.

O navegador não deve emitir `purchase` somente porque abriu a Hotmart. A venda precisa ser confirmada por uma fonte confiável.

## Formulários

Formulários que precisarem de mensuração explícita devem receber `data-analytics-form`, por exemplo:

```html
<form data-analytics-form="orcamento" name="orcamento">
  ...
</form>
```

A camada central registra início, envio e abandono sem coletar os valores dos campos.

Se a medição automática de interações com formulários do GA4 estiver ativada, evitar instrumentar o mesmo formulário duas vezes. Escolha uma única fonte para `form_start` e `form_submit` para não duplicar eventos.

## Cadastros

Quando existir um fluxo de cadastro, o evento deve ser disparado somente depois da confirmação de sucesso:

```js
window.NatanaelAnalytics?.trackConfirmedSignup("website");
```

O método pode ser ajustado para representar a origem funcional do cadastro, sem incluir dados pessoais.

## Pagamentos

Quando houver confirmação confiável da Hotmart ou de outro provedor, o evento pode ser enviado pela integração apropriada. A função disponível no navegador exige ID da transação e valor válido:

```js
window.NatanaelAnalytics?.trackConfirmedPurchase({
  transactionId: "TRANSACTION_ID",
  value: 199.9,
  currency: "BRL",
});
```

Esse exemplo é apenas o contrato da função. Não inserir IDs ou valores fictícios em produção.

Para uma implementação robusta, preferir uma confirmação fornecida pela plataforma de pagamento ou uma integração de servidor em vez de inferência no navegador.

## Origem dos visitantes

A origem deve ser analisada principalmente pelos relatórios de Aquisição do GA4:

- source / medium;
- session source / medium;
- default channel group;
- campaign;
- landing page.

Campanhas próprias devem usar UTMs consistentes. Convenção recomendada:

- `utm_source`: plataforma ou parceiro;
- `utm_medium`: tipo de mídia;
- `utm_campaign`: campanha;
- `utm_content`: variação do criativo quando necessário.

Não inserir dados pessoais em parâmetros UTM.

## Google Search Console

Vincular a propriedade do Search Console ao fluxo Web do GA4 permite combinar desempenho orgânico com comportamento no site.

Depois da vinculação, acompanhar principalmente:

- consultas de pesquisa;
- cliques orgânicos;
- impressões;
- CTR;
- posição média;
- páginas de destino orgânicas;
- conversões geradas por essas páginas no GA4.

## Explorações recomendadas no GA4

### Funil de decoração

`page_view` → `generate_lead`

Segmentar por `Landing page`, `Session source / medium`, dispositivo e `cta_location`.

### Funil do curso

`page_view` → `view_item` → `begin_checkout` → `purchase`

O último passo só deve ser incluído quando a integração de pagamento estiver efetivamente produzindo eventos confirmados.

### Diagnóstico de formulário

`form_start` → `form_submit`

Comparar usuários que concluíram com usuários que emitiram `form_abandonment`. Segmentar por página, dispositivo e origem.

## Eventos principais

Recomendação inicial:

- `generate_lead`: sim;
- `begin_checkout`: opcional como microconversão;
- `purchase`: sim, quando integrado;
- `sign_up`: sim, caso um cadastro real seja criado;
- `whatsapp_click`: não, manter como diagnóstico do canal;
- `scroll_depth`: não;
- `form_start`: não;
- `form_abandonment`: não.

## Checklist de validação

Antes de considerar uma nova mensuração pronta:

- validar no GA4 Tempo real ou DebugView;
- confirmar que o evento ocorre uma única vez por ação;
- conferir parâmetros e nomes;
- verificar se nenhum dado pessoal é enviado;
- testar consentimento aceito e recusado;
- confirmar que cliques de WhatsApp registram `whatsapp_click` e `generate_lead`;
- confirmar que a Hotmart registra somente `begin_checkout` até existir confirmação de compra;
- revisar funis após acumular volume suficiente de dados.
