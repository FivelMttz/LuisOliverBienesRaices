import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { CatalogFilters, PropertyType } from './types/domain';
import {
  usePlatform,
  saveContinuitySnapshot,
  loadContinuitySnapshot,
} from './services/platformStore';
import { PropertyImage } from './components/PropertyImage';
import { PublicPropertyCard } from './components/PublicPropertyCard';
import { SellerCaptureSection } from './components/SellerCaptureSection';
import { ContactSection } from './components/ContactSection';
import { ContactModal, ContactModalMode } from './components/ContactModal';
import { CatalogView } from './components/CatalogView';
import { AdminPanel } from './components/admin/AdminPanel';

type AppView = 'landing' | 'catalogo' | 'admin';
type PriceRangeOption = 'all' | 'under_3_5m' | '3_5m_to_8m' | 'over_8m';

const PRIMARY_MOBILE_CHIPS: { id: 'Todas' | PropertyType; label: string; icon: string }[] = [
  { id: 'Todas', label: 'Todas', icon: 'grid_view' },
  { id: 'Casa', label: 'Casa', icon: 'home' },
  { id: 'Departamento', label: 'Depa', icon: 'apartment' },
  { id: 'Terreno', label: 'Terreno', icon: 'layers' },
];

const EXTRA_MOBILE_CHIPS: { id: PropertyType; label: string; icon: string }[] = [
  { id: 'Oficina', label: 'Oficina', icon: 'work_outline' },
  { id: 'Local', label: 'Local', icon: 'storefront' },
  { id: 'Bodega', label: 'Bodega', icon: 'warehouse' },
];

const DESKTOP_TYPE_CHIPS: { id: PropertyType; label: string }[] = [
  { id: 'Terreno', label: 'Terreno' },
  { id: 'Departamento', label: 'Departamento' },
  { id: 'Casa', label: 'Casa' },
  { id: 'Oficina', label: 'Oficina' },
  { id: 'Local', label: 'Local' },
  { id: 'Bodega', label: 'Bodega' },
];

const PRICE_RANGE_OPTIONS: { id: PriceRangeOption; label: string }[] = [
  { id: 'all', label: 'Todos los precios' },
  { id: 'under_3_5m', label: 'Hasta $3,500,000 MXN' },
  { id: '3_5m_to_8m', label: '$3,500,000 – $8,000,000' },
  { id: 'over_8m', label: 'Más de $8,000,000 MXN' },
];

const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
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
};

function getViewFromHash(): AppView {
  if (typeof window === 'undefined') return 'landing';
  const hash = window.location.hash;
  if (hash.startsWith('#/catalogo')) return 'catalogo';
  if (hash.startsWith('#/admin')) return 'admin';
  return 'landing';
}

