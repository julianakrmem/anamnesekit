# AnamneseKit

[![CI e deploy](https://github.com/julianakrmem/anamnesekit/actions/workflows/deploy.yml/badge.svg)](https://github.com/julianakrmem/anamnesekit/actions/workflows/deploy.yml)

**Acesse:** <https://julianakrmem.github.io/anamnesekit/>

**Gerador de roteiros de anamnese sob medida**: uma "caixa de ferramentas de perguntas" que se adapta ao contexto real de quem está atendendo ou treinando.

Em vez de um roteiro gigante e engessado, o AnamneseKit cruza **tipo de consulta × público × recorte clínico/funcional** e entrega só o que importa naquela hora, já na ordem certa para cada cenário.

## Funcionalidades

| Recurso | O que faz |
| --- | --- |
| **5 cenários** | Pronto-socorro, UBS/atenção primária, retorno, pré-exame/procedimento e consulta ginecológica. Cada um muda a ordem das seções e a prioridade das perguntas. |
| **Adulto ou pediátrico** | Troca o texto das perguntas para falar com o responsável, inclui informante, desenvolvimento, vacinação, rotina escolar e sinais de alarme pediátricos. |
| **Recortes temáticos** | Ortopedia/trauma, cabeça e pescoço, pessoa idosa e saúde mental, com sinais de alarme próprios. |
| **Cabeça e pescoço** | Anamnese dirigida (cefaleia, olhos, ouvidos, nariz, boca, pescoço, tireoide, sono) e **roteiro de exame físico** em sequência: inspeção, olhos, otoscopia, rinoscopia, oroscopia, linfonodos, tireoide, vasos e pares cranianos. |
| **Olhar funcional (AVDs)** | Impacto nas atividades de vida diária, adaptações, trabalho/escola e meta centrada na pessoa (Katz, Lawton, brincar). |
| **Prioridades** | Alarme, essencial e complementar. No PS, "complementar" começa desligado para manter o roteiro enxuto. |
| **"Por que perguntar?"** | Cada pergunta-chave traz o raciocínio clínico por trás dela. |
| **Marcar e copiar** | Marque o que vai usar e copie o roteiro pronto (com ou sem dicas) para o prontuário, caderno ou app de notas. |
| **Modo estudo** | Esconde as perguntas para treinar de memória, com autoavaliação ("lembrei / não lembrei") e barra de progresso. |
| **Perguntas próprias** | Adicione suas perguntas; elas ficam salvas no navegador. |
| **Impressão** | Layout de impressão limpo, só com o roteiro. |

Tudo roda no navegador, sem backend e sem coletar dados: as preferências ficam no `localStorage`.

## Como rodar

Pré-requisito: [Node.js](https://nodejs.org) 18 ou superior.

```bash
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (normalmente `http://localhost:5173`).

Outros comandos:

```bash
npm test           # testes do motor de roteiros (Vitest)
npm run typecheck  # verificação de tipos
npm run build      # versão de produção em dist/
npm run preview    # serve a versão de produção
```

## Publicar no GitHub Pages

O repositório já inclui o workflow `.github/workflows/deploy.yml`, que verifica os tipos, roda os testes, gera o build e publica.

1. Suba o projeto para um repositório no GitHub.
2. Em **Settings → Pages**, em *Source*, escolha **GitHub Actions**.
3. Faça um push na branch `main`: o site é publicado automaticamente.

## Estrutura

```
src/
├── types.ts               # tipos: cenário, público, foco, prioridade, pergunta
├── data/
│   ├── meta.ts            # nomes, descrições e ordem das seções por cenário
│   └── perguntas.ts       # banco de perguntas (fácil de editar e ampliar)
├── lib/
│   ├── roteiro.ts         # motor: filtra, prioriza, ordena e formata o roteiro
│   ├── roteiro.test.ts    # testes do motor
│   └── storage.ts         # persistência local e cópia para a área de transferência
├── components/
│   ├── PainelConfig.tsx   # seleção de cenário, público, focos e prioridades
│   ├── SecaoCard.tsx      # seção recolhível do roteiro
│   ├── PerguntaItem.tsx   # pergunta, dica e modo estudo
│   └── NovaPergunta.tsx   # formulário de perguntas próprias
├── App.tsx
├── main.tsx
└── styles.css
```

### Como adicionar uma pergunta ao banco

Em `src/data/perguntas.ts`:

```ts
{
  id: 'orto-exemplo',              // único
  secao: 'ortopedia',
  prioridade: 'essencial',         // 'alarme' | 'essencial' | 'complementar'
  texto: 'Pergunta para adulto',
  textoPed: 'Versão para o responsável', // opcional
  dica: 'Por que perguntar',             // opcional
  cenarios: ['ps', 'ubs'],               // opcional: ausente = todos
  publicos: ['adulto'],                  // opcional: ausente = ambos
  focos: ['ortopedia'],                  // opcional: só aparece com o foco ativo
  prioridadePor: { ps: 'alarme' },       // opcional: ajusta por cenário
}
```

## Tecnologias

React 19 · TypeScript · Vite · Vitest · CSS puro (tema claro/escuro automático)

## Aviso

Material **educativo**, para estudo e apoio ao atendimento. Não substitui o julgamento clínico, os protocolos do serviço nem as diretrizes vigentes. Recomendações de rastreamento mudam com o tempo: confira sempre a orientação atual do Ministério da Saúde.

## Autoria

Desenvolvido por **Juliana Carmem Costa**, estudante de Medicina (FAG) e de Terapia Ocupacional.

- Lattes: <http://lattes.cnpq.br/8502192893322594>
- ORCID: [0009-0007-8636-3695](https://orcid.org/0009-0007-8636-3695)

Licença [MIT](LICENSE).
