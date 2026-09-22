'use client';

import { useState } from 'react';
import { Alert, Button, Input, Select, Textarea } from '@/components/ui';

const ASSUNTOS = [
  { value: 'informacao', label: 'Informação sobre produtos' },
  { value: 'encomenda', label: 'Dúvida sobre encomenda' },
  { value: 'personalizado', label: 'Pedido personalizado' },
  { value: 'outro', label: 'Outro' },
];

const VAZIO = { name: '', email: '', phone: '', subject: '', message: '' };

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
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
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
      />

      <Select
        label="Assunto *"
        name="subject"
        value={formData.subject}
        onChange={handleChange}
        required
      >
        <option value="">Selecione um assunto</option>
        {ASSUNTOS.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
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

      <Button type="submit" fullWidth loading={loading}>
        {loading ? 'A enviar…' : 'Enviar mensagem'}
      </Button>
    </form>
  );
}