export default function App() {
  const { publicProperties, config, favorites, toggleFavorite, trackEvent, gmpQuotaExceeded } =
    usePlatform();

  const initialSnapshot = useMemo(() => loadContinuitySnapshot(), []);
  const isDesktopInitial =
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true;

  const [view, setView] = useState<AppView>(() => {
    const fromHash = getViewFromHash();
    if (fromHash !== 'landing') return fromHash;
    return initialSnapshot?.view && initialSnapshot.view !== 'admin'
      ? initialSnapshot.view
      : 'landing';
  });

  // Landing state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExtraSheetOpen, setMobileExtraSheetOpen] = useState(false);
  const [landingType, setLandingType] = useState<'Todas' | PropertyType>(
    initialSnapshot?.landingType ?? 'Todas',
  );
  const [landingZona, setLandingZona] = useState<string>('Todas');
  const [landingPriceRange, setLandingPriceRange] = useState<PriceRangeOption>('all');
  const [landingSort, setLandingSort] = useState<'recent' | 'price_asc' | 'price_desc'>('recent');
  const [openDropdown, setOpenDropdown] = useState<'price' | 'zona' | null>(null);
  const [landingVisibleCount, setLandingVisibleCount] = useState<number>(
    initialSnapshot?.landingVisibleCount ?? (isDesktopInitial ? 9 : 3),
  );
  const [landingExpandClicks, setLandingExpandClicks] = useState<number>(
    initialSnapshot?.landingExpandClicks ?? 0,
  );
  const [showMobileSellerForm, setShowMobileSellerForm] = useState(false);

  // Catalog state
  const [catalogFilters, setCatalogFilters] = useState<CatalogFilters>(
    initialSnapshot?.filters ?? DEFAULT_CATALOG_FILTERS,
  );
  const [catalogVisibleCount, setCatalogVisibleCount] = useState<number>(
    initialSnapshot?.catalogVisibleCount ?? 12,
  );

  // Shared expanded property IDs (REQ-CAT-002 & REQ-NAV-002)
  const [expandedIds, setExpandedIds] = useState<string[]>(() => {
    const saved = initialSnapshot?.expandedIds ?? [];
    const availableSet = new Set(publicProperties.map((p) => p.id));
    return saved.filter((id) => availableSet.has(id));
  });

  // Sticky compact desktop landing header (REQ-NAV-001)
  const [isScrolled, setIsScrolled] = useState(false);

  // Contact modal fallback
  const [contactModalMode, setContactModalMode] = useState<ContactModalMode>(null);
  const [contactFolioContext, setContactFolioContext] = useState<string | null>(null);

  const filterBarRef = useRef<HTMLDivElement>(null);
  const visitTrackedRef = useRef<string | null>(null);
  const expandedIdsRef = useRef<string[]>(expandedIds);

  useEffect(() => {
    expandedIdsRef.current = expandedIds;
  }, [expandedIds]);

  // Sync hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setView(getViewFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Track site_visit when entering landing or catalogo (REQ-ANA-001)
  useEffect(() => {
    if (view === 'landing' || view === 'catalogo') {
      if (visitTrackedRef.current !== view) {
        visitTrackedRef.current = view;
        trackEvent({ tipo: 'site_visit' });
      }
    }
  }, [view, trackEvent]);

  // Restore scroll on initial return if snapshot existed
  useEffect(() => {
    if (initialSnapshot && initialSnapshot.scrollY > 0 && view === initialSnapshot.view) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: initialSnapshot.scrollY, behavior: 'auto' });
      });
    }
  }, []);

  // Remove any retired property IDs from expandedIds automatically (REQ-NAV-002)
  useEffect(() => {
    const availableSet = new Set(publicProperties.map((p) => p.id));
    setExpandedIds((prev) => prev.filter((id) => availableSet.has(id)));
  }, [publicProperties]);

  // Persist continuity snapshot (REQ-NAV-002)
  useEffect(() => {
    const persistNow = () => {
      saveContinuitySnapshot({
        view,
        filters: catalogFilters,
        landingType,
        landingVisibleCount,
        landingExpandClicks,
        catalogVisibleCount,
        expandedIds,
        scrollY: window.scrollY,
        updatedAt: Date.now(),
      });
    };

    persistNow();
    window.addEventListener('pagehide', persistNow);
    return () => window.removeEventListener('pagehide', persistNow);
  }, [
    view,
    catalogFilters,
    landingType,
    landingVisibleCount,
    landingExpandClicks,
    catalogVisibleCount,
    expandedIds,
  ]);

  // Sticky compact desktop landing header listener (REQ-NAV-001)
  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 280);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close desktop filter dropdowns on outside click / Escape
  useEffect(() => {
    if (!openDropdown) return;
    const handleOutside = (e: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdown(null);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [openDropdown]);

  const navigateTo = useCallback((nextView: AppView, anchorId?: string) => {
    setView(nextView);
    setMobileMenuOpen(false);
    if (nextView === 'landing') {
      window.location.hash = '#/';
    } else if (nextView === 'catalogo') {
      window.location.hash = '#/catalogo';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.location.hash = '#/admin';
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    if (anchorId) {
      setTimeout(() => {
        document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  }, []);

  const handleToggleExpand = useCallback(
    (id: string, folio?: string) => {
      const isCurrentlyOpen = expandedIdsRef.current.includes(id);
      const nextExpanded = isCurrentlyOpen
        ? expandedIdsRef.current.filter((item) => item !== id)
        : [...expandedIdsRef.current, id];
      expandedIdsRef.current = nextExpanded;
      setExpandedIds(nextExpanded);
      if (!isCurrentlyOpen && folio) {
        trackEvent({ tipo: 'property_view', folio });
      }
    },
    [trackEvent],
  );

  // REQ-LAN-002: Destacadas available first ordered by most recent publication,
  // filled with available recent properties; Vendida/Rentada excluded from Destacadas!
  const landingPool = useMemo(() => {
    const eligible = publicProperties.filter(
      (p) => p.estado !== 'Vendida' && p.estado !== 'Rentada',
    );
    const ordered = [...eligible].sort((a, b) => {
      // Destacadas priority
      if (a.destacada !== b.destacada) return a.destacada ? -1 : 1;
      // Commercial preference for Venta over Renta when un-filtered
      const aVenta = a.operacion === 'Venta' ? 0 : 1;
      const bVenta = b.operacion === 'Venta' ? 0 : 1;
      if (aVenta !== bVenta) return aVenta - bVenta;
      return new Date(b.publicadaEn).getTime() - new Date(a.publicadaEn).getTime();
    });

    let list = ordered.filter((p) => {
      if (landingType !== 'Todas' && p.tipo !== landingType) return false;
      if (landingZona !== 'Todas' && p.zonaPublica !== landingZona) return false;
      if (landingPriceRange === 'under_3_5m' && p.precio > 3500000) return false;
      if (landingPriceRange === '3_5m_to_8m' && (p.precio < 3500000 || p.precio > 8000000)) {
        return false;
      }
      if (landingPriceRange === 'over_8m' && p.precio <= 8000000) return false;
      return true;
    });

    if (landingSort === 'price_asc') {
      list = [...list].sort((a, b) => a.precio - b.precio);
    } else if (landingSort === 'price_desc') {
      list = [...list].sort((a, b) => b.precio - a.precio);
    }
    return list;
  }, [publicProperties, landingType, landingZona, landingPriceRange, landingSort]);

  const landingZones = useMemo(
    () => Array.from(new Set(publicProperties.map((p) => p.zonaPublica))).sort(),
    [publicProperties],
  );

  const displayedLanding = landingPool.slice(0, landingVisibleCount);
  const hasMoreLanding = landingVisibleCount < landingPool.length;
  const batchIncrement = typeof window !== 'undefined' && window.innerWidth >= 768 ? 9 : 3;

  const handleBuyCtaClick = () => {
    // REQ-LAN-001: on mobile expand from 3 to 6 if inventory exists
    if (typeof window !== 'undefined' && window.innerWidth < 768 && landingVisibleCount < 6) {
      setLandingVisibleCount(6);
    }
    document.getElementById('propiedades')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSellCtaClick = () => {
    setShowMobileSellerForm(true);
    if (view !== 'landing') {
      navigateTo('landing', 'vender');
    } else {
      document.getElementById('vender')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const hasLandingFilters =
    landingType !== 'Todas' || landingZona !== 'Todas' || landingPriceRange !== 'all';

  const openMapWithLandingFilters = useCallback(() => {
    setCatalogFilters({
      ...DEFAULT_CATALOG_FILTERS,
      operaciones:
        landingPriceRange === '3_5m_to_8m' || landingPriceRange === 'over_8m'
          ? ['Venta', 'Preventa']
          : [],
      tipos: landingType !== 'Todas' ? [landingType] : [],
      zonas: landingZona !== 'Todas' ? [landingZona] : [],
      ventaPrecioMin:
        landingPriceRange === '3_5m_to_8m'
          ? 3500000
          : landingPriceRange === 'over_8m'
            ? 8000001
            : null,
      ventaPrecioMax:
        landingPriceRange === 'under_3_5m'
          ? 3500000
          : landingPriceRange === '3_5m_to_8m'
            ? 8000000
            : null,
      orden: landingSort,
    });
    setCatalogVisibleCount(12);
    navigateTo('catalogo');
  }, [landingType, landingZona, landingPriceRange, landingSort, navigateTo]);

  const handleOpenContactModal = (mode: ContactModalMode, folio?: string) => {
    setContactFolioContext(folio ?? null);
    setContactModalMode(mode);
  };

  const quotaBanner = gmpQuotaExceeded ? (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
      <span>
        Google Maps Platform quota reached. If you are the app owner, visit{' '}
        <a
          href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold text-amber-950 hover:text-amber-800"
        >
          maps developer site
        </a>{' '}
        for instructions to update your account.
      </span>
    </div>
  ) : null;

  if (view === 'admin') {
    return (
      <>
        {quotaBanner}
        <AdminPanel onExitToPublic={() => navigateTo('landing')} />
      </>
    );
  }

  if (view === 'catalogo') {
    return (
      <>
        {quotaBanner}
        <CatalogView
          filters={catalogFilters}
          onFiltersChange={setCatalogFilters}
          visibleCount={catalogVisibleCount}
          onVisibleCountChange={setCatalogVisibleCount}
          expandedIds={expandedIds}
          onToggleExpand={handleToggleExpand}
          onGoLanding={() => navigateTo('landing')}
          onGoSell={handleSellCtaClick}
          onGoContact={() => navigateTo('landing', 'contacto')}
          onOpenContactModal={handleOpenContactModal}
        />
        <footer className="border-t border-outline-variant/60 bg-surface-container-low">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-label-sm text-on-surface-variant">
            <span>© 2026 Luis &amp; Oliver Bienes Raíces · San Luis Potosí, S.L.P.</span>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => navigateTo('landing')}
                className="hover:text-on-surface transition-colors"
              >
                Inicio
              </button>
              <button
                type="button"
                onClick={handleSellCtaClick}
                className="hover:text-on-surface transition-colors"
              >
                Vender
              </button>
              <button
                type="button"
                onClick={() => navigateTo('admin')}
                className="hover:text-on-surface transition-colors"
              >
                Acceso equipo
              </button>
            </div>
          </div>
        </footer>
        <ContactModal
          mode={contactModalMode}
          folioContext={contactFolioContext}
          onClose={() => setContactModalMode(null)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-clip flex flex-col bg-surface text-on-surface">
      {quotaBanner}
      {/* FIXED COMPACT HEADER ON DESKTOP SCROLL (REQ-NAV-001) */}
      {isScrolled && (
        <div className="hidden md:block fixed top-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/70 shadow-xs">
          <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between gap-8">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex flex-col shrink-0 text-on-surface"
            >
              <span className="font-headline text-title-md tracking-wider uppercase">
                LUIS &amp; OLIVER
              </span>
              <span className="font-body text-[11px] tracking-[0.2em] uppercase text-on-surface-variant">
                BIENES RAÍCES
              </span>
            </a>

            <nav className="flex items-center gap-8 text-label-lg text-on-surface-variant">
              <button
                type="button"
                onClick={() => navigateTo('catalogo')}
                className="hover:text-on-surface transition-colors whitespace-nowrap"
              >
                Propiedades
              </button>
              <a
                href="#vender"
                className="hover:text-on-surface transition-colors whitespace-nowrap"
              >
                Vender
              </a>
              <a
                href="#contacto"
                className="rounded-md bg-primary-container text-on-primary-container px-4 py-2 text-label-md font-semibold hover:bg-primary transition-colors whitespace-nowrap"
              >
                Contáctanos
              </a>
            </nav>
          </div>
        </div>
      )}

      {/* HERO + TOP NAVIGATION */}
      <header className="relative w-full min-h-[250px] md:min-h-[360px] flex flex-col justify-between overflow-hidden">
        <PropertyImage
          src={config.heroImageUrl}
          alt="Residencia contemporánea en San Luis Potosí"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/75 via-primary/50 to-primary/45" />

        {/* Top Bar inside Hero */}
        <div className="relative z-20 w-full max-w-6xl mx-auto px-5 md:px-8 pt-5 md:pt-7">
          <nav aria-label="Navegación principal" className="flex items-center justify-between gap-8">
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

            {/* Desktop Right Links */}
            <div className="hidden md:flex items-center gap-8">
              <button
                type="button"
                onClick={() => navigateTo('catalogo')}
                className="text-label-lg text-on-primary/95 hover:text-on-primary transition-colors whitespace-nowrap shrink-0"
              >
                Propiedades
              </button>
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

            {/* Mobile Hamburger */}
            <button
              type="button"
              aria-label="Abrir menú"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-on-primary hover:bg-on-primary/10 transition-colors"
            >
              <span className="material-symbols-outlined text-headline-md" aria-hidden="true">
                menu
              </span>
            </button>
          </nav>
        </div>

        {/* Hero Title (mobile visible, desktop clean per REQ-LAN-001) & Split CTAs */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-5 md:px-8 pt-4 pb-6 md:pb-24 flex flex-col items-center gap-4 text-center">
          <h1 className="md:sr-only font-headline text-[26px] leading-[32px] min-[380px]:text-display-lg-mobile text-on-primary text-balance">
            {config.mobileHeroTitle}
          </h1>

          <div className="w-full max-w-md md:max-w-lg grid grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
            <button
              type="button"
              onClick={handleBuyCtaClick}
              className="min-w-0 inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-md bg-surface-container-lowest text-on-surface px-2.5 sm:px-3 md:px-6 py-3 md:py-3.5 transition-colors duration-150 hover:bg-surface-container-low shadow-sm"
            >
              <span className="material-symbols-outlined text-title-md md:hidden shrink-0" aria-hidden="true">
                home
              </span>
              <span className="font-body text-[13px] min-[380px]:text-label-lg md:text-title-md font-semibold truncate">
                Quiero comprar
              </span>
            </button>
            <button
              type="button"
              onClick={handleSellCtaClick}
              className="min-w-0 inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-md bg-primary-container/80 md:bg-primary/65 md:backdrop-blur-xs border border-on-primary/65 text-on-primary px-2.5 sm:px-3 md:px-6 py-3 md:py-3.5 transition-colors duration-150 hover:bg-primary-container"
            >
              <span className="material-symbols-outlined text-title-md md:hidden shrink-0" aria-hidden="true">
                sell
              </span>
              <span className="font-body text-[13px] min-[380px]:text-label-lg md:text-title-md font-semibold truncate">
                Quiero vender
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* FULL-SCREEN MOBILE OVERLAY MENU WITH X (REQ-NAV-001) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-primary text-on-primary flex flex-col justify-between p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Menú principal"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-headline text-title-md tracking-wider uppercase">
                LUIS &amp; OLIVER
              </span>
              <span className="font-body text-label-sm tracking-[0.2em] uppercase text-on-primary/80">
                BIENES RAÍCES
              </span>
            </div>
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setMobileMenuOpen(false)}
              className="w-11 h-11 rounded-full flex items-center justify-center text-on-primary hover:bg-on-primary/10"
            >
              <span className="material-symbols-outlined text-headline-md" aria-hidden="true">
                close
              </span>
            </button>
          </div>

          <nav className="flex flex-col gap-5 text-headline-md font-headline">
            <a
              href="#propiedades"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-on-primary/15"
            >
              Propiedades destacadas
            </a>
            <button
              type="button"
              onClick={() => navigateTo('catalogo')}
              className="text-left py-2 border-b border-on-primary/15"
            >
              Catálogo completo
            </button>
            <a
              href="#vender"
              onClick={() => {
                setShowMobileSellerForm(true);
                setMobileMenuOpen(false);
              }}
              className="py-2 border-b border-on-primary/15"
            >
              Quiero vender mi propiedad
            </a>
            <a
              href="#contacto"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-on-primary/15"
            >
              Contáctanos
            </a>
          </nav>

          <div className="flex items-center justify-between text-label-sm text-on-primary/70">
            <span>San Luis Potosí, S.L.P.</span>
            <button
              type="button"
              onClick={() => navigateTo('admin')}
              className="underline underline-offset-4 text-on-primary/90"
            >
              Acceso equipo
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-5 md:py-10 flex flex-col gap-6 md:gap-14">
        {/* PROPIEDADES DESTACADAS */}
        <section id="propiedades" className="flex flex-col gap-4 md:gap-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="min-w-0 font-headline text-[20px] leading-[26px] min-[380px]:text-headline-md md:text-headline-lg text-on-surface">
              Propiedades destacadas
            </h2>

            <div className="flex items-center gap-3 shrink-0">
              {hasLandingFilters && (
                <button
                  type="button"
                  onClick={openMapWithLandingFilters}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary-container bg-primary-container text-on-primary-container px-3 py-1 text-label-sm font-semibold hover:bg-primary transition-colors whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-body-lg" aria-hidden="true">
                    map
                  </span>
                  <span>Ver en mapa ({landingPool.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => navigateTo('catalogo')}
                className="inline-flex items-center gap-1 text-label-md text-on-surface hover:text-secondary shrink-0 whitespace-nowrap"
              >
                <span>Ver todas</span>
                <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>

          {/* Mobile Quick Chips + Bottom Sheet Trigger for Oficina/Local/Bodega (REQ-LAN-002) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 md:hidden">
            {PRIMARY_MOBILE_CHIPS.map((chip) => {
              const isActive = landingType === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => {
                    setLandingType(chip.id);
                    setLandingVisibleCount(3);
                    setLandingExpandClicks(0);
                    trackEvent({ tipo: 'filter_applied', filtrosCategorias: ['Tipo'] });
                  }}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors whitespace-nowrap ${
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
              onClick={() => setMobileExtraSheetOpen(true)}
              className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-label-md whitespace-nowrap ${
                EXTRA_MOBILE_CHIPS.some((c) => c.id === landingType)
                  ? 'border-primary-container bg-primary-container text-on-primary-container'
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface'
              }`}
            >
              <span>
                {EXTRA_MOBILE_CHIPS.find((c) => c.id === landingType)?.label ?? 'Más'}
              </span>
              <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                expand_more
              </span>
            </button>
          </div>

          {/* Desktop Filter Bar (md+) matching desktop mockup */}
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
                  onClick={() =>
                    setOpenDropdown((prev) => (prev === 'price' ? null : 'price'))
                  }
                  className={`inline-flex items-center justify-between gap-3 min-w-[170px] rounded-full border px-4 py-2.5 text-label-md transition-colors whitespace-nowrap ${
                    landingPriceRange !== 'all' || landingSort !== 'recent'
                      ? 'border-primary-container bg-surface-container-low font-semibold'
                      : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-title-md text-emerald-800"
                      aria-hidden="true"
                    >
                      payments
                    </span>
                    <span>
                      {landingPriceRange === 'all'
                        ? 'Precio'
                        : PRICE_RANGE_OPTIONS.find((o) => o.id === landingPriceRange)?.label}
                    </span>
                  </span>
                  <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                    {openDropdown === 'price' ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {openDropdown === 'price' && (
                  <div className="absolute left-0 top-full mt-2 z-30 w-64 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-lg p-2 flex flex-col gap-1">
                    {PRICE_RANGE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setLandingPriceRange(opt.id);
                          setOpenDropdown(null);
                          setLandingVisibleCount(9);
                          trackEvent({
                            tipo: 'filter_applied',
                            filtrosCategorias: ['Precio'],
                            precioRango: opt.label,
                          });
                        }}
                        className={`text-left px-3 py-2 rounded-lg text-body-md transition-colors ${
                          landingPriceRange === opt.id
                            ? 'bg-primary-container text-on-primary-container font-medium'
                            : 'hover:bg-surface-container-low'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                    <div className="my-1 border-t border-outline-variant/50" />
                    {[
                      { id: 'recent' as const, label: 'Más recientes' },
                      { id: 'price_asc' as const, label: 'Menor a mayor precio' },
                      { id: 'price_desc' as const, label: 'Mayor a menor precio' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setLandingSort(opt.id);
                          setOpenDropdown(null);
                        }}
                        className={`text-left px-3 py-2 rounded-lg text-body-md transition-colors ${
                          landingSort === opt.id
                            ? 'bg-secondary-container text-on-secondary-container font-medium'
                            : 'hover:bg-surface-container-low'
                        }`}
                      >
                        {opt.label}
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
                  onClick={() =>
                    setOpenDropdown((prev) => (prev === 'zona' ? null : 'zona'))
                  }
                  className={`inline-flex items-center justify-between gap-3 min-w-[160px] rounded-full border px-4 py-2.5 text-label-md transition-colors whitespace-nowrap ${
                    landingZona !== 'Todas'
                      ? 'border-primary-container bg-surface-container-low font-semibold'
                      : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-title-md text-red-700"
                      aria-hidden="true"
                    >
                      location_on
                    </span>
                    <span>{landingZona === 'Todas' ? 'Zona' : landingZona}</span>
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
                        setLandingZona('Todas');
                        setOpenDropdown(null);
                        setLandingVisibleCount(9);
                      }}
                      className={`text-left px-3 py-2 rounded-lg text-body-md ${
                        landingZona === 'Todas'
                          ? 'bg-primary-container text-on-primary-container font-medium'
                          : 'hover:bg-surface-container-low'
                      }`}
                    >
                      Todas las zonas
                    </button>
                    {landingZones.map((zona) => (
                      <button
                        key={zona}
                        type="button"
                        onClick={() => {
                          setLandingZona(zona);
                          setOpenDropdown(null);
                          setLandingVisibleCount(9);
                          trackEvent({
                            tipo: 'filter_applied',
                            filtrosCategorias: ['Zona'],
                            zona,
                          });
                        }}
                        className={`text-left px-3 py-2 rounded-lg text-body-md ${
                          landingZona === zona
                            ? 'bg-primary-container text-on-primary-container font-medium'
                            : 'hover:bg-surface-container-low'
                        }`}
                      >
                        {zona}
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
                  const isActive = landingType === chip.id;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        setLandingType((prev) => (prev === chip.id ? 'Todas' : chip.id));
                        setLandingVisibleCount(9);
                        setLandingExpandClicks(0);
                        trackEvent({ tipo: 'filter_applied', filtrosCategorias: ['Tipo'] });
                      }}
                      className={`rounded-full border px-4 py-1.5 text-label-md transition-colors whitespace-nowrap ${
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

          {/* Grid or Empty State */}
          {displayedLanding.length === 0 ? (
            <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/70 p-8 text-center flex flex-col items-center gap-3">
              <p className="font-headline text-title-lg text-on-surface">
                Por el momento no tenemos propiedades que coincidan con tu búsqueda
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setLandingType('Todas');
                    setLandingZona('Todas');
                    setLandingPriceRange('all');
                    setLandingSort('recent');
                  }}
                  className="rounded-md bg-primary-container text-on-primary-container px-5 py-2 text-label-md font-semibold"
                >
                  Restablecer filtros
                </button>
                <a
                  href="#contacto"
                  className="rounded-md border border-outline-variant bg-surface-container-lowest px-5 py-2 text-label-md"
                >
                  Contactar a la agencia
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 items-start">
              {displayedLanding.map((prop) => (
                <PublicPropertyCard
                  key={prop.id}
                  property={prop}
                  isFavorite={!!favorites[prop.id]}
                  isExpanded={expandedIds.includes(prop.id)}
                  onToggleExpand={(id) => handleToggleExpand(id, prop.folio)}
                  onToggleFavorite={toggleFavorite}
                  onTrackWhatsApp={(folio) => trackEvent({ tipo: 'whatsapp_click', folio })}
                  onTrackCall={(folio) => trackEvent({ tipo: 'call_click', folio })}
                  onOpenCallFallback={(folio) => handleOpenContactModal('phone', folio)}
                />
              ))}
            </div>
          )}

          {/* Incremental Loading + Ver catálogo completo after 3 expansions (REQ-LAN-002) */}
          <div className="flex flex-col items-center gap-2 pt-1">
            {hasMoreLanding && (
              <button
                type="button"
                onClick={() => {
                  setLandingVisibleCount((prev) => prev + batchIncrement);
                  setLandingExpandClicks((prev) => prev + 1);
                }}
                className="w-full max-w-[260px] inline-flex items-center justify-center gap-2 rounded-md bg-surface-container-lowest text-on-surface border border-outline-variant px-6 py-2.5 hover:bg-surface-container-low transition-colors"
              >
                <span className="font-body text-label-lg md:hidden">Ver más propiedades</span>
                <span className="font-body text-label-lg hidden md:inline">Ver más</span>
                <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                  expand_more
                </span>
              </button>
            )}

            {(landingExpandClicks >= 3 || !hasMoreLanding) && landingPool.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  hasLandingFilters ? openMapWithLandingFilters() : navigateTo('catalogo')
                }
                className="text-label-md text-secondary hover:text-on-surface underline underline-offset-4 py-1"
              >
                {hasLandingFilters
                  ? 'Ver resultados filtrados en el mapa'
                  : 'Ver catálogo completo y mapa'}
              </button>
            )}
          </div>
        </section>

        {/* QUIERO VENDER MI PROPIEDAD */}
        <SellerCaptureSection
          showMobileForm={showMobileSellerForm}
          onToggleMobileForm={setShowMobileSellerForm}
        />

        {/* CONTÁCTANOS */}
        <ContactSection onOpenModal={(mode) => handleOpenContactModal(mode)} />
      </main>

      {/* Mobile Bottom Sheet for Oficina / Local / Bodega (REQ-LAN-002) */}
      {mobileExtraSheetOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex items-end bg-primary/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Más tipos de propiedad"
          onClick={() => setMobileExtraSheetOpen(false)}
        >
          <div
            className="w-full rounded-t-2xl bg-surface border-t border-outline-variant p-5 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-title-lg">Espacios comerciales e industriales</h3>
              <button
                type="button"
                onClick={() => setMobileExtraSheetOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-surface-container-low flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                  close
                </span>
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {EXTRA_MOBILE_CHIPS.map((chip) => {
                const active = landingType === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      setLandingType(chip.id);
                      setLandingVisibleCount(3);
                      setLandingExpandClicks(0);
                      setMobileExtraSheetOpen(false);
                      trackEvent({ tipo: 'filter_applied', filtrosCategorias: ['Tipo'] });
                    }}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-body-md font-medium ${
                      active
                        ? 'border-primary-container bg-primary-container text-on-primary-container'
                        : 'border-outline-variant bg-surface-container-lowest text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                      {chip.icon}
                    </span>
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-outline-variant/60 bg-surface-container-low">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-label-sm text-on-surface-variant">
          <span>© 2026 Luis &amp; Oliver Bienes Raíces · San Luis Potosí, S.L.P.</span>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => navigateTo('catalogo')}
              className="hover:text-on-surface transition-colors"
            >
              Catálogo
            </button>
            <a href="#vender" className="hover:text-on-surface transition-colors">
              Vender
            </a>
            <a href="#contacto" className="hover:text-on-surface transition-colors">
              Contacto
            </a>
            <button
              type="button"
              onClick={() => navigateTo('admin')}
              className="hover:text-on-surface transition-colors"
            >
              Acceso equipo
            </button>
          </div>
        </div>
      </footer>

      <ContactModal
        mode={contactModalMode}
        folioContext={contactFolioContext}
        onClose={() => setContactModalMode(null)}
      />
    </div>
  );
}
