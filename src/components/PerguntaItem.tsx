import { useState } from 'react';
import { PRIORIDADES } from '../data/meta';
import type { PerguntaResolvida } from '../types';

export type ResultadoEstudo = 'lembrei' | 'esqueci';

interface Props {
  pergunta: PerguntaResolvida;
  marcada: boolean;
  onToggleMarcada: () => void;
  modoEstudo: boolean;
  revelada: boolean;
  resultado?: ResultadoEstudo;
  onRevelar: () => void;
  onResultado: (r: ResultadoEstudo) => void;
  onRemover?: () => void;
}

export function PerguntaItem({
  pergunta,
  marcada,
  onToggleMarcada,
  modoEstudo,
  revelada,
  resultado,
  onRevelar,
  onResultado,
  onRemover,
}: Props) {
  const [dicaAberta, setDicaAberta] = useState(false);
  const oculta = modoEstudo && !revelada;
  const idCheck = `chk-${pergunta.id}`;

  return (
    <li
      className={`pergunta prioridade-${pergunta.prioridade} ${marcada ? 'marcada' : ''} ${modoEstudo ? 'estudo' : ''} ${
        resultado ? `resultado-${resultado}` : ''
      }`}
    >
      {!modoEstudo && (
        <input
          id={idCheck}
          type="checkbox"
          checked={marcada}
          onChange={onToggleMarcada}
          aria-label="Usar esta pergunta"
        />
      )}

      <div className="pergunta-corpo">
        <div className="pergunta-topo">
          <span className={`badge badge-${pergunta.prioridade}`}>
            {PRIORIDADES[pergunta.prioridade].nome}
          </span>
          {pergunta.personalizada && <span className="badge badge-minha">Minha</span>}
        </div>

        {oculta ? (
          <button type="button" className="revelar" onClick={onRevelar}>
            <span className="borrado" aria-hidden="true">
              {pergunta.texto}
            </span>
            <span className="revelar-rotulo">Tente lembrar… toque para revelar</span>
          </button>
        ) : modoEstudo ? (
          <p className="pergunta-texto">{pergunta.texto}</p>
        ) : (
          <label htmlFor={idCheck} className="pergunta-texto">
            {pergunta.texto}
          </label>
        )}

        {modoEstudo && revelada && (
          <div className="autoavaliacao" role="group" aria-label="Você lembrou desta pergunta?">
            <button
              type="button"
              className={resultado === 'lembrei' ? 'ativo ok' : 'ok'}
              onClick={() => onResultado('lembrei')}
            >
              Lembrei
            </button>
            <button
              type="button"
              className={resultado === 'esqueci' ? 'ativo nok' : 'nok'}
              onClick={() => onResultado('esqueci')}
            >
              Não lembrei
            </button>
          </div>
        )}

        {!oculta && pergunta.dica && (
          <>
            <button
              type="button"
              className="link-dica"
              aria-expanded={dicaAberta}
              onClick={() => setDicaAberta((v) => !v)}
            >
              {dicaAberta
                ? 'Esconder dica'
                : pergunta.secao.startsWith('exame')
                  ? 'Dica de exame'
                  : 'Por que perguntar?'}
            </button>
            {dicaAberta && <p className="dica">{pergunta.dica}</p>}
          </>
        )}
      </div>

      {onRemover && !modoEstudo && (
        <button type="button" className="remover" onClick={onRemover} aria-label="Remover pergunta">
          ×
        </button>
      )}
    </li>
  );
}
