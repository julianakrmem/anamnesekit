import { useState } from 'react';
import { PRIORIDADES } from '../data/meta';
import type { PerguntaResolvida } from '../types';

export type Modo = 'roteiro' | 'preencher' | 'estudo';
export type ResultadoEstudo = 'lembrei' | 'esqueci';

interface Props {
  pergunta: PerguntaResolvida;
  modo: Modo;
  marcada: boolean;
  onToggleMarcada: () => void;
  resposta: string;
  onResposta: (texto: string) => void;
  revelada: boolean;
  resultado?: ResultadoEstudo;
  onRevelar: () => void;
  onResultado: (r: ResultadoEstudo) => void;
  onRemover?: () => void;
}

export function PerguntaItem({
  pergunta,
  modo,
  marcada,
  onToggleMarcada,
  resposta,
  onResposta,
  revelada,
  resultado,
  onRevelar,
  onResultado,
  onRemover,
}: Props) {
  const [dicaAberta, setDicaAberta] = useState(false);
  const estudo = modo === 'estudo';
  const preencher = modo === 'preencher';
  const oculta = estudo && !revelada;
  const ehExame = pergunta.secao.startsWith('exame');
  const idCampo = `campo-${pergunta.id}`;
  const idCheck = `chk-${pergunta.id}`;
  const respondida = preencher && resposta.trim().length > 0;

  const classes = [
    'pergunta',
    `prioridade-${pergunta.prioridade}`,
    modo === 'roteiro' && marcada ? 'marcada' : '',
    respondida ? 'respondida' : '',
    resultado ? `resultado-${resultado}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li className={classes}>
      {modo === 'roteiro' && (
        <input
          id={idCheck}
          type="checkbox"
          checked={marcada}
          onChange={onToggleMarcada}
          aria-label="Usar esta pergunta"
        />
      )}
      {preencher && (
        <span className={`status ${respondida ? 'ok' : ''}`} aria-hidden="true">
          {respondida ? '✓' : ''}
        </span>
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
        ) : estudo ? (
          <p className="pergunta-texto">{pergunta.texto}</p>
        ) : (
          <label htmlFor={preencher ? idCampo : idCheck} className="pergunta-texto">
            {pergunta.texto}
          </label>
        )}

        {preencher && (
          <textarea
            id={idCampo}
            className="resposta"
            rows={1}
            value={resposta}
            placeholder={ehExame ? 'Achados do exame…' : 'Resposta…'}
            onChange={(e) => onResposta(e.target.value)}
          />
        )}

        {estudo && revelada && (
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
              {dicaAberta ? 'Esconder dica' : ehExame ? 'Dica de exame' : 'Por que perguntar?'}
            </button>
            {dicaAberta && <p className="dica">{pergunta.dica}</p>}
          </>
        )}
      </div>

      {onRemover && modo === 'roteiro' && (
        <button type="button" className="remover" onClick={onRemover} aria-label="Remover pergunta">
          ×
        </button>
      )}
    </li>
  );
}
