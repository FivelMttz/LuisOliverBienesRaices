import { useState, MouseEvent } from 'react';
import { PublicProperty, formatMXN } from '../types/domain';
import { OFFICIAL_CONTACTS } from '../data/seedData';
import { PropertyImage } from './PropertyImage';

interface PublicPropertyCardProps {
  property: PublicProperty;
  isFavorite: boolean;
  isExpanded: boolean;
  isHighlighted?: boolean;
  onToggleExpand: (id: string) => void;
  onToggleFavorite: (id: string, folio: string) => void;
  onTrackWhatsApp: (folio: string) => void;
  onTrackCall: (folio: string) => void;
  onOpenCallFallback: (folio: string) => void;
}

export function PublicPropertyCard({
  property,
  isFavorite,
  isExpanded,
  isHighlighted = false,
  onToggleExpand,
  onToggleFavorite,
  onTrackWhatsApp,
  onTrackCall,
  onOpenCallFallback,
}: PublicPropertyCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [heartAnimating, setHeartAnimating] = useState(false);

  const photos = property.fotos.length > 0 ? property.fotos : [];
  const safeIndex = photoIndex < photos.length ? photoIndex : 0;
  const activePhoto = photos[safeIndex];
  const hasGallery = photos.length > 1;

  const isClosed = property.estado === 'Vendida' || property.estado === 'Rentada';
  const isReserved = property.estado === 'Apartada' || property.estado === 'En negociación';

  const handlePrevPhoto = (e: MouseEvent) => {
    e.stopPropagation();
    if (!hasGallery) return;
    setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleNextPhoto = (e: MouseEvent) => {
    e.stopPropagation();
    if (!hasGallery) return;
    setPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const handleHeartClick = (e: MouseEvent) => {
    e.stopPropagation();
    setHeartAnimating(true);
    setTimeout(() => setHeartAnimating(false), 250);
    onToggleFavorite(property.id, property.folio);
  };

  const buildWhatsAppHref = () => {
    const priceText =
      property.operacion === 'Renta'
        ? `$${property.precio.toLocaleString('es-MX')} MXN/mes`
        : `$${property.precio.toLocaleString('es-MX')} MXN`;
    const msg = `Hola, quisiera obtener más información sobre ${property.titulo}, ${priceText}. Folio: ${property.folio}`;
    return `https://wa.me/${OFFICIAL_CONTACTS.phoneDigits}?text=${encodeURIComponent(msg)}`;
  };

  const renderAttributes = (compactMobile = false) => {
    const items: { icon: string; text: string; title: string }[] = [];

    if (property.tipo === 'Casa' || property.tipo === 'Departamento') {
      if (property.recamaras !== null) {
        items.push({ icon: 'bed', text: `${property.recamaras}`, title: 'Recámaras' });
      }
      if (property.banos !== null) {
        items.push({ icon: 'bathtub', text: `${property.banos}`, title: 'Baños' });
      }
      const m2Value = property.m2Construccion ?? property.m2Terreno;
      if (m2Value !== null) {
        items.push({ icon: 'open_in_full', text: `${m2Value} m²`, title: 'Superficie' });
      }
    } else if (property.tipo === 'Terreno') {
      if (property.m2Terreno !== null) {
        items.push({ icon: 'open_in_full', text: `${property.m2Terreno} m²`, title: 'Terreno' });
      }
    } else {
      const m2Value = property.m2Construccion ?? property.m2Terreno;
      if (m2Value !== null) {
        items.push({ icon: 'open_in_full', text: `${m2Value} m²`, title: 'Superficie' });
      }
    }

    if (compactMobile) {
      return (
        <div className="flex flex-wrap items-center gap-3 text-on-surface-variant">
          {items.map((item) => (
            <span key={item.title} className="inline-flex items-center gap-1" title={item.title}>
              <span className="material-symbols-outlined text-body-md" aria-hidden="true">
                {item.icon}
              </span>
              <span className="font-body text-label-sm tabular-nums">{item.text}</span>
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-end gap-1 text-on-surface-variant shrink-0">
        {items.map((item) => (
          <span
            key={item.title}
            title={item.title}
            className="inline-flex items-center gap-1.5 text-label-sm tabular-nums"
          >
            <span className="material-symbols-outlined text-body-md" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.text}</span>
          </span>
        ))}
      </div>
    );
  };

  return (
    <article
      id={`property-card-${property.id}`}
      data-folio={property.folio}
      onClick={() => onToggleExpand(property.id)}
      className={`group cursor-pointer bg-surface-container-lowest rounded-xl border overflow-hidden transition-all duration-150 ${
        isHighlighted
          ? 'border-red-700 ring-2 ring-red-700/25 shadow-md'
          : isExpanded
            ? 'border-secondary shadow-sm'
            : 'border-outline-variant/70 hover:border-secondary/70 hover:shadow-xs'
      }`}
    >
      {/* Top Card Layout: Horizontal on mobile, Vertical on md+ */}
      <div className="flex items-stretch gap-2.5 min-[380px]:gap-3 p-2 md:flex-col md:p-0 md:gap-0">
        {/* Image Container with Gallery Controls & Heart */}
        <div className="relative w-[104px] min-[380px]:w-[120px] sm:w-[124px] min-h-[108px] shrink-0 rounded-md overflow-hidden bg-surface-container-high md:w-full md:aspect-[16/10] md:rounded-none">
          <PropertyImage
            src={activePhoto?.url ?? ''}
            alt={`${property.tipo} en ${property.zonaPublica}, San Luis Potosí`}
            fallbackLabel={property.zonaPublica}
            className={`w-full h-full object-cover transition-transform duration-300 ease-surface-enter group-hover:scale-[1.03] ${
              isClosed ? 'opacity-80 grayscale-[25%]' : ''
            }`}
          />

          {/* Top-left Desktop Type + Status Chromatic Highlight (REQ-UI-001, REQ-CAT-003) */}
          <div className="hidden md:flex items-center gap-1.5 absolute top-3 left-3 z-10">
            <span className="rounded-full bg-surface-container-lowest/95 text-on-surface px-3 py-1 text-label-sm font-semibold shadow-xs">
              {property.tipo}
            </span>
            {property.operacion !== 'Venta' && (
              <span className="rounded-full bg-secondary text-on-secondary px-2.5 py-1 text-label-sm font-medium shadow-xs">
                {property.operacion}
              </span>
            )}
          </div>

          {/* Availability Status Badge when non-Disponible */}
          {(isClosed || isReserved) && (
            <span
              className={`absolute bottom-2 left-2 md:bottom-3 md:left-3 z-10 rounded-md px-2 py-0.5 text-label-sm font-medium shadow-xs ${
                isClosed
                  ? 'bg-primary/90 text-on-primary'
                  : 'bg-secondary-container text-on-secondary-container'
              }`}
            >
              {property.estado}
            </span>
          )}

          {/* Gallery Arrows (REQ-GAL-001: only when >1 photo, stopPropagation) */}
          {hasGallery && (
            <>
              <button
                type="button"
                onClick={handlePrevPhoto}
                aria-label="Fotografía anterior"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/55 hover:bg-primary/80 text-on-primary flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-body-lg" aria-hidden="true">
                  chevron_left
                </span>
              </button>
              <button
                type="button"
                onClick={handleNextPhoto}
                aria-label="Siguiente fotografía"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/55 hover:bg-primary/80 text-on-primary flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-body-lg" aria-hidden="true">
                  chevron_right
                </span>
              </button>
              <span className="hidden md:inline-block absolute bottom-2.5 right-3 z-10 rounded-full bg-primary/65 text-on-primary px-2 py-0.5 font-mono text-[11px] tabular-nums">
                {safeIndex + 1}/{photos.length}
              </span>
            </>
          )}

          {/* Heart Favorite Button (REQ-FAV-001) */}
          <button
            type="button"
            onClick={handleHeartClick}
            aria-label={
              isFavorite
                ? `Quitar ${property.titulo} de favoritos`
                : `Guardar ${property.titulo} en favoritos`
            }
            aria-pressed={isFavorite}
            className={`absolute top-2 right-2 md:top-3 md:right-3 z-10 w-8 h-8 rounded-full bg-primary/45 hover:bg-primary/75 flex items-center justify-center transition-transform duration-150 ${
              heartAnimating ? 'scale-125' : 'scale-100'
            } ${isFavorite ? 'text-red-500' : 'text-on-primary'}`}
          >
            <span
              className="material-symbols-outlined text-body-lg"
              style={isFavorite ? { fontVariationSettings: "'FILL' 1" } : undefined}
              aria-hidden="true"
            >
              favorite
            </span>
          </button>
        </div>

        {/* Mobile Compact Info (< md) */}
        <div className="flex-1 min-w-0 py-1 flex flex-col justify-between gap-1.5 md:hidden">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-label-sm font-medium text-secondary">
              <span>{property.tipo}</span>
              <span aria-hidden="true">·</span>
              <span>{property.operacion}</span>
            </div>
            <h3 className="font-body text-title-md font-semibold text-on-surface truncate">
              {property.titulo}
            </h3>
            <p className="inline-flex items-center gap-1 text-label-sm text-on-surface-variant truncate">
              <span
                className="material-symbols-outlined text-body-md text-red-700 shrink-0"
                aria-hidden="true"
              >
                location_on
              </span>
              <span className="truncate">{property.zonaPublica}</span>
            </p>
            <p className="font-body text-label-md min-[380px]:text-body-md font-semibold text-emerald-800 tabular-nums truncate">
              {formatMXN(property.precio, property.operacion)}
            </p>
          </div>
          {renderAttributes(true)}
        </div>

        {/* Mobile Expand Toggle Button */}
        <div className="flex items-center shrink-0 pr-0.5 sm:pr-1 md:hidden">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(property.id);
            }}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? `Contraer ${property.titulo}` : `Expandir ${property.titulo}`}
            className="w-8 h-8 min-[380px]:w-9 min-[380px]:h-9 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface flex items-center justify-center hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-title-md" aria-hidden="true">
              {isExpanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>

        {/* Desktop Footer (md+) */}
        <div className="hidden md:flex items-end justify-between gap-3 p-4 min-h-[98px]">
          <div className="min-w-0 flex flex-col gap-1">
            <h3 className="font-body text-title-md font-semibold text-on-surface truncate">
              {property.titulo}
            </h3>
            <p className="inline-flex items-center gap-1 text-label-sm text-on-surface-variant truncate">
              <span
                className="material-symbols-outlined text-body-md text-red-700 shrink-0"
                aria-hidden="true"
              >
                location_on
              </span>
              <span className="truncate">{property.zonaPublica}</span>
            </p>
            <p className="font-body text-body-md font-semibold text-emerald-800 tabular-nums">
              {formatMXN(property.precio, property.operacion)}
            </p>
          </div>
          {renderAttributes(false)}
        </div>
      </div>

      {/* IN-PLACE EXPANSION (REQ-CAT-002: stays open independently per card, no separate pages) */}
      {isExpanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="border-t border-outline-variant/60 bg-surface-container-low/65 p-4 flex flex-col gap-3 cursor-default"
        >
          <div className="flex items-center justify-between gap-2 text-label-sm text-on-surface-variant">
            <span className="font-mono text-mono-sm text-on-surface">{property.folio}</span>
            <button
              type="button"
              onClick={() => onToggleExpand(property.id)}
              className="inline-flex items-center gap-1 text-label-sm text-secondary hover:text-on-surface"
            >
              <span>Contraer</span>
              <span className="material-symbols-outlined text-body-md" aria-hidden="true">
                expand_less
              </span>
            </button>
          </div>

          <p className="text-body-md text-on-surface-variant line-clamp-3 leading-relaxed">
            {property.descripcion}
          </p>

          {/* Extra type-specific attributes (no zeros for unknown) */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-label-sm text-on-surface pt-0.5">
            {property.m2Terreno !== null && (
              <span className="tabular-nums">Terreno: {property.m2Terreno} m²</span>
            )}
            {property.m2Construccion !== null && (
              <span className="tabular-nums">Construcción: {property.m2Construccion} m²</span>
            )}
            {property.estacionamientos !== null && (
              <span className="tabular-nums">Cochera: {property.estacionamientos}</span>
            )}
            {property.alturaLibre !== null && (
              <span className="tabular-nums">Altura libre: {property.alturaLibre} m</span>
            )}
          </div>

          {(isClosed || isReserved) && (
            <p className="text-label-sm text-secondary font-medium">
              {isClosed
                ? 'Esta operación ya fue concluida. Escríbenos para conocer opciones similares disponibles.'
                : 'Propiedad en proceso. Consulta con nuestros asesores otras alternativas en la zona.'}
            </p>
          )}

          {/* Contextual WhatsApp & Llamar Actions (REQ-CON-001, REQ-CON-002) */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <a
              href={buildWhatsAppHref()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onTrackWhatsApp(property.folio)}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary-container text-on-primary-container py-2.5 px-3 text-label-md font-semibold hover:bg-primary transition-colors whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-body-lg" aria-hidden="true">
                chat
              </span>
              <span>WhatsApp</span>
            </a>

            <a
              href={`tel:+${OFFICIAL_CONTACTS.phoneDigits}`}
              onClick={(e) => {
                onTrackCall(property.folio);
                // On desktop browsers without tel handler, also surface helper modal cleanly
                if (typeof window !== 'undefined' && window.innerWidth >= 768) {
                  e.preventDefault();
                  onOpenCallFallback(property.folio);
                }
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface py-2.5 px-3 text-label-md font-semibold hover:bg-surface-container-low transition-colors whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-body-lg" aria-hidden="true">
                call
              </span>
              <span>Llamar</span>
            </a>
          </div>
        </div>
      )}
    </article>
  );
}
