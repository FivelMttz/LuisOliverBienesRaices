import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  CatalogFilters,
  OperationType,
  PropertyType,
  PublicProperty,
  formatMXN,
} from '../types/domain';
import { usePlatform } from '../services/platformStore';
import { PublicPropertyCard } from './PublicPropertyCard';
import { SanLuisMap } from './SanLuisMap';
import { ContactSection } from './ContactSection';
import { ContactModalMode } from './ContactModal';

interface CatalogViewProps {
  filters: CatalogFilters;
  onFiltersChange: (next: CatalogFilters) => void;
  visibleCount: number;
  onVisibleCountChange: (count: number) => void;
  expandedIds: string[];
  onToggleExpand: (id: string, folio?: string) => void;
  onGoLanding: () => void;
  onGoSell: () => void;
  onGoContact: () => void;
  onOpenContactModal: (mode: ContactModalMode, folio?: string) => void;
}

const ALL_TYPES: PropertyType[] = [
  'Casa',
  'Departamento',
  'Terreno',
  'Oficina',
  'Local',
  'Bodega',
];

const ALL_OPERATIONS: OperationType[] = ['Venta', 'Renta', 'Preventa'];

export function CatalogView({
  filters,
  onFiltersChange,
  visibleCount,
  onVisibleCountChange,
  expandedIds,
  onToggleExpand,
  onGoLanding,
  onGoSell,
  onGoContact,
  onOpenContactModal,
}: CatalogViewProps) {
  const { publicProperties, favorites, toggleFavorite, trackEvent } = usePlatform();

  const [showMap, setShowMap] = useState(true);
  const [selectedMapPropertyId, setSelectedMapPropertyId] = useState<string | null>(null);
  const [mapBoundIds, setMapBoundIds] = useState<Set<string> | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const availableZones = useMemo(
    () => Array.from(new Set(publicProperties.map((p) => p.zonaPublica))).sort(),
    [publicProperties],
  );

  const updateFiltersAndResetBatch = (next: CatalogFilters, changedCategory?: string) => {
    onFiltersChange(next);
    onVisibleCountChange(12);
    setMapBoundIds(null);
    if (changedCategory) {
      trackEvent({
        tipo: 'filter_applied',
        filtrosCategorias: [changedCategory],
        zona: next.zonas.length === 1 ? next.zonas[0] : undefined,
        operacion: next.operaciones.length === 1 ? next.operaciones[0] : undefined,
        precioRango:
          next.ventaPrecioMax || next.ventaPrecioMin
            ? `Venta:${next.ventaPrecioMin ?? 0}-${next.ventaPrecioMax ?? 'max'}`
            : next.rentaPrecioMax || next.rentaPrecioMin
              ? `Renta:${next.rentaPrecioMin ?? 0}-${next.rentaPrecioMax ?? 'max'}`
              : undefined,
      });
    }
  };

  const toggleOperation = (op: OperationType) => {
    const exists = filters.operaciones.includes(op);
    const nextOps = exists
      ? filters.operaciones.filter((item) => item !== op)
      : [...filters.operaciones, op];
    updateFiltersAndResetBatch({ ...filters, operaciones: nextOps }, 'Operación');
  };

  const toggleType = (tipo: PropertyType) => {
    const exists = filters.tipos.includes(tipo);
    const nextTipos = exists
      ? filters.tipos.filter((item) => item !== tipo)
      : [...filters.tipos, tipo];
    updateFiltersAndResetBatch({ ...filters, tipos: nextTipos }, 'Tipo de propiedad');
  };

  const toggleZona = (zona: string) => {
    const exists = filters.zonas.includes(zona);
    const nextZonas = exists
      ? filters.zonas.filter((item) => item !== zona)
      : [...filters.zonas, zona];
    updateFiltersAndResetBatch({ ...filters, zonas: nextZonas }, 'Zona');
  };

  const resetFilters = () => {
    onFiltersChange({
      operaciones: [],
      tipos: [],
      zonas: [],
      minRecamaras: null,
      minBanos: null,
      ventaPrecioMin: null,
      ventaPrecioMax: null,
      rentaPrecioMin: null,
      rentaPrecioMax: null,
      orden: 'recent',
      onlyFavorites: false,
    });
    onVisibleCountChange(12);
    setSelectedMapPropertyId(null);
    setMapBoundIds(null);
  };

  // REQ-FIL-001, REQ-FIL-003: intersection across categories, union inside each, independent modality pricing
  const baseFilteredProperties = useMemo(() => {
    let list = publicProperties.filter((p) => {
      if (filters.onlyFavorites && !favorites[p.id]) return false;
      if (filters.operaciones.length > 0 && !filters.operaciones.includes(p.operacion)) {
        return false;
      }
      if (filters.tipos.length > 0 && !filters.tipos.includes(p.tipo)) {
        return false;
      }
      if (filters.zonas.length > 0 && !filters.zonas.includes(p.zonaPublica)) {
        return false;
      }
      if (filters.minRecamaras !== null) {
        if (p.recamaras === null || p.recamaras < filters.minRecamaras) return false;
      }
      if (filters.minBanos !== null) {
        if (p.banos === null || p.banos < filters.minBanos) return false;
      }

      // Price range separated by modality (Venta/Preventa total vs Renta monthly)
      if (p.operacion === 'Renta') {
        if (filters.rentaPrecioMin !== null && p.precio < filters.rentaPrecioMin) return false;
        if (filters.rentaPrecioMax !== null && p.precio > filters.rentaPrecioMax) return false;
      } else {
        if (filters.ventaPrecioMin !== null && p.precio < filters.ventaPrecioMin) return false;
        if (filters.ventaPrecioMax !== null && p.precio > filters.ventaPrecioMax) return false;
      }

      return true;
    });

    // Sort: Venta prioritized slightly in default 'recent' while respecting publication date (REQ-FIL-003)
    if (filters.orden === 'recent') {
      list = [...list].sort((a, b) => {
        const aClosed = a.estado === 'Vendida' || a.estado === 'Rentada' ? 1 : 0;
        const bClosed = b.estado === 'Vendida' || b.estado === 'Rentada' ? 1 : 0;
        if (aClosed !== bClosed) return aClosed - bClosed;
        return new Date(b.publicadaEn).getTime() - new Date(a.publicadaEn).getTime();
      });
    } else if (filters.orden === 'price_asc' || filters.orden === 'price_desc') {
      // Group by modality (Venta/Preventa vs Renta) so monthly rent isn't compared against sale prices
      const dir = filters.orden === 'price_asc' ? 1 : -1;
      list = [...list].sort((a, b) => {
        const aGroup = a.operacion === 'Renta' ? 1 : 0;
        const bGroup = b.operacion === 'Renta' ? 1 : 0;
        if (aGroup !== bGroup) return aGroup - bGroup;
        return (a.precio - b.precio) * dir;
      });
    }

    return list;
  }, [publicProperties, filters, favorites]);

  const filteredProperties = useMemo(() => {
    const list =
      !showMap || !mapBoundIds
        ? baseFilteredProperties
        : baseFilteredProperties.filter((p) => mapBoundIds.has(p.id));

    if (!selectedMapPropertyId) return list;

    const selectedIdx = list.findIndex((p) => p.id === selectedMapPropertyId);
    if (selectedIdx <= 0) return list;

    return [
      list[selectedIdx],
      ...list.slice(0, selectedIdx),
      ...list.slice(selectedIdx + 1),
    ];
  }, [baseFilteredProperties, showMap, mapBoundIds, selectedMapPropertyId]);

  const handleBoundsFilter = useCallback((nextIds: Set<string> | null) => {
    setMapBoundIds((prev) => {
      if (nextIds === null) return prev === null ? prev : null;
      if (prev && prev.size === nextIds.size && [...nextIds].every((id) => prev.has(id))) {
        return prev;
      }
      return nextIds;
    });
  }, []);

  const displayedProperties = filteredProperties.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProperties.length;

  // When a marker on the map is clicked, move card to top of list, expand it, and ensure it's in view
  const handleSelectFromMap = useCallback(
    (prop: PublicProperty) => {
      setSelectedMapPropertyId(prop.id);
      if (!expandedIds.includes(prop.id)) {
        onToggleExpand(prop.id, prop.folio);
      }
      setTimeout(() => {
        document
          .getElementById(`property-card-${prop.id}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    },
    [expandedIds, onToggleExpand],
  );

  const showVentaRange =
    filters.operaciones.length === 0 ||
    filters.operaciones.includes('Venta') ||
    filters.operaciones.includes('Preventa');
  const showRentaRange =
    filters.operaciones.length === 0 || filters.operaciones.includes('Renta');

  useEffect(() => {
    if (
      selectedMapPropertyId &&
      !baseFilteredProperties.some((p) => p.id === selectedMapPropertyId)
    ) {
      setSelectedMapPropertyId(null);
    }
  }, [baseFilteredProperties, selectedMapPropertyId]);

  const filterKey = useMemo(
    () =>
      JSON.stringify({
        operaciones: filters.operaciones,
        tipos: filters.tipos,
        zonas: filters.zonas,
        minRecamaras: filters.minRecamaras,
        minBanos: filters.minBanos,
        ventaPrecioMin: filters.ventaPrecioMin,
        ventaPrecioMax: filters.ventaPrecioMax,
        rentaPrecioMin: filters.rentaPrecioMin,
        rentaPrecioMax: filters.rentaPrecioMax,
        onlyFavorites: filters.onlyFavorites,
      }),
    [
      filters.operaciones,
      filters.tipos,
      filters.zonas,
      filters.minRecamaras,
      filters.minBanos,
      filters.ventaPrecioMin,
      filters.ventaPrecioMax,
      filters.rentaPrecioMin,
      filters.rentaPrecioMax,
      filters.onlyFavorites,
    ],
  );

  const activeFilterCount =
    filters.operaciones.length +
    filters.tipos.length +
    filters.zonas.length +
    (filters.minRecamaras !== null ? 1 : 0) +
    (filters.minBanos !== null ? 1 : 0) +
    (filters.ventaPrecioMin !== null || filters.ventaPrecioMax !== null ? 1 : 0) +
    (filters.rentaPrecioMin !== null || filters.rentaPrecioMax !== null ? 1 : 0) +
    (filters.onlyFavorites ? 1 : 0);

  return (
    <div className="min-h-screen w-full overflow-x-clip flex flex-col bg-surface text-on-surface">
      {/* Slim Catalog Header (REQ-NAV-001: desktop full menu; mobile logo + Vender only, no hamburger/hero CTAs) */}
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-outline-variant/70">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-6">
          <button
            type="button"
            onClick={onGoLanding}
            className="flex flex-col text-left shrink-0 text-on-surface hover:opacity-80 transition-opacity"
          >
            <span className="font-headline text-title-md tracking-wider uppercase">
              LUIS &amp; OLIVER
            </span>
            <span className="font-body text-[11px] tracking-[0.2em] uppercase text-on-surface-variant">
              BIENES RAÍCES
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-label-lg text-on-surface-variant">
            <button
              type="button"
              onClick={onGoLanding}
              className="hover:text-on-surface transition-colors whitespace-nowrap"
            >
              Inicio
            </button>
            <span className="text-on-surface font-semibold whitespace-nowrap">Propiedades</span>
            <button
              type="button"
              onClick={onGoSell}
              className="hover:text-on-surface transition-colors whitespace-nowrap"
            >
              Vender
            </button>
            <button
              type="button"
              onClick={onGoContact}
              className="rounded-md bg-primary-container text-on-primary-container px-4 py-2 text-label-md hover:bg-primary transition-colors whitespace-nowrap"
            >
              Contáctanos
            </button>
          </nav>

          {/* Mobile: Logo + Vender only (REQ-NAV-001) */}
          <button
            type="button"
            onClick={onGoSell}
            className="md:hidden rounded-md bg-primary-container text-on-primary-container px-4 py-2 text-label-md font-semibold whitespace-nowrap"
          >
            Vender
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col gap-6">
        {/* Title + Map Toggle & Sort Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-headline text-headline-md md:text-headline-lg text-on-surface">
              Catálogo de propiedades
            </h1>
            <p className="text-body-md text-on-surface-variant">
              {filteredProperties.length}{' '}
              {filteredProperties.length === 1 ? 'resultado' : 'resultados'} en San Luis Potosí
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowMap((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-2 text-label-md text-on-surface hover:bg-surface-container-low transition-colors whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-title-md text-red-700" aria-hidden="true">
                map
              </span>
              <span>{showMap ? 'Ocultar mapa' : 'Mostrar mapa'}</span>
            </button>

            <select
              aria-label="Ordenar propiedades"
              value={filters.orden}
              onChange={(e) =>
                updateFiltersAndResetBatch({
                  ...filters,
                  orden: e.target.value as CatalogFilters['orden'],
                })
              }
              className="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-label-md text-on-surface focus:border-secondary focus:outline-none"
            >
              <option value="recent">Más reciente</option>
              <option value="price_asc">Menor precio</option>
              <option value="price_desc">Mayor precio</option>
            </select>
          </div>
        </div>

        {/* Mobile Quick Horizontal Chips + Full Filter Bottom Sheet Trigger (REQ-FIL-001) */}
        <div className="flex md:hidden items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setMobileSheetOpen(true)}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-primary-container bg-primary-container text-on-primary-container px-3.5 py-1.5 text-label-md whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-body-lg" aria-hidden="true">
              tune
            </span>
            <span>Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
          </button>

          {ALL_OPERATIONS.map((op) => {
            const active = filters.operaciones.includes(op);
            return (
              <button
                key={op}
                type="button"
                aria-pressed={active}
                onClick={() => toggleOperation(op)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-label-md whitespace-nowrap ${
                  active
                    ? 'border-secondary bg-secondary text-on-secondary'
                    : 'border-outline-variant bg-surface-container-lowest text-on-surface'
                }`}
              >
                {op}
              </button>
            );
          })}

          {ALL_TYPES.map((tipo) => {
            const active = filters.tipos.includes(tipo);
            return (
              <button
                key={tipo}
                type="button"
                aria-pressed={active}
                onClick={() => toggleType(tipo)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-label-md whitespace-nowrap ${
                  active
                    ? 'border-primary-container bg-primary-container text-on-primary-container'
                    : 'border-outline-variant bg-surface-container-lowest text-on-surface'
                }`}
              >
                {tipo}
              </button>
            );
          })}
        </div>

        {/* Desktop Discreet Multi-Select Filter Panel (REQ-FIL-001, REQ-FIL-003) */}
        <div className="hidden md:flex flex-col gap-4 rounded-xl bg-surface-container-lowest border border-outline-variant/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Operación */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-label-sm font-semibold text-on-surface-variant mr-1">
                Operación:
              </span>
              {ALL_OPERATIONS.map((op) => {
                const active = filters.operaciones.includes(op);
                return (
                  <button
                    key={op}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleOperation(op)}
                    className={`rounded-full border px-3 py-1 text-label-sm transition-colors ${
                      active
                        ? 'border-primary-container bg-primary-container text-on-primary-container'
                        : 'border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {op}
                  </button>
                );
              })}
            </div>

            {/* Tipo de propiedad */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-label-sm font-semibold text-on-surface-variant mr-1">
                Tipo:
              </span>
              {ALL_TYPES.map((tipo) => {
                const active = filters.tipos.includes(tipo);
                return (
                  <button
                    key={tipo}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleType(tipo)}
                    className={`rounded-full border px-3 py-1 text-label-sm transition-colors ${
                      active
                        ? 'border-primary-container bg-primary-container text-on-primary-container'
                        : 'border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {tipo}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 border-t border-outline-variant/50 items-start">
            {/* Zonas multi-select */}
            <div className="lg:col-span-5 flex flex-col gap-1.5">
              <span className="text-label-sm font-semibold text-on-surface-variant">
                Zonas (selección múltiple)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableZones.map((zona) => {
                  const active = filters.zonas.includes(zona);
                  return (
                    <button
                      key={zona}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleZona(zona)}
                      className={`rounded-full border px-2.5 py-1 text-label-sm transition-colors ${
                        active
                          ? 'border-secondary bg-secondary text-on-secondary'
                          : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                      }`}
                    >
                      {zona}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recámaras & Baños mínimos */}
            <div className="lg:col-span-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-label-sm font-semibold text-on-surface-variant">
                  Recámaras mín.
                </span>
                <div className="flex items-center gap-1">
                  {[null, 1, 2, 3, 4].map((val) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() =>
                        updateFiltersAndResetBatch(
                          { ...filters, minRecamaras: val },
                          'Recámaras',
                        )
                      }
                      className={`px-2 py-1 rounded text-label-sm tabular-nums ${
                        filters.minRecamaras === val
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {val === null ? 'Todas' : `${val}+`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-label-sm font-semibold text-on-surface-variant">
                  Baños mín.
                </span>
                <div className="flex items-center gap-1">
                  {[null, 1, 2, 3].map((val) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() =>
                        updateFiltersAndResetBatch({ ...filters, minBanos: val }, 'Baños')
                      }
                      className={`px-2 py-1 rounded text-label-sm tabular-nums ${
                        filters.minBanos === val
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {val === null ? 'Todos' : `${val}+`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Independent Price Ranges by Modality (REQ-FIL-003) */}
            <div className="lg:col-span-4 flex flex-col gap-2">
              {showVentaRange && (
                <div className="flex flex-col gap-1">
                  <span className="text-label-sm font-semibold text-on-surface-variant">
                    Precio Venta / Preventa (MXN)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min={0}
                      step={250000}
                      placeholder="Mínimo"
                      value={filters.ventaPrecioMin ?? ''}
                      onChange={(e) =>
                        updateFiltersAndResetBatch(
                          {
                            ...filters,
                            ventaPrecioMin: e.target.value ? Number(e.target.value) : null,
                          },
                          'Precio',
                        )
                      }
                      className="rounded-md border border-outline-variant bg-surface-container-low px-2.5 py-1.5 text-label-sm tabular-nums focus:border-secondary focus:outline-none"
                    />
                    <input
                      type="number"
                      min={0}
                      step={250000}
                      placeholder="Máximo"
                      value={filters.ventaPrecioMax ?? ''}
                      onChange={(e) =>
                        updateFiltersAndResetBatch(
                          {
                            ...filters,
                            ventaPrecioMax: e.target.value ? Number(e.target.value) : null,
                          },
                          'Precio',
                        )
                      }
                      className="rounded-md border border-outline-variant bg-surface-container-low px-2.5 py-1.5 text-label-sm tabular-nums focus:border-secondary focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {showRentaRange && (
                <div className="flex flex-col gap-1">
                  <span className="text-label-sm font-semibold text-on-surface-variant">
                    Precio Renta (MXN/mes)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      placeholder="Mínimo/mes"
                      value={filters.rentaPrecioMin ?? ''}
                      onChange={(e) =>
                        updateFiltersAndResetBatch(
                          {
                            ...filters,
                            rentaPrecioMin: e.target.value ? Number(e.target.value) : null,
                          },
                          'Precio',
                        )
                      }
                      className="rounded-md border border-outline-variant bg-surface-container-low px-2.5 py-1.5 text-label-sm tabular-nums focus:border-secondary focus:outline-none"
                    />
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      placeholder="Máximo/mes"
                      value={filters.rentaPrecioMax ?? ''}
                      onChange={(e) =>
                        updateFiltersAndResetBatch(
                          {
                            ...filters,
                            rentaPrecioMax: e.target.value ? Number(e.target.value) : null,
                          },
                          'Precio',
                        )
                      }
                      className="rounded-md border border-outline-variant bg-surface-container-low px-2.5 py-1.5 text-label-sm tabular-nums focus:border-secondary focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/40 text-label-sm">
            <label className="inline-flex items-center gap-2 cursor-pointer text-on-surface">
              <input
                type="checkbox"
                checked={filters.onlyFavorites}
                onChange={(e) =>
                  updateFiltersAndResetBatch(
                    { ...filters, onlyFavorites: e.target.checked },
                    'Favoritos',
                  )
                }
                className="rounded border-outline-variant text-primary-container focus:ring-secondary"
              />
              <span>Solo mis favoritos</span>
            </label>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-secondary hover:text-on-surface underline underline-offset-4"
              >
                Restablecer filtros ({activeFilterCount})
              </button>
            )}
          </div>
        </div>

        {/* Real 2D Map of San Luis Potosí (REQ-MAP-001) */}
        {showMap && (
          <SanLuisMap
            properties={baseFilteredProperties}
            selectedPropertyId={selectedMapPropertyId}
            onSelectProperty={handleSelectFromMap}
            onBoundsFilter={handleBoundsFilter}
            hasActiveFilters={activeFilterCount > 0}
            filterKey={filterKey}
            onResetFilters={activeFilterCount > 0 ? resetFilters : undefined}
          />
        )}

        {/* Catalog Grid / List + Empty State (REQ-FIL-002) */}
        {displayedProperties.length === 0 ? (
          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant p-8 text-center flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-headline-lg text-outline" aria-hidden="true">
              search_off
            </span>
            <p className="font-headline text-title-lg text-on-surface">
              Por el momento no tenemos propiedades que coincidan con tu búsqueda
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-md bg-primary-container text-on-primary-container px-5 py-2.5 text-label-md font-semibold hover:bg-primary transition-colors"
              >
                Restablecer filtros
              </button>
              <button
                type="button"
                onClick={onGoContact}
                className="rounded-md border border-outline-variant bg-surface-container-lowest px-5 py-2.5 text-label-md text-on-surface hover:bg-surface-container-low transition-colors"
              >
                Contactar a la agencia
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 items-start">
            {displayedProperties.map((prop) => (
              <PublicPropertyCard
                key={prop.id}
                property={prop}
                isFavorite={!!favorites[prop.id]}
                isExpanded={expandedIds.includes(prop.id)}
                isHighlighted={selectedMapPropertyId === prop.id}
                onToggleExpand={(id) => onToggleExpand(id, prop.folio)}
                onToggleFavorite={toggleFavorite}
                onTrackWhatsApp={(folio) => trackEvent({ tipo: 'whatsapp_click', folio })}
                onTrackCall={(folio) => trackEvent({ tipo: 'call_click', folio })}
                onOpenCallFallback={(folio) => onOpenContactModal('phone', folio)}
              />
            ))}
          </div>
        )}

        {/* Progressive Load (12 + 12, no duplicated results, discrete end notice) */}
        {displayedProperties.length > 0 && (
          <div className="flex justify-center pt-1">
            {hasMore ? (
              <button
                type="button"
                onClick={() => onVisibleCountChange(visibleCount + 12)}
                className="w-full max-w-[260px] inline-flex items-center justify-center gap-2 rounded-md bg-surface-container-lowest text-on-surface border border-outline-variant px-6 py-2.5 hover:bg-surface-container-low transition-colors"
              >
                <span className="font-body text-label-lg">Ver más</span>
                <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                  expand_more
                </span>
              </button>
            ) : (
              <p className="text-label-sm text-on-surface-variant py-2">
                Fin de resultados ({filteredProperties.length}{' '}
                {filteredProperties.length === 1 ? 'propiedad' : 'propiedades'})
              </p>
            )}
          </div>
        )}

        <div className="pt-4">
          <ContactSection onOpenModal={(mode) => onOpenContactModal(mode)} />
        </div>
      </main>

      {/* Mobile Full Filter Bottom Sheet (REQ-FIL-001) */}
      {mobileSheetOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex items-end bg-primary/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Filtros del catálogo"
          onClick={() => setMobileSheetOpen(false)}
        >
          <div
            className="w-full max-h-[88vh] overflow-y-auto overflow-x-hidden rounded-t-2xl bg-surface border-t border-outline-variant p-4 sm:p-5 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-title-lg text-on-surface">Filtros avanzados</h2>
              <button
                type="button"
                onClick={() => setMobileSheetOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-surface-container-low flex items-center justify-center"
                aria-label="Cerrar filtros"
              >
                <span className="material-symbols-outlined text-title-lg" aria-hidden="true">
                  close
                </span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-label-md font-semibold">Zonas</span>
              <div className="flex flex-wrap gap-2">
                {availableZones.map((zona) => {
                  const active = filters.zonas.includes(zona);
                  return (
                    <button
                      key={zona}
                      type="button"
                      onClick={() => toggleZona(zona)}
                      className={`rounded-full border px-3 py-1.5 text-label-sm ${
                        active
                          ? 'border-secondary bg-secondary text-on-secondary'
                          : 'border-outline-variant bg-surface-container-lowest text-on-surface'
                      }`}
                    >
                      {zona}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 min-w-0">
                <span className="text-label-sm font-semibold">Recámaras mín.</span>
                <select
                  value={filters.minRecamaras ?? ''}
                  onChange={(e) =>
                    updateFiltersAndResetBatch(
                      {
                        ...filters,
                        minRecamaras: e.target.value ? Number(e.target.value) : null,
                      },
                      'Recámaras',
                    )
                  }
                  className="w-full min-w-0 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md"
                >
                  <option value="">Cualquiera</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <span className="text-label-sm font-semibold">Baños mín.</span>
                <select
                  value={filters.minBanos ?? ''}
                  onChange={(e) =>
                    updateFiltersAndResetBatch(
                      {
                        ...filters,
                        minBanos: e.target.value ? Number(e.target.value) : null,
                      },
                      'Baños',
                    )
                  }
                  className="w-full min-w-0 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md"
                >
                  <option value="">Cualquiera</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                </select>
              </div>
            </div>

            {showVentaRange && (
              <div className="flex flex-col gap-1.5">
                <span className="text-label-sm font-semibold">Precio Venta / Preventa (MXN)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Mínimo"
                    value={filters.ventaPrecioMin ?? ''}
                    onChange={(e) =>
                      updateFiltersAndResetBatch(
                        {
                          ...filters,
                          ventaPrecioMin: e.target.value ? Number(e.target.value) : null,
                        },
                        'Precio',
                      )
                    }
                    className="w-full min-w-0 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md tabular-nums"
                  />
                  <input
                    type="number"
                    placeholder="Máximo"
                    value={filters.ventaPrecioMax ?? ''}
                    onChange={(e) =>
                      updateFiltersAndResetBatch(
                        {
                          ...filters,
                          ventaPrecioMax: e.target.value ? Number(e.target.value) : null,
                        },
                        'Precio',
                      )
                    }
                    className="w-full min-w-0 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md tabular-nums"
                  />
                </div>
              </div>
            )}

            {showRentaRange && (
              <div className="flex flex-col gap-1.5">
                <span className="text-label-sm font-semibold">Precio Renta (MXN/mes)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Mínimo/mes"
                    value={filters.rentaPrecioMin ?? ''}
                    onChange={(e) =>
                      updateFiltersAndResetBatch(
                        {
                          ...filters,
                          rentaPrecioMin: e.target.value ? Number(e.target.value) : null,
                        },
                        'Precio',
                      )
                    }
                    className="w-full min-w-0 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md tabular-nums"
                  />
                  <input
                    type="number"
                    placeholder="Máximo/mes"
                    value={filters.rentaPrecioMax ?? ''}
                    onChange={(e) =>
                      updateFiltersAndResetBatch(
                        {
                          ...filters,
                          rentaPrecioMax: e.target.value ? Number(e.target.value) : null,
                        },
                        'Precio',
                      )
                    }
                    className="w-full min-w-0 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md tabular-nums"
                  />
                </div>
              </div>
            )}

            <label className="inline-flex items-center gap-2 text-body-md text-on-surface">
              <input
                type="checkbox"
                checked={filters.onlyFavorites}
                onChange={(e) =>
                  updateFiltersAndResetBatch(
                    { ...filters, onlyFavorites: e.target.checked },
                    'Favoritos',
                  )
                }
              />
              <span>Solo mostrar favoritos</span>
            </label>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-md border border-outline-variant py-2.5 text-label-md font-semibold"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setMobileSheetOpen(false)}
                className="rounded-md bg-primary-container text-on-primary-container py-2.5 text-label-md font-semibold"
              >
                Ver {filteredProperties.length} resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
