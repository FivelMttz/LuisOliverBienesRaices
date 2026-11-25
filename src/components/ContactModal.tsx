import { useEffect, useState, FormEvent } from 'react';

export type ContactModalMode = 'whatsapp' | 'location' | 'phone' | 'email' | null;

interface ContactModalProps {
  mode: ContactModalMode;
  onClose: () => void;
}

export function ContactModal({ mode, onClose }: ContactModalProps) {
  const [message, setMessage] = useState(
    'Hola Luis & Oliver, me gustaría recibir asesoría sobre propiedades disponibles en San Luis Potosí.',
  );
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [senderEmail, setSenderEmail] = useState('');
  const [emailBody, setEmailBody] = useState('');

  useEffect(() => {
    setCopied(false);
    setEmailSent(false);
  }, [mode]);

  useEffect(() => {
    if (!mode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, onClose]);

  if (!mode) return null;

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    setEmailSent(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-primary/60 backdrop-blur-sm p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl sm:rounded-xl bg-surface border border-outline-variant p-5 sm:p-6 text-on-surface shadow-2xl flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="w-10 h-10 rounded-full bg-surface-container-low border border-outline-variant flex items-center justify-center text-secondary shrink-0"
              aria-hidden="true"
            >
              <span className="material-symbols-outlined text-title-lg">
                {mode === 'whatsapp'
                  ? 'chat'
                  : mode === 'phone'
                    ? 'call'
                    : mode === 'email'
                      ? 'mail'
                      : 'location_on'}
              </span>
            </span>
            <div>
              <h2 id="contact-modal-title" className="font-headline text-title-lg text-on-surface">
                {mode === 'whatsapp' && 'Atención por WhatsApp'}
                {mode === 'phone' && 'Atención telefónica'}
                {mode === 'email' && 'Enviar correo electrónico'}
                {mode === 'location' && 'Oficina en San Luis Potosí'}
              </h2>
              <p className="text-label-sm text-on-surface-variant">
                Luis &amp; Oliver Bienes Raíces
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de contacto"
            className="w-10 h-10 rounded-full hover:bg-surface-container-low text-on-surface flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-title-lg" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        {mode === 'whatsapp' && (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-label-sm text-on-surface">Mensaje inicial</span>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md text-on-surface focus:border-secondary focus:outline-none"
              />
            </label>
            <a
              href={`https://wa.me/524441234567?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary-container text-on-primary-container py-2.5 px-4 text-label-lg hover:bg-primary transition-colors"
            >
              <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                chat
              </span>
              <span>Abrir conversación (+52 444 123 4567)</span>
            </a>
          </div>
        )}

        {mode === 'phone' && (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg bg-surface-container-low border border-outline-variant/60 p-4 flex items-center justify-between gap-3">
              <div>
                <span className="text-label-sm text-on-surface-variant block">
                  Línea directa SLP
                </span>
                <span className="font-mono text-title-lg text-on-surface tabular-nums">
                  +52 444 123 4567
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyValue('+524441234567')}
                className="inline-flex items-center gap-1.5 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-label-md text-on-surface hover:bg-surface-container-low whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-body-lg" aria-hidden="true">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <p className="text-body-md text-on-surface-variant">
              Horario de atención: Lunes a Viernes de 9:00 a 19:00 hrs · Sábados de 10:00 a 14:00 hrs.
            </p>
            <a
              href="tel:+524441234567"
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary-container text-on-primary-container py-2.5 px-4 text-label-lg hover:bg-primary transition-colors"
            >
              <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                call
              </span>
              <span>Llamar ahora</span>
            </a>
          </div>
        )}

        {mode === 'email' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low border border-outline-variant/60 px-3.5 py-2.5">
              <span className="font-mono text-body-md text-on-surface truncate">
                contacto@luisoliver.mx
              </span>
              <button
                type="button"
                onClick={() => copyValue('contacto@luisoliver.mx')}
                className="inline-flex items-center gap-1 text-label-sm text-secondary hover:text-on-surface whitespace-nowrap shrink-0"
              >
                <span className="material-symbols-outlined text-body-md" aria-hidden="true">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            {emailSent ? (
              <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-4 text-center flex flex-col gap-1.5">
                <span className="material-symbols-outlined text-headline-md text-secondary mx-auto" aria-hidden="true">
                  mark_email_read
                </span>
                <p className="text-body-md font-medium text-on-surface">
                  Mensaje enviado correctamente
                </p>
                <p className="text-label-sm text-on-surface-variant">
                  Responderemos a {senderEmail} en menos de 24 horas hábiles.
                </p>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-label-sm text-on-surface">Tu correo</span>
                  <input
                    type="email"
                    required
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="nombre@correo.com"
                    className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-label-sm text-on-surface">Consulta</span>
                  <textarea
                    rows={3}
                    required
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Indícanos qué propiedad o zona te interesa..."
                    className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-md bg-primary-container text-on-primary-container py-2.5 text-label-lg hover:bg-primary transition-colors"
                >
                  Enviar mensaje
                </button>
              </form>
            )}
          </div>
        )}

        {mode === 'location' && (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg bg-surface-container-low border border-outline-variant/60 p-4 flex flex-col gap-2">
              <p className="text-title-md text-on-surface">Corporativo Lomas Poniente</p>
              <p className="text-body-md text-on-surface-variant">
                Av. Sierra Leona 420, Piso 2, Col. Lomas 4ta Sección, C.P. 78216, San Luis Potosí, S.L.P.
              </p>
              <div className="pt-2 border-t border-outline-variant/50 flex flex-col gap-1 text-label-sm text-on-surface-variant">
                <span>Estacionamiento privado para visitantes</span>
                <span>Lunes a Viernes: 9:00 – 19:00 · Sábados: 10:00 – 14:00</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  copyValue('Av. Sierra Leona 420, Lomas 4ta Sección, 78216 San Luis Potosí, S.L.P.')
                }
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-outline-variant bg-surface-container-lowest py-2.5 px-3 text-label-md text-on-surface hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-body-lg" aria-hidden="true">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Dirección copiada' : 'Copiar dirección'}</span>
              </button>
              <a
                href="https://maps.google.com/?q=Av.+Sierra+Leona+420,+Lomas+4ta+Seccion,+San+Luis+Potosi"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary-container text-on-primary-container py-2.5 px-3 text-label-md hover:bg-primary transition-colors"
              >
                <span className="material-symbols-outlined text-body-lg" aria-hidden="true">
                  directions
                </span>
                <span>Abrir mapa</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
