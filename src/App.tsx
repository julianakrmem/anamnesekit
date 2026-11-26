import { useEffect, useMemo, useState } from 'react';
import { PainelConfig } from './components/PainelConfig';
import { NovaPergunta } from './components/NovaPergunta';
import type { ResultadoEstudo } from './components/PerguntaItem';
import { SecaoCard } from './components/SecaoCard';
import { CENARIOS } from './data/meta';
import { PERGUNTAS } from './data/perguntas';
import { contarPerguntas, focosValidos, formatarRoteiro, gerarRoteiro } from './lib/roteiro';
import { copiarTexto, usePersistedState } from './lib/storage';
import type { Cenario, Config, Foco, Pergunta, Prioridade, Publico } from './types';

const PRIORIDADES_PADRAO: Record<Cenario, Prioridade[]> = {
  ps: ['alarme', 'essencial'],
  ubs: ['alarme', 'essencial', 'complementar'],
  retorno: ['alarme', 'essencial', 'complementar'],
  'pre-exame': ['alarme', 'essencial', 'complementar'],
  gineco: ['alarme', 'essencial', 'complementar'],
};

const CONFIG_INICIAL: Config = {
  cenario: 'ubs',
  publico: 'adulto',
  focos: ['funcional'],
  prioridades: PRIORIDADES_PADRAO.ubs,
  busca: '',
};

