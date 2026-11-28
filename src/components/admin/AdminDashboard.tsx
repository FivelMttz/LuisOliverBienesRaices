import { useMemo, useState } from 'react';
import { usePlatform } from '../../services/platformStore';

type PeriodMode = 'week' | 'month';

function formatComparison(current: number, previous: number): string {
  if (previous === 0) return 'Sin comparación';
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct >= 0 ? '+' : ''}${pct}% vs periodo anterior`;
}

export function AdminDashboard() {
  const { analyticsEvents, leads, adminProperties } = usePlatform();
  const [period, setPeriod] = useState<PeriodMode>('week');

  const stats = useMemo(() => {
    const now = Date.now();
    const dayMs = 86400000;
    const windowDays = period === 'week' ? 7 : 30;
    const currentStart = now - windowDays * dayMs;
    const prevStart = now - windowDays * 2 * dayMs;

    const currentEvents = analyticsEvents.filter(
      (e) => new Date(e.fecha).getTime() >= currentStart,
    );
    const prevEvents = analyticsEvents.filter((e) => {
      const t = new Date(e.fecha).getTime();
      return t >= prevStart && t < currentStart;
    });

    const countByType = (list: typeof analyticsEvents, tipo: string) =>
      list.filter((e) => e.tipo === tipo).length;

    const siteVisitsCurr = countByType(currentEvents, 'site_visit');
    const siteVisitsPrev = countByType(prevEvents, 'site_visit');

    const favAddCurr = countByType(currentEvents, 'favorite_add');
    const favRemoveCurr = countByType(currentEvents, 'favorite_remove');

    const waCurr = countByType(currentEvents, 'whatsapp_click');
    const waPrev = countByType(prevEvents, 'whatsapp_click');

    const callCurr = countByType(currentEvents, 'call_click');
    const callPrev = countByType(prevEvents, 'call_click');

    const leadsCurr = leads.filter(
      (l) => new Date(l.creadaEn).getTime() >= currentStart,
    ).length;
    const leadsPrev = leads.filter((l) => {
      const t = new Date(l.creadaEn).getTime();
      return t >= prevStart && t < currentStart;
    }).length;

    // Groupings for indicators 2, 3, 4, 5, 7, 8, 9, 11
    const propViewsByFolio = new Map<string, number>();
    const favAddByFolio = new Map<string, number>();
    const waByFolio = new Map<string, number>();
    const callByFolio = new Map<string, number>();
    const zonesSearched = new Map<string, number>();
    const priceRanges = new Map<string, number>();
    const trafficSources = new Map<string, number>();
    const filterCategories = new Map<string, number>();

    currentEvents.forEach((e) => {
      if (e.tipo === 'property_view' && e.folio) {
        propViewsByFolio.set(e.folio, (propViewsByFolio.get(e.folio) ?? 0) + 1);
      }
      if (e.tipo === 'favorite_add' && e.folio) {
        favAddByFolio.set(e.folio, (favAddByFolio.get(e.folio) ?? 0) + 1);
      }
      if (e.tipo === 'whatsapp_click' && e.folio) {
        waByFolio.set(e.folio, (waByFolio.get(e.folio) ?? 0) + 1);
      }
      if (e.tipo === 'call_click' && e.folio) {
        callByFolio.set(e.folio, (callByFolio.get(e.folio) ?? 0) + 1);
      }
      if (e.tipo === 'filter_applied') {
        if (e.zona) zonesSearched.set(e.zona, (zonesSearched.get(e.zona) ?? 0) + 1);
        if (e.precioRango) {
          priceRanges.set(e.precioRango, (priceRanges.get(e.precioRango) ?? 0) + 1);
        }
        e.filtrosCategorias?.forEach((cat) => {
          filterCategories.set(cat, (filterCategories.get(cat) ?? 0) + 1);
        });
      }
      if (e.tipo === 'site_visit') {
        const src = e.origen || 'Directo';
        trafficSources.set(src, (trafficSources.get(src) ?? 0) + 1);
      }
    });

    const sortMap = (m: Map<string, number>) =>
      Array.from(m.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    return {
      siteVisitsCurr,
      siteVisitsComp: formatComparison(siteVisitsCurr, siteVisitsPrev),
      propViewsCurr: countByType(currentEvents, 'property_view'),
      propViewsComp: formatComparison(
        countByType(currentEvents, 'property_view'),
        countByType(prevEvents, 'property_view'),
      ),
      favAddCurr,
      favRemoveCurr,
      waCurr,
      waComp: formatComparison(waCurr, waPrev),
      callCurr,
      callComp: formatComparison(callCurr, callPrev),
      leadsCurr,
      leadsComp: formatComparison(leadsCurr, leadsPrev),
      topViewedFolios: sortMap(propViewsByFolio),
      topFavFolios: sortMap(favAddByFolio),
      topWaFolios: sortMap(waByFolio),
      topCallFolios: sortMap(callByFolio),
      topZones: sortMap(zonesSearched),
      topPriceRanges: sortMap(priceRanges),
      topSources: sortMap(trafficSources),
      topFilters: sortMap(filterCategories),
    };
  }, [analyticsEvents, leads, period]);

  const titleByFolio = useMemo(() => {
    const map = new Map<string, string>();
    adminProperties.forEach((p) => map.set(p.folio, p.titulo));
    return map;
  }, [adminProperties]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-headline text-headline-md text-on-surface">
            Dashboard de analítica comercial
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Once indicadores reales registrados en la sesión. Los clics miden intención de contacto,
            no conversaciones ni cierres.
          </p>
        </div>

        {/* Indicator 10: Weekly / Monthly comparison selector */}
        <div className="inline-flex rounded-lg border border-outline-variant bg-surface-container-lowest p-1">
          <button
            type="button"
            onClick={() => setPeriod('week')}
            className={`px-3.5 py-1.5 rounded-md text-label-md transition-colors ${
              period === 'week'
                ? 'bg-primary-container text-on-primary-container'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Últimos 7 días
          </button>
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={`px-3.5 py-1.5 rounded-md text-label-md transition-colors ${
              period === 'month'
                ? 'bg-primary-container text-on-primary-container'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Últimos 30 días
          </button>
        </div>
      </div>

      {/* Top 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/70 p-4 flex flex-col gap-1">
          <span className="text-label-sm text-on-surface-variant">1. Visitas al sitio</span>
          <span className="font-headline text-headline-lg text-on-surface tabular-nums">
            {stats.siteVisitsCurr}
          </span>
          <span className="text-label-sm text-secondary">{stats.siteVisitsComp}</span>
        </div>

        <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/70 p-4 flex flex-col gap-1">
          <span className="text-label-sm text-on-surface-variant">2. Aperturas de ficha</span>
          <span className="font-headline text-headline-lg text-on-surface tabular-nums">
            {stats.propViewsCurr}
          </span>
          <span className="text-label-sm text-secondary">{stats.propViewsComp}</span>
        </div>

        <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/70 p-4 flex flex-col gap-1">
          <span className="text-label-sm text-on-surface-variant">
            3. Favoritos (marcados / desmarcados)
          </span>
          <span className="font-headline text-headline-lg text-on-surface tabular-nums">
            {stats.favAddCurr} / {stats.favRemoveCurr}
          </span>
          <span className="text-label-sm text-on-surface-variant">
            Eventos locales diferenciados
          </span>
        </div>

        <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/70 p-4 flex flex-col gap-1">
          <span className="text-label-sm text-on-surface-variant">
            4. Clics WhatsApp (intención)
          </span>
          <span className="font-headline text-headline-lg text-on-surface tabular-nums">
            {stats.waCurr}
          </span>
          <span className="text-label-sm text-secondary">{stats.waComp}</span>
        </div>

        <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/70 p-4 flex flex-col gap-1">
          <span className="text-label-sm text-on-surface-variant">
            5. Clics Llamar (intención)
          </span>
          <span className="font-headline text-headline-lg text-on-surface tabular-nums">
            {stats.callCurr}
          </span>
          <span className="text-label-sm text-secondary">{stats.callComp}</span>
        </div>

        <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/70 p-4 flex flex-col gap-1">
          <span className="text-label-sm text-on-surface-variant">
            6. Solicitudes persistidas
          </span>
          <span className="font-headline text-headline-lg text-on-surface tabular-nums">
            {stats.leadsCurr}
          </span>
          <span className="text-label-sm text-secondary">{stats.leadsComp}</span>
        </div>
      </div>

      {/* Breakdown Lists for Indicators 2, 3, 4, 5, 7, 8, 9, 11 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            title: 'Ranking por propiedad (aperturas)',
            rows: stats.topViewedFolios,
            showTitle: true,
            empty: 'Sin aperturas de ficha registradas en el periodo.',
          },
          {
            title: 'Ranking de favoritos marcados por folio',
            rows: stats.topFavFolios,
            showTitle: true,
            empty: 'Sin favoritos marcados en el periodo.',
          },
          {
            title: 'Intención WhatsApp y Llamada por folio',
            rows: [
              ...stats.topWaFolios.map(([f, c]) => [`${f} · WhatsApp`, c] as [string, number]),
              ...stats.topCallFolios.map(([f, c]) => [`${f} · Llamar`, c] as [string, number]),
            ],
            showTitle: false,
            empty: 'Sin clics de contacto por propiedad registrados.',
          },
          {
            title: '7. Zonas buscadas en filtros',
            rows: stats.topZones,
            showTitle: false,
            empty: 'Sin filtros de zona aplicados aún.',
          },
          {
            title: '8. Rangos de precio aplicados (por modalidad)',
            rows: stats.topPriceRanges,
            showTitle: false,
            empty: 'Sin rangos de precio filtrados aún.',
          },
          {
            title: '9. Origen de tráfico · 11. Categorías filtradas',
            rows: [
              ...stats.topSources.map(([s, c]) => [`Origen: ${s}`, c] as [string, number]),
              ...stats.topFilters.map(([f, c]) => [`Filtro: ${f}`, c] as [string, number]),
            ],
            showTitle: false,
            empty: 'Sin eventos de tráfico o filtros en el periodo.',
          },
        ].map((panel) => (
          <div
            key={panel.title}
            className="rounded-xl bg-surface-container-lowest border border-outline-variant/70 p-4 flex flex-col gap-3"
          >
            <h2 className="font-headline text-title-md text-on-surface">{panel.title}</h2>
            {panel.rows.length === 0 ? (
              <p className="text-body-md text-on-surface-variant py-2">{panel.empty}</p>
            ) : (
              <ul className="divide-y divide-outline-variant/40">
                {panel.rows.map(([label, count]) => (
                  <li
                    key={label}
                    className="py-2 flex items-center justify-between gap-2 text-body-md"
                  >
                    <span className="text-on-surface truncate">
                      {label}
                      {panel.showTitle && titleByFolio.get(label)
                        ? ` — ${titleByFolio.get(label)}`
                        : ''}
                    </span>
                    <span className="font-mono text-label-md font-semibold text-secondary tabular-nums shrink-0">
                      {count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
