import { useEffect, useState, FormEvent } from 'react';
import { Property, formatMXN } from '../data/properties';
import { PropertyImage } from './PropertyImage';

interface PropertyDetailModalProps {
  property: Property | null;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  onClose: () => void;
}

export function PropertyDetailModal({
  property,
  isFavorite,
  onToggleFavorite,
  onClose,
}: PropertyDetailModalProps) {
  const [visitName, setVisitName] = useState('');
  const [visitPhone, setVisitPhone] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitSubmitted, setVisitSubmitted] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    setVisitSubmitted(false);
    setPhoneError('');
    setVisitName('');
    setVisitPhone('');
    setVisitDate('');
  }, [property?.id]);

  useEffect(() => {
    if (!property) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [property, onClose]);

  if (!property) return null;

  // Simple realistic mortgage estimate: 20% down payment, 10.5% annual rate, 20 years
  const principal = property.precio * 0.8;
  const monthlyRate = 0.105 / 12;
  const months = 240;
  const monthlyEstimate = Math.round(
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
      (Math.pow(1 + monthlyRate, months) - 1),
  );

  const handleScheduleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const digits = visitPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      setPhoneError('Ingresa un número telefónico válido a 10 dígitos.');
      return;
    }
    setPhoneError('');
    setVisitSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-primary/60 backdrop-blur-sm p-0 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-detail-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl md:rounded-xl bg-surface border border-outline-variant text-on-surface shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Mobile Sheet Handle */}
        <div className="md:hidden pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-outline-variant" aria-hidden="true" />
        </div>

        {/* Image Header */}
        <div className="relative w-full aspect-[16/10] bg-surface-container-high shrink-0">
          <PropertyImage
            src={property.imagen}
            alt={property.alt}
            fallbackLabel={property.zona}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-primary/30 pointer-events-none" />

          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleFavorite(property.id)}
              aria-label={
                isFavorite
                  ? `Quitar ${property.zona} de favoritos`
                  : `Guardar ${property.zona} en favoritos`
              }
              aria-pressed={isFavorite}
              className="w-10 h-10 rounded-full bg-primary/70 hover:bg-primary text-on-primary flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-on-primary"
            >
              <span
                className="material-symbols-outlined text-title-lg"
                style={isFavorite ? { fontVariationSettings: "'FILL' 1" } : undefined}
                aria-hidden="true"
              >
                favorite
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar detalle de propiedad"
              className="w-10 h-10 rounded-full bg-primary/70 hover:bg-primary text-on-primary flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-on-primary"
            >
              <span className="material-symbols-outlined text-title-lg" aria-hidden="true">
                close
              </span>
            </button>
          </div>

          <div className="absolute bottom-4 left-5 right-5 text-on-primary">
            <p className="text-label-sm font-medium text-on-primary/90">
              {property.tipo} · {property.operacion} · San Luis Potosí
            </p>
            <h2
              id="property-detail-title"
              className="font-headline text-headline-md md:text-headline-lg text-on-primary"
            >
              {property.zona}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 md:p-6 flex flex-col gap-5">
          {/* Price + Estimate */}
          <div className="flex flex-wrap items-baseline justify-between gap-3 pb-4 border-b border-outline-variant/60">
            <div>
              <span className="text-label-sm text-on-surface-variant block">
                Precio de venta
              </span>
              <p className="font-headline text-headline-md text-on-surface font-bold tabular-nums">
                {formatMXN(property.precio)}
              </p>
            </div>
            <div className="text-left md:text-right">
              <span className="text-label-sm text-on-surface-variant block">
                Mensualidad estimada (20% enganche)
              </span>
              <p className="font-mono text-body-md text-secondary font-medium tabular-nums">
                ~{formatMXN(monthlyEstimate)} / mes
              </p>
            </div>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {property.recamaras !== null && (
              <div className="rounded-lg bg-surface-container-low border border-outline-variant/50 p-3 flex flex-col gap-1">
                <span className="text-label-sm text-on-surface-variant">Recámaras</span>
                <div className="flex items-center gap-1.5 text-on-surface">
                  <span className="material-symbols-outlined text-title-md text-secondary" aria-hidden="true">
                    bed
                  </span>
                  <span className="font-body text-title-md tabular-nums">{property.recamaras}</span>
                </div>
              </div>
            )}
            {property.banos !== null && (
              <div className="rounded-lg bg-surface-container-low border border-outline-variant/50 p-3 flex flex-col gap-1">
                <span className="text-label-sm text-on-surface-variant">Baños</span>
                <div className="flex items-center gap-1.5 text-on-surface">
                  <span className="material-symbols-outlined text-title-md text-secondary" aria-hidden="true">
                    bathtub
                  </span>
                  <span className="font-body text-title-md tabular-nums">{property.banos}</span>
                </div>
              </div>
            )}
            <div className="rounded-lg bg-surface-container-low border border-outline-variant/50 p-3 flex flex-col gap-1">
              <span className="text-label-sm text-on-surface-variant">Superficie</span>
              <div className="flex items-center gap-1.5 text-on-surface">
                <span className="material-symbols-outlined text-title-md text-secondary" aria-hidden="true">
                  square_foot
                </span>
                <span className="font-body text-title-md tabular-nums">{property.m2} m²</span>
              </div>
            </div>
            {property.estacionamientos !== null && (
              <div className="rounded-lg bg-surface-container-low border border-outline-variant/50 p-3 flex flex-col gap-1">
                <span className="text-label-sm text-on-surface-variant">Cochera</span>
                <div className="flex items-center gap-1.5 text-on-surface">
                  <span className="material-symbols-outlined text-title-md text-secondary" aria-hidden="true">
                    directions_car
                  </span>
                  <span className="font-body text-title-md tabular-nums">
                    {property.estacionamientos} autos
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Description & Highlights */}
          <div className="flex flex-col gap-3">
            <h3 className="font-headline text-title-lg text-on-surface">
              Descripción de la propiedad
            </h3>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              {property.descripcion}
            </p>
            <ul className="flex flex-col gap-1.5 pt-1">
              {property.destacados.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-body-md text-on-surface"
                >
                  <span
                    className="material-symbols-outlined text-title-md text-secondary mt-0.5 shrink-0"
                    aria-hidden="true"
                  >
                    check_circle
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Schedule Visit Form */}
          <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-4 flex flex-col gap-3">
            <h3 className="font-headline text-title-md text-on-surface">
              Agendar visita privada
            </h3>
            {visitSubmitted ? (
              <div className="py-2 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-secondary font-medium text-body-md">
                  <span className="material-symbols-outlined text-title-lg" aria-hidden="true">
                    task_alt
                  </span>
                  <span>Solicitud recibida para {property.zona}</span>
                </div>
                <p className="text-body-md text-on-surface-variant">
                  Un asesor de Luis &amp; Oliver confirmará tu recorrido por teléfono o WhatsApp
                  {visitDate ? ` para el ${visitDate}` : ' a la brevedad'}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleScheduleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-label-sm text-on-surface">Nombre</span>
                  <input
                    type="text"
                    required
                    value={visitName}
                    onChange={(e) => setVisitName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-label-sm text-on-surface">Teléfono</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    value={visitPhone}
                    onChange={(e) => {
                      setVisitPhone(e.target.value);
                      if (phoneError) setPhoneError('');
                    }}
                    placeholder="444 000 0000"
                    className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-label-sm text-on-surface">Fecha preferida</span>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md text-on-surface focus:border-secondary focus:outline-none"
                  />
                </label>
                {phoneError && (
                  <p className="sm:col-span-3 text-label-sm text-error" role="alert">
                    {phoneError}
                  </p>
                )}
                <div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-primary-container text-on-primary-container px-5 py-2.5 text-label-lg hover:bg-primary transition-colors whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                      calendar_month
                    </span>
                    <span>Solicitar cita</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface px-4 py-2.5 text-label-md hover:bg-surface-container-low transition-colors whitespace-nowrap"
                  >
                    Seguir explorando
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
