'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Input, Select, Textarea } from '@/components/ui';
import { ASSUNTOS_CONTACTO } from '@/lib/contacto';

const VAZIO = { name: '', email: '', phone: '', subject: '', message: '', sitio: '' };

export default function ContactForm() {
  const [formData, setFormData] = useState(VAZIO);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      setSuccess(true);
      setFormData(VAZIO);
    } catch {
      setError('Erro ao enviar mensagem. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative space-y-4 md:space-y-6">
      {success && (
        <Alert tone="sucesso">
          Mensagem enviada. Respondemos assim que possível.
        </Alert>
      )}
      {error && <Alert tone="erro">{error}</Alert>}

      <Input
        label="Nome *"
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        autoComplete="name"
        placeholder="O seu nome"
      />

      <Input
        label="Email *"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        required
        autoComplete="email"
        placeholder="seuemail@exemplo.com"
      />

      <Input
        label="Telefone"
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        autoComplete="tel"
        placeholder="+351 xxx xxx xxx"
        pattern="\+?[\d\s\(\)\.\-]{9,20}"
        title="Só algarismos, espaços e + ( ) . -"
      />

      <Select
        label="Assunto *"
        name="subject"
        value={formData.subject}
        onChange={handleChange}
        required
      >
        <option value="">Selecione um assunto</option>
        {Object.entries(ASSUNTOS_CONTACTO).map(([valor, rotulo]) => (
          <option key={valor} value={valor}>
            {rotulo}
          </option>
        ))}
      </Select>

      <Textarea
        label="Mensagem *"
        name="message"
        value={formData.message}
        onChange={handleChange}
        required
        rows={5}
        placeholder="Escreva a sua mensagem aqui…"
      />

      {/*
        A armadilha para programas (ver `/api/contact`). Fora do ecra, fora do
        teclado e escondida dos leitores de ecra: uma pessoa nunca a preenche,
        e um programa que preenche todos os campos denuncia-se.
      */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contacto-sitio">Não preencha este campo</label>
        <input
          id="contacto-sitio"
          type="text"
          name="sitio"
          tabIndex={-1}
          autoComplete="off"
          value={formData.sitio}
          onChange={handleChange}
        />
      </div>

      <Button type="submit" fullWidth loading={loading}>
        {loading ? 'A enviar…' : 'Enviar mensagem'}
      </Button>

      {/*
        Aviso, nao caixa de consentimento.

        O fundamento para tratar estes dados e responder a quem nos escreve —
        diligencias a pedido do proprio, nao consentimento. Por uma caixa a
        pedir autorizacao criava-se um fundamento falso, e depois quem a
        retirasse teria de fazer desaparecer uma mensagem que so existe para
        lhe podermos responder. O que a lei pede aqui e informacao (art. 13 do
        RGPD), e e isso que esta linha da.
      */}
      <p className="text-xs text-ink-muted">
        Usamos o que escrever aqui para lhe responder, e mais nada. Veja a{' '}
        <Link href="/privacidade" className="text-rose-700 underline decoration-rose-700/40 underline-offset-2 transition-smooth hover:decoration-rose-700">
          política de privacidade
        </Link>
        .
      </p>
    </form>
  );
}
