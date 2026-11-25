import { useState, useMemo, useEffect, useRef, FormEvent } from 'react';
import {
  PROPERTIES,
  PRIMARY_CHIPS,
  EXTRA_CHIPS,
  HERO_IMAGE,
  SELLER_BANNER_IMAGE,
  Property,
  PropertyType,
  formatMXN,
} from './data/properties';
import { PropertyImage } from './components/PropertyImage';
import { PropertyCard } from './components/PropertyCard';
import { PropertyDetailModal } from './components/PropertyDetailModal';
import { ContactModal, ContactModalMode } from './components/ContactModal';

type SortOption = 'featured' | 'price_asc' | 'price_desc';
type PriceRangeOption = 'all' | 'under_3_5m' | '3_5m_to_8m' | 'over_8m';

const FAVORITES_STORAGE_KEY = 'luis_oliver_favorites_v1';

const DESKTOP_TYPE_CHIPS: { id: PropertyType; label: string; icon: string }[] = [
  { id: 'Terreno', label: 'Terreno', icon: 'layers' },
  { id: 'Departamento', label: 'Departamento', icon: 'apartment' },
  { id: 'Casa', label: 'Casa', icon: 'home' },
  { id: 'Oficina', label: 'Oficina', icon: 'work_outline' },
  { id: 'Local', label: 'Local', icon: 'storefront' },
  { id: 'Bodega', label: 'Bodega', icon: 'warehouse' },
];

const SELLER_TYPE_CHIPS: { id: PropertyType; label: string; icon: string }[] = [
  { id: 'Casa', label: 'Casa', icon: 'home' },
  { id: 'Departamento', label: 'Departamento', icon: 'apartment' },
  { id: 'Terreno', label: 'Terreno', icon: 'layers' },
  { id: 'Local', label: 'Local', icon: 'storefront' },
  { id: 'Oficina', label: 'Oficina', icon: 'work_outline' },
  { id: 'Bodega', label: 'Bodega', icon: 'warehouse' },
];

