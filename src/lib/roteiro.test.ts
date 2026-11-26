import { describe, expect, it } from 'vitest';
import { ORDEM_SECOES } from '../data/meta';
import { PERGUNTAS } from '../data/perguntas';
import type { Cenario, Config, Pergunta, Prioridade, Publico } from '../types';
import { contarPerguntas, focosValidos, formatarRoteiro, gerarRoteiro } from './roteiro';

const TODAS: Prioridade[] = ['alarme', 'essencial', 'complementar'];
const CENARIOS: Cenario[] = ['ps', 'ubs', 'retorno', 'pre-exame', 'gineco'];
const PUBLICOS: Publico[] = ['adulto', 'pediatrico'];

function cfg(parcial: Partial<Config> = {}): Config {
  return { cenario: 'ubs', publico: 'adulto', focos: [], prioridades: TODAS, busca: '', ...parcial };
}

function ids(config: Config, banco: Pergunta[] = PERGUNTAS): string[] {
  return gerarRoteiro(banco, config).flatMap((s) => s.perguntas.map((p) => p.id));
}

describe('banco de perguntas', () => {
  it('não tem ids repetidos', () => {
    const lista = PERGUNTAS.map((p) => p.id);
    expect(new Set(lista).size).toBe(lista.length);
  });

  it('não tem textos vazios', () => {
    for (const p of PERGUNTAS) expect(p.texto.trim().length).toBeGreaterThan(0);
  });

  it('toda pergunta específica de um cenário aparece na ordem de seções desse cenário', () => {
    for (const p of PERGUNTAS) {
      for (const c of p.cenarios ?? []) {
        expect(ORDEM_SECOES[c]).toContain(p.secao);
      }
    }
  });

  it('gera roteiro não vazio para toda combinação de cenário e público', () => {
    for (const cenario of CENARIOS) {
      for (const publico of PUBLICOS) {
        expect(contarPerguntas(gerarRoteiro(PERGUNTAS, cfg({ cenario, publico })))).toBeGreaterThan(10);
      }
    }
  });
});

describe('gerarRoteiro', () => {
  it('perguntas de foco só aparecem com o foco ativo', () => {
    expect(ids(cfg())).not.toContain('orto-mecanismo');
    expect(ids(cfg({ focos: ['ortopedia'] }))).toContain('orto-mecanismo');
    expect(ids(cfg())).not.toContain('ex-cp-linfonodos');
    expect(ids(cfg({ focos: ['cabeca'] }))).toContain('ex-cp-linfonodos');
  });

  it('filtra por público', () => {
    expect(ids(cfg({ publico: 'pediatrico' }))).toContain('ident-informante');
    expect(ids(cfg({ publico: 'adulto' }))).not.toContain('ident-informante');
  });

  it('usa o texto pediátrico quando existe', () => {
    const secoes = gerarRoteiro(PERGUNTAS, cfg({ publico: 'pediatrico' }));
    const queixa = secoes.flatMap((s) => s.perguntas).find((p) => p.id === 'queixa-principal');
    expect(queixa?.texto).toContain('criança');
  });

  it('ignora o foco "pessoa idosa" no público pediátrico', () => {
    expect(focosValidos(['idoso', 'mental'], 'pediatrico')).toEqual(['mental']);
    expect(ids(cfg({ publico: 'pediatrico', focos: ['idoso'] }))).not.toContain('idoso-quedas');
  });

  it('ajusta a prioridade conforme o cenário', () => {
    const alergia = (cenario: Cenario) =>
      gerarRoteiro(PERGUNTAS, cfg({ cenario }))
        .flatMap((s) => s.perguntas)
        .find((p) => p.id === 'med-alergias');
    expect(alergia('ps')?.prioridade).toBe('alarme');
    expect(alergia('ubs')?.prioridade).toBe('essencial');
  });

  it('respeita o filtro de prioridades', () => {
    const secoes = gerarRoteiro(PERGUNTAS, cfg({ prioridades: ['alarme'] }));
    for (const p of secoes.flatMap((s) => s.perguntas)) expect(p.prioridade).toBe('alarme');
  });

  it('ordena alarme antes de essencial e complementar dentro da seção', () => {
    const peso = { alarme: 0, essencial: 1, complementar: 2 };
    for (const secao of gerarRoteiro(PERGUNTAS, cfg({ focos: ['ortopedia', 'cabeca'] }))) {
      const pesos = secao.perguntas.map((p) => peso[p.prioridade]);
      expect(pesos).toEqual([...pesos].sort((a, b) => a - b));
    }
  });

  it('segue a ordem de seções do cenário (PS: alarme logo após a queixa)', () => {
    const secoes = gerarRoteiro(PERGUNTAS, cfg({ cenario: 'ps' })).map((s) => s.id);
    expect(secoes.indexOf('alarme')).toBe(secoes.indexOf('queixa') + 1);
  });

  it('busca ignora acentos e maiúsculas', () => {
    const achadas = ids(cfg({ busca: 'OCUPACAO' }));
    expect(achadas.length).toBeGreaterThan(0);
  });

  it('inclui perguntas personalizadas em qualquer cenário', () => {
    const minha: Pergunta = {
      id: 'minha-1',
      secao: 'minhas',
      prioridade: 'essencial',
      texto: 'Pergunta própria?',
      personalizada: true,
    };
    for (const cenario of CENARIOS) {
      expect(ids(cfg({ cenario, prioridades: ['alarme'] }), [...PERGUNTAS, minha])).toContain('minha-1');
    }
  });
});

describe('formatarRoteiro', () => {
  const config = cfg({ cenario: 'ps', focos: ['ortopedia'] });
  const secoes = gerarRoteiro(PERGUNTAS, config);

  it('monta o cabeçalho com cenário, público e focos', () => {
    const texto = formatarRoteiro(secoes, config, { data: new Date(2026, 10, 25) });
    expect(texto).toContain('Pronto-socorro · Adulto');
    expect(texto).toContain('Focos: Ortopedia / trauma');
    expect(texto).toContain('25/11/2026');
  });

  it('marca perguntas de alarme com [!]', () => {
    expect(formatarRoteiro(secoes, config)).toContain('[!] ');
  });

  it('copia só as marcadas quando informado', () => {
    const texto = formatarRoteiro(secoes, config, { somenteIds: new Set(['queixa-tempo']) });
    expect(texto).toContain('Há quanto tempo isso começou?');
    expect(texto).not.toContain('O que trouxe você aqui hoje?');
  });

  it('inclui dicas apenas quando pedido', () => {
    expect(formatarRoteiro(secoes, config)).not.toContain('↳');
    expect(formatarRoteiro(secoes, config, { incluirDicas: true })).toContain('↳');
  });
});
