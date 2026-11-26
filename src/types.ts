export type Cenario = 'ps' | 'ubs' | 'retorno' | 'pre-exame' | 'gineco';
export type Publico = 'adulto' | 'pediatrico';
export type Foco = 'ortopedia' | 'cabeca' | 'idoso' | 'mental' | 'funcional';
export type Prioridade = 'alarme' | 'essencial' | 'complementar';

export type SecaoId =
  | 'identificacao'
  | 'seguimento'
  | 'preparo'
  | 'queixa'
  | 'hda'
  | 'alarme'
  | 'antecedentes'
  | 'medicacoes'
  | 'familiares'
  | 'habitos'
  | 'social'
  | 'gineco'
  | 'pediatria'
  | 'ortopedia'
  | 'cabeca'
  | 'exame-cabeca'
  | 'idoso'
  | 'mental'
  | 'funcional'
  | 'sistemas'
  | 'fechamento'
  | 'minhas';

export interface Pergunta {
  id: string;
  secao: SecaoId;
  prioridade: Prioridade;
  /** Texto padrão (adulto ou geral). */
  texto: string;
  /** Texto alternativo quando o público é pediátrico (fala com o responsável). */
  textoPed?: string;
  /** Dica de raciocínio clínico, exibida sob demanda. */
  dica?: string;
  /** Se ausente, vale para todos os cenários. */
  cenarios?: Cenario[];
  /** Se ausente, vale para adulto e pediátrico. */
  publicos?: Publico[];
  /** Se presente, a pergunta só aparece quando pelo menos um destes focos está ativo. */
  focos?: Foco[];
  /** Ajusta a prioridade conforme o cenário (ex.: algo essencial na UBS vira complementar no PS). */
  prioridadePor?: Partial<Record<Cenario, Prioridade>>;
  /** Marca perguntas criadas pela própria pessoa usuária. */
  personalizada?: boolean;
}

export interface Config {
  cenario: Cenario;
  publico: Publico;
  focos: Foco[];
  prioridades: Prioridade[];
  busca: string;
}

export interface PerguntaResolvida {
  id: string;
  secao: SecaoId;
  prioridade: Prioridade;
  texto: string;
  dica?: string;
  personalizada?: boolean;
}

export interface SecaoResolvida {
  id: SecaoId;
  titulo: string;
  perguntas: PerguntaResolvida[];
}
