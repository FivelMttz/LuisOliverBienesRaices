import { useState, FormEvent } from 'react';
import { PropertyType, LeadRequest, formatMXN } from '../types/domain';
import { OFFICIAL_CONTACTS } from '../data/seedData';
import { usePlatform } from '../services/platformStore';
import { PropertyImage } from './PropertyImage';

interface SellerCaptureSectionProps {
  showMobileForm: boolean;
  onToggleMobileForm: (open: boolean) => void;
}

const SELLER_TYPE_CHIPS: { id: PropertyType; label: string; icon: string }[] = [
  { id: 'Casa', label: 'Casa', icon: 'home' },
  { id: 'Departamento', label: 'Departamento', icon: 'apartment' },
  { id: 'Terreno', label: 'Terreno', icon: 'layers' },
  { id: 'Local', label: 'Local', icon: 'storefront' },
  { id: 'Oficina', label: 'Oficina', icon: 'work_outline' },
  { id: 'Bodega', label: 'Bodega', icon: 'warehouse' },
];

export function SellerCaptureSection({
  showMobileForm,
  onToggleMobileForm,
}: SellerCaptureSectionProps) {
  const { config, submitSellerLead } = usePlatform();

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [zona, setZona] = useState('');
  const [tipo, setTipo] = useState<PropertyType | ''>('Casa');
  const [precio, setPrecio] = useState<number>(5000000);
  const [manualPriceText, setManualPriceText] = useState('5000000');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => `key-${Date.now()}`);
  const [submittedLead, setSubmittedLead] = useState<LeadRequest | null>(null);

  const sliderClamped = Math.min(20000000, Math.max(1000000, precio));
  const sliderProgress = ((sliderClamped - 1000000) / (20000000 - 1000000)) * 100;

  const handleSliderChange = (value: number) => {
    setPrecio(value);
    setManualPriceText(String(value));
  };

  const handleManualPriceChange = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    setManualPriceText(cleaned);
    if (cleaned) {
      const parsed = Number(cleaned);
      if (!Number.isNaN(parsed)) {
        setPrecio(parsed);
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!nombre.trim()) {
      setError('Ingresa tu nombre completo.');
      return;
    }
    const digits = telefono.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Ingresa un teléfono válido de al menos 10 dígitos (ej. 444 369 7826).');
      return;
    }
    if (!zona.trim()) {
      setError('Indica la zona donde se ubica tu inmueble.');
      return;
    }
    if (!tipo) {
      setError('Selecciona el tipo de propiedad.');
      return;
    }
    if (precio <= 0) {
      setError('Ingresa un precio aproximado válido en MXN.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const res = submitSellerLead({
      nombre,
      telefono,
      zona,
      tipo,
      precioAproximado: precio,
      idempotencyKey,
    });

    setIsSubmitting(false);

    if (!res.ok || !res.data) {
      setError(res.error ?? 'No pudimos registrar tu solicitud. Intenta de nuevo.');
      return;
    }

    setSubmittedLead(res.data);
  };

  const handleReset = () => {
    setNombre('');
    setTelefono('');
    setZona('');
    setTipo('Casa');
    setPrecio(5000000);
    setManualPriceText('5000000');
    setError('');
    setSubmittedLead(null);
    setIdempotencyKey(`key-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  };

  const buildLeadWhatsAppUrl = (lead: LeadRequest) => {
    const msg = `Hola, he llenado el formulario. Quiero vender mi propiedad. Folio: ${lead.folio}`;
    return `https://wa.me/${OFFICIAL_CONTACTS.phoneDigits}?text=${encodeURIComponent(msg)}`;
  };

  const renderFormFields = (isMobile: boolean) => (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className={isMobile ? 'flex flex-col gap-3' : 'grid grid-cols-2 gap-4'}>
        <label className="flex flex-col gap-1.5">
          <span className="font-body text-label-md font-semibold text-on-surface">Nombre</span>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            className="w-full rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-body text-label-md font-semibold text-on-surface">Teléfono</span>
          <div className="relative">
            <span
              className="material-symbols-outlined text-title-md text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            >
              call
            </span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={telefono}
              onChange={(e) => {
                setTelefono(e.target.value);
                if (error) setError('');
              }}
              placeholder="444 000 0000"
              className="w-full rounded-full border border-outline-variant bg-surface-container-lowest pl-10 pr-4 py-2.5 text-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none"
            />
          </div>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-body text-label-md font-semibold text-on-surface">Zona</span>
        <div className="relative">
          <span
            className="material-symbols-outlined text-title-md text-red-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          >
            location_on
          </span>
          <input
            type="text"
            required
            value={zona}
            onChange={(e) => setZona(e.target.value)}
            placeholder="Ej. Lomas, Tangamanga, Himalaya..."
            className="w-full rounded-full border border-outline-variant bg-surface-container-lowest pl-10 pr-4 py-2.5 text-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none"
          />
        </div>
      </label>

      <div className="flex flex-col gap-2">
        <span className="font-body text-label-md font-semibold text-on-surface">
          Tipo de propiedad
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {SELLER_TYPE_CHIPS.map((chip) => {
            const isSelected = tipo === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setTipo(chip.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-label-md transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'border-primary-container bg-primary-container text-on-primary-container'
                    : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-body-lg" aria-hidden="true">
                  {chip.icon}
                </span>
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor={isMobile ? 'seller-slider-mobile' : 'seller-slider-desktop'}
            className="font-body text-label-md font-semibold text-on-surface"
          >
            Precio aproximado
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-label-sm text-on-surface-variant">Monto exacto:</span>
            <input
              type="text"
              inputMode="numeric"
              aria-label="Monto aproximado en MXN"
              value={manualPriceText}
              onChange={(e) => handleManualPriceChange(e.target.value)}
              className="w-28 sm:w-32 max-w-full rounded-md border border-outline-variant bg-surface-container-lowest px-2.5 py-1 text-label-md font-mono text-on-surface tabular-nums text-right focus:border-secondary focus:outline-none"
            />
          </div>
        </div>

        <input
          id={isMobile ? 'seller-slider-mobile' : 'seller-slider-desktop'}
          type="range"
          min={1000000}
          max={20000000}
          step={250000}
          value={sliderClamped}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          style={{
            background: `linear-gradient(to right, #715B3E 0%, #715B3E ${sliderProgress}%, #E7E2D9 ${sliderProgress}%, #E7E2D9 100%)`,
          }}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-secondary"
        />
        <div className="flex items-center justify-between gap-2 text-label-sm tabular-nums">
          <span className="text-on-surface-variant shrink-0">
            <span className="sm:hidden">$1M</span>
            <span className="hidden sm:inline">$1,000,000 MXN</span>
          </span>
          <span className="font-semibold text-emerald-800 text-center truncate">
            {formatMXN(precio)}
          </span>
          <span className="text-on-surface-variant shrink-0">
            <span className="sm:hidden">$20M</span>
            <span className="hidden sm:inline">$20,000,000 MXN</span>
          </span>
        </div>
      </div>

      {error && (
        <p className="text-label-sm text-error font-medium" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto md:min-w-[260px] rounded-md bg-primary-container text-on-primary-container px-8 py-3 text-label-lg font-semibold hover:bg-primary disabled:opacity-60 transition-colors"
        >
          {isSubmitting ? 'Guardando...' : 'Enviar información'}
        </button>
        <p className="text-label-sm text-on-surface-variant text-center">
          Al enviar aceptas nuestro{' '}
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="underline underline-offset-2 text-secondary hover:text-on-surface"
          >
            Aviso de privacidad
          </button>
          . Tus datos se resguardan de forma confidencial.
        </p>
      </div>
    </form>
  );

  const renderConfirmation = (lead: LeadRequest) => (
    <div className="rounded-xl bg-surface-container-low border border-outline-variant/70 p-6 md:p-8 flex flex-col items-center text-center gap-3">
      <span className="material-symbols-outlined text-display-lg text-emerald-800" aria-hidden="true">
        check_circle
      </span>
      <div>
        <span className="font-mono text-mono-sm text-secondary block">
          Folio asignado: {lead.folio}
        </span>
        <h3 className="font-headline text-headline-md text-on-surface mt-0.5">
          Solicitud registrada correctamente
        </h3>
      </div>
      <p className="text-body-md text-on-surface-variant max-w-md break-words">
        Gracias, <span className="font-semibold text-on-surface">{lead.nombre}</span>. Guardamos tu{' '}
        <span className="font-semibold text-on-surface">{lead.tipo}</span> en{' '}
        <span className="font-semibold text-on-surface">{lead.zona}</span> ({formatMXN(lead.precioAproximado)}).
        Notificamos al equipo y te contactaremos al {lead.telefono}.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full">
        <a
          href={buildLeadWhatsAppUrl(lead)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary-container text-on-primary-container px-5 py-2.5 text-label-md font-semibold hover:bg-primary transition-colors"
        >
          <span className="material-symbols-outlined text-title-md" aria-hidden="true">
            chat
          </span>
          <span>Confirmar por WhatsApp</span>
        </a>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-outline-variant bg-surface-container-lowest px-5 py-2.5 text-label-md text-on-surface hover:bg-surface-container transition-colors"
        >
          Registrar otra propiedad
        </button>
      </div>
    </div>
  );

  return (
    <section id="vender" className="flex flex-col gap-3">
      {/* Mobile Compact Banner (< md) */}
      <div className="md:hidden relative rounded-xl overflow-hidden border border-outline-variant/60 min-h-[156px] p-4 min-[420px]:p-5 flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-3.5">
        <PropertyImage
          src={config.sellerBannerImageUrl}
          alt="Residencia de cantera en San Luis Potosí"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b min-[420px]:bg-gradient-to-r from-primary/85 via-primary/70 to-primary/50" />

        <div className="relative z-10 flex flex-col gap-1 min-w-0 flex-1">
          <h2 className="font-headline text-[21px] leading-[27px] min-[420px]:text-headline-md text-on-primary text-balance break-words">
            {config.sellerTitle}
          </h2>
          <p className="font-body text-label-sm text-on-primary/90 text-pretty break-words">
            {config.sellerSubtitle}
          </p>
        </div>

        <button
          type="button"
          aria-expanded={showMobileForm}
          onClick={() => onToggleMobileForm(!showMobileForm)}
          className="relative z-10 self-start min-[420px]:self-center shrink-0 inline-flex items-center gap-1.5 rounded-md bg-surface-container-lowest text-on-surface px-3.5 py-2.5 hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-title-md shrink-0" aria-hidden="true">
            sell
          </span>
          <span className="font-body text-label-md font-semibold whitespace-nowrap">
            {showMobileForm ? 'Ocultar' : 'Iniciar registro'}
          </span>
          <span className="material-symbols-outlined text-title-md shrink-0" aria-hidden="true">
            {showMobileForm ? 'expand_less' : 'arrow_forward'}
          </span>
        </button>
      </div>

      {/* Mobile Expandable Form (< md) */}
      {showMobileForm && (
        <div className="md:hidden bg-surface-container-lowest rounded-lg border border-outline-variant p-4">
          {submittedLead ? renderConfirmation(submittedLead) : renderFormFields(true)}
        </div>
      )}

      {/* Desktop 2-Column Showcase Card (md+) */}
      <div className="hidden md:grid md:grid-cols-[38%_1fr] gap-8 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 p-6 items-stretch shadow-xs">
        <div className="relative rounded-xl overflow-hidden min-h-[440px] bg-surface-container-high">
          <PropertyImage
            src={config.sellerBannerImageUrl}
            alt="Residencia de cantera en San Luis Potosí"
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="py-2 pr-2 flex flex-col justify-center gap-5">
          <h2 className="font-headline text-headline-lg text-on-surface">{config.sellerTitle}</h2>
          {submittedLead ? renderConfirmation(submittedLead) : renderFormFields(false)}
        </div>
      </div>

      {/* Aviso de Privacidad Modal */}
      {showPrivacyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
          onClick={() => setShowPrivacyModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-surface border border-outline-variant p-6 flex flex-col gap-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 id="privacy-modal-title" className="font-headline text-title-lg text-on-surface">
                Aviso de Privacidad
              </h3>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                aria-label="Cerrar aviso de privacidad"
                className="w-9 h-9 rounded-full hover:bg-surface-container-low flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                  close
                </span>
              </button>
            </div>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Luis &amp; Oliver Bienes Raíces utiliza los datos proporcionados únicamente para
              contactarte respecto a la valoración, promoción y comercialización de tu inmueble en
              San Luis Potosí. No compartimos ni publicamos datos personales, direcciones exactas ni
              teléfonos de propietarios con terceros o visitantes del sitio.
            </p>
            <button
              type="button"
              onClick={() => setShowPrivacyModal(false)}
              className="self-end rounded-md bg-primary-container text-on-primary-container px-4 py-2 text-label-md"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
