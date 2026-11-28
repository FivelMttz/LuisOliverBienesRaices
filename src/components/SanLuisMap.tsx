import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  Circle,
  CollisionBehavior,
  APILoadingStatus,
  useMap,
  useApiLoadingStatus,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import { PublicProperty, formatMXN } from '../types/domain';

interface SanLuisMapProps {
  properties: PublicProperty[];
  selectedPropertyId: string | null;
  onSelectProperty: (property: PublicProperty) => void;
  onBoundsFilter?: (visibleIds: Set<string> | null) => void;
  hasActiveFilters?: boolean;
  filterKey?: string;
  onResetFilters?: () => void;
}

const SLP_CENTER: google.maps.LatLngLiteral = { lat: 22.142, lng: -101.015 };
const GOOGLE_MAPS_API_KEY = (
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? ''
).trim();

function getTypeShortLabel(tipo: PublicProperty['tipo']): string {
  switch (tipo) {
    case 'Casa':
      return 'C';
    case 'Departamento':
      return 'D';
    case 'Terreno':
      return 'T';
    case 'Oficina':
      return 'O';
    case 'Local':
      return 'L';
    case 'Bodega':
      return 'B';
  }
}

function formatCompactMXN(precio: number, operacion: PublicProperty['operacion']): string {
  if (operacion === 'Renta') {
    if (precio >= 1000) {
      const k = Number((precio / 1000).toFixed(1));
      return `$${k}k/m`;
    }
    return `$${precio}/m`;
  }
  if (precio >= 1_000_000) {
    const m = Number((precio / 1_000_000).toFixed(2));
    return `$${m}M`;
  }
  if (precio >= 1000) {
    return `$${Math.round(precio / 1000)}k`;
  }
  return `$${precio}`;
}

interface PropertyMarkerItemProps {
  property: PublicProperty;
  position: google.maps.LatLngLiteral;
  isSelected: boolean;
  isHovered: boolean;
  showFilteredLabel: boolean;
  forceRequiredCollision: boolean;
  zIndex: number;
  onHoverChange: (id: string | null) => void;
  onSelect: (property: PublicProperty, marker: google.maps.marker.AdvancedMarkerElement) => void;
}

function PropertyMarkerItem({
  property,
  position,
  isSelected,
  isHovered,
  showFilteredLabel,
  forceRequiredCollision,
  zIndex,
  onHoverChange,
  onSelect,
}: PropertyMarkerItemProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <AdvancedMarker
      ref={markerRef}
      position={position}
      zIndex={zIndex}
      title={`${property.titulo} · ${property.zonaPublica}`}
      collisionBehavior={
        forceRequiredCollision
          ? CollisionBehavior.REQUIRED
          : CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY
      }
      onClick={() => {
        if (marker) {
          onSelect(property, marker);
        }
      }}
      onMouseEnter={() => onHoverChange(property.id)}
      onMouseLeave={() => onHoverChange(null)}
    >
      {showFilteredLabel ? (
        <div
          className={`inline-flex items-center gap-1 rounded-full border-2 border-white px-2.5 py-1 text-white font-body font-bold text-[11px] leading-none shadow-md transition-transform duration-150 cursor-pointer whitespace-nowrap ${
            isSelected
              ? 'bg-red-700 scale-110 ring-2 ring-red-200'
              : isHovered
                ? 'bg-secondary scale-105'
                : 'bg-primary-container'
          }`}
        >
          <span>{getTypeShortLabel(property.tipo)}</span>
          <span className="opacity-70">·</span>
          <span className="tabular-nums">
            {formatCompactMXN(property.precio, property.operacion)}
          </span>
        </div>
      ) : (
        <div
          className={`flex items-center justify-center rounded-full border-2 border-white text-white font-body font-bold shadow-md transition-transform duration-150 cursor-pointer ${
            isSelected
              ? 'w-9 h-9 bg-red-700 scale-110 text-xs'
              : isHovered
                ? 'w-8 h-8 bg-secondary scale-105 text-xs'
                : 'w-[30px] h-[30px] bg-primary-container text-xs'
          }`}
        >
          {getTypeShortLabel(property.tipo)}
        </div>
      )}
    </AdvancedMarker>
  );
}

