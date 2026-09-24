import { paginaComSessao } from '@/lib/autorizacao';
import AreaPessoal from './conteudo';

/** A porta, no servidor. O conteudo e de cliente e esta em `conteudo.tsx`. */
export default async function Pagina() {
  await paginaComSessao('/area-pessoal');
  return <AreaPessoal />;
}
