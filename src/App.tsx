import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { NovaPergunta } from './components/NovaPergunta';
import { PainelConfig } from './components/PainelConfig';
import type { Modo, ResultadoEstudo } from './components/PerguntaItem';
import { SecaoCard } from './components/SecaoCard';
import { CENARIOS } from './data/meta';
import { PERGUNTAS } from './data/perguntas';
import {
  baixarArquivo,
  criarAtendimento,
  lerAtendimento,
  lerPerguntasDeTexto,
  nomeDeArquivo,
} from './lib/arquivo';
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

const MODOS: { id: Modo; nome: string }[] = [
  { id: 'roteiro', nome: 'Roteiro' },
  { id: 'preencher', nome: 'Preencher' },
  { id: 'estudo', nome: 'Estudo' },
];

let contadorId = 0;
const novoId = () => `minha-${Date.now().toString(36)}-${(contadorId++).toString(36)}`;

export default function App() {
  const [config, setConfig] = usePersistedState<Config>('config', CONFIG_INICIAL);
  const [marcadasLista, setMarcadasLista] = usePersistedState<string[]>('marcadas', []);
  const [personalizadas, setPersonalizadas] = usePersistedState<Pergunta[]>('minhas', []);
  const [incluirDicas, setIncluirDicas] = usePersistedState<boolean>('incluirDicas', false);
  const [respostas, setRespostas] = usePersistedState<Record<string, string>>('respostas', {});
  const [titulo, setTitulo] = usePersistedState<string>('titulo', '');
  const [modo, setModo] = usePersistedState<Modo>('modo', 'roteiro');

  const [reveladas, setReveladas] = useState<Set<string>>(new Set());
  const [resultados, setResultados] = useState<Record<string, ResultadoEstudo>>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmarLimpeza, setConfirmarLimpeza] = useState(false);
  const inputArquivo = useRef<HTMLInputElement>(null);

  const marcadas = useMemo(() => new Set(marcadasLista), [marcadasLista]);
  const banco = useMemo(() => [...PERGUNTAS, ...personalizadas], [personalizadas]);
  const secoes = useMemo(() => gerarRoteiro(banco, config), [banco, config]);
  const total = contarPerguntas(secoes);
  const idsVisiveis = useMemo(
    () => secoes.flatMap((s) => s.perguntas.map((p) => p.id)),
    [secoes],
  );
  const marcadasVisiveis = idsVisiveis.filter((id) => marcadas.has(id)).length;
  const respondidasVisiveis = idsVisiveis.filter((id) => respostas[id]?.trim()).length;
  const totalRespondidas = Object.values(respostas).filter((r) => r.trim()).length;
  const qtdReveladas = idsVisiveis.filter((id) => reveladas.has(id)).length;
  const qtdLembrei = idsVisiveis.filter((id) => resultados[id] === 'lembrei').length;

  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 3000);
    return () => window.clearTimeout(t);
  }, [aviso]);

  useEffect(() => {
    if (!confirmarLimpeza) return;
    const t = window.setTimeout(() => setConfirmarLimpeza(false), 4000);
    return () => window.clearTimeout(t);
  }, [confirmarLimpeza]);

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

  const mudarModo = (novo: Modo) => {
    setModo(novo);
    setReveladas(new Set());
    setResultados({});
  };

  // ───────── marcações e respostas ─────────
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

  const responder = (id: string, texto: string) =>
    setRespostas((r) => {
      const novo = { ...r };
      if (texto) novo[id] = texto;
      else delete novo[id];
      return novo;
    });

  const limparRespostas = () => {
    if (!confirmarLimpeza) {
      setConfirmarLimpeza(true);
      return;
    }
    setRespostas({});
    setTitulo('');
    setConfirmarLimpeza(false);
    setAviso('Respostas apagadas. Pronto para um novo atendimento.');
  };

  // ───────── perguntas próprias ─────────
  const adicionarPersonalizadas = (textos: string[]): number => {
    const existentes = new Set(banco.map((p) => p.texto.trim().toLowerCase()));
    const novas: Pergunta[] = textos
      .filter((t) => !existentes.has(t.trim().toLowerCase()))
      .map((texto) => ({
        id: novoId(),
        secao: 'minhas',
        prioridade: 'essencial',
        texto,
        personalizada: true,
      }));
    if (novas.length) {
      setPersonalizadas((l) => [...l, ...novas]);
      setMarcadasLista((l) => [...l, ...novas.map((p) => p.id)]);
    }
    return novas.length;
  };

  const adicionarPersonalizada = (texto: string) => {
    const n = adicionarPersonalizadas([texto]);
    setAviso(n ? 'Pergunta adicionada em “Minhas perguntas”.' : 'Essa pergunta já existe no roteiro.');
  };

  const removerPersonalizada = (id: string) => {
    setPersonalizadas((l) => l.filter((p) => p.id !== id));
    setMarcadasLista((l) => l.filter((x) => x !== id));
    responder(id, '');
  };

  // ───────── modo estudo ─────────
  const revelar = (id: string) => setReveladas((s) => new Set(s).add(id));
  const revelarTudo = () => setReveladas(new Set(idsVisiveis));
  const reiniciarTreino = () => {
    setReveladas(new Set());
    setResultados({});
  };

  // ───────── saída ─────────
  const textoAtual = () => {
    if (modo === 'preencher') {
      const selecionadas = new Set(
        idsVisiveis.filter((id) => marcadas.has(id) || respostas[id]?.trim()),
      );
      return formatarRoteiro(secoes, config, {
        somenteIds: selecionadas.size ? selecionadas : undefined,
        incluirDicas,
        respostas,
        titulo,
      });
    }
    return formatarRoteiro(secoes, config, {
      somenteIds: marcadasVisiveis ? marcadas : undefined,
      incluirDicas,
    });
  };

  const copiar = async () => {
    const ok = await copiarTexto(textoAtual());
    if (!ok) return setAviso('Não foi possível copiar. Tente exportar em .txt.');
    if (modo === 'preencher') return setAviso('Anamnese copiada.');
    setAviso(
      marcadasVisiveis
        ? `${marcadasVisiveis} perguntas marcadas copiadas.`
        : `Roteiro completo copiado (${total} perguntas).`,
    );
  };

  const exportarTxt = () => {
    const ok = baixarArquivo(nomeDeArquivo(titulo, 'txt'), textoAtual(), 'text/plain');
    setAviso(ok ? 'Arquivo .txt exportado.' : 'Este navegador bloqueou o download.');
  };

  const exportarJson = () => {
    const dados = criarAtendimento({ titulo, config, marcadas: marcadasLista, respostas, personalizadas });
    const ok = baixarArquivo(
      nomeDeArquivo(titulo, 'json'),
      JSON.stringify(dados, null, 2),
      'application/json',
    );
    setAviso(
      ok
        ? 'Atendimento exportado. Use “Importar” para continuar depois.'
        : 'Este navegador bloqueou o download.',
    );
  };

  const importar = async (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    try {
      const texto = await arquivo.text();
      const ehJson = arquivo.name.toLowerCase().endsWith('.json') || texto.trimStart().startsWith('{');

      if (ehJson) {
        const dados = lerAtendimento(texto);
        setConfig(dados.config);
        setMarcadasLista(dados.marcadas);
        setRespostas(dados.respostas);
        setTitulo(dados.titulo);
        setPersonalizadas((atuais) => {
          const ids = new Set(atuais.map((p) => p.id));
          return [...atuais, ...dados.personalizadas.filter((p) => !ids.has(p.id))];
        });
        const qtd = Object.keys(dados.respostas).length;
        if (qtd) setModo('preencher');
        setAviso(
          qtd ? `Atendimento importado com ${qtd} respostas.` : 'Configuração do roteiro importada.',
        );
        return;
      }

      const linhas = lerPerguntasDeTexto(texto);
      if (!linhas.length) return setAviso('Nenhuma pergunta encontrada no arquivo.');
      const n = adicionarPersonalizadas(linhas);
      setAviso(
        n
          ? `${n} perguntas importadas para “Minhas perguntas”.`
          : 'Todas as perguntas do arquivo já estavam no roteiro.',
      );
    } catch (erro) {
      setAviso(erro instanceof Error ? erro.message : 'Não foi possível ler o arquivo.');
    }
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
        <div className="modos" role="radiogroup" aria-label="Modo de uso">
          {MODOS.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={modo === m.id}
              className={modo === m.id ? 'ativo' : ''}
              onClick={() => mudarModo(m.id)}
            >
              {m.nome}
            </button>
          ))}
        </div>
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
            {modo === 'estudo' ? (
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
                {modo === 'preencher' ? (
                  <div className="preencher-topo">
                    <label className="campo-titulo">
                      <span>Identificação do atendimento</span>
                      <input
                        type="text"
                        value={titulo}
                        maxLength={120}
                        placeholder="ex.: Caso 3 · retorno de lombalgia"
                        onChange={(e) => setTitulo(e.target.value)}
                      />
                    </label>
                    <div className="progresso" aria-live="polite">
                      <div className="progresso-texto">
                        Respondidas <strong>{respondidasVisiveis}</strong>/{total}
                      </div>
                      <div className="progresso-trilho">
                        <div
                          className="progresso-barra"
                          style={{
                            width: total ? `${(respondidasVisiveis / total) * 100}%` : '0%',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="contagem">
                    <strong>{total}</strong> perguntas no roteiro ·{' '}
                    <strong>{marcadasVisiveis}</strong> marcadas
                  </div>
                )}

                <div className="acoes">
                  {modo === 'roteiro' && (
                    <>
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
                    </>
                  )}
                  <label className="opcao">
                    <input
                      type="checkbox"
                      checked={incluirDicas}
                      onChange={(e) => setIncluirDicas(e.target.checked)}
                    />
                    com dicas
                  </label>
                  <button type="button" className="botao" onClick={copiar} disabled={!total}>
                    {modo === 'preencher'
                      ? 'Copiar anamnese'
                      : marcadasVisiveis
                        ? `Copiar marcadas (${marcadasVisiveis})`
                        : 'Copiar roteiro'}
                  </button>
                  <button type="button" className="botao secundario" onClick={() => window.print()}>
                    Imprimir
                  </button>
                </div>

                <div className="acoes arquivo">
                  <span className="rotulo-arquivo">Arquivo</span>
                  <button type="button" className="botao secundario" onClick={exportarTxt}>
                    Exportar .txt
                  </button>
                  <button type="button" className="botao secundario" onClick={exportarJson}>
                    Exportar .json
                  </button>
                  <button
                    type="button"
                    className="botao secundario"
                    onClick={() => inputArquivo.current?.click()}
                  >
                    Importar
                  </button>
                  <input
                    ref={inputArquivo}
                    type="file"
                    accept=".json,.txt,application/json,text/plain"
                    hidden
                    onChange={importar}
                  />
                  {modo === 'preencher' && (
                    <button
                      type="button"
                      className={`botao secundario perigo ${confirmarLimpeza ? 'confirmar' : ''}`}
                      onClick={limparRespostas}
                      disabled={!totalRespondidas && !titulo}
                    >
                      {confirmarLimpeza ? 'Confirmar: apagar respostas' : 'Novo atendimento'}
                    </button>
                  )}
                </div>
                <p className="ajuda-arquivo">
                  {modo === 'preencher'
                    ? 'As respostas ficam salvas só neste navegador. Evite nome completo, documentos ou outros dados que identifiquem o paciente.'
                    : 'Importar aceita um atendimento .json exportado aqui ou um .txt com uma pergunta por linha.'}
                </p>
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
                modo={modo}
                marcadas={marcadas}
                onToggleMarcada={alternarMarcada}
                onMarcarSecao={marcarVarias}
                respostas={respostas}
                onResposta={responder}
                reveladas={reveladas}
                resultados={resultados}
                onRevelar={revelar}
                onResultado={(id, r) => setResultados((m) => ({ ...m, [id]: r }))}
                onRemoverPersonalizada={removerPersonalizada}
              />
            ))
          )}

          {modo !== 'estudo' && <NovaPergunta onAdicionar={adicionarPersonalizada} />}

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
