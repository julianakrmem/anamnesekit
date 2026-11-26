import { useState } from 'react';
import type { SecaoResolvida } from '../types';
import { PerguntaItem, type ResultadoEstudo } from './PerguntaItem';

interface Props {
  secao: SecaoResolvida;
  indice: number;
  marcadas: Set<string>;
  onToggleMarcada: (id: string) => void;
  onMarcarSecao: (ids: string[], marcar: boolean) => void;
  modoEstudo: boolean;
  reveladas: Set<string>;
  resultados: Record<string, ResultadoEstudo>;
  onRevelar: (id: string) => void;
  onResultado: (id: string, r: ResultadoEstudo) => void;
  onRemoverPersonalizada: (id: string) => void;
}

export function SecaoCard({
  secao,
  indice,
  marcadas,
  onToggleMarcada,
  onMarcarSecao,
  modoEstudo,
  reveladas,
  resultados,
  onRevelar,
  onResultado,
  onRemoverPersonalizada,
}: Props) {
  const [aberta, setAberta] = useState(true);
  const ids = secao.perguntas.map((p) => p.id);
  const qtdMarcadas = ids.filter((id) => marcadas.has(id)).length;
  const todasMarcadas = qtdMarcadas === ids.length;
  const temAlarme = secao.perguntas.some((p) => p.prioridade === 'alarme');

  return (
    <section className={`secao ${temAlarme ? 'tem-alarme' : ''}`}>
      <header className="secao-cabecalho">
        <button
          type="button"
          className="secao-titulo"
          aria-expanded={aberta}
          onClick={() => setAberta((v) => !v)}
        >
          <span className="secao-num">{String(indice + 1).padStart(2, '0')}</span>
          <h2>{secao.titulo}</h2>
          <span className="secao-contagem">
            {modoEstudo ? `${ids.length}` : `${qtdMarcadas}/${ids.length}`}
          </span>
          <span className={`seta ${aberta ? 'aberta' : ''}`} aria-hidden="true">
            ▾
          </span>
        </button>
        {!modoEstudo && aberta && (
          <button
            type="button"
            className="link"
            onClick={() => onMarcarSecao(ids, !todasMarcadas)}
          >
            {todasMarcadas ? 'Desmarcar seção' : 'Marcar seção'}
          </button>
        )}
      </header>

      {aberta && (
        <ul className="perguntas">
          {secao.perguntas.map((p) => (
            <PerguntaItem
              key={p.id}
              pergunta={p}
              marcada={marcadas.has(p.id)}
              onToggleMarcada={() => onToggleMarcada(p.id)}
              modoEstudo={modoEstudo}
              revelada={reveladas.has(p.id)}
              resultado={resultados[p.id]}
              onRevelar={() => onRevelar(p.id)}
              onResultado={(r) => onResultado(p.id, r)}
              onRemover={p.personalizada ? () => onRemoverPersonalizada(p.id) : undefined}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
