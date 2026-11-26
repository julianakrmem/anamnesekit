import { describe, expect, it } from 'vitest';
import { PERGUNTAS } from '../data/perguntas';
import type { Config } from '../types';
import { criarAtendimento, lerAtendimento, lerPerguntasDeTexto, nomeDeArquivo } from './arquivo';
import { formatarRoteiro, gerarRoteiro } from './roteiro';

const config: Config = {
  cenario: 'retorno',
  publico: 'adulto',
  focos: ['ortopedia'],
  prioridades: ['alarme', 'essencial'],
  busca: 'algo',
};

describe('exportar e importar atendimento (.json)', () => {
  it('ida e volta preserva configuração, marcações, respostas e perguntas próprias', () => {
    const original = criarAtendimento({
      titulo: 'Caso 3',
      config,
      marcadas: ['queixa-tempo'],
      respostas: { 'queixa-tempo': 'Há 2 semanas' },
      personalizadas: [
        { id: 'minha-1', secao: 'minhas', prioridade: 'essencial', texto: 'Própria?', personalizada: true },
      ],
    });
    const lido = lerAtendimento(JSON.stringify(original));
    expect(lido.titulo).toBe('Caso 3');
    expect(lido.config.cenario).toBe('retorno');
    expect(lido.config.focos).toEqual(['ortopedia']);
    expect(lido.config.busca).toBe('');
    expect(lido.marcadas).toEqual(['queixa-tempo']);
    expect(lido.respostas).toEqual({ 'queixa-tempo': 'Há 2 semanas' });
    expect(lido.personalizadas.length).toBe(1);
  });

  it('recusa JSON inválido ou de outro app', () => {
    expect(() => lerAtendimento('{oi')).toThrow('JSON válido');
    expect(() => lerAtendimento('{"app":"outro"}')).toThrow('AnamneseKit');
  });

  it('descarta valores inválidos em vez de quebrar', () => {
    const lido = lerAtendimento(
      JSON.stringify({
        app: 'anamnesekit',
        config: { cenario: 'marte', publico: 'gato', focos: ['ortopedia', 'xyz'], prioridades: [] },
        marcadas: ['a', 3],
        respostas: { a: 'ok', b: 5, c: '   ' },
        personalizadas: [{ id: 'x' }, 'lixo'],
      }),
    );
    expect(lido.config.cenario).toBe('ubs');
    expect(lido.config.publico).toBe('adulto');
    expect(lido.config.focos).toEqual(['ortopedia']);
    expect(lido.config.prioridades.length).toBe(3);
    expect(lido.marcadas).toEqual(['a']);
    expect(lido.respostas).toEqual({ a: 'ok' });
    expect(lido.personalizadas).toEqual([]);
  });
});

describe('importar perguntas de .txt', () => {
  it('uma pergunta por linha, sem marcadores, vazias, comentários ou repetidas', () => {
    const texto = '# minhas perguntas\n- Usa óculos?\n\n1. Dorme bem?\n[ ] Usa óculos?\n• Trabalha à noite?\n';
    expect(lerPerguntasDeTexto(texto)).toEqual(['Usa óculos?', 'Dorme bem?', 'Trabalha à noite?']);
  });
});

describe('nome do arquivo', () => {
  it('gera nome seguro, sem acentos', () => {
    expect(nomeDeArquivo('Caso 3 · Lombalgia!', 'json', new Date('2026-11-25T12:00:00Z'))).toBe(
      'anamnese-caso-3-lombalgia-2026-11-25.json',
    );
    expect(nomeDeArquivo('', 'txt', new Date('2026-11-25T12:00:00Z'))).toBe(
      'anamnese-atendimento-2026-11-25.txt',
    );
  });
});

describe('formatarRoteiro com respostas', () => {
  const secoes = gerarRoteiro(PERGUNTAS, { ...config, busca: '', focos: ['cabeca'] });

  it('inclui respostas, achados de exame e identificação do atendimento', () => {
    const texto = formatarRoteiro(secoes, config, {
      titulo: 'Caso 3',
      respostas: { 'queixa-tempo': 'Há 2 semanas\npiorou ontem', 'ex-cp-linfonodos': 'Sem linfonodomegalias' },
    });
    expect(texto.startsWith('ANAMNESE —')).toBe(true);
    expect(texto).toContain('Atendimento: Caso 3');
    expect(texto).toContain('    R: Há 2 semanas');
    expect(texto).toContain('       piorou ontem');
    expect(texto).toContain('    Achados: Sem linfonodomegalias');
  });

  it('sem respostas continua sendo um roteiro', () => {
    expect(formatarRoteiro(secoes, config).startsWith('ROTEIRO DE ANAMNESE —')).toBe(true);
  });
});
