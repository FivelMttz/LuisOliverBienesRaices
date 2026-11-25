import { Property, formatMXN } from '../data/properties';
import { PropertyImage } from './PropertyImage';

interface PropertyCardProps {
  property: Property;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  onSelect: (property: Property) => void;
}

export function PropertyCard({
  property,
  isFavorite,
  onToggleFavorite,
  onSelect,
}: PropertyCardProps) {
  return (
    <article
      data-component-id={`card-property-${property.id}`}
      data-component-type="card"
      data-component-variant="elevated"
      onClick={() => onSelect(property)}
      className="group cursor-pointer bg-surface-container-lowest rounded-xl border border-outline-variant/60 overflow-hidden flex items-stretch gap-3 p-2 md:flex-col md:p-0 md:gap-0 transition-all duration-150 ease-state-change hover:border-secondary/70 hover:shadow-sm"
    >
      {/* Thumbnail */}
      <div className="relative w-[124px] min-h-[104px] shrink-0 rounded-md overflow-hidden bg-surface-container-high md:w-full md:aspect-[16/10] md:rounded-none">
        <PropertyImage
          src={property.imagen}
          alt={property.alt}
          fallbackLabel={property.zona}
          className="w-full h-full object-cover transition-transform duration-300 ease-surface-enter group-hover:scale-[1.03]"
        />

        {/* Desktop top-left type label matching desktop showcase */}
        <span className="hidden md:inline-block absolute top-3 left-3 rounded-full bg-surface-container-lowest/95 text-on-surface px-3 py-1 text-label-sm font-medium shadow-xs">
          {property.tipo}
        </span>

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(property.id);
          }}
          aria-label={
            isFavorite
              ? `Quitar ${property.zona} de favoritos`
              : `Guardar ${property.zona} en favoritos`
          }
          aria-pressed={isFavorite}
          className="absolute top-2 right-2 md:top-3 md:right-3 w-8 h-8 rounded-full bg-primary/45 hover:bg-primary/75 text-on-primary flex items-center justify-center transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-primary"
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

      {/* Mobile Content (< md) */}
      <div className="flex-1 min-w-0 py-1 flex flex-col justify-between gap-1.5 md:hidden">
        <div className="flex flex-col gap-1">
          <span className="text-label-sm font-medium text-secondary">
            {property.tipo}
          </span>
          <h3 className="font-body text-title-md text-on-surface truncate">
            {property.zona}
          </h3>
          <p className="font-body text-body-md text-on-surface tabular-nums">
            {formatMXN(property.precio)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-on-surface-variant">
          {property.recamaras !== null && (
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-body-md" aria-hidden="true">
                bed
              </span>
              <span className="font-body text-label-sm tabular-nums">
                {property.recamaras}
              </span>
            </span>
          )}
          {property.banos !== null && (
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-body-md" aria-hidden="true">
                bathtub
              </span>
              <span className="font-body text-label-sm tabular-nums">
                {property.banos}
              </span>
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-body-md" aria-hidden="true">
              square_foot
            </span>
            <span className="font-body text-label-sm tabular-nums">
              {property.m2} m²
            </span>
          </span>
        </div>
      </div>

      {/* Mobile Forward Arrow (< md) */}
      <div className="flex items-center pr-1 md:hidden">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(property);
          }}
          aria-label={`Ver detalle de ${property.zona}`}
          className="w-9 h-9 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface flex items-center justify-center hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-title-md" aria-hidden="true">
            arrow_forward
          </span>
        </button>
      </div>

      {/* Desktop Footer Content (md+) matching desktop showcase */}
      <div className="hidden md:flex items-end justify-between gap-3 p-4 min-h-[96px]">
        <div className="min-w-0 flex flex-col gap-1">
          <h3 className="font-body text-title-md font-semibold text-on-surface truncate">
            {property.zona}
          </h3>
          <p className="font-body text-body-md font-medium text-on-surface tabular-nums">
            {formatMXN(property.precio)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 text-on-surface-variant shrink-0">
          {property.recamaras !== null && (
            <span className="inline-flex items-center gap-1.5 text-label-sm tabular-nums">
              <span className="material-symbols-outlined text-body-md" aria-hidden="true">
                bed
              </span>
              <span className="min-w-[20px] text-right">{property.recamaras}</span>
            </span>
          )}
          {property.banos !== null && (
            <span className="inline-flex items-center gap-1.5 text-label-sm tabular-nums">
              <span className="material-symbols-outlined text-body-md" aria-hidden="true">
                bathtub
              </span>
              <span className="min-w-[20px] text-right">{property.banos}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-label-sm tabular-nums">
            <span className="material-symbols-outlined text-body-md" aria-hidden="true">
              open_in_full
            </span>
            <span>{property.m2} m²</span>
          </span>
        </div>
      </div>
    </article>
  );
}
