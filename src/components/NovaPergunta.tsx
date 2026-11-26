import { useState, type FormEvent } from 'react';

interface Props {
  onAdicionar: (texto: string) => void;
}

export function NovaPergunta({ onAdicionar }: Props) {
  const [texto, setTexto] = useState('');

  function enviar(e: FormEvent) {
    e.preventDefault();
    const limpo = texto.trim();
    if (!limpo) return;
    onAdicionar(limpo);
    setTexto('');
  }

  return (
    <form className="nova-pergunta" onSubmit={enviar}>
      <label htmlFor="nova-pergunta">Adicionar pergunta própria</label>
      <div className="linha">
        <input
          id="nova-pergunta"
          type="text"
          placeholder="ex.: Usa protetor solar no trabalho ao ar livre?"
          value={texto}
          maxLength={240}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button type="submit" className="botao" disabled={!texto.trim()}>
          Adicionar
        </button>
      </div>
      <p className="ajuda">Fica salva neste navegador e aparece em “Minhas perguntas”, em qualquer cenário.</p>
    </form>
  );
}
