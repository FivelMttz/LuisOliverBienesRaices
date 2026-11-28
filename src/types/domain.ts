export type PropertyType =
  | 'Casa'
  | 'Departamento'
  | 'Terreno'
  | 'Oficina'
  | 'Local'
  | 'Bodega';

export type OperationType = 'Venta' | 'Renta' | 'Preventa';

export type PropertyStatus =
  | 'Borrador'
  | 'Disponible'
  | 'En negociación'
  | 'Apartada'
  | 'Vendida'
  | 'Rentada'
  | 'Retirada';

export type LeadStatus = 'Nuevo' | 'En contacto' | 'Atendido' | 'Descartado';

export type UserRole = 'Direccion' | 'Asesor';

export interface PropertyPhoto {
  id: string;
  url: string;
  orden: number;
  esPortada: boolean;
}

export interface PropertyDraftRevision {
  titulo: string;
  tipo: PropertyType;
  operacion: OperationType;
  precio: number;
  zonaPublica: string;
  descripcion: string;
  recamaras: number | null;
  banos: number | null;
  m2Terreno: number | null;
  m2Construccion: number | null;
  estacionamientos: number | null;
  alturaLibre: number | null;
  fotos: PropertyPhoto[];
  updatedBy: string;
  updatedAt: string;
}

/**
 * Full internal property entity (includes private fields visible only to authorized staff).
 */
export interface Property {
  id: string;
  folio: string;
  titulo: string;
  tipo: PropertyType;
  operacion: OperationType;
  precio: number;
  zonaPublica: string;
  /** Broad neighborhood/zone coordinates for public map display (NOT exact address). */
  ubicacionPublica: {
    lat: number;
    lng: number;
    radioAproxMetros: number;
  };
  /** Private fields — NEVER exposed in PublicProperty projection. */
  direccionPrivada: string;
  propietarioNombre: string;
  propietarioTelefono: string;
  exclusividad: boolean;
  comisionPorcentaje: number;
  recamaras: number | null;
  banos: number | null;
  m2Terreno: number | null;
  m2Construccion: number | null;
  estacionamientos: number | null;
  alturaLibre: number | null;
  descripcion: string;
  fotos: PropertyPhoto[];
  estado: PropertyStatus;
  destacada: boolean;
  mostrarCerradaPublicamente: boolean;
  creadaEn: string;
  publicadaEn: string;
  creadaPorId: string;
  /** Pending edits submitted by Asesor awaiting Dirección approval (REQ-ADM-003). */
  pendingRevision?: PropertyDraftRevision | null;
}

/**
 * Sanitized public projection (REQ-MAP-002, REQ-SEC-001).
 * Strips exact address, owner PII, commissions, exclusivity, and unapproved drafts.
 */
export interface PublicProperty {
  id: string;
  folio: string;
  titulo: string;
  tipo: PropertyType;
  operacion: OperationType;
  precio: number;
  zonaPublica: string;
  ubicacionPublica: {
    lat: number;
    lng: number;
    radioAproxMetros: number;
  };
  recamaras: number | null;
  banos: number | null;
  m2Terreno: number | null;
  m2Construccion: number | null;
  estacionamientos: number | null;
  alturaLibre: number | null;
  descripcion: string;
  fotos: PropertyPhoto[];
  estado: PropertyStatus;
  destacada: boolean;
  publicadaEn: string;
}

export function toPublicProperty(p: Property): PublicProperty {
  return {
    id: p.id,
    folio: p.folio,
    titulo: p.titulo,
    tipo: p.tipo,
    operacion: p.operacion,
    precio: p.precio,
    zonaPublica: p.zonaPublica,
    ubicacionPublica: { ...p.ubicacionPublica },
    recamaras: p.recamaras,
    banos: p.banos,
    m2Terreno: p.m2Terreno,
    m2Construccion: p.m2Construccion,
    estacionamientos: p.estacionamientos,
    alturaLibre: p.alturaLibre,
    descripcion: p.descripcion,
    fotos: [...p.fotos].sort((a, b) => a.orden - b.orden),
    estado: p.estado,
    destacada: p.destacada,
    publicadaEn: p.publicadaEn,
  };
}

export interface LeadRequest {
  id: string;
  folio: string;
  nombre: string;
  telefono: string;
  zona: string;
  tipo: PropertyType;
  precioAproximado: number;
  estado: LeadStatus;
  notasSeguimiento: string;
  asesorAsignadoId: string | null;
  creadaEn: string;
  emailNotificado: boolean;
  idempotencyKey: string;
  historial: { fecha: string; accion: string; usuario: string }[];
}

export interface StaffUser {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  /** Stored only for local verification in static mode (not exposed publicly). */
  passwordHash: string;
  creadoEn: string;
}

export type AnalyticsEventType =
  | 'site_visit'
  | 'property_view'
  | 'favorite_add'
  | 'favorite_remove'
  | 'whatsapp_click'
  | 'call_click'
  | 'lead_submitted'
  | 'filter_applied';

export interface AnalyticsEvent {
  id: string;
  tipo: AnalyticsEventType;
  fecha: string;
  folio?: string;
  zona?: string;
  operacion?: OperationType;
  precioRango?: string;
  filtrosCategorias?: string[];
  origen?: string;
  dispositivo?: 'mobile' | 'desktop';
}

export interface SiteConfig {
  heroImageUrl: string;
  sellerBannerImageUrl: string;
  mobileHeroTitle: string;
  sellerTitle: string;
  sellerSubtitle: string;
  officialPhone: string;
  officialEmail: string;
  officialMapsUrl: string;
}

export interface CatalogFilters {
  operaciones: OperationType[];
  tipos: PropertyType[];
  zonas: string[];
  minRecamaras: number | null;
  minBanos: number | null;
  ventaPrecioMin: number | null;
  ventaPrecioMax: number | null;
  rentaPrecioMin: number | null;
  rentaPrecioMax: number | null;
  orden: 'recent' | 'price_desc' | 'price_asc';
  onlyFavorites: boolean;
}

export function formatMXN(amount: number, operacion?: OperationType): string {
  const formatted = '$' + amount.toLocaleString('es-MX') + ' MXN';
  return operacion === 'Renta' ? `${formatted}/mes` : formatted;
}
