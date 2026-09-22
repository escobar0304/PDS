'use client';

import { useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (err) {
      setError('Erro ao enviar mensagem. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      {/* Nome */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink mb-2">
          Nome *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-transparent transition-smooth"
          placeholder="O seu nome"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink mb-2">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-transparent transition-smooth"
          placeholder="seuemail@exemplo.com"
        />
      </div>

      {/* Telefone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-ink mb-2">
          Telefone
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-transparent transition-smooth"
          placeholder="+351 xxx xxx xxx"
        />
      </div>

      {/* Assunto */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-ink mb-2">
          Assunto *
        </label>
        <select
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-transparent transition-smooth"
        >
          <option value="">Selecione um assunto</option>
          <option value="informacao">Informação sobre produtos</option>
          <option value="encomenda">Dúvida sobre encomenda</option>
          <option value="personalizado">Pedido personalizado</option>
          <option value="outro">Outro</option>
        </select>
      </div>

      {/* Mensagem */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-ink mb-2">
          Mensagem *
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={5}
          className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-transparent transition-smooth resize-none"
          placeholder="Escreva a sua mensagem aqui..."
        />
      </div>

      {/* Mensagens de sucesso/erro */}
      {success && (
        <div className="p-4 bg-sage-100 border border-sage-600/25 rounded-lg">
          <p className="flex items-start gap-2 text-sm text-sage-600">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
            Mensagem enviada com sucesso. Entraremos em contacto em breve.
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-danger-100 border border-danger-700/25 rounded-lg">
          <p className="flex items-start gap-2 text-sm text-danger-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
            {error}
          </p>
        </div>
      )}

      {/* Botão Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Enviando...' : 'Enviar Mensagem'}
      </button>
    </form>
  );
}