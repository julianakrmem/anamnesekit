import { CENARIOS, FOCOS, PRIORIDADES, PUBLICOS } from '../data/meta';
import type { Cenario, Config, Foco, Prioridade, Publico } from '../types';

interface Props {
  config: Config;
  onCenario: (c: Cenario) => void;
  onPublico: (p: Publico) => void;
  onToggleFoco: (f: Foco) => void;
  onTogglePrioridade: (p: Prioridade) => void;
  onBusca: (texto: string) => void;
}

export function PainelConfig({
  config,
  onCenario,
  onPublico,
  onToggleFoco,
  onTogglePrioridade,
  onBusca,
}: Props) {
  return (
    <aside className="painel" aria-label="Montar roteiro">
      <fieldset className="grupo">
        <legend>1 · Tipo de consulta</legend>
        <div className="cenarios">
          {(Object.keys(CENARIOS) as Cenario[]).map((c) => (
            <button
              key={c}
              type="button"
              className={`cenario ${config.cenario === c ? 'ativo' : ''}`}
              aria-pressed={config.cenario === c}
              onClick={() => onCenario(c)}
            >
              <span className="cenario-sigla">{CENARIOS[c].sigla}</span>
              <span className="cenario-texto">
                <strong>{CENARIOS[c].nome}</strong>
                <small>{CENARIOS[c].resumo}</small>
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="grupo">
        <legend>2 · Público</legend>
        <div className="segmentado" role="radiogroup" aria-label="Público">
          {(Object.keys(PUBLICOS) as Publico[]).map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={config.publico === p}
              className={config.publico === p ? 'ativo' : ''}
              onClick={() => onPublico(p)}
            >
              {PUBLICOS[p].nome}
            </button>
          ))}
        </div>
        <p className="ajuda">{PUBLICOS[config.publico].resumo}</p>
      </fieldset>

      <fieldset className="grupo">
        <legend>3 · Recorte e olhar funcional</legend>
        <div className="chips">
          {(Object.keys(FOCOS) as Foco[]).map((f) => {
            const desabilitado = Boolean(FOCOS[f].apenasAdulto && config.publico === 'pediatrico');
            const ativo = config.focos.includes(f) && !desabilitado;
            return (
              <button
                key={f}
                type="button"
                className={`chip ${ativo ? 'ativo' : ''}`}
                aria-pressed={ativo}
                disabled={desabilitado}
                title={desabilitado ? 'Disponível apenas no público adulto' : FOCOS[f].resumo}
                onClick={() => onToggleFoco(f)}
              >
                {FOCOS[f].nome}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="grupo">
        <legend>4 · Prioridade</legend>
        <div className="chips">
          {(Object.keys(PRIORIDADES) as Prioridade[]).map((p) => {
            const ativo = config.prioridades.includes(p);
            return (
              <button
                key={p}
                type="button"
                className={`chip chip-${p} ${ativo ? 'ativo' : ''}`}
                aria-pressed={ativo}
                title={PRIORIDADES[p].descricao}
                onClick={() => onTogglePrioridade(p)}
              >
                {PRIORIDADES[p].nome}
              </button>
            );
          })}
        </div>
        <p className="ajuda">
          No PS, “complementar” começa desligado para manter o roteiro enxuto.
        </p>
      </fieldset>

      <label className="grupo busca">
        <span className="legenda">Buscar pergunta</span>
        <input
          type="search"
          placeholder="ex.: febre, queda, contraste…"
          value={config.busca}
          onChange={(e) => onBusca(e.target.value)}
        />
      </label>
    </aside>
  );
}
