# Política de segurança

Este repositório publica uma landing page estática no GitHub Pages. Não há backend, autenticação, banco de dados ou processamento próprio de pagamentos neste projeto.

## Princípios

- Todo conteúdo e recurso do site deve ser servido por HTTPS.
- Credenciais, tokens, senhas, chaves privadas e segredos de APIs nunca devem ser incluídos em HTML, CSS, JavaScript, commits, issues ou arquivos públicos.
- Identificadores destinados ao navegador, como o Measurement ID do Google Analytics, são configuração pública e não devem ser tratados como segredos.
- Integrações que exijam segredo devem usar um backend ou função server-side e armazenar o segredo no gerenciador de variáveis/segredos do provedor.
- Dependências e GitHub Actions devem permanecer atualizadas; as Actions deste repositório são fixadas por SHA e monitoradas pelo Dependabot.

## Formulários

Atualmente o site não possui formulários HTML. A auditoria automática bloqueia a introdução de um `<form>` sem revisão explícita de segurança.

Se um formulário for criado no futuro, ele deverá usar um endpoint server-side dedicado com, no mínimo:

- validação e normalização dos dados no servidor;
- limite de tamanho e tipos de campos aceitos;
- rate limiting;
- proteção automatizada contra bots/spam;
- verificação de origem quando aplicável;
- proteção CSRF quando houver autenticação baseada em cookies;
- logs sem senhas, tokens ou dados pessoais desnecessários;
- mensagens de erro que não revelem detalhes internos;
- política CSP `form-action` limitada exclusivamente ao endpoint necessário.

## GitHub Pages e headers HTTP

O GitHub Pages deve permanecer com **Enforce HTTPS** habilitado para o domínio personalizado.

O GitHub Pages não oferece configuração arbitrária de headers HTTP por arquivo do repositório. Portanto, controles como HSTS, `X-Content-Type-Options`, `Permissions-Policy` e proteção completa contra framing/clickjacking precisam ser aplicados em uma camada de edge/proxy que permita controlar os headers, ou em uma hospedagem que ofereça essa capacidade.

No código da página, uma Content Security Policy por `<meta http-equiv>` pode complementar essa proteção, mas não substitui todos os headers HTTP e não suporta diretivas como `frame-ancestors`.

## Domínio e DNS

- Manter o domínio personalizado verificado na conta GitHub que publica o site.
- Evitar registros DNS wildcard para o domínio do GitHub Pages.
- Remover registros DNS antigos quando a hospedagem mudar para reduzir risco de takeover do domínio.
- Manter acesso ao registrador e à conta GitHub protegido por autenticação multifator.

## Auditoria automática

O workflow `.github/workflows/security.yml` executa:

- bloqueio de referências inseguras por HTTP;
- bloqueio de handlers JavaScript inline;
- detecção de primitivas perigosas como `eval` e `document.write`;
- detecção básica de formatos conhecidos de credenciais;
- validação de links externos com `target="_blank"`;
- bloqueio preventivo de novos formulários sem revisão;
- análise estática JavaScript com CodeQL.

Esses controles são complementares e não substituem revisão de código e configuração segura da infraestrutura.
