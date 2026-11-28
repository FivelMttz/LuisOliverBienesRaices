import { useState, useMemo, FormEvent, ChangeEvent } from 'react';
import {
  OperationType,
  Property,
  PropertyPhoto,
  PropertyStatus,
  PropertyType,
  formatMXN,
  toPublicProperty,
} from '../../types/domain';
import { usePlatform } from '../../services/platformStore';
import { PublicPropertyCard } from '../PublicPropertyCard';

const TYPES: PropertyType[] = ['Casa', 'Departamento', 'Terreno', 'Oficina', 'Local', 'Bodega'];
const OPERATIONS: OperationType[] = ['Venta', 'Renta', 'Preventa'];
const STATUSES: PropertyStatus[] = [
  'Borrador',
  'Disponible',
  'En negociación',
  'Apartada',
  'Vendida',
  'Rentada',
  'Retirada',
];

/**
 * Strips EXIF/GPS metadata and optimizes uploaded images for web via canvas re-encoding (REQ-ADM-004).
 */
async function optimizeImageStripExif(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Formato inválido: selecciona una imagen JPG, PNG o WebP.');
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('No se pudo procesar el archivo de imagen.'));
      el.src = objectUrl;
    });

    const maxDim = 1400;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Error al procesar imagen.');
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.86);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function AdminProperties() {
  const {
    adminProperties,
    currentUser,
    saveProperty,
    approvePendingRevision,
    rejectPendingRevision,
    updatePropertyStatus,
  } = usePlatform();

  const isDirector = currentUser?.rol === 'Direccion';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | PropertyStatus>('Todos');
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | null>(null);

  // Form state
  const [formState, setFormState] = useState({
    titulo: '',
    tipo: 'Casa' as PropertyType,
    operacion: 'Venta' as OperationType,
    precio: 5000000,
    zonaPublica: 'Lomas 4ta Sección',
    lat: 22.1422,
    lng: -101.0285,
    radioAproxMetros: 550,
    direccionPrivada: '',
    propietarioNombre: '',
    propietarioTelefono: '',
    exclusividad: false,
    comisionPorcentaje: 4.0,
    recamaras: '' as string,
    banos: '' as string,
    m2Terreno: '' as string,
    m2Construccion: '' as string,
    estacionamientos: '' as string,
    alturaLibre: '' as string,
    descripcion: '',
    estado: 'Borrador' as PropertyStatus,
    destacada: false,
    mostrarCerradaPublicamente: false,
    fotos: [] as PropertyPhoto[],
  });

  const openNewForm = () => {
    setEditingProperty(null);
    setIsCreating(true);
    setPhotoError('');
    setFormState({
      titulo: '',
      tipo: 'Casa',
      operacion: 'Venta',
      precio: 4500000,
      zonaPublica: 'Lomas 4ta Sección',
      lat: 22.1422,
      lng: -101.0285,
      radioAproxMetros: 550,
      direccionPrivada: '',
      propietarioNombre: '',
      propietarioTelefono: '',
      exclusividad: false,
      comisionPorcentaje: 4.0,
      recamaras: '3',
      banos: '2.5',
      m2Terreno: '220',
      m2Construccion: '250',
      estacionamientos: '2',
      alturaLibre: '',
      descripcion: '',
      estado: 'Borrador',
      destacada: false,
      mostrarCerradaPublicamente: false,
      fotos: [],
    });
  };

  const openEditForm = (prop: Property) => {
    setIsCreating(false);
    setEditingProperty(prop);
    setPhotoError('');
    // If there is a pending revision and user is opening to review/edit, load its values if present
    const rev = prop.pendingRevision;
    setFormState({
      titulo: rev ? rev.titulo : prop.titulo,
      tipo: rev ? rev.tipo : prop.tipo,
      operacion: rev ? rev.operacion : prop.operacion,
      precio: rev ? rev.precio : prop.precio,
      zonaPublica: rev ? rev.zonaPublica : prop.zonaPublica,
      lat: prop.ubicacionPublica.lat,
      lng: prop.ubicacionPublica.lng,
      radioAproxMetros: prop.ubicacionPublica.radioAproxMetros,
      direccionPrivada: prop.direccionPrivada,
      propietarioNombre: prop.propietarioNombre,
      propietarioTelefono: prop.propietarioTelefono,
      exclusividad: prop.exclusividad,
      comisionPorcentaje: prop.comisionPorcentaje,
      recamaras: (rev ? rev.recamaras : prop.recamaras)?.toString() ?? '',
      banos: (rev ? rev.banos : prop.banos)?.toString() ?? '',
      m2Terreno: (rev ? rev.m2Terreno : prop.m2Terreno)?.toString() ?? '',
      m2Construccion: (rev ? rev.m2Construccion : prop.m2Construccion)?.toString() ?? '',
      estacionamientos: (rev ? rev.estacionamientos : prop.estacionamientos)?.toString() ?? '',
      alturaLibre: (rev ? rev.alturaLibre : prop.alturaLibre)?.toString() ?? '',
      descripcion: rev ? rev.descripcion : prop.descripcion,
      estado: prop.estado,
      destacada: prop.destacada,
      mostrarCerradaPublicamente: prop.mostrarCerradaPublicamente,
      fotos: [...(rev ? rev.fotos : prop.fotos)].sort((a, b) => a.orden - b.orden),
    });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return adminProperties.filter((p) => {
      if (statusFilter !== 'Todos' && p.estado !== statusFilter) return false;
      if (q) {
        const hay = `${p.folio} ${p.titulo} ${p.zonaPublica} ${p.tipo}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [adminProperties, search, statusFilter]);

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setPhotoError('');
    try {
      const processed: PropertyPhoto[] = [];
      for (let i = 0; i < files.length; i++) {
        const dataUrl = await optimizeImageStripExif(files[i]);
        processed.push({
          id: `ph-${Date.now()}-${i}`,
          url: dataUrl,
          orden: formState.fotos.length + i,
          esPortada: formState.fotos.length === 0 && i === 0,
        });
      }
      setFormState((prev) => ({ ...prev, fotos: [...prev.fotos, ...processed] }));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Error al cargar fotografías.');
    } finally {
      e.target.value = '';
    }
  };

  const handleAddPhotoUrl = () => {
    const url = newPhotoUrl.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setPhotoError('La URL de la foto debe iniciar con https://');
      return;
    }
    setPhotoError('');
    setFormState((prev) => ({
      ...prev,
      fotos: [
        ...prev.fotos,
        {
          id: `ph-${Date.now()}`,
          url,
          orden: prev.fotos.length,
          esPortada: prev.fotos.length === 0,
        },
      ],
    }));
    setNewPhotoUrl('');
  };

  const movePhoto = (idx: number, dir: -1 | 1) => {
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= formState.fotos.length) return;
    const copy = [...formState.fotos];
    [copy[idx], copy[nextIdx]] = [copy[nextIdx], copy[idx]];
    setFormState((prev) => ({
      ...prev,
      fotos: copy.map((f, i) => ({ ...f, orden: i })),
    }));
  };

  const setCoverPhoto = (id: string) => {
    setFormState((prev) => {
      const updated = prev.fotos.map((f) => ({ ...f, esPortada: f.id === id }));
      // Move portada to index 0 for consistent cover display
      updated.sort((a, b) => (a.esPortada === b.esPortada ? a.orden - b.orden : a.esPortada ? -1 : 1));
      return { ...prev, fotos: updated.map((f, i) => ({ ...f, orden: i })) };
    });
  };

  const removePhoto = (id: string) => {
    setFormState((prev) => {
      const next = prev.fotos.filter((f) => f.id !== id).map((f, i) => ({ ...f, orden: i }));
      if (next.length > 0 && !next.some((f) => f.esPortada)) {
        next[0].esPortada = true;
      }
      return { ...prev, fotos: next };
    });
  };

  const buildPayloadFromForm = () => ({
    id: editingProperty?.id,
    titulo: formState.titulo.trim(),
    tipo: formState.tipo,
    operacion: formState.operacion,
    precio: Number(formState.precio) || 0,
    zonaPublica: formState.zonaPublica.trim(),
    ubicacionPublica: {
      lat: Number(formState.lat) || 22.1422,
      lng: Number(formState.lng) || -101.0285,
      radioAproxMetros: Number(formState.radioAproxMetros) || 550,
    },
    direccionPrivada: formState.direccionPrivada.trim(),
    propietarioNombre: formState.propietarioNombre.trim(),
    propietarioTelefono: formState.propietarioTelefono.trim(),
    exclusividad: formState.exclusividad,
    comisionPorcentaje: Number(formState.comisionPorcentaje) || 0,
    recamaras: formState.recamaras ? Number(formState.recamaras) : null,
    banos: formState.banos ? Number(formState.banos) : null,
    m2Terreno: formState.m2Terreno ? Number(formState.m2Terreno) : null,
    m2Construccion: formState.m2Construccion ? Number(formState.m2Construccion) : null,
    estacionamientos: formState.estacionamientos ? Number(formState.estacionamientos) : null,
    alturaLibre: formState.alturaLibre ? Number(formState.alturaLibre) : null,
    descripcion: formState.descripcion.trim(),
    fotos: formState.fotos,
    estado: formState.estado,
    destacada: formState.destacada,
    mostrarCerradaPublicamente: formState.mostrarCerradaPublicamente,
    publicadaEn: editingProperty?.publicadaEn ?? '',
  });

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const res = saveProperty(buildPayloadFromForm());
    if (!res.ok) {
      setFeedback(res.error ?? 'Error al guardar.');
      return;
    }
    if (!isDirector && editingProperty && editingProperty.estado !== 'Borrador') {
      setFeedback(
        `Cambios enviados a revisión de Dirección para ${res.data?.folio}. La versión pública actual permanece intacta hasta su aprobación.`,
      );
    } else {
      setFeedback(`Inmueble ${res.data?.folio} guardado correctamente.`);
    }
    setEditingProperty(null);
    setIsCreating(false);
  };

  const previewPublicProperty = useMemo(() => {
    const p = buildPayloadFromForm();
    return toPublicProperty({
      ...p,
      id: p.id ?? 'preview-id',
      folio: editingProperty?.folio ?? 'LOBR-2026-VISTA',
      creadaEn: new Date().toISOString(),
      creadaPorId: currentUser?.id ?? 'preview',
    });
  }, [formState, editingProperty, currentUser]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-headline text-headline-md text-on-surface">
            Inventario de propiedades
          </h1>
          <p className="text-body-md text-on-surface-variant">
            {isDirector
              ? 'Alta, edición, aprobación de borradores, estados y control de comisiones.'
              : 'Crea borradores o propón cambios para revisión de Dirección (Luis u Oliver).'}
          </p>
        </div>

        <button
          type="button"
          onClick={openNewForm}
          className="inline-flex items-center gap-2 rounded-md bg-primary-container text-on-primary-container px-4 py-2.5 text-label-md font-semibold hover:bg-primary transition-colors whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-title-md" aria-hidden="true">
            add
          </span>
          <span>Nueva propiedad</span>
        </button>
      </div>

      {feedback && (
        <div className="rounded-lg border border-secondary/50 bg-secondary-container/40 px-4 py-2.5 text-label-md text-on-surface flex items-center justify-between gap-2">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback('')}
            className="text-label-sm underline shrink-0"
          >
            Ocultar
          </button>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por folio, título o zona..."
          className="flex-1 min-w-[220px] rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-2 text-body-md focus:border-secondary focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          {(['Todos', ...STATUSES] as const).map((st) => (
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

      {/* Table */}
      <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/70 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/60 bg-surface-container-low text-label-sm text-on-surface-variant">
              <th className="py-3 px-4 font-semibold">Folio</th>
              <th className="py-3 px-4 font-semibold">Inmueble</th>
              <th className="py-3 px-4 font-semibold">Precio</th>
              <th className="py-3 px-4 font-semibold">Estado</th>
              {isDirector && <th className="py-3 px-4 font-semibold">Comisión</th>}
              <th className="py-3 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40 text-body-md">
            {filtered.map((prop) => (
              <tr key={prop.id} className="hover:bg-surface-container-low/40">
                <td className="py-3 px-4 font-mono text-mono-sm text-secondary whitespace-nowrap">
                  {prop.folio}
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium text-on-surface flex items-center gap-2">
                    <span>{prop.titulo}</span>
                    {prop.destacada && (
                      <span className="text-[11px] font-semibold text-secondary">· Destacada</span>
                    )}
                    {prop.pendingRevision && (
                      <span className="text-[11px] font-semibold text-amber-700">
                        · Revisión pendiente
                      </span>
                    )}
                  </div>
                  <div className="text-label-sm text-on-surface-variant">
                    {prop.tipo} · {prop.operacion} · {prop.zonaPublica}
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-label-md tabular-nums whitespace-nowrap">
                  {formatMXN(prop.precio, prop.operacion)}
                </td>
                <td className="py-3 px-4">
                  {isDirector ? (
                    <select
                      aria-label={`Estado de ${prop.folio}`}
                      value={prop.estado}
                      onChange={(e) =>
                        updatePropertyStatus(prop.id, e.target.value as PropertyStatus)
                      }
                      className="rounded-md border border-outline-variant bg-surface-container-low px-2.5 py-1 text-label-sm"
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-label-sm font-medium">{prop.estado}</span>
                  )}
                </td>
                {isDirector && (
                  <td className="py-3 px-4 text-label-sm tabular-nums whitespace-nowrap">
                    {prop.comisionPorcentaje}% {prop.exclusividad ? '(Exclusiva)' : ''}
                  </td>
                )}
                <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                  {isDirector && prop.pendingRevision && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          approvePendingRevision(prop.id);
                          setFeedback(`Cambios aprobados y publicados para ${prop.folio}.`);
                        }}
                        className="rounded-md bg-emerald-800 text-white px-2.5 py-1 text-label-sm font-medium"
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          rejectPendingRevision(prop.id);
                          setFeedback(`Revisión descartada para ${prop.folio}.`);
                        }}
                        className="rounded-md border border-outline-variant px-2.5 py-1 text-label-sm"
                      >
                        Descartar
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditForm(prop)}
                    className="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-1 text-label-sm hover:bg-surface-container-low"
                  >
                    Editar
                  </button>
                  {isDirector && prop.estado !== 'Retirada' && (
                    <button
                      type="button"
                      onClick={() => {
                        updatePropertyStatus(prop.id, 'Retirada', false);
                        setFeedback(`${prop.folio} archivada (retirada de vista pública).`);
                      }}
                      className="rounded-md border border-error/40 text-error px-2.5 py-1 text-label-sm hover:bg-error-container/30"
                    >
                      Archivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Property Modal */}
      {(isCreating || editingProperty) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 backdrop-blur-xs p-3 md:p-6"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            setIsCreating(false);
            setEditingProperty(null);
          }}
        >
          <div
            className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-xl bg-surface border border-outline-variant p-5 md:p-6 flex flex-col gap-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-headline text-headline-md text-on-surface">
                  {isCreating
                    ? 'Nueva propiedad'
                    : `Editar ${editingProperty?.folio ?? ''}`}
                </h2>
                {!isDirector && editingProperty && editingProperty.estado !== 'Borrador' && (
                  <p className="text-label-sm text-amber-800">
                    Modo Asesor: los cambios se guardarán como propuesta pendiente de aprobación por
                    Dirección.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingProperty(null);
                }}
                className="w-9 h-9 rounded-full hover:bg-surface-container-low flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="md:col-span-2 flex flex-col gap-1">
                  <span className="text-label-sm font-semibold">Título público</span>
                  <input
                    type="text"
                    required
                    value={formState.titulo}
                    onChange={(e) => setFormState({ ...formState, titulo: e.target.value })}
                    className="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-label-sm font-semibold">Zona pública (SLP)</span>
                  <input
                    type="text"
                    required
                    value={formState.zonaPublica}
                    onChange={(e) => setFormState({ ...formState, zonaPublica: e.target.value })}
                    className="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-label-sm font-semibold">Tipo</span>
                  <select
                    value={formState.tipo}
                    onChange={(e) =>
                      setFormState({ ...formState, tipo: e.target.value as PropertyType })
                    }
                    className="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md"
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-label-sm font-semibold">Operación</span>
                  <select
                    value={formState.operacion}
                    onChange={(e) =>
                      setFormState({ ...formState, operacion: e.target.value as OperationType })
                    }
                    className="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md"
                  >
                    {OPERATIONS.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="col-span-2 flex flex-col gap-1">
                  <span className="text-label-sm font-semibold">
                    Precio MXN {formState.operacion === 'Renta' ? '(mensual)' : '(total)'}
                  </span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formState.precio}
                    onChange={(e) => setFormState({ ...formState, precio: Number(e.target.value) })}
                    className="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md tabular-nums"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-label-sm">Recámaras</span>
                  <input
                    type="number"
                    min={0}
                    value={formState.recamaras}
                    onChange={(e) => setFormState({ ...formState, recamaras: e.target.value })}
                    placeholder="—"
                    className="rounded-md border border-outline-variant bg-surface-container-lowest px-2.5 py-1.5 text-body-md tabular-nums"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-label-sm">Baños</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={formState.banos}
                    onChange={(e) => setFormState({ ...formState, banos: e.target.value })}
                    placeholder="—"
                    className="rounded-md border border-outline-variant bg-surface-container-lowest px-2.5 py-1.5 text-body-md tabular-nums"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-label-sm">m² Terreno</span>
                  <input
                    type="number"
                    min={0}
                    value={formState.m2Terreno}
                    onChange={(e) => setFormState({ ...formState, m2Terreno: e.target.value })}
                    placeholder="—"
                    className="rounded-md border border-outline-variant bg-surface-container-lowest px-2.5 py-1.5 text-body-md tabular-nums"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-label-sm">m² Const.</span>
                  <input
                    type="number"
                    min={0}
                    value={formState.m2Construccion}
                    onChange={(e) => setFormState({ ...formState, m2Construccion: e.target.value })}
                    placeholder="—"
                    className="rounded-md border border-outline-variant bg-surface-container-lowest px-2.5 py-1.5 text-body-md tabular-nums"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-label-sm">Cochera</span>
                  <input
                    type="number"
                    min={0}
                    value={formState.estacionamientos}
                    onChange={(e) =>
                      setFormState({ ...formState, estacionamientos: e.target.value })
                    }
                    placeholder="—"
                    className="rounded-md border border-outline-variant bg-surface-container-lowest px-2.5 py-1.5 text-body-md tabular-nums"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-label-sm">Altura (m)</span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={formState.alturaLibre}
                    onChange={(e) => setFormState({ ...formState, alturaLibre: e.target.value })}
                    placeholder="—"
                    className="rounded-md border border-outline-variant bg-surface-container-lowest px-2.5 py-1.5 text-body-md tabular-nums"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-label-sm font-semibold">Descripción pública (máx. 3 líneas recomendadas)</span>
                <textarea
                  rows={3}
                  required
                  value={formState.descripcion}
                  onChange={(e) => setFormState({ ...formState, descripcion: e.target.value })}
                  className="rounded-md border border-outline-variant bg-surface-container-lowest p-3 text-body-md"
                />
              </label>

              {/* Photos Manager (REQ-ADM-004) */}
              <div className="rounded-lg border border-outline-variant/70 bg-surface-container-low p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-label-md font-semibold">
                    Fotografías (reordenar, elegir portada y eliminación automática de metadatos EXIF)
                  </span>
                  <label className="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-label-sm cursor-pointer hover:bg-surface-container">
                    Subir imágenes
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="O pega una URL https://..."
                    className="flex-1 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-body-md"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhotoUrl}
                    className="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-label-sm hover:bg-surface-container"
                  >
                    Agregar URL
                  </button>
                </div>

                {photoError && (
                  <p className="text-label-sm text-error" role="alert">
                    {photoError}
                  </p>
                )}

                {formState.fotos.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {formState.fotos.map((photo, idx) => (
                      <div
                        key={photo.id}
                        className="flex items-center gap-2 rounded-md border border-outline-variant bg-surface-container-lowest p-2"
                      >
                        <img
                          src={photo.url}
                          alt={`Foto ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-16 h-12 object-cover rounded shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-label-sm font-medium block truncate">
                            {photo.esPortada ? 'Portada principal' : `Foto ${idx + 1}`}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            {!photo.esPortada && (
                              <button
                                type="button"
                                onClick={() => setCoverPhoto(photo.id)}
                                className="text-[11px] text-secondary underline"
                              >
                                Hacer portada
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => movePhoto(idx, -1)}
                            disabled={idx === 0}
                            aria-label="Mover arriba"
                            className="p-1 rounded hover:bg-surface-container-low disabled:opacity-30"
                          >
                            <span className="material-symbols-outlined text-body-lg" aria-hidden="true">
                              arrow_upward
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => movePhoto(idx, 1)}
                            disabled={idx === formState.fotos.length - 1}
                            aria-label="Mover abajo"
                            className="p-1 rounded hover:bg-surface-container-low disabled:opacity-30"
                          >
                            <span className="material-symbols-outlined text-body-lg" aria-hidden="true">
                              arrow_downward
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removePhoto(photo.id)}
                            aria-label="Eliminar foto"
                            className="p-1 rounded text-error hover:bg-error-container/30"
                          >
                            <span className="material-symbols-outlined text-body-lg" aria-hidden="true">
                              delete
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Private Data (never exposed publicly) */}
              <div className="rounded-lg border border-outline-variant/70 bg-surface-container-low/60 p-4 flex flex-col gap-3">
                <span className="text-label-md font-semibold text-on-surface">
                  Datos privados internos (no visibles en web pública)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-label-sm">Dirección exacta</span>
                    <input
                      type="text"
                      value={formState.direccionPrivada}
                      onChange={(e) =>
                        setFormState({ ...formState, direccionPrivada: e.target.value })
                      }
                      className="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-body-md"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-label-sm">Propietario</span>
                    <input
                      type="text"
                      value={formState.propietarioNombre}
                      onChange={(e) =>
                        setFormState({ ...formState, propietarioNombre: e.target.value })
                      }
                      className="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-body-md"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-label-sm">Teléfono propietario</span>
                    <input
                      type="tel"
                      value={formState.propietarioTelefono}
                      onChange={(e) =>
                        setFormState({ ...formState, propietarioTelefono: e.target.value })
                      }
                      className="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-body-md"
                    />
                  </label>
                </div>

                {/* Commissions & Exclusivity strictly Dirección-only (REQ-SEC-001) */}
                {isDirector && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-outline-variant/50">
                    <label className="flex flex-col gap-1">
                      <span className="text-label-sm font-semibold">Comisión (%)</span>
                      <input
                        type="number"
                        step={0.1}
                        min={0}
                        value={formState.comisionPorcentaje}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            comisionPorcentaje: Number(e.target.value),
                          })
                        }
                        className="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-body-md tabular-nums"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-body-md pt-5">
                      <input
                        type="checkbox"
                        checked={formState.exclusividad}
                        onChange={(e) =>
                          setFormState({ ...formState, exclusividad: e.target.checked })
                        }
                      />
                      <span>Con exclusividad</span>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-label-sm font-semibold">Estado</span>
                      <select
                        value={formState.estado}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            estado: e.target.value as PropertyStatus,
                          })
                        }
                        className="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-body-md"
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                {isDirector && (
                  <div className="flex flex-wrap gap-4 pt-1">
                    <label className="inline-flex items-center gap-2 text-label-md">
                      <input
                        type="checkbox"
                        checked={formState.destacada}
                        onChange={(e) =>
                          setFormState({ ...formState, destacada: e.target.checked })
                        }
                      />
                      <span>Priorizar en Destacadas</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-label-md">
                      <input
                        type="checkbox"
                        checked={formState.mostrarCerradaPublicamente}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            mostrarCerradaPublicamente: e.target.checked,
                          })
                        }
                      />
                      <span>Permitir visibilidad si está Vendida/Rentada</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Mandatory Preview & Save Actions (REQ-ADM-004) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('desktop')}
                    className="inline-flex items-center gap-1.5 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-label-md hover:bg-surface-container-low"
                  >
                    <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                      desktop_windows
                    </span>
                    <span>Vista previa Escritorio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('mobile')}
                    className="inline-flex items-center gap-1.5 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-label-md hover:bg-surface-container-low"
                  >
                    <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                      smartphone
                    </span>
                    <span>Vista previa Móvil</span>
                  </button>
                </div>

                <button
                  type="submit"
                  className="rounded-md bg-primary-container text-on-primary-container px-6 py-2.5 text-label-lg font-semibold hover:bg-primary"
                >
                  {isDirector ? 'Guardar propiedad' : 'Guardar borrador / enviar a revisión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Desktop / Mobile Preview Modal (REQ-ADM-004) */}
      {previewMode && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-primary/70 backdrop-blur-xs p-4"
          onClick={() => setPreviewMode(null)}
        >
          <div
            className="w-full max-w-xl rounded-xl bg-surface border border-outline-variant p-5 flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-title-lg">
                Vista previa ({previewMode === 'desktop' ? 'Escritorio' : 'Móvil'})
              </h3>
              <button
                type="button"
                onClick={() => setPreviewMode(null)}
                className="w-9 h-9 rounded-full hover:bg-surface-container-low flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                  close
                </span>
              </button>
            </div>
            <div
              className={
                previewMode === 'mobile'
                  ? 'max-w-[380px] mx-auto w-full'
                  : 'max-w-[360px] mx-auto w-full'
              }
            >
              <PublicPropertyCard
                property={previewPublicProperty}
                isFavorite={false}
                isExpanded={true}
                onToggleExpand={() => {}}
                onToggleFavorite={() => {}}
                onTrackWhatsApp={() => {}}
                onTrackCall={() => {}}
                onOpenCallFallback={() => {}}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