interface GoogleMapInnerProps extends SanLuisMapProps {
  filterByMapBounds: boolean;
  recenterSignal: number;
}

function GoogleMapInner({
  properties,
  selectedPropertyId,
  onSelectProperty,
  onBoundsFilter,
  hasActiveFilters = false,
  filterKey = '',
  onResetFilters,
  filterByMapBounds,
  recenterSignal,
}: GoogleMapInnerProps) {
  const status = useApiLoadingStatus();
  const map = useMap();

  const [zoom, setZoom] = useState<number>(12);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeMarker, setActiveMarker] =
    useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [activeInfoProp, setActiveInfoProp] = useState<PublicProperty | null>(null);

  const prevSyncKeyRef = useRef<string | null>(null);
  const didInitialFitRef = useRef(false);

  const syncBoundsFilter = useCallback(() => {
    if (!onBoundsFilter) return;
    if (!filterByMapBounds || !map) {
      onBoundsFilter(null);
      return;
    }
    const bounds = map.getBounds();
    if (!bounds) return;
    const inBounds = new Set<string>();
    properties.forEach((p) => {
      if (bounds.contains({ lat: p.ubicacionPublica.lat, lng: p.ubicacionPublica.lng })) {
        inBounds.add(p.id);
      }
    });
    onBoundsFilter(inBounds);
  }, [filterByMapBounds, map, onBoundsFilter, properties]);

  useEffect(() => {
    syncBoundsFilter();
  }, [syncBoundsFilter]);

  useEffect(() => {
    return () => {
      onBoundsFilter?.(null);
    };
  }, [onBoundsFilter]);

  const selectedProperty = useMemo(
    () => (selectedPropertyId ? properties.find((p) => p.id === selectedPropertyId) ?? null : null),
    [properties, selectedPropertyId],
  );

  // Clear InfoWindow if the property was filtered out or selection was cleared
  useEffect(() => {
    if (
      activeInfoProp &&
      (!properties.some((p) => p.id === activeInfoProp.id) || selectedPropertyId === null)
    ) {
      setActiveInfoProp(null);
      setActiveMarker(null);
    }
  }, [properties, activeInfoProp, selectedPropertyId]);

  const zoneClusters = useMemo(() => {
    const groups: Record<string, PublicProperty[]> = {};
    properties.forEach((p) => {
      if (!groups[p.zonaPublica]) {
        groups[p.zonaPublica] = [];
      }
      groups[p.zonaPublica].push(p);
    });
    return Object.entries(groups);
  }, [properties]);

  // Distribute properties per zone in a deterministic golden-angle spiral so filtered items in the same zone stay readable
  const orderedProperties = useMemo(() => {
    const zoneTotals: Record<string, number> = {};
    properties.forEach((p) => {
      zoneTotals[p.zonaPublica] = (zoneTotals[p.zonaPublica] ?? 0) + 1;
    });

    const zoneSeen: Record<string, number> = {};
    return [...properties]
      .sort((a, b) => b.ubicacionPublica.lat - a.ubicacionPublica.lat)
      .map((prop, globalIdx) => {
        const idxInZone = zoneSeen[prop.zonaPublica] ?? 0;
        zoneSeen[prop.zonaPublica] = idxInZone + 1;
        const totalInZone = zoneTotals[prop.zonaPublica] ?? 1;

        if (totalInZone === 1) {
          return {
            prop,
            baseZIndex: globalIdx,
            position: {
              lat: prop.ubicacionPublica.lat,
              lng: prop.ubicacionPublica.lng,
            },
          };
        }

        const angle = (idxInZone * 137.5 * Math.PI) / 180;
        const radius = 0.0015 + Math.floor(idxInZone / 5) * 0.0011;
        return {
          prop,
          baseZIndex: globalIdx,
          position: {
            lat: prop.ubicacionPublica.lat + Math.sin(angle) * radius,
            lng: prop.ubicacionPublica.lng + Math.cos(angle) * radius,
          },
        };
      });
  }, [properties]);

  const filteredZoneCircles = useMemo(() => {
    if (!hasActiveFilters || properties.length === 0) return [];
    const seen: Record<string, { lat: number; lng: number; radius: number }> = {};
    properties.forEach((p) => {
      if (selectedProperty && p.zonaPublica === selectedProperty.zonaPublica) return;
      if (!seen[p.zonaPublica]) {
        seen[p.zonaPublica] = {
          lat: p.ubicacionPublica.lat,
          lng: p.ubicacionPublica.lng,
          radius: Math.max(p.ubicacionPublica.radioAproxMetros, 550),
        };
      }
    });
    return Object.entries(seen);
  }, [hasActiveFilters, properties, selectedProperty]);

  const fitMapToFiltered = useCallback(() => {
    if (!map) return;
    if (orderedProperties.length === 0) {
      map.panTo(SLP_CENTER);
      map.setZoom(12);
      return;
    }
    if (orderedProperties.length === 1) {
      map.panTo(orderedProperties[0].position);
      map.setZoom(14);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    orderedProperties.forEach((item) => {
      bounds.extend(item.position);
    });
    map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
    google.maps.event.addListenerOnce(map, 'idle', () => {
      const currentZoom = map.getZoom();
      if (currentZoom && currentZoom > 14) {
        map.setZoom(14);
      }
    });
  }, [map, orderedProperties]);

  const propertyIdsKey = useMemo(
    () => orderedProperties.map((o) => o.prop.id).join('|'),
    [orderedProperties],
  );
  const syncKey = `${filterKey}::${propertyIdsKey}`;

  useEffect(() => {
    if (!map) return;

    if (!didInitialFitRef.current) {
      didInitialFitRef.current = true;
      prevSyncKeyRef.current = syncKey;
      if (hasActiveFilters) {
        fitMapToFiltered();
      }
      return;
    }

    if (prevSyncKeyRef.current === syncKey) return;
    prevSyncKeyRef.current = syncKey;

    if (!hasActiveFilters) {
      map.panTo(SLP_CENTER);
      map.setZoom(12);
      return;
    }

    fitMapToFiltered();
  }, [map, syncKey, hasActiveFilters, fitMapToFiltered]);

  useEffect(() => {
    if (recenterSignal > 0) {
      fitMapToFiltered();
    }
  }, [recenterSignal, fitMapToFiltered]);

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="p-6 text-center bg-surface-container-low flex flex-col items-center justify-center gap-2 min-h-[300px] md:min-h-[360px]">
        <span className="material-symbols-outlined text-headline-md text-secondary" aria-hidden="true">
          map
        </span>
        <p className="text-body-md font-medium text-on-surface">
          Mapa temporalmente no disponible
        </p>
        <p className="text-label-sm text-on-surface-variant max-w-md">
          Puedes seguir filtrando, explorando el catálogo y contactando a la agencia con normalidad.
        </p>
      </div>
    );
  }

  // Never collapse filtered results into zone clusters when filters are active or there are <= 8 pins
  const showClusters = zoom <= 11 && !hasActiveFilters && orderedProperties.length > 8;
  const showFilteredLabels = hasActiveFilters && orderedProperties.length <= 10;

  return (
    <div className="w-full h-[300px] md:h-[360px] relative">
      <GoogleMap
        mapId="DEMO_MAP_ID"
        defaultCenter={SLP_CENTER}
        defaultZoom={12}
        minZoom={10}
        maxZoom={16}
        gestureHandling="greedy"
        streetViewControl={false}
        mapTypeControl={false}
        clickableIcons={false}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
        onCameraChanged={(ev) => {
          setZoom(ev.detail.zoom);
        }}
        onIdle={syncBoundsFilter}
        onClick={() => {
          setActiveInfoProp(null);
          setActiveMarker(null);
        }}
      >
        {/* Subtle approximate zone highlights for active filtered results (REQ-MAP-002) */}
        {filteredZoneCircles.map(([zona, zoneInfo]) => (
          <Circle
            key={`filtered-zone-${zona}`}
            center={{
              lat: zoneInfo.lat + 0.0008,
              lng: zoneInfo.lng - 0.0009,
            }}
            radius={zoneInfo.radius}
            strokeColor="#1B2A4A"
            strokeOpacity={0.55}
            strokeWeight={1.5}
            fillColor="#1B2A4A"
            fillOpacity={0.07}
          />
        ))}

        {/* Highlight approximate broad zone for selected property (REQ-MAP-002: NOT centered on private address) */}
        {selectedProperty && (
          <Circle
            center={{
              lat: selectedProperty.ubicacionPublica.lat + 0.0012,
              lng: selectedProperty.ubicacionPublica.lng - 0.0014,
            }}
            radius={Math.max(selectedProperty.ubicacionPublica.radioAproxMetros, 500)}
            strokeColor="#B91C1C"
            strokeOpacity={0.85}
            strokeWeight={1.5}
            fillColor="#EF4444"
            fillOpacity={0.14}
          />
        )}

        {showClusters
          ? zoneClusters.map(([zona, group]) => {
              const anchor = group[0];
              const hasSelected = group.some((p) => p.id === selectedPropertyId);
              return (
                <AdvancedMarker
                  key={`cluster-${zona}`}
                  position={{
                    lat: anchor.ubicacionPublica.lat,
                    lng: anchor.ubicacionPublica.lng,
                  }}
                  zIndex={hasSelected ? 1000 : 10}
                  onClick={() => {
                    if (group.length === 1) {
                      onSelectProperty(group[0]);
                    } else if (map) {
                      map.setCenter({
                        lat: anchor.ubicacionPublica.lat,
                        lng: anchor.ubicacionPublica.lng,
                      });
                      map.setZoom(13);
                    }
                  }}
                >
                  <div
                    className={`rounded-full border-2 border-white px-2.5 py-1 text-xs font-semibold text-white whitespace-nowrap shadow-md cursor-pointer ${
                      hasSelected ? 'bg-red-700' : 'bg-primary'
                    }`}
                  >
                    {zona} ({group.length})
                  </div>
                </AdvancedMarker>
              );
            })
          : orderedProperties.map(({ prop, position, baseZIndex }) => {
              const isSelected = prop.id === selectedPropertyId;
              const isHovered = prop.id === hoveredId;
              const zIndex = isSelected
                ? orderedProperties.length + 2
                : isHovered
                  ? orderedProperties.length + 1
                  : baseZIndex;

              return (
                <PropertyMarkerItem
                  key={prop.id}
                  property={prop}
                  position={position}
                  isSelected={isSelected}
                  isHovered={isHovered}
                  showFilteredLabel={showFilteredLabels}
                  forceRequiredCollision={hasActiveFilters}
                  zIndex={zIndex}
                  onHoverChange={setHoveredId}
                  onSelect={(selectedProp, marker) => {
                    setActiveMarker(marker);
                    setActiveInfoProp(selectedProp);
                    onSelectProperty(selectedProp);
                  }}
                />
              );
            })}

        {activeInfoProp && activeMarker && !showClusters && (
          <InfoWindow
            anchor={activeMarker}
            pixelOffset={[0, -8]}
            onCloseClick={() => {
              setActiveInfoProp(null);
              setActiveMarker(null);
            }}
          >
            <div className="max-w-[220px] p-0.5 text-on-surface">
              <p className="text-[11px] font-medium uppercase tracking-wide text-secondary">
                {activeInfoProp.tipo} · {activeInfoProp.operacion}
              </p>
              <p className="text-xs font-semibold leading-snug text-primary mt-0.5">
                {activeInfoProp.titulo}
              </p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                {activeInfoProp.zonaPublica}
              </p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                {[
                  activeInfoProp.recamaras ? `${activeInfoProp.recamaras} rec.` : null,
                  activeInfoProp.banos ? `${activeInfoProp.banos} baños` : null,
                  activeInfoProp.m2Construccion
                    ? `${activeInfoProp.m2Construccion} m²`
                    : activeInfoProp.m2Terreno
                      ? `${activeInfoProp.m2Terreno} m²`
                      : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <p className="text-xs font-semibold text-emerald-800 mt-1 tabular-nums">
                {formatMXN(activeInfoProp.precio, activeInfoProp.operacion)}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {properties.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
          <div className="pointer-events-auto rounded-xl bg-surface-container-lowest/95 border border-outline-variant shadow-md px-4 py-3 text-center max-w-xs flex flex-col items-center gap-2">
            <p className="text-label-md font-semibold text-on-surface">
              Sin coincidencias en el mapa
            </p>
            <p className="text-label-sm text-on-surface-variant">
              Ninguna propiedad cumple con la zona y características seleccionadas.
            </p>
            {onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="rounded-md bg-primary-container text-on-primary-container px-3 py-1.5 text-label-sm font-semibold hover:bg-primary transition-colors"
              >
                Restablecer filtros
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function SanLuisMap({
  properties,
  selectedPropertyId,
  onSelectProperty,
  onBoundsFilter,
  hasActiveFilters = false,
  filterKey = '',
  onResetFilters,
}: SanLuisMapProps) {
  const [filterByMapBounds, setFilterByMapBounds] = useState(false);
  const [recenterSignal, setRecenterSignal] = useState(0);

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
      <div className="px-4 py-2.5 border-b border-outline-variant/60 bg-surface-container-low flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-label-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-body-lg text-red-700 shrink-0" aria-hidden="true">
            location_on
          </span>
          <span>
            Ubicación aproximada por zona en San Luis Potosí (dirección exacta reservada)
          </span>
          {hasActiveFilters && (
            <span className="inline-flex items-center rounded-full bg-primary-container text-on-primary-container px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap">
              {properties.length}{' '}
              {properties.length === 1 ? 'inmueble filtrado' : 'inmuebles filtrados'}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {properties.length > 0 && (
            <button
              type="button"
              onClick={() => setRecenterSignal((prev) => prev + 1)}
              className="inline-flex items-center gap-1 rounded-md border border-outline-variant bg-surface-container-lowest px-2.5 py-1 text-label-sm font-medium text-on-surface hover:bg-surface-container transition-colors whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-body-lg text-primary" aria-hidden="true">
                center_focus_strong
              </span>
              <span>Centrar resultados</span>
            </button>
          )}

          <label className="inline-flex items-center gap-2 text-label-sm text-on-surface cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterByMapBounds}
              onChange={(e) => setFilterByMapBounds(e.target.checked)}
              className="rounded border-outline-variant text-primary-container focus:ring-secondary"
            />
            <span>Actualizar listado al mover el mapa</span>
          </label>
        </div>
      </div>

      {!GOOGLE_MAPS_API_KEY ? (
        <div className="p-6 text-center bg-surface-container-low flex flex-col items-center justify-center gap-2 min-h-[300px] md:min-h-[360px]">
          <span className="material-symbols-outlined text-headline-md text-secondary" aria-hidden="true">
            map
          </span>
          <p className="text-body-md font-medium text-on-surface">
            Mapa temporalmente no disponible
          </p>
          <p className="text-label-sm text-on-surface-variant max-w-md">
            Configura tu clave de Google Maps Platform para visualizar el mapa interactivo. Puedes seguir filtrando y contactando a la agencia con normalidad.
          </p>
        </div>
      ) : (
        <APIProvider
          apiKey={GOOGLE_MAPS_API_KEY}
          libraries={['marker']}
          language="es"
          region="MX"
        >
          <GoogleMapInner
            properties={properties}
            selectedPropertyId={selectedPropertyId}
            onSelectProperty={onSelectProperty}
            onBoundsFilter={onBoundsFilter}
            hasActiveFilters={hasActiveFilters}
            filterKey={filterKey}
            onResetFilters={onResetFilters}
            filterByMapBounds={filterByMapBounds}
            recenterSignal={recenterSignal}
          />
        </APIProvider>
      )}
    </div>
  );
}
