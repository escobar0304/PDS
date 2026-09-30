'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/ui/AuthShell';
import { Alert, Button, Caixa, Input } from '@/components/ui';

export default function Declaracao() {
  const router = useRouter();
  const [maiorDeIdade, setMaiorDeIdade] = useState(false);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  // Para quem nao tem 18 anos: apagar a conta, com a confirmacao que a conta
  // pede (a palavra-passe, ou o email para quem entrou pela Google).
  const [aApagar, setAApagar] = useState(false);
  const [temPassword, setTemPassword] = useState<boolean | null>(null);
  const [confirmacao, setConfirmacao] = useState('');

  useEffect(() => {
    if (!aApagar || temPassword !== null) return;
    let vivo = true;
    fetch('/api/conta')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (vivo && d) setTemPassword(Boolean(d.temPassword));
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [aApagar, temPassword]);

  const declarar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setOcupado(true);
    try {
      const r = await fetch('/api/conta/maioridade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maiorDeIdade }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErro(d.error ?? 'Não foi possível guardar.');
        setOcupado(false);
        return;
      }
      // A sessao le a declaracao da base de dados em cada pedido
      // (`verificarSessao`): a pagina seguinte ja a ve.
      router.replace('/area-pessoal');
      router.refresh();
    } catch {
      setErro('Não foi possível guardar.');
      setOcupado(false);
    }
  };

  const apagar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setOcupado(true);
    try {
      const corpo = temPassword ? { password: confirmacao } : { confirmacao };
      const r = await fetch('/api/conta', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErro(d.error ?? 'Não foi possível apagar a conta.');
        setOcupado(false);
        return;
      }
      await signOut({ callbackUrl: '/' });
    } catch {
      setErro('Não foi possível apagar a conta.');
      setOcupado(false);
    }
  };

  return (
    <AuthShell title="Confirmar a idade" lead="Só maiores de 18 anos podem ter conta na loja.">
      {erro && <Alert tone="erro">{erro}</Alert>}

      {!aApagar ? (
        <form onSubmit={declarar} className="space-y-6">
          <Caixa
            label="Tenho 18 anos ou mais"
            checked={maiorDeIdade}
            onChange={setMaiorDeIdade}
            required
          />
          <Button type="submit" fullWidth loading={ocupado}>
            Continuar
          </Button>
          <Button type="button" variant="ghost" fullWidth onClick={() => setAApagar(true)}>
            Não tenho 18 anos
          </Button>
        </form>
      ) : (
        <form onSubmit={apagar} className="space-y-6">
          <p className="text-sm text-ink-muted">
            Sem 18 anos não pode ter conta. Apagamos a conta e os dados que ela tem.
          </p>
          {temPassword !== null && (
            <Input
              label={temPassword ? 'A sua palavra-passe' : 'Escreva o seu email para confirmar'}
              type={temPassword ? 'password' : 'email'}
              name={temPassword ? 'password-apagar' : 'email-apagar'}
              autoComplete={temPassword ? 'current-password' : 'email'}
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              required
            />
          )}
          <Button type="submit" variant="danger" fullWidth loading={ocupado} disabled={temPassword === null}>
            Apagar a conta
          </Button>
          <Button type="button" variant="ghost" fullWidth onClick={() => setAApagar(false)}>
            Voltar
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