const PRICE_RANGE_OPTIONS: { id: PriceRangeOption; label: string }[] = [
  { id: 'all', label: 'Todos los precios' },
  { id: 'under_3_5m', label: 'Hasta $3,500,000 MXN' },
  { id: '3_5m_to_8m', label: '$3,500,000 – $8,000,000' },
  { id: 'over_8m', label: 'Más de $8,000,000 MXN' },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'Todas' | PropertyType>('Todas');
  const [selectedZona, setSelectedZona] = useState<string>('Todas');
  const [priceRange, setPriceRange] = useState<PriceRangeOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [showExtraChips, setShowExtraChips] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'price' | 'zona' | null>(null);

  const [visibleCount, setVisibleCount] = useState<number>(() =>
    typeof window !== 'undefined' && window.innerWidth >= 768 ? 9 : 3,
  );

  const [favorites, setFavorites] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modals
  const [activeProperty, setActiveProperty] = useState<Property | null>(null);
  const [contactMode, setContactMode] = useState<ContactModalMode>(null);

  // Seller Form State (shared between mobile expandable & desktop 2-col section)
  const [showSellerForm, setShowSellerForm] = useState(false);
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerZona, setSellerZona] = useState('');
  const [sellerTipo, setSellerTipo] = useState<PropertyType>('Casa');
  const [sellerPrice, setSellerPrice] = useState<number>(5000000);
  const [sellerError, setSellerError] = useState('');
  const [sellerSubmitted, setSellerSubmitted] = useState(false);

  const filterBarRef = useRef<HTMLDivElement>(null);

  const availableZones = useMemo(
    () => Array.from(new Set(PROPERTIES.map((p) => p.zona))),
    [],
  );

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // Ignore storage quota errors
    }
  }, [favorites]);

  // Close desktop filter dropdowns on outside click or Escape
  useEffect(() => {
    if (!openDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openDropdown]);

  const favoriteCount = useMemo(
    () => Object.values(favorites).filter(Boolean).length,
    [favorites],
  );

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredProperties = useMemo(() => {
    let list = PROPERTIES.filter((p) => {
      if (selectedType !== 'Todas' && p.tipo !== selectedType) return false;
      if (selectedZona !== 'Todas' && p.zona !== selectedZona) return false;
      if (onlyFavorites && !favorites[p.id]) return false;

      if (priceRange === 'under_3_5m' && p.precio > 3500000) return false;
      if (priceRange === '3_5m_to_8m' && (p.precio < 3500000 || p.precio > 8000000)) {
        return false;
      }
      if (priceRange === 'over_8m' && p.precio <= 8000000) return false;

      return true;
    });

    if (sortBy === 'price_asc') {
      list = [...list].sort((a, b) => a.precio - b.precio);
    } else if (sortBy === 'price_desc') {
      list = [...list].sort((a, b) => b.precio - a.precio);
    }

    return list;
  }, [selectedType, selectedZona, priceRange, onlyFavorites, favorites, sortBy]);

  const displayedProperties = filteredProperties.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProperties.length;
  const hasActiveFilters =
    selectedType !== 'Todas' ||
    selectedZona !== 'Todas' ||
    priceRange !== 'all' ||
    onlyFavorites ||
    sortBy !== 'featured';

  const resetAllFilters = () => {
    setSelectedType('Todas');
    setSelectedZona('Todas');
    setPriceRange('all');
    setSortBy('featured');
    setOnlyFavorites(false);
    setOpenDropdown(null);
    setVisibleCount(typeof window !== 'undefined' && window.innerWidth >= 768 ? 9 : 3);
  };

  const handleDesktopTypeToggle = (type: PropertyType) => {
    setOnlyFavorites(false);
    setSelectedType((prev) => (prev === type ? 'Todas' : type));
    setVisibleCount(9);
  };

  const handleMobileChipClick = (chipId: 'Todas' | PropertyType) => {
    setOnlyFavorites(false);
    setSelectedType(chipId);
    setVisibleCount(3);
  };

  const handleSellerSubmit = (e: FormEvent) => {
    e.preventDefault();
    const digits = sellerPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      setSellerError('Ingresa un teléfono válido de 10 dígitos (ej. 444 123 4567).');
      return;
    }
    setSellerError('');
    setSellerSubmitted(true);
  };

  const resetSellerForm = () => {
    setSellerName('');
    setSellerPhone('');
    setSellerZona('');
    setSellerTipo('Casa');
    setSellerPrice(5000000);
    setSellerError('');
    setSellerSubmitted(false);
  };

  const sliderProgress = ((sellerPrice - 1000000) / (20000000 - 1000000)) * 100;

  return (
    <div className="min-h-screen w-full flex flex-col bg-surface text-on-surface">
      {/* HERO + TOP NAVIGATION */}
      <header className="relative w-full min-h-[250px] md:min-h-[360px] flex flex-col justify-between overflow-hidden">
        <PropertyImage
          src={HERO_IMAGE}
          alt="Residencia contemporánea en San Luis Potosí"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/75 via-primary/50 to-primary/45" />

        {/* Top Navbar */}
        <div className="relative z-20 w-full max-w-6xl mx-auto px-5 md:px-8 pt-5 md:pt-7">
          <nav
            aria-label="Navegación principal"
            className="flex items-center justify-between gap-8"
          >
            <a
              href="#"
              className="flex flex-col shrink-0 text-on-primary whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-primary"
            >
              <span className="font-headline text-title-md md:text-title-lg tracking-wider uppercase text-on-primary">
                LUIS &amp; OLIVER
              </span>
              <span className="font-body text-label-sm tracking-[0.2em] uppercase text-on-primary/90">
                BIENES RAÍCES
              </span>
            </a>

            {/* Desktop Right Links + Contáctanos CTA (matching desktop screenshot) */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#propiedades"
                onClick={() => setOnlyFavorites(false)}
                className="text-label-lg text-on-primary/95 hover:text-on-primary transition-colors whitespace-nowrap shrink-0"
              >
                Propiedades
              </a>
              <a
                href="#vender"
                className="text-label-lg text-on-primary/95 hover:text-on-primary transition-colors whitespace-nowrap shrink-0"
              >
                Vender
              </a>
              <a
                href="#contacto"
                className="rounded-md bg-surface-container-lowest text-on-surface px-5 py-2 text-label-lg font-semibold hover:bg-surface-container-low transition-colors whitespace-nowrap shrink-0 shadow-xs"
              >
                Contáctanos
              </a>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-on-primary hover:bg-on-primary/10 transition-colors duration-150"
            >
              <span className="material-symbols-outlined text-headline-md" aria-hidden="true">
                {menuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </nav>

          {/* Collapsible Mobile Menu */}
          {menuOpen && (
            <div className="md:hidden mt-3 rounded-lg bg-surface-container-lowest border border-outline-variant p-3 flex flex-col gap-1 shadow-lg">
              <a
                href="#propiedades"
                onClick={() => {
                  setOnlyFavorites(false);
                  setMenuOpen(false);
                }}
                className="px-3 py-2.5 rounded-md text-label-lg text-on-surface hover:bg-surface-container-low"
              >
                Propiedades destacadas
              </a>
              <button
                type="button"
                onClick={() => {
                  setOnlyFavorites(true);
                  setMenuOpen(false);
                  document.getElementById('propiedades')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-left px-3 py-2.5 rounded-md text-label-lg text-on-surface hover:bg-surface-container-low flex items-center justify-between"
              >
                <span>Mis favoritos</span>
                <span className="font-mono text-label-sm text-secondary tabular-nums">
                  {favoriteCount}
                </span>
              </button>
              <a
                href="#vender"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 rounded-md text-label-lg text-on-surface hover:bg-surface-container-low"
              >
                Quiero vender mi propiedad
              </a>
              <a
                href="#contacto"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 rounded-md text-label-lg text-on-surface hover:bg-surface-container-low"
              >
                Contáctanos
              </a>
            </div>
          )}
        </div>

        {/* Hero Title (mobile visible, sr-only on desktop to match desktop screenshot) & Split CTAs */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-5 md:px-8 pt-4 pb-6 md:pb-24 flex flex-col items-center gap-4 text-center">
          <h1 className="md:sr-only font-headline text-display-lg-mobile text-on-primary text-balance">
            Encuentra tu próxima propiedad
          </h1>

          <div className="w-full max-w-md md:max-w-lg grid grid-cols-2 gap-3 md:gap-4">
            <a
              href="#propiedades"
              data-component-id="button-hero-buy"
              data-component-type="button"
              data-component-variant="secondary"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-surface-container-lowest text-on-surface px-3 md:px-6 py-3 md:py-3.5 transition-colors duration-150 ease-state-change hover:bg-surface-container-low whitespace-nowrap shadow-sm"
            >
              <span className="material-symbols-outlined text-title-md md:hidden" aria-hidden="true">
                home
              </span>
              <span className="font-body text-label-lg md:text-title-md font-semibold">
                Quiero comprar
              </span>
            </a>
            <a
              href="#vender"
              data-component-id="button-hero-sell"
              data-component-type="button"
              data-component-variant="primary"
              onClick={() => setShowSellerForm(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary-container/80 md:bg-primary/65 md:backdrop-blur-xs border border-on-primary/65 text-on-primary px-3 md:px-6 py-3 md:py-3.5 transition-colors duration-150 ease-state-change hover:bg-primary-container whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-title-md md:hidden" aria-hidden="true">
                sell
              </span>
              <span className="font-body text-label-lg md:text-title-md font-semibold">
                Quiero vender
              </span>
            </a>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-5 md:py-10 flex flex-col gap-6 md:gap-14">
        {/* PROPIEDADES DESTACADAS */}
        <section id="propiedades" className="flex flex-col gap-4 md:gap-6">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-headline text-headline-md md:text-headline-lg text-on-surface">
              {onlyFavorites ? 'Mis propiedades favoritas' : 'Propiedades destacadas'}
            </h2>

            {/* Mobile "Ver todas" link */}
            <button
              type="button"
              onClick={() => {
                resetAllFilters();
                setVisibleCount(PROPERTIES.length);
              }}
              className="md:hidden inline-flex items-center gap-1 text-label-md text-on-surface hover:text-secondary shrink-0"
            >
              <span>Ver todas</span>
              <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                arrow_forward
              </span>
            </button>

            {/* Desktop subtle favorites / clear filter controls */}
            <div className="hidden md:flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-label-md text-secondary hover:text-on-surface underline underline-offset-4 transition-colors whitespace-nowrap"
                >
                  Limpiar filtros
                </button>
              )}
              {favoriteCount > 0 && (
                <button
                  type="button"
                  onClick={() => setOnlyFavorites((prev) => !prev)}
                  aria-pressed={onlyFavorites}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-label-md transition-colors whitespace-nowrap ${
                    onlyFavorites
                      ? 'border-primary-container bg-primary-container text-on-primary-container'
                      : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-body-lg"
                    style={onlyFavorites ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    aria-hidden="true"
                  >
                    favorite
                  </span>
                  <span>Favoritos ({favoriteCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Filter Chips (< md) */}
          <div className="flex flex-col gap-2 md:hidden">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {PRIMARY_CHIPS.map((chip) => {
                const isActive = !onlyFavorites && selectedType === chip.id;
                return (
                  <button
                    key={chip.id}
                    data-component-id={`chip-mobile-${chip.id.toLowerCase()}`}
                    data-component-type="chip"
                    data-component-variant="filter"
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => handleMobileChipClick(chip.id)}
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors duration-150 ease-state-change whitespace-nowrap ${
                      isActive
                        ? 'border-primary-container bg-primary-container text-on-primary-container'
                        : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="material-symbols-outlined text-body-lg" aria-hidden="true">
                      {chip.icon}
                    </span>
                    <span className="font-body text-label-md">{chip.label}</span>
                  </button>
                );
              })}

              <button
                type="button"
                aria-label="Más tipos de propiedad"
                aria-expanded={showExtraChips}
                onClick={() => setShowExtraChips(!showExtraChips)}
                className="shrink-0 w-8 h-8 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface flex items-center justify-center hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                  {showExtraChips ? 'expand_less' : 'expand_more'}
                </span>
              </button>
            </div>

            {showExtraChips && (
              <div className="flex flex-wrap items-center gap-2">
                {EXTRA_CHIPS.map((chip) => {
                  const isActive = !onlyFavorites && selectedType === chip.id;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => handleMobileChipClick(chip.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors duration-150 ease-state-change whitespace-nowrap ${
                        isActive
                          ? 'border-primary-container bg-primary-container text-on-primary-container'
                          : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                      }`}
                    >
                      <span className="material-symbols-outlined text-body-lg" aria-hidden="true">
                        {chip.icon}
                      </span>
                      <span className="font-body text-label-md">{chip.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Filter Bar (md+) matching desktop screenshot */}
          <div
            ref={filterBarRef}
            className="hidden md:flex flex-wrap items-end justify-between gap-5"
          >
            <div className="flex items-center gap-4">
              {/* Precio Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  aria-expanded={openDropdown === 'price'}
                  aria-haspopup="listbox"
                  onClick={() =>
                    setOpenDropdown((prev) => (prev === 'price' ? null : 'price'))
                  }
                  className={`inline-flex items-center justify-between gap-3 min-w-[170px] rounded-full border px-4 py-2.5 text-label-md transition-colors whitespace-nowrap ${
                    priceRange !== 'all' || sortBy !== 'featured'
                      ? 'border-primary-container bg-surface-container-low text-on-surface font-semibold'
                      : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-title-md text-on-surface-variant"
                      aria-hidden="true"
                    >
                      payments
                    </span>
                    <span>
                      {priceRange === 'all'
                        ? 'Precio'
                        : PRICE_RANGE_OPTIONS.find((o) => o.id === priceRange)?.label}
                    </span>
                  </span>
                  <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                    {openDropdown === 'price' ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {openDropdown === 'price' && (
                  <div className="absolute left-0 top-full mt-2 z-30 w-64 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-lg p-2 flex flex-col gap-1">
                    <span className="px-3 py-1 text-label-sm text-on-surface-variant font-medium">
                      Rango de precio
                    </span>
                    {PRICE_RANGE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setPriceRange(opt.id);
                          setOpenDropdown(null);
                        }}
                        className={`text-left px-3 py-2 rounded-lg text-body-md transition-colors flex items-center justify-between ${
                          priceRange === opt.id
                            ? 'bg-primary-container text-on-primary-container font-medium'
                            : 'text-on-surface hover:bg-surface-container-low'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {priceRange === opt.id && (
                          <span className="material-symbols-outlined text-body-lg" aria-hidden="true">
                            check
                          </span>
                        )}
                      </button>
                    ))}
                    <div className="my-1 border-t border-outline-variant/50" />
                    <span className="px-3 py-1 text-label-sm text-on-surface-variant font-medium">
                      Ordenar
                    </span>
                    {[
                      { id: 'featured' as SortOption, label: 'Destacadas' },
                      { id: 'price_asc' as SortOption, label: 'Menor a mayor precio' },
                      { id: 'price_desc' as SortOption, label: 'Mayor a menor precio' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.id);
                          setOpenDropdown(null);
                        }}
                        className={`text-left px-3 py-2 rounded-lg text-body-md transition-colors flex items-center justify-between ${
                          sortBy === opt.id
                            ? 'bg-secondary-container text-on-secondary-container font-medium'
                            : 'text-on-surface hover:bg-surface-container-low'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {sortBy === opt.id && (
                          <span className="material-symbols-outlined text-body-lg" aria-hidden="true">
                            check
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Zona Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  aria-expanded={openDropdown === 'zona'}
                  aria-haspopup="listbox"
                  onClick={() =>
                    setOpenDropdown((prev) => (prev === 'zona' ? null : 'zona'))
                  }
                  className={`inline-flex items-center justify-between gap-3 min-w-[160px] rounded-full border px-4 py-2.5 text-label-md transition-colors whitespace-nowrap ${
                    selectedZona !== 'Todas'
                      ? 'border-primary-container bg-surface-container-low text-on-surface font-semibold'
                      : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-title-md text-on-surface-variant"
                      aria-hidden="true"
                    >
                      location_on
                    </span>
                    <span>{selectedZona === 'Todas' ? 'Zona' : selectedZona}</span>
                  </span>
                  <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                    {openDropdown === 'zona' ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {openDropdown === 'zona' && (
                  <div className="absolute left-0 top-full mt-2 z-30 w-60 max-h-72 overflow-y-auto rounded-xl bg-surface-container-lowest border border-outline-variant shadow-lg p-2 flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedZona('Todas');
                        setOpenDropdown(null);
                      }}
                      className={`text-left px-3 py-2 rounded-lg text-body-md transition-colors flex items-center justify-between ${
                        selectedZona === 'Todas'
                          ? 'bg-primary-container text-on-primary-container font-medium'
                          : 'text-on-surface hover:bg-surface-container-low'
                      }`}
                    >
                      <span>Todas las zonas</span>
                      {selectedZona === 'Todas' && (
                        <span className="material-symbols-outlined text-body-lg" aria-hidden="true">
                          check
                        </span>
                      )}
                    </button>
                    {availableZones.map((zona) => (
                      <button
                        key={zona}
                        type="button"
                        onClick={() => {
                          setSelectedZona(zona);
                          setOpenDropdown(null);
                        }}
                        className={`text-left px-3 py-2 rounded-lg text-body-md transition-colors flex items-center justify-between ${
                          selectedZona === zona
                            ? 'bg-primary-container text-on-primary-container font-medium'
                            : 'text-on-surface hover:bg-surface-container-low'
                        }`}
                      >
                        <span>{zona}</span>
                        {selectedZona === zona && (
                          <span className="material-symbols-outlined text-body-lg" aria-hidden="true">
                            check
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-7 w-px bg-outline-variant/80 mx-1" aria-hidden="true" />
            </div>

            {/* Tipo de propiedad Chips */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <span className="text-label-md font-semibold text-on-surface">
                Tipo de propiedad
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {DESKTOP_TYPE_CHIPS.map((chip) => {
                  const isActive = !onlyFavorites && selectedType === chip.id;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => handleDesktopTypeToggle(chip.id)}
                      className={`rounded-full border px-4 py-1.5 text-label-md transition-colors duration-150 whitespace-nowrap ${
                        isActive
                          ? 'border-primary-container bg-primary-container text-on-primary-container'
                          : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Property Cards Grid / Empty State */}
          {displayedProperties.length === 0 ? (
            <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/70 p-8 text-center flex flex-col items-center gap-3">
              <span
                className="material-symbols-outlined text-headline-lg text-outline"
                aria-hidden="true"
              >
                {onlyFavorites ? 'favorite_border' : 'search_off'}
              </span>
              <div className="flex flex-col gap-1">
                <p className="font-headline text-title-lg text-on-surface">
                  {onlyFavorites
                    ? 'Aún no tienes propiedades guardadas'
                    : 'No encontramos propiedades con esos filtros'}
                </p>
                <p className="text-body-md text-on-surface-variant">
                  {onlyFavorites
                    ? 'Toca el corazón en cualquier propiedad para guardarla aquí.'
                    : 'Prueba ajustando el rango de precio, zona o tipo de propiedad.'}
                </p>
              </div>
              <button
                type="button"
                onClick={resetAllFilters}
                className="mt-1 rounded-md bg-primary-container text-on-primary-container px-5 py-2 text-label-md hover:bg-primary transition-colors"
              >
                Ver todas las propiedades
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
              {displayedProperties.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  isFavorite={!!favorites[prop.id]}
                  onToggleFavorite={toggleFavorite}
                  onSelect={setActiveProperty}
                />
              ))}
            </div>
          )}

          {/* Ver más button */}
          {hasMore && (
            <div className="flex justify-center pt-1 md:pt-2">
              <button
                data-component-id="button-ver-mas"
                data-component-type="button"
                data-component-variant="with-icon"
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 3)}
                className="w-full max-w-[260px] inline-flex items-center justify-center gap-2 rounded-md bg-surface-container-lowest text-on-surface border border-outline-variant px-6 py-2.5 hover:bg-surface-container-low transition-colors whitespace-nowrap"
              >
                <span className="font-body text-label-lg md:hidden">Ver más propiedades</span>
                <span className="font-body text-label-lg hidden md:inline">Ver más</span>
                <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                  expand_more
                </span>
              </button>
            </div>
          )}
        </section>

        {/* QUIERO VENDER MI PROPIEDAD */}
        <section id="vender" className="flex flex-col gap-3">
          {/* Mobile Compact Banner (< md) */}
          <div className="md:hidden relative rounded-xl overflow-hidden border border-outline-variant/60 min-h-[156px] p-5 flex items-center justify-between gap-4">
            <PropertyImage
              src={SELLER_BANNER_IMAGE}
              alt="Residencia de cantera en San Luis Potosí"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/70 to-primary/45" />

            <div className="relative z-10 flex flex-col gap-1.5 max-w-[190px]">
              <h2 className="font-headline text-headline-md text-on-primary text-balance">
                Quiero vender mi propiedad
              </h2>
              <p className="font-body text-label-sm text-on-primary/90 text-pretty">
                Déjanos tus datos y te contactamos a la brevedad.
              </p>
            </div>

            <button
              data-component-id="button-mobile-iniciar-registro"
              data-component-type="button"
              data-component-variant="secondary"
              type="button"
              aria-expanded={showSellerForm}
              onClick={() => setShowSellerForm(!showSellerForm)}
              className="relative z-10 shrink-0 inline-flex items-center gap-1.5 rounded-md bg-surface-container-lowest text-on-surface px-3.5 py-2.5 hover:bg-surface-container-low transition-colors whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                sell
              </span>
              <span className="font-body text-label-md">Iniciar registro</span>
              <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                arrow_forward
              </span>
            </button>
          </div>

          {/* Mobile Expandable Seller Form (< md) */}
          {showSellerForm && (
            <form
              onSubmit={handleSellerSubmit}
              className="md:hidden bg-surface-container-lowest rounded-lg border border-outline-variant p-4 flex flex-col gap-3"
            >
              {sellerSubmitted ? (
                <div className="py-2 flex flex-col items-center text-center gap-2">
                  <span className="material-symbols-outlined text-headline-md text-secondary" aria-hidden="true">
                    check_circle
                  </span>
                  <p className="font-body text-body-md font-medium text-on-surface">
                    Registro enviado. Un asesor en San Luis Potosí se pondrá en contacto contigo.
                  </p>
                  <button
                    type="button"
                    onClick={resetSellerForm}
                    className="rounded-md border border-outline-variant px-4 py-2 text-label-sm text-on-surface"
                  >
                    Enviar otra propiedad
                  </button>
                </div>
              ) : (
                <>
                  <label className="flex flex-col gap-1">
                    <span className="font-body text-label-sm text-on-surface">Nombre</span>
                    <input
                      type="text"
                      required
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 text-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-body text-label-sm text-on-surface">Teléfono</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      value={sellerPhone}
                      onChange={(e) => {
                        setSellerPhone(e.target.value);
                        if (sellerError) setSellerError('');
                      }}
                      placeholder="444 000 0000"
                      className="w-full rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 text-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-body text-label-sm text-on-surface">
                      Zona en San Luis Potosí
                    </span>
                    <input
                      type="text"
                      required
                      value={sellerZona}
                      onChange={(e) => setSellerZona(e.target.value)}
                      placeholder="Ej. Lomas, Tangamanga, Himalaya..."
                      className="w-full rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 text-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none"
                    />
                  </label>
                  {sellerError && (
                    <p className="text-label-sm text-error" role="alert">
                      {sellerError}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="w-full rounded-md bg-primary-container text-on-primary-container py-2.5 text-label-lg"
                  >
                    Enviar información
                  </button>
                </>
              )}
            </form>
          )}

          {/* Desktop 2-Column Seller Showcase Card (md+) matching desktop screenshot */}
          <div className="hidden md:grid md:grid-cols-[38%_1fr] gap-8 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 p-6 items-stretch shadow-xs">
            <div className="relative rounded-xl overflow-hidden min-h-[430px] bg-surface-container-high">
              <PropertyImage
                src={SELLER_BANNER_IMAGE}
                alt="Residencia de cantera en San Luis Potosí"
                className="w-full h-full object-cover object-center"
              />
            </div>

            <div className="py-2 pr-2 flex flex-col justify-center gap-5">
              <h2 className="font-headline text-headline-lg text-on-surface">
                Quiero vender mi propiedad
              </h2>

              {sellerSubmitted ? (
                <div className="rounded-xl bg-surface-container-low border border-outline-variant/70 p-8 flex flex-col items-center text-center gap-3">
                  <span
                    className="material-symbols-outlined text-display-lg text-secondary"
                    aria-hidden="true"
                  >
                    check_circle
                  </span>
                  <h3 className="font-headline text-headline-md text-on-surface">
                    Información recibida
                  </h3>
                  <p className="text-body-md text-on-surface-variant max-w-md">
                    Gracias, <span className="font-semibold text-on-surface">{sellerName}</span>.
                    Registramos tu <span className="font-semibold text-on-surface">{sellerTipo}</span> en{' '}
                    <span className="font-semibold text-on-surface">{sellerZona}</span> con valor
                    aproximado de <span className="font-semibold text-on-surface tabular-nums">{formatMXN(sellerPrice)}</span>. Te
                    contactaremos al {sellerPhone}.
                  </p>
                  <button
                    type="button"
                    onClick={resetSellerForm}
                    className="mt-2 rounded-md border border-outline-variant bg-surface-container-lowest px-5 py-2.5 text-label-md text-on-surface hover:bg-surface-container transition-colors"
                  >
                    Registrar otra propiedad
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSellerSubmit} className="flex flex-col gap-4">
                  {/* Nombre & Número */}
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="font-body text-label-md font-semibold text-on-surface">
                        Nombre
                      </span>
                      <input
                        type="text"
                        required
                        value={sellerName}
                        onChange={(e) => setSellerName(e.target.value)}
                        placeholder="Tu nombre"
                        className="w-full rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="font-body text-label-md font-semibold text-on-surface">
                        Número
                      </span>
                      <div className="relative">
                        <span
                          className="material-symbols-outlined text-title-md text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                          aria-hidden="true"
                        >
                          call
                        </span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          required
                          value={sellerPhone}
                          onChange={(e) => {
                            setSellerPhone(e.target.value);
                            if (sellerError) setSellerError('');
                          }}
                          placeholder="Tu número"
                          className="w-full rounded-full border border-outline-variant bg-surface-container-lowest pl-10 pr-4 py-2.5 text-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none"
                        />
                      </div>
                    </label>
                  </div>

                  {/* Zona */}
                  <label className="flex flex-col gap-1.5">
                    <span className="font-body text-label-md font-semibold text-on-surface">
                      Zona
                    </span>
                    <div className="relative">
                      <span
                        className="material-symbols-outlined text-title-md text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        aria-hidden="true"
                      >
                        location_on
                      </span>
                      <input
                        type="text"
                        required
                        value={sellerZona}
                        onChange={(e) => setSellerZona(e.target.value)}
                        placeholder="Ej. Lomas, Tangamanga, Himalaya..."
                        className="w-full rounded-full border border-outline-variant bg-surface-container-lowest pl-10 pr-4 py-2.5 text-body-md text-on-surface placeholder:text-outline focus:border-secondary focus:outline-none"
                      />
                    </div>
                  </label>

                  {/* Tipo de propiedad */}
                  <div className="flex flex-col gap-2">
                    <span className="font-body text-label-md font-semibold text-on-surface">
                      Tipo de propiedad
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {SELLER_TYPE_CHIPS.map((chip) => {
                        const isSelected = sellerTipo === chip.id;
                        return (
                          <button
                            key={chip.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => setSellerTipo(chip.id)}
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

                  {/* Precio aproximado Slider */}
                  <div className="flex flex-col gap-2 pt-1">
                    <label
                      htmlFor="seller-price-slider"
                      className="font-body text-label-md font-semibold text-on-surface"
                    >
                      Precio aproximado
                    </label>
                    <input
                      id="seller-price-slider"
                      type="range"
                      min={1000000}
                      max={20000000}
                      step={250000}
                      value={sellerPrice}
                      onChange={(e) => setSellerPrice(Number(e.target.value))}
                      style={{
                        background: `linear-gradient(to right, #715B3E 0%, #715B3E ${sliderProgress}%, #E7E2D9 ${sliderProgress}%, #E7E2D9 100%)`,
                      }}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-secondary"
                    />
                    <div className="flex items-center justify-between text-label-sm tabular-nums">
                      <span className="text-on-surface-variant">$1,000,000 MXN</span>
                      <span className="font-semibold text-on-surface">
                        {formatMXN(sellerPrice)}
                      </span>
                      <span className="text-on-surface-variant">$20,000,000 MXN</span>
                    </div>
                  </div>

                  {sellerError && (
                    <p className="text-label-sm text-error" role="alert">
                      {sellerError}
                    </p>
                  )}

                  <div className="flex justify-center pt-2">
                    <button
                      type="submit"
                      className="min-w-[260px] rounded-md bg-primary-container text-on-primary-container px-8 py-3 text-label-lg font-semibold hover:bg-primary transition-colors"
                    >
                      Enviar información
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* CONTÁCTANOS */}
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

          <div className="grid grid-cols-4 gap-2 md:gap-4 items-stretch">
            {[
              {
                mode: 'whatsapp' as const,
                id: 'card-contact-whatsapp',
                icon: 'chat',
                mobileLabel: 'WhatsApp',
                desktopTitle: 'WhatsApp',
                desktopSub: 'Mensaje directo',
              },
              {
                mode: 'phone' as const,
                id: 'card-contact-phone',
                icon: 'call',
                mobileLabel: 'Llamar',
                desktopTitle: 'Teléfono',
                desktopSub: 'Llamada directa',
              },
              {
                mode: 'email' as const,
                id: 'card-contact-email',
                icon: 'mail',
                mobileLabel: 'Correo',
                desktopTitle: 'Correo',
                desktopSub: 'Correo directo',
              },
              {
                mode: 'location' as const,
                id: 'card-contact-location',
                icon: 'location_on',
                mobileLabel: 'Ubicación',
                desktopTitle: 'Ubicación',
                desktopSub: 'Abrir en Google Maps',
              },
            ].map((item) => (
              <button
                key={item.mode}
                type="button"
                onClick={() => setContactMode(item.mode)}
                data-component-id={item.id}
                data-component-type="card"
                data-component-variant="interactive"
                className="h-full bg-surface-container-lowest border border-outline-variant rounded-xl md:rounded-xl py-3 px-1 md:px-4 md:py-4 flex flex-col md:flex-row items-center justify-center md:justify-between gap-1.5 md:gap-3 hover:bg-surface-container-low hover:border-secondary/60 transition-colors text-center md:text-left"
              >
                <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-3 min-w-0">
                  <span
                    className="material-symbols-outlined text-headline-md text-on-surface shrink-0"
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-body text-label-sm md:text-title-md font-semibold text-on-surface md:hidden">
                      {item.mobileLabel}
                    </span>
                    <span className="hidden md:block font-body text-title-md font-semibold text-on-surface truncate">
                      {item.desktopTitle}
                    </span>
                    <span className="hidden md:block font-body text-label-sm text-on-surface-variant truncate">
                      {item.desktopSub}
                    </span>
                  </div>
                </div>
                <span
                  className="hidden md:inline-block material-symbols-outlined text-title-md text-on-surface-variant shrink-0"
                  aria-hidden="true"
                >
                  chevron_right
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* QUIET EDITORIAL FOOTER */}
      <footer className="border-t border-outline-variant/60 bg-surface-container-low">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-label-sm text-on-surface-variant">
          <span>© 2026 Luis &amp; Oliver Bienes Raíces · San Luis Potosí, S.L.P.</span>
          <div className="flex items-center gap-5">
            <a href="#propiedades" className="hover:text-on-surface transition-colors">
              Propiedades
            </a>
            <a href="#vender" className="hover:text-on-surface transition-colors">
              Vender
            </a>
            <a href="#contacto" className="hover:text-on-surface transition-colors">
              Contacto
            </a>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <PropertyDetailModal
        property={activeProperty}
        isFavorite={activeProperty ? !!favorites[activeProperty.id] : false}
        onToggleFavorite={toggleFavorite}
        onClose={() => setActiveProperty(null)}
      />

      <ContactModal mode={contactMode} onClose={() => setContactMode(null)} />
    </div>
  );
}
