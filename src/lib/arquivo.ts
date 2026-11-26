import type { Cenario, Config, Foco, Pergunta, Prioridade, Publico } from '../types';

/** Formato do arquivo .json exportado/importado pelo AnamneseKit. */
export interface Atendimento {
  app: 'anamnesekit';
  versao: 1;
  exportadoEm: string;
  titulo: string;
  config: Config;
  marcadas: string[];
  respostas: Record<string, string>;
  personalizadas: Pergunta[];
}

const CENARIOS: Cenario[] = ['ps', 'ubs', 'retorno', 'pre-exame', 'gineco'];
const PUBLICOS: Publico[] = ['adulto', 'pediatrico'];
const FOCOS: Foco[] = ['ortopedia', 'cabeca', 'idoso', 'mental', 'funcional'];
const PRIORIDADES: Prioridade[] = ['alarme', 'essencial', 'complementar'];

export function criarAtendimento(dados: Omit<Atendimento, 'app' | 'versao' | 'exportadoEm'>): Atendimento {
  return { app: 'anamnesekit', versao: 1, exportadoEm: new Date().toISOString(), ...dados };
}

const ehObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const listaDeTextos = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

function lerConfig(v: unknown): Config {
  const c = ehObjeto(v) ? v : {};
  const cenario = CENARIOS.includes(c.cenario as Cenario) ? (c.cenario as Cenario) : 'ubs';
  const publico = PUBLICOS.includes(c.publico as Publico) ? (c.publico as Publico) : 'adulto';
  const focos = listaDeTextos(c.focos).filter((f): f is Foco => FOCOS.includes(f as Foco));
  const prioridades = listaDeTextos(c.prioridades).filter((p): p is Prioridade =>
    PRIORIDADES.includes(p as Prioridade),
  );
  return {
    cenario,
    publico,
    focos,
    prioridades: prioridades.length ? prioridades : [...PRIORIDADES],
    busca: '',
  };
}

function lerPersonalizadas(v: unknown): Pergunta[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter(ehObjeto)
    .filter((p) => typeof p.id === 'string' && typeof p.texto === 'string' && p.texto.trim())
    .map((p) => ({
      id: String(p.id),
      secao: 'minhas' as const,
      prioridade: 'essencial' as const,
      texto: String(p.texto).trim().slice(0, 240),
      personalizada: true,
    }));
}

function lerRespostas(v: unknown): Record<string, string> {
  if (!ehObjeto(v)) return {};
  const saida: Record<string, string> = {};
  for (const [id, texto] of Object.entries(v)) {
    if (typeof texto === 'string' && texto.trim()) saida[id] = texto;
  }
  return saida;
}

/** Valida e normaliza um arquivo .json. Lança Error com mensagem amigável se for inválido. */
export function lerAtendimento(texto: string): Atendimento {
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    throw new Error('O arquivo não é um JSON válido.');
  }
  if (!ehObjeto(bruto) || bruto.app !== 'anamnesekit') {
    throw new Error('Este arquivo não foi exportado pelo AnamneseKit.');
  }
  return {
    app: 'anamnesekit',
    versao: 1,
    exportadoEm: typeof bruto.exportadoEm === 'string' ? bruto.exportadoEm : '',
    titulo: typeof bruto.titulo === 'string' ? bruto.titulo.slice(0, 120) : '',
    config: lerConfig(bruto.config),
    marcadas: listaDeTextos(bruto.marcadas),
    respostas: lerRespostas(bruto.respostas),
    personalizadas: lerPersonalizadas(bruto.personalizadas),
  };
}

/** Uma pergunta por linha (ignora linhas vazias, marcadores de lista e comentários com #). */
export function lerPerguntasDeTexto(texto: string): string[] {
  const vistas = new Set<string>();
  return texto
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)]|\[[ xX!]?\])\s*/, '').trim())
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('■'))
    .map((l) => l.slice(0, 240))
    .filter((l) => {
      const chave = l.toLowerCase();
      if (vistas.has(chave)) return false;
      vistas.add(chave);
      return true;
    });
}

export function nomeDeArquivo(titulo: string, extensao: string, data = new Date()): string {
  const base =
    titulo
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'atendimento';
  const dois = (n: number) => String(n).padStart(2, '0');
  const dia = `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`;
  return `anamnese-${base}-${dia}.${extensao}`;
}

export function baixarArquivo(nome: string, conteudo: string, tipo: string): boolean {
  try {
    const blob = new Blob([conteudo], { type: `${tipo};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}
