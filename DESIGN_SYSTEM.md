# Natanael Albino Festas — Design System v1

## Direção de marca

A identidade visual do site deve comunicar cinco atributos principais:

- sofisticado
- autoral
- artístico
- contemporâneo
- acolhedor

O site deve se aproximar visualmente de um estúdio de design de eventos e direção artística, evitando uma estética genérica de buffet, loja de balões ou template promocional.

## Paleta institucional

| Token | Hex | Uso principal |
| --- | --- | --- |
| `--ink` | `#241914` | fundos escuros, rodapé, hero |
| `--ink-soft` | `#4A3026` | seções institucionais, CTAs, superfícies secundárias |
| `--paper` | `#F1EAE2` | fundos editoriais e portfólio |
| `--paper-light` | `#FCFAF7` | fundo principal e contraste claro |
| `--mist` | `#B9AFA5` | informação secundária |
| `--accent` | `#B48763` | detalhes, foco, linhas e destaques discretos |
| `--accent-strong` | `#8F6246` | destaques de maior contraste |

Princípio de distribuição: aproximadamente 70% tons claros, 20% marrons profundos e 10% acentos.

## Tipografia

### Display / títulos

**Cormorant Garamond**

Uso: H1, H2, H3 de destaque, títulos de projetos, dados de impacto e frases de assinatura.

Características desejadas:
- peso 500 como padrão;
- tracking levemente negativo;
- entrelinha compacta;
- evitar negrito excessivo.

### Interface / corpo

**Manrope**

Uso: textos corridos, eyebrow labels, botões, navegação, rodapé, indicadores e textos técnicos.

Características desejadas:
- peso 400/500 para leitura;
- peso 700 apenas para labels e CTAs;
- labels em caixa alta devem usar espaçamento entre letras amplo.

## Forma

- raio pequeno: `0.55rem`
- raio médio: `0.9rem`
- raio grande: `1.35rem`
- botões e chips: formato pill

Não usar múltiplos estilos de arredondamento arbitrariamente.

## Sombras

Sombras devem ser discretas e usadas apenas para separar fotografia, cards ou componentes flutuantes do fundo.

Evitar:
- sombras muito escuras;
- glow decorativo;
- vários níveis de profundidade concorrentes.

## Fotografia

A fotografia é o principal elemento visual da marca.

Regras:
- imagens grandes têm prioridade sobre grids muito densos;
- manter proporções consistentes por tipo de projeto;
- evitar filtros artificiais;
- preservar cores reais da decoração;
- usar molduras e sombras discretas;
- não permitir que ornamentos gráficos concorram com as fotografias.

## Botões

### Primário claro

Fundo claro, texto marrom profundo, formato pill. Usado em seções escuras.

### Primário escuro

Fundo `--ink-soft`, texto claro, formato pill. Usado em superfícies claras e ações de compra.

### Estado hover

Mudança deve ser discreta: inversão, escurecimento ou elevação mínima. Evitar efeitos chamativos.

## Espaçamento

O site deve preservar bastante espaço negativo.

Regras gerais:
- seções principais: aproximadamente 96–160 px no desktop;
- conteúdo deve respeitar largura máxima editorial;
- textos longos devem ficar em colunas estreitas de leitura;
- elementos não devem parecer comprimidos no mobile.

## Hierarquia visual

1. fotografia / H1
2. grandes títulos editoriais
3. títulos de projeto e dados de impacto
4. texto explicativo
5. labels e informações auxiliares

Não introduzir novos tamanhos de texto sem necessidade clara.

## Princípios de consistência

Toda nova seção deve reutilizar:
- os mesmos tokens de cor;
- as mesmas duas famílias tipográficas;
- os mesmos raios;
- a mesma lógica de sombra;
- a mesma linguagem de botões;
- a mesma hierarquia de títulos;
- o mesmo ritmo de espaçamento.

A regra principal é reduzir decisões visuais locais. Quanto maior a reutilização do sistema, mais profissional e coerente o site parecerá.
