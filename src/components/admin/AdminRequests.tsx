import { useState, useMemo } from 'react';
import { LeadStatus, formatMXN } from '../../types/domain';
import { usePlatform } from '../../services/platformStore';

const LEAD_STATUSES: LeadStatus[] = ['Nuevo', 'En contacto', 'Atendido', 'Descartado'];

export function AdminRequests() {
  const { leads, staff, currentUser, updateLead, retryLeadEmail } = usePlatform();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | LeadStatus>('Todos');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== 'Todos' && l.estado !== statusFilter) return false;
      if (q) {
        const hay = `${l.folio} ${l.nombre} ${l.zona} ${l.tipo}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, search, statusFilter]);

  const selectedLead = useMemo(
    () => leads.find((l) => l.id === selectedLeadId) ?? null,
    [leads, selectedLeadId],
  );

  const handleOpenLead = (leadId: string, currentNotes: string) => {
    setSelectedLeadId(leadId);
    setNotesDraft(currentNotes);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-headline text-headline-md text-on-surface">
          Bandeja de solicitudes de propietarios
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Registros captados desde «Quiero vender mi propiedad» con folio único permanente.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por folio (CAP-2026-...), nombre o zona..."
          className="flex-1 min-w-[220px] rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-2 text-body-md focus:border-secondary focus:outline-none"
        />

        <div className="flex flex-wrap gap-1.5">
          {(['Todos', ...LEAD_STATUSES] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-full border px-3 py-1.5 text-label-sm transition-colors ${
                statusFilter === st
                  ? 'border-primary-container bg-primary-container text-on-primary-container'
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table / Empty state */}
      {filteredLeads.length === 0 ? (
        <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/70 p-8 text-center">
          <p className="font-headline text-title-md text-on-surface">Sin solicitudes registradas</p>
          <p className="text-body-md text-on-surface-variant mt-1">
            Las captaciones enviadas desde el formulario público aparecerán aquí con su folio.
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/70 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/60 bg-surface-container-low text-label-sm text-on-surface-variant">
                <th className="py-3 px-4 font-semibold">Folio</th>
                <th className="py-3 px-4 font-semibold">Propietario</th>
                <th className="py-3 px-4 font-semibold">Zona / Tipo</th>
                <th className="py-3 px-4 font-semibold text-right">Monto aprox.</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 text-body-md">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-surface-container-low/50">
                  <td className="py-3 px-4 font-mono text-mono-sm text-secondary whitespace-nowrap">
                    {lead.folio}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-on-surface">{lead.nombre}</div>
                    <div className="text-label-sm text-on-surface-variant tabular-nums">
                      {lead.telefono}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-on-surface">{lead.zona}</div>
                    <div className="text-label-sm text-on-surface-variant">{lead.tipo}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-label-md tabular-nums whitespace-nowrap">
                    {formatMXN(lead.precioAproximado)}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      aria-label={`Estado de ${lead.folio}`}
                      value={lead.estado}
                      onChange={(e) =>
                        updateLead(lead.id, { estado: e.target.value as LeadStatus })
                      }
                      className="rounded-md border border-outline-variant bg-surface-container-low px-2.5 py-1 text-label-sm text-on-surface"
                    >
                      {LEAD_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenLead(lead.id, lead.notasSeguimiento)}
                      className="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-label-sm hover:bg-surface-container-low whitespace-nowrap"
                    >
                      Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Drawer / Modal */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedLeadId(null)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-surface border border-outline-variant p-5 flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-mono text-mono-sm text-secondary">{selectedLead.folio}</span>
                <h2 className="font-headline text-title-lg text-on-surface">
                  {selectedLead.nombre}
                </h2>
                <p className="text-body-md text-on-surface-variant tabular-nums">
                  {selectedLead.telefono} · {selectedLead.tipo} en {selectedLead.zona}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeadId(null)}
                className="w-9 h-9 rounded-full hover:bg-surface-container-low flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                  close
                </span>
              </button>
            </div>

            <div className="rounded-lg bg-surface-container-low p-3 flex items-center justify-between text-label-sm">
              <span>
                Correo notificación:{' '}
                <strong>{selectedLead.emailNotificado ? 'Enviado' : 'Pendiente'}</strong>
              </span>
              {!selectedLead.emailNotificado && (
                <button
                  type="button"
                  onClick={() => retryLeadEmail(selectedLead.id)}
                  className="text-secondary underline"
                >
                  Reintentar correo
                </button>
              )}
            </div>

            {currentUser?.rol === 'Direccion' && staff.length > 0 && (
              <label className="flex flex-col gap-1">
                <span className="text-label-sm font-semibold">Asesor asignado</span>
                <select
                  value={selectedLead.asesorAsignadoId ?? ''}
                  onChange={(e) =>
                    updateLead(selectedLead.id, {
                      asesorAsignadoId: e.target.value || null,
                    })
                  }
                  className="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md"
                >
                  <option value="">Sin asignar</option>
                  {staff
                    .filter((u) => u.activo)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre}
                      </option>
                    ))}
                </select>
              </label>
            )}

            <label className="flex flex-col gap-1">
              <span className="text-label-sm font-semibold">Notas de seguimiento</span>
              <textarea
                rows={3}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Acuerdos de llamada, cita de valoración..."
                className="rounded-md border border-outline-variant bg-surface-container-lowest p-3 text-body-md focus:border-secondary focus:outline-none"
              />
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  updateLead(selectedLead.id, { notasSeguimiento: notesDraft });
                  setSelectedLeadId(null);
                }}
                className="rounded-md bg-primary-container text-on-primary-container px-4 py-2 text-label-md font-semibold"
              >
                Guardar seguimiento
              </button>
            </div>

            <div className="border-t border-outline-variant/50 pt-3">
              <h3 className="text-label-sm font-semibold text-on-surface-variant mb-2">
                Historial de atención
              </h3>
              <ul className="flex flex-col gap-1.5 text-label-sm text-on-surface-variant">
                {selectedLead.historial.map((h, i) => (
                  <li key={i}>
                    <span className="font-mono text-[11px]">
                      {new Date(h.fecha).toLocaleString('es-MX')}
                    </span>{' '}
                    · {h.accion} ({h.usuario})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
