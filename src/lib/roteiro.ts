import { CENARIOS, FOCOS, ORDEM_SECOES, PRIORIDADES, PUBLICOS, SECOES } from '../data/meta';
import type {
  Config,
  Foco,
  Pergunta,
  PerguntaResolvida,
  Prioridade,
  Publico,
  SecaoResolvida,
} from '../types';

const PESO_PRIORIDADE: Record<Prioridade, number> = { alarme: 0, essencial: 1, complementar: 2 };

/** Remove focos que não se aplicam ao público (ex.: "pessoa idosa" no pediátrico). */
export function focosValidos(focos: Foco[], publico: Publico): Foco[] {
  return focos.filter((f) => !(FOCOS[f].apenasAdulto && publico === 'pediatrico'));
}

function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function perguntaSeAplica(p: Pergunta, config: Config): boolean {
  if (p.personalizada) return true;
  if (p.cenarios && !p.cenarios.includes(config.cenario)) return false;
  if (p.publicos && !p.publicos.includes(config.publico)) return false;
  if (p.focos) {
    const ativos = focosValidos(config.focos, config.publico);
    if (!p.focos.some((f) => ativos.includes(f))) return false;
  }
  return true;
}

export function resolverPergunta(p: Pergunta, config: Config): PerguntaResolvida {
  const prioridade = p.prioridadePor?.[config.cenario] ?? p.prioridade;
  const texto = config.publico === 'pediatrico' && p.textoPed ? p.textoPed : p.texto;
  return {
    id: p.id,
    secao: p.secao,
    prioridade,
    texto,
    dica: p.dica,
    personalizada: p.personalizada,
  };
}

/**
 * Cruza cenário × público × focos × prioridades × busca
 * e devolve as seções na ordem certa para aquele cenário.
 */
export function gerarRoteiro(banco: Pergunta[], config: Config): SecaoResolvida[] {
  const termo = normalizar(config.busca.trim());

  const resolvidas = banco
    .filter((p) => perguntaSeAplica(p, config))
    .map((p) => resolverPergunta(p, config))
    .filter((p) => p.personalizada || config.prioridades.includes(p.prioridade))
    .filter((p) => !termo || normalizar(p.texto + ' ' + (p.dica ?? '')).includes(termo));

  return ORDEM_SECOES[config.cenario]
    .map((secaoId) => {
      const perguntas = resolvidas
        .filter((p) => p.secao === secaoId)
        // ordenação estável: alarme → essencial → complementar, mantendo a ordem do banco
        .map((p, i) => ({ p, i }))
        .sort(
          (a, b) => PESO_PRIORIDADE[a.p.prioridade] - PESO_PRIORIDADE[b.p.prioridade] || a.i - b.i,
        )
        .map(({ p }) => p);
      return { id: secaoId, titulo: SECOES[secaoId], perguntas };
    })
    .filter((s) => s.perguntas.length > 0);
}

export function contarPerguntas(secoes: SecaoResolvida[]): number {
  return secoes.reduce((total, s) => total + s.perguntas.length, 0);
}

/** Texto pronto para colar no prontuário, no caderno ou num app de notas. */
export function formatarRoteiro(
  secoes: SecaoResolvida[],
  config: Config,
  opcoes: {
    somenteIds?: Set<string>;
    incluirDicas?: boolean;
    respostas?: Record<string, string>;
    titulo?: string;
    data?: Date;
  } = {},
): string {
  const { somenteIds, incluirDicas = false, respostas, titulo, data = new Date() } = opcoes;
  const focos = focosValidos(config.focos, config.publico).map((f) => FOCOS[f].nome);

  const linhas: string[] = [
    `${respostas && Object.values(respostas).some((r) => r.trim()) ? 'ANAMNESE' : 'ROTEIRO DE ANAMNESE'} — ${
      CENARIOS[config.cenario].nome
    } · ${PUBLICOS[config.publico].nome}`,
  ];
  if (titulo?.trim()) linhas.push(`Atendimento: ${titulo.trim()}`);
  if (focos.length) linhas.push(`Focos: ${focos.join(', ')}`);
  linhas.push(`Gerado em ${data.toLocaleDateString('pt-BR')} com AnamneseKit`);

  for (const secao of secoes) {
    const perguntas = somenteIds
      ? secao.perguntas.filter((p) => somenteIds.has(p.id))
      : secao.perguntas;
    if (!perguntas.length) continue;

    linhas.push('', `■ ${secao.titulo.toUpperCase()}`);
    for (const p of perguntas) {
      const marcador = p.prioridade === 'alarme' ? '[!]' : '[ ]';
      linhas.push(`${marcador} ${p.texto}`);
      const resposta = respostas?.[p.id]?.trim();
      if (resposta) {
        const rotulo = p.secao.startsWith('exame') ? 'Achados' : 'R';
        resposta.split(/\r?\n/).forEach((linha, i) =>
          linhas.push(`    ${i === 0 ? `${rotulo}: ` : ' '.repeat(rotulo.length + 2)}${linha}`),
        );
      }
      if (incluirDicas && p.dica) linhas.push(`    ↳ ${p.dica}`);
    }
  }

  linhas.push('', `[!] = ${PRIORIDADES.alarme.descricao.toLowerCase()}`);
  linhas.push('Material educativo: não substitui o julgamento clínico nem protocolos do serviço.');
  return linhas.join('\n');
}
