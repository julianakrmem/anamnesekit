import { useEffect, useState } from 'react';

const PREFIXO = 'anamnesekit:v1:';

function ler<T>(chave: string, padrao: T): T {
  try {
    const bruto = window.localStorage.getItem(PREFIXO + chave);
    return bruto ? (JSON.parse(bruto) as T) : padrao;
  } catch {
    return padrao;
  }
}

function gravar<T>(chave: string, valor: T): void {
  try {
    window.localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
  } catch {
    // modo anônimo ou armazenamento cheio: o app segue funcionando só em memória
  }
}

/** useState que persiste no localStorage (com fallback silencioso). */
export function usePersistedState<T>(chave: string, padrao: T) {
  const [valor, setValor] = useState<T>(() => ler(chave, padrao));
  useEffect(() => gravar(chave, valor), [chave, valor]);
  return [valor, setValor] as const;
}

export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // fallback para navegadores sem Clipboard API ou fora de HTTPS
    try {
      const area = document.createElement('textarea');
      area.value = texto;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}
