import { OFFICIAL_CONTACTS } from '../data/seedData';
import { ContactModalMode } from './ContactModal';
import { usePlatform } from '../services/platformStore';

interface ContactSectionProps {
  onOpenModal: (mode: ContactModalMode) => void;
}

export function ContactSection({ onOpenModal }: ContactSectionProps) {
  const { trackEvent } = usePlatform();

  return (
    <section id="contacto" className="flex flex-col gap-3 md:gap-6 pb-4">
      <div className="flex flex-col gap-0.5 md:items-center md:text-center">
        <h2 className="font-headline text-headline-md md:text-headline-lg text-on-surface">
          <span className="md:hidden">Contáctanos</span>
          <span className="hidden md:inline">Contáctanos y resuelve tus dudas</span>
        </h2>
        <p className="font-body text-body-md text-on-surface-variant md:hidden">
          Resuelve tus dudas y recibe asesoría personalizada.
        </p>
      </div>

      <div className="grid grid-cols-2 min-[375px]:grid-cols-4 gap-2 md:gap-4 items-stretch">
        {/* WhatsApp */}
        <a
          href={`https://wa.me/${OFFICIAL_CONTACTS.phoneDigits}?text=${encodeURIComponent(
            'Hola Luis & Oliver Bienes Raíces, quisiera asesoría sobre propiedades en San Luis Potosí.',
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent({ tipo: 'whatsapp_click' })}
          className="h-full min-w-0 overflow-hidden bg-surface-container-lowest border border-outline-variant rounded-xl py-3 px-1.5 md:px-4 md:py-4 flex flex-col md:flex-row items-center justify-center md:justify-between gap-1.5 md:gap-3 hover:bg-surface-container-low hover:border-secondary/60 transition-colors text-center md:text-left"
        >
          <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-3 min-w-0 max-w-full">
            <span className="material-symbols-outlined text-headline-md text-on-surface shrink-0" aria-hidden="true">
              chat
            </span>
            <div className="flex flex-col min-w-0 max-w-full">
              <span className="font-body text-[11px] min-[400px]:text-label-sm font-semibold text-on-surface truncate md:hidden">
                WhatsApp
              </span>
              <span className="hidden md:block font-body text-title-md font-semibold text-on-surface truncate">
                WhatsApp
              </span>
              <span className="hidden md:block font-body text-label-sm text-on-surface-variant truncate">
                Mensaje directo
              </span>
            </div>
          </div>
          <span className="hidden md:inline-block material-symbols-outlined text-title-md text-on-surface-variant shrink-0" aria-hidden="true">
            chevron_right
          </span>
        </a>

        {/* Llamar */}
        <button
          type="button"
          onClick={() => {
            trackEvent({ tipo: 'call_click' });
            onOpenModal('phone');
          }}
          className="h-full min-w-0 overflow-hidden bg-surface-container-lowest border border-outline-variant rounded-xl py-3 px-1.5 md:px-4 md:py-4 flex flex-col md:flex-row items-center justify-center md:justify-between gap-1.5 md:gap-3 hover:bg-surface-container-low hover:border-secondary/60 transition-colors text-center md:text-left"
        >
          <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-3 min-w-0 max-w-full">
            <span className="material-symbols-outlined text-headline-md text-on-surface shrink-0" aria-hidden="true">
              call
            </span>
            <div className="flex flex-col min-w-0 max-w-full">
              <span className="font-body text-[11px] min-[400px]:text-label-sm font-semibold text-on-surface truncate md:hidden">
                Llamar
              </span>
              <span className="hidden md:block font-body text-title-md font-semibold text-on-surface truncate">
                Teléfono
              </span>
              <span className="hidden md:block font-body text-label-sm text-on-surface-variant truncate">
                Llamada directa
              </span>
            </div>
          </div>
          <span className="hidden md:inline-block material-symbols-outlined text-title-md text-on-surface-variant shrink-0" aria-hidden="true">
            chevron_right
          </span>
        </button>

        {/* Correo */}
        <a
          href={`mailto:${OFFICIAL_CONTACTS.email}`}
          onClick={(e) => {
            if (typeof window !== 'undefined' && window.innerWidth >= 768) {
              e.preventDefault();
              onOpenModal('email');
            }
          }}
          className="h-full min-w-0 overflow-hidden bg-surface-container-lowest border border-outline-variant rounded-xl py-3 px-1.5 md:px-4 md:py-4 flex flex-col md:flex-row items-center justify-center md:justify-between gap-1.5 md:gap-3 hover:bg-surface-container-low hover:border-secondary/60 transition-colors text-center md:text-left"
        >
          <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-3 min-w-0 max-w-full">
            <span className="material-symbols-outlined text-headline-md text-on-surface shrink-0" aria-hidden="true">
              mail
            </span>
            <div className="flex flex-col min-w-0 max-w-full">
              <span className="font-body text-[11px] min-[400px]:text-label-sm font-semibold text-on-surface truncate md:hidden">
                Correo
              </span>
              <span className="hidden md:block font-body text-title-md font-semibold text-on-surface truncate">
                Correo
              </span>
              <span className="hidden md:block font-body text-label-sm text-on-surface-variant truncate">
                Correo directo
              </span>
            </div>
          </div>
          <span className="hidden md:inline-block material-symbols-outlined text-title-md text-on-surface-variant shrink-0" aria-hidden="true">
            chevron_right
          </span>
        </a>

        {/* Ubicación */}
        <a
          href={OFFICIAL_CONTACTS.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-full min-w-0 overflow-hidden bg-surface-container-lowest border border-outline-variant rounded-xl py-3 px-1.5 md:px-4 md:py-4 flex flex-col md:flex-row items-center justify-center md:justify-between gap-1.5 md:gap-3 hover:bg-surface-container-low hover:border-secondary/60 transition-colors text-center md:text-left"
        >
          <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-3 min-w-0 max-w-full">
            <span className="material-symbols-outlined text-headline-md text-on-surface shrink-0" aria-hidden="true">
              location_on
            </span>
            <div className="flex flex-col min-w-0 max-w-full">
              <span className="font-body text-[11px] min-[400px]:text-label-sm font-semibold text-on-surface truncate md:hidden">
                Ubicación
              </span>
              <span className="hidden md:block font-body text-title-md font-semibold text-on-surface truncate">
                Ubicación
              </span>
              <span className="hidden md:block font-body text-label-sm text-on-surface-variant truncate">
                Abrir en Google Maps
              </span>
            </div>
          </div>
          <span className="hidden md:inline-block material-symbols-outlined text-title-md text-on-surface-variant shrink-0" aria-hidden="true">
            chevron_right
          </span>
        </a>
      </div>
    </section>
  );
}
