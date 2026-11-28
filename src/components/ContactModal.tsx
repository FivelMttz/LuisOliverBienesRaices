import { useEffect, useState } from 'react';
import { OFFICIAL_CONTACTS } from '../data/seedData';

export type ContactModalMode = 'phone' | 'email' | null;

interface ContactModalProps {
  mode: ContactModalMode;
  folioContext?: string | null;
  onClose: () => void;
}

export function ContactModal({ mode, folioContext, onClose }: ContactModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [mode, folioContext]);

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
                {mode === 'phone' ? 'call' : 'mail'}
              </span>
            </span>
            <div>
              <h2 id="contact-modal-title" className="font-headline text-title-lg text-on-surface">
                {mode === 'phone' ? 'Atención telefónica' : 'Correo oficial'}
              </h2>
              <p className="text-label-sm text-on-surface-variant">
                Luis &amp; Oliver Bienes Raíces
                {folioContext ? ` · Folio ${folioContext}` : ''}
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

        {mode === 'phone' && (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg bg-surface-container-low border border-outline-variant/60 p-4 flex items-center justify-between gap-3">
              <div>
                <span className="text-label-sm text-on-surface-variant block">
                  Teléfono oficial
                </span>
                <span className="font-mono text-title-lg text-on-surface tabular-nums">
                  {OFFICIAL_CONTACTS.phoneDisplay}
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyValue(OFFICIAL_CONTACTS.phoneDisplay)}
                className="inline-flex items-center gap-1.5 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-label-md text-on-surface hover:bg-surface-container-low whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-body-lg" aria-hidden="true">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <a
              href={`tel:+${OFFICIAL_CONTACTS.phoneDigits}`}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary-container text-on-primary-container py-2.5 px-4 text-label-lg hover:bg-primary transition-colors"
            >
              <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                call
              </span>
              <span>Abrir marcador</span>
            </a>
          </div>
        )}

        {mode === 'email' && (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg bg-surface-container-low border border-outline-variant/60 p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-label-sm text-on-surface-variant block">
                  Correo oficial
                </span>
                <span className="font-mono text-body-md text-on-surface break-all">
                  {OFFICIAL_CONTACTS.email}
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyValue(OFFICIAL_CONTACTS.email)}
                className="inline-flex items-center gap-1.5 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-label-md text-on-surface hover:bg-surface-container-low whitespace-nowrap shrink-0"
              >
                <span className="material-symbols-outlined text-body-lg" aria-hidden="true">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <a
              href={`mailto:${OFFICIAL_CONTACTS.email}`}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary-container text-on-primary-container py-2.5 px-4 text-label-lg hover:bg-primary transition-colors"
            >
              <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                mail
              </span>
              <span>Abrir aplicación de correo</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
