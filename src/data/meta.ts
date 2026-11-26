import type { Cenario, Foco, Prioridade, Publico, SecaoId } from '../types';

export const CENARIOS: Record<
  Cenario,
  { nome: string; sigla: string; resumo: string; abordagem: string }
> = {
  ps: {
    nome: 'Pronto-socorro',
    sigla: 'PS',
    resumo: 'Direto ao ponto, sinais de alarme primeiro',
    abordagem:
      'Comece pela queixa e pelos sinais de alarme. Estabilize antes de aprofundar: antecedentes, medicações e alergias entram no que muda a conduta agora.',
  },
  ubs: {
    nome: 'UBS / Atenção primária',
    sigla: 'UBS',
    resumo: 'Contexto de vida, rotina e adesão',
    abordagem:
      'Há tempo para a pessoa por inteiro: contexto familiar e social, hábitos, adesão e o que ela espera da consulta. Use o método clínico centrado na pessoa.',
  },
  retorno: {
    nome: 'Retorno',
    sigla: 'RET',
    resumo: 'Evolução, adesão e efeitos colaterais',
    abordagem:
      'Foque no que mudou desde a última consulta: evolução, adesão ao plano, efeitos colaterais, resultados de exames e queixas novas.',
  },
  'pre-exame': {
    nome: 'Pré-exame / procedimento',
    sigla: 'PRÉ',
    resumo: 'Preparo e segurança',
    abordagem:
      'Confirme preparo e segurança: jejum, alergias (incluindo contraste e látex), medicações a suspender, implantes, função renal e chance de gestação.',
  },
  gineco: {
    nome: 'Consulta ginecológica',
    sigla: 'GO',
    resumo: 'Ciclo, saúde reprodutiva e prevenção',
    abordagem:
      'Garanta privacidade. Investigue ciclo menstrual, história obstétrica, contracepção, saúde sexual, rastreamentos e segurança, sem pressupor orientação sexual ou parceria.',
  },
};

export const PUBLICOS: Record<Publico, { nome: string; resumo: string }> = {
  adulto: { nome: 'Adulto', resumo: 'Ocupação, autonomia e hábitos' },
  pediatrico: {
    nome: 'Pediátrico',
    resumo: 'Informante, desenvolvimento e rotina escolar/familiar',
  },
};

export const FOCOS: Record<Foco, { nome: string; resumo: string; apenasAdulto?: boolean }> = {
  ortopedia: { nome: 'Ortopedia / trauma', resumo: 'Mecanismo, apoio, sinais neurovasculares' },
  cabeca: {
    nome: 'Cabeça e pescoço',
    resumo: 'Anamnese dirigida + roteiro de exame físico (olhos, ouvidos, nariz, boca, linfonodos, tireoide)',
  },
  idoso: {
    nome: 'Pessoa idosa',
    resumo: 'Quedas, cognição, polifarmácia',
    apenasAdulto: true,
  },
  mental: { nome: 'Saúde mental', resumo: 'Humor, ansiedade e avaliação de risco' },
  funcional: { nome: 'Olhar funcional (AVDs)', resumo: 'Impacto nas atividades do dia a dia' },
};

export const PRIORIDADES: Record<Prioridade, { nome: string; descricao: string }> = {
  alarme: { nome: 'Alarme', descricao: 'Sinais que mudam a conduta imediatamente' },
  essencial: { nome: 'Essencial', descricao: 'Não deixe de perguntar' },
  complementar: { nome: 'Complementar', descricao: 'Aprofunda quando houver tempo' },
};

export const SECOES: Record<SecaoId, string> = {
  identificacao: 'Identificação',
  seguimento: 'Evolução desde a última consulta',
  preparo: 'Preparo e segurança do exame',
  queixa: 'Queixa principal',
  hda: 'História da doença atual',
  alarme: 'Sinais de alarme',
  antecedentes: 'Antecedentes pessoais',
  medicacoes: 'Medicações e alergias',
  familiares: 'Antecedentes familiares',
  habitos: 'Hábitos de vida',
  social: 'Contexto familiar e social',
  gineco: 'História ginecológica e obstétrica',
  pediatria: 'Crescimento e desenvolvimento',
  ortopedia: 'Ortopedia e trauma',
  cabeca: 'Cabeça e pescoço',
  'exame-cabeca': 'Exame físico de cabeça e pescoço',
  idoso: 'Avaliação da pessoa idosa',
  mental: 'Saúde mental',
  funcional: 'Funcionalidade e atividades do dia a dia',
  sistemas: 'Revisão de sistemas',
  fechamento: 'Fechamento da consulta',
  minhas: 'Minhas perguntas',
};

/** Ordem das seções em cada cenário: muda o ritmo do roteiro. */
export const ORDEM_SECOES: Record<Cenario, SecaoId[]> = {
  ps: [
    'identificacao',
    'queixa',
    'alarme',
    'hda',
    'ortopedia',
    'cabeca',
    'medicacoes',
    'antecedentes',
    'mental',
    'idoso',
    'gineco',
    'pediatria',
    'funcional',
    'social',
    'fechamento',
    'exame-cabeca',
    'minhas',
  ],
  ubs: [
    'identificacao',
    'queixa',
    'hda',
    'antecedentes',
    'medicacoes',
    'familiares',
    'habitos',
    'social',
    'pediatria',
    'gineco',
    'idoso',
    'mental',
    'ortopedia',
    'cabeca',
    'funcional',
    'sistemas',
    'alarme',
    'fechamento',
    'exame-cabeca',
    'minhas',
  ],
  retorno: [
    'identificacao',
    'seguimento',
    'queixa',
    'hda',
    'medicacoes',
    'alarme',
    'antecedentes',
    'ortopedia',
    'cabeca',
    'idoso',
    'mental',
    'pediatria',
    'funcional',
    'social',
    'fechamento',
    'exame-cabeca',
    'minhas',
  ],
  'pre-exame': [
    'identificacao',
    'preparo',
    'medicacoes',
    'antecedentes',
    'alarme',
    'gineco',
    'ortopedia',
    'cabeca',
    'idoso',
    'mental',
    'funcional',
    'fechamento',
    'exame-cabeca',
    'minhas',
  ],
  gineco: [
    'identificacao',
    'queixa',
    'hda',
    'gineco',
    'alarme',
    'antecedentes',
    'medicacoes',
    'familiares',
    'habitos',
    'social',
    'mental',
    'idoso',
    'ortopedia',
    'cabeca',
    'funcional',
    'sistemas',
    'fechamento',
    'exame-cabeca',
    'minhas',
  ],
};