export default function App() {
  const [config, setConfig] = usePersistedState<Config>('config', CONFIG_INICIAL);
  const [marcadasLista, setMarcadasLista] = usePersistedState<string[]>('marcadas', []);
  const [personalizadas, setPersonalizadas] = usePersistedState<Pergunta[]>('minhas', []);
  const [incluirDicas, setIncluirDicas] = usePersistedState<boolean>('incluirDicas', false);

  const [modoEstudo, setModoEstudo] = useState(false);
  const [reveladas, setReveladas] = useState<Set<string>>(new Set());
  const [resultados, setResultados] = useState<Record<string, ResultadoEstudo>>({});
  const [aviso, setAviso] = useState<string | null>(null);

  const marcadas = useMemo(() => new Set(marcadasLista), [marcadasLista]);
  const banco = useMemo(() => [...PERGUNTAS, ...personalizadas], [personalizadas]);
  const secoes = useMemo(() => gerarRoteiro(banco, config), [banco, config]);
  const total = contarPerguntas(secoes);
  const idsVisiveis = useMemo(
    () => secoes.flatMap((s) => s.perguntas.map((p) => p.id)),
    [secoes],
  );
  const marcadasVisiveis = idsVisiveis.filter((id) => marcadas.has(id)).length;
  const qtdReveladas = idsVisiveis.filter((id) => reveladas.has(id)).length;
  const qtdLembrei = idsVisiveis.filter((id) => resultados[id] === 'lembrei').length;

  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 2600);
    return () => window.clearTimeout(t);
  }, [aviso]);

  // ───────── configuração ─────────
  const mudarCenario = (cenario: Cenario) =>
    setConfig((c) => ({ ...c, cenario, prioridades: PRIORIDADES_PADRAO[cenario] }));

  const mudarPublico = (publico: Publico) =>
    setConfig((c) => ({ ...c, publico, focos: focosValidos(c.focos, publico) }));

  const alternarFoco = (foco: Foco) =>
    setConfig((c) => ({
      ...c,
      focos: c.focos.includes(foco) ? c.focos.filter((f) => f !== foco) : [...c.focos, foco],
    }));

  const alternarPrioridade = (p: Prioridade) =>
    setConfig((c) => {
      const tem = c.prioridades.includes(p);
      if (tem && c.prioridades.length === 1) return c; // mantém pelo menos uma
      return { ...c, prioridades: tem ? c.prioridades.filter((x) => x !== p) : [...c.prioridades, p] };
    });

  // ───────── marcações ─────────
  const alternarMarcada = (id: string) =>
    setMarcadasLista((lista) =>
      lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id],
    );

  const marcarVarias = (ids: string[], marcar: boolean) =>
    setMarcadasLista((lista) => {
      const s = new Set(lista);
      ids.forEach((id) => (marcar ? s.add(id) : s.delete(id)));
      return [...s];
    });

  // ───────── perguntas próprias ─────────
  const adicionarPersonalizada = (texto: string) => {
    const nova: Pergunta = {
      id: `minha-${Date.now().toString(36)}`,
      secao: 'minhas',
      prioridade: 'essencial',
      texto,
      personalizada: true,
    };
    setPersonalizadas((l) => [...l, nova]);
    setMarcadasLista((l) => [...l, nova.id]);
    setAviso('Pergunta adicionada em “Minhas perguntas”.');
  };

  const removerPersonalizada = (id: string) => {
    setPersonalizadas((l) => l.filter((p) => p.id !== id));
    setMarcadasLista((l) => l.filter((x) => x !== id));
  };

  // ───────── modo estudo ─────────
  const alternarModoEstudo = () => {
    setModoEstudo((v) => !v);
    setReveladas(new Set());
    setResultados({});
  };

  const revelar = (id: string) => setReveladas((s) => new Set(s).add(id));
  const revelarTudo = () => setReveladas(new Set(idsVisiveis));
  const reiniciarTreino = () => {
    setReveladas(new Set());
    setResultados({});
  };

  // ───────── saída ─────────
  const copiar = async () => {
    const usarMarcadas = marcadasVisiveis > 0;
    const texto = formatarRoteiro(secoes, config, {
      somenteIds: usarMarcadas ? marcadas : undefined,
      incluirDicas,
    });
    const ok = await copiarTexto(texto);
    setAviso(
      ok
        ? usarMarcadas
          ? `${marcadasVisiveis} perguntas marcadas copiadas.`
          : `Roteiro completo copiado (${total} perguntas).`
        : 'Não foi possível copiar. Tente pelo botão Imprimir.',
    );
  };

  const ginecoPediatrico = config.cenario === 'gineco' && config.publico === 'pediatrico';

  return (
    <div className="app">
      <header className="topo">
        <div className="marca">
          <span className="logo" aria-hidden="true">
            A<span>k</span>
          </span>
          <div>
            <h1>AnamneseKit</h1>
            <p>Roteiros de anamnese sob medida para o atendimento e para o estudo</p>
          </div>
        </div>
        <button
          type="button"
          className={`botao modo-estudo ${modoEstudo ? 'ativo' : ''}`}
          aria-pressed={modoEstudo}
          onClick={alternarModoEstudo}
        >
          {modoEstudo ? 'Sair do modo estudo' : 'Modo estudo'}
        </button>
      </header>

      <div className="layout">
        <PainelConfig
          config={config}
          onCenario={mudarCenario}
          onPublico={mudarPublico}
          onToggleFoco={alternarFoco}
          onTogglePrioridade={alternarPrioridade}
          onBusca={(busca) => setConfig((c) => ({ ...c, busca }))}
        />

        <main className="conteudo">
          <div className="abordagem">
            <strong>{CENARIOS[config.cenario].nome}:</strong> {CENARIOS[config.cenario].abordagem}
            {ginecoPediatrico && (
              <p className="nota">
                Público pediátrico na consulta ginecológica: roteiro adaptado para adolescentes
                (menarca, puberdade e confidencialidade).
              </p>
            )}
          </div>

          <div className="barra" role="toolbar" aria-label="Ações do roteiro">
            {modoEstudo ? (
              <>
                <div className="progresso" aria-live="polite">
                  <div className="progresso-texto">
                    Reveladas <strong>{qtdReveladas}</strong>/{total} · Lembrei{' '}
                    <strong>{qtdLembrei}</strong>
                  </div>
                  <div className="progresso-trilho">
                    <div
                      className="progresso-barra"
                      style={{ width: total ? `${(qtdReveladas / total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
                <div className="acoes">
                  <button type="button" className="botao secundario" onClick={revelarTudo}>
                    Revelar tudo
                  </button>
                  <button type="button" className="botao secundario" onClick={reiniciarTreino}>
                    Reiniciar treino
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="contagem">
                  <strong>{total}</strong> perguntas no roteiro · <strong>{marcadasVisiveis}</strong>{' '}
                  marcadas
                </div>
                <div className="acoes">
                  <button
                    type="button"
                    className="botao secundario"
                    onClick={() => marcarVarias(idsVisiveis, true)}
                  >
                    Marcar tudo
                  </button>
                  <button
                    type="button"
                    className="botao secundario"
                    onClick={() => marcarVarias(idsVisiveis, false)}
                    disabled={!marcadasVisiveis}
                  >
                    Limpar
                  </button>
                  <label className="opcao">
                    <input
                      type="checkbox"
                      checked={incluirDicas}
                      onChange={(e) => setIncluirDicas(e.target.checked)}
                    />
                    com dicas
                  </label>
                  <button type="button" className="botao" onClick={copiar} disabled={!total}>
                    {marcadasVisiveis ? `Copiar marcadas (${marcadasVisiveis})` : 'Copiar roteiro'}
                  </button>
                  <button type="button" className="botao secundario" onClick={() => window.print()}>
                    Imprimir
                  </button>
                </div>
              </>
            )}
          </div>

          {secoes.length === 0 ? (
            <div className="vazio">
              Nenhuma pergunta com esses filtros. Tente limpar a busca ou ativar mais prioridades.
            </div>
          ) : (
            secoes.map((secao, i) => (
              <SecaoCard
                key={`${config.cenario}-${config.publico}-${secao.id}`}
                secao={secao}
                indice={i}
                marcadas={marcadas}
                onToggleMarcada={alternarMarcada}
                onMarcarSecao={marcarVarias}
                modoEstudo={modoEstudo}
                reveladas={reveladas}
                resultados={resultados}
                onRevelar={revelar}
                onResultado={(id, r) => setResultados((m) => ({ ...m, [id]: r }))}
                onRemoverPersonalizada={removerPersonalizada}
              />
            ))
          )}

          {!modoEstudo && <NovaPergunta onAdicionar={adicionarPersonalizada} />}

          <footer className="rodape">
            Material educativo para estudo e apoio ao atendimento. Não substitui o julgamento
            clínico, os protocolos do serviço nem as diretrizes vigentes.
          </footer>
        </main>
      </div>

      {aviso && (
        <div className="aviso" role="status">
          {aviso}
        </div>
      )}
    </div>
  );
}
