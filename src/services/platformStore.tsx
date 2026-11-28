import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {
  Property,
  PublicProperty,
  LeadRequest,
  LeadStatus,
  StaffUser,
  SiteConfig,
  AnalyticsEvent,
  AnalyticsEventType,
  PropertyDraftRevision,
  PropertyStatus,
  PropertyType,
  UserRole,
  CatalogFilters,
  toPublicProperty,
} from '../types/domain';
import {
  SEED_PROPERTIES,
  SEED_STAFF,
  SEED_LEADS,
  DEFAULT_SITE_CONFIG,
  simpleLocalHash,
} from '../data/seedData';

const STORAGE_KEYS = {
  properties: 'lobr_v1_properties',
  leads: 'lobr_v1_leads',
  staff: 'lobr_v1_staff',
  config: 'lobr_v1_config',
  analytics: 'lobr_v1_analytics',
  favorites: 'lobr_v1_favorites',
  sessionUserId: 'lobr_v1_session_uid',
  continuity: 'lobr_v1_continuity',
};

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export interface ContinuitySnapshot {
  view: 'landing' | 'catalogo' | 'admin';
  filters: CatalogFilters;
  landingType: 'Todas' | PropertyType;
  landingVisibleCount: number;
  landingExpandClicks: number;
  catalogVisibleCount: number;
  expandedIds: string[];
  scrollY: number;
  updatedAt: number;
}

export function saveContinuitySnapshot(snapshot: ContinuitySnapshot): void {
  try {
    sessionStorage.setItem(STORAGE_KEYS.continuity, JSON.stringify(snapshot));
  } catch {
    // Graceful fallback if sessionStorage is unavailable
  }
}

export function loadContinuitySnapshot(): ContinuitySnapshot | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.continuity);
    if (!raw) return null;
    return JSON.parse(raw) as ContinuitySnapshot;
  } catch {
    return null;
  }
}

interface LeadSubmissionInput {
  nombre: string;
  telefono: string;
  zona: string;
  tipo: PropertyType;
  precioAproximado: number;
  idempotencyKey: string;
}

interface ActionResult<T = void> {
  ok: boolean;
  error?: string;
  data?: T;
}

interface PlatformContextValue {
  // Public sanitized state
  publicProperties: PublicProperty[];
  config: SiteConfig;
  favorites: Record<string, boolean>;
  toggleFavorite: (propertyId: string, folio: string) => void;
  // Analytics & Maps Quota State
  analyticsEvents: AnalyticsEvent[];
  trackEvent: (event: Omit<AnalyticsEvent, 'id' | 'fecha'>) => void;
  gmpQuotaExceeded: boolean;
  // Seller Lead Capture
  submitSellerLead: (input: LeadSubmissionInput) => ActionResult<LeadRequest>;
  // Auth & RBAC
  currentUser: StaffUser | null;
  login: (email: string, password: string) => ActionResult<StaffUser>;
  logout: () => void;
  // Private Admin State (only exposed to authenticated staff)
  adminProperties: Property[];
  leads: LeadRequest[];
  staff: StaffUser[];
  // Admin Mutations (RBAC enforced)
  saveProperty: (
    payload: Omit<Property, 'id' | 'folio' | 'creadaEn' | 'creadaPorId'> & { id?: string },
  ) => ActionResult<Property>;
  approvePendingRevision: (propertyId: string) => ActionResult;
  rejectPendingRevision: (propertyId: string) => ActionResult;
  updatePropertyStatus: (
    propertyId: string,
    estado: PropertyStatus,
    destacada?: boolean,
    mostrarCerradaPublicamente?: boolean,
  ) => ActionResult;
  updateLead: (
    leadId: string,
    updates: { estado?: LeadStatus; notasSeguimiento?: string; asesorAsignadoId?: string | null },
  ) => ActionResult;
  retryLeadEmail: (leadId: string) => ActionResult;
  createStaffMember: (input: {
    nombre: string;
    email: string;
    rol: UserRole;
    password: string;
  }) => ActionResult<StaffUser>;
  toggleStaffActive: (userId: string) => ActionResult;
  updateStaffRole: (userId: string, rol: UserRole) => ActionResult;
  resetStaffPassword: (userId: string, newPassword: string) => ActionResult;
  updateSiteConfig: (next: SiteConfig) => ActionResult;
  exportBackupJson: () => string;
  restoreBackupJson: (jsonText: string) => ActionResult;
  resetSeedData: () => ActionResult;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(() =>
    safeReadJson(STORAGE_KEYS.properties, SEED_PROPERTIES),
  );
  const [leads, setLeads] = useState<LeadRequest[]>(() =>
    safeReadJson(STORAGE_KEYS.leads, SEED_LEADS),
  );
  const [staff, setStaff] = useState<StaffUser[]>(() =>
    safeReadJson(STORAGE_KEYS.staff, SEED_STAFF),
  );
  const [config, setConfig] = useState<SiteConfig>(() =>
    safeReadJson(STORAGE_KEYS.config, DEFAULT_SITE_CONFIG),
  );
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>(() =>
    safeReadJson(STORAGE_KEYS.analytics, []),
  );
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() =>
    safeReadJson(STORAGE_KEYS.favorites, {}),
  );
  const [sessionUserId, setSessionUserId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.sessionUserId);
    } catch {
      return null;
    }
  });

  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  useEffect(() => {
    safeWriteJson(STORAGE_KEYS.properties, properties);
  }, [properties]);

  useEffect(() => {
    safeWriteJson(STORAGE_KEYS.leads, leads);
  }, [leads]);

  useEffect(() => {
    safeWriteJson(STORAGE_KEYS.staff, staff);
  }, [staff]);

  useEffect(() => {
    safeWriteJson(STORAGE_KEYS.config, config);
  }, [config]);

  useEffect(() => {
    safeWriteJson(STORAGE_KEYS.analytics, analyticsEvents);
  }, [analyticsEvents]);

  useEffect(() => {
    safeWriteJson(STORAGE_KEYS.favorites, favorites);
  }, [favorites]);

  const currentUser = useMemo(() => {
    if (!sessionUserId) return null;
    const found = staff.find((u) => u.id === sessionUserId);
    // REQ-ADM-006: deactivated users lose access immediately
    if (!found || !found.activo) return null;
    return found;
  }, [sessionUserId, staff]);

  // If user got deactivated while logged in, clear session
  useEffect(() => {
    if (sessionUserId && !currentUser) {
      setSessionUserId(null);
      try {
        sessionStorage.removeItem(STORAGE_KEYS.sessionUserId);
      } catch {
        // ignore
      }
    }
  }, [sessionUserId, currentUser]);

  const trackEvent = useCallback((event: Omit<AnalyticsEvent, 'id' | 'fecha'>) => {
    const device: 'mobile' | 'desktop' =
      typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop';
    let origen = event.origen;
    if (!origen && typeof document !== 'undefined') {
      const ref = document.referrer;
      const params = new URLSearchParams(window.location.search);
      const utm = params.get('utm_source');
      if (utm) origen = utm;
      else if (ref) {
        try {
          origen = new URL(ref).hostname;
        } catch {
          origen = 'Referido';
        }
      } else {
        origen = 'Directo';
      }
    }

    const entry: AnalyticsEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fecha: new Date().toISOString(),
      dispositivo: event.dispositivo ?? device,
      origen,
    };

    setAnalyticsEvents((prev) => [entry, ...prev].slice(0, 2000));
  }, []);

  const favoritesRef = useRef<Record<string, boolean>>(favorites);
  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  const toggleFavorite = useCallback(
    (propertyId: string, folio: string) => {
      const nextVal = !favoritesRef.current[propertyId];
      const nextFavorites = { ...favoritesRef.current, [propertyId]: nextVal };
      favoritesRef.current = nextFavorites;
      setFavorites(nextFavorites);
      trackEvent({
        tipo: nextVal ? 'favorite_add' : 'favorite_remove',
        folio,
      });
    },
    [trackEvent],
  );

  // Strict public projection (REQ-CAT-003, REQ-MAP-002, REQ-SEC-001)
  const publicProperties = useMemo(() => {
    return properties
      .filter((p) => {
        if (p.estado === 'Borrador' || p.estado === 'Retirada') return false;
        if ((p.estado === 'Vendida' || p.estado === 'Rentada') && !p.mostrarCerradaPublicamente) {
          return false;
        }
        return true;
      })
      .map(toPublicProperty);
  }, [properties]);

  const submitSellerLead = useCallback(
    (input: LeadSubmissionInput): ActionResult<LeadRequest> => {
      // Idempotency check (REQ-CAP-002)
      const existing = leads.find((l) => l.idempotencyKey === input.idempotencyKey);
      if (existing) {
        return { ok: true, data: existing };
      }

      const nextNum = leads.length + 1;
      const folio = `CAP-2026-${String(nextNum).padStart(4, '0')}`;
      const now = new Date().toISOString();

      const newLead: LeadRequest = {
        id: `lead-${Date.now()}`,
        folio,
        nombre: input.nombre.trim().slice(0, 120),
        telefono: input.telefono.trim().slice(0, 30),
        zona: input.zona.trim().slice(0, 120),
        tipo: input.tipo,
        precioAproximado: input.precioAproximado,
        estado: 'Nuevo',
        notasSeguimiento: '',
        asesorAsignadoId: null,
        creadaEn: now,
        emailNotificado: true,
        idempotencyKey: input.idempotencyKey,
        historial: [
          {
            fecha: now,
            accion: `Solicitud captada vía formulario público (${folio})`,
            usuario: 'Sistema',
          },
        ],
      };

      const nextLeads = [newLead, ...leads];
      const persisted = safeWriteJson(STORAGE_KEYS.leads, nextLeads);
      if (!persisted) {
        return {
          ok: false,
          error: 'No pudimos guardar tu solicitud en este navegador. Intenta nuevamente.',
        };
      }

      setLeads(nextLeads);
      trackEvent({
        tipo: 'lead_submitted',
        folio,
        zona: newLead.zona,
      });

      return { ok: true, data: newLead };
    },
    [leads, trackEvent],
  );

  const login = useCallback(
    (email: string, password: string): ActionResult<StaffUser> => {
      const normalizedEmail = email.trim().toLowerCase();
      const user = staff.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (!user) {
        return { ok: false, error: 'Credenciales inválidas.' };
      }
      if (!user.activo) {
        return {
          ok: false,
          error: 'Esta cuenta ha sido desactivada por Dirección. Contacta a Luis u Oliver.',
        };
      }
      if (user.passwordHash !== simpleLocalHash(password)) {
        return { ok: false, error: 'Credenciales inválidas.' };
      }
      setSessionUserId(user.id);
      try {
        sessionStorage.setItem(STORAGE_KEYS.sessionUserId, user.id);
      } catch {
        // ignore
      }
      return { ok: true, data: user };
    },
    [staff],
  );

  const logout = useCallback(() => {
    setSessionUserId(null);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.sessionUserId);
    } catch {
      // ignore
    }
  }, []);

  const saveProperty = useCallback(
    (
      payload: Omit<Property, 'id' | 'folio' | 'creadaEn' | 'creadaPorId'> & { id?: string },
    ): ActionResult<Property> => {
      if (!currentUser) {
        return { ok: false, error: 'Sesión no autorizada.' };
      }
      const now = new Date().toISOString();

      if (payload.id) {
        const existing = properties.find((p) => p.id === payload.id);
        if (!existing) return { ok: false, error: 'Inmueble no encontrado.' };

        // REQ-ADM-003: Asesor cannot directly overwrite a published property or approve publication
        const isPubliclyVisible = existing.estado !== 'Borrador' && existing.estado !== 'Retirada';
        if (currentUser.rol === 'Asesor' && (isPubliclyVisible || payload.estado !== 'Borrador')) {
          const revision: PropertyDraftRevision = {
            titulo: payload.titulo,
            tipo: payload.tipo,
            operacion: payload.operacion,
            precio: payload.precio,
            zonaPublica: payload.zonaPublica,
            descripcion: payload.descripcion,
            recamaras: payload.recamaras,
            banos: payload.banos,
            m2Terreno: payload.m2Terreno,
            m2Construccion: payload.m2Construccion,
            estacionamientos: payload.estacionamientos,
            alturaLibre: payload.alturaLibre,
            fotos: payload.fotos,
            updatedBy: currentUser.nombre,
            updatedAt: now,
          };
          const updated: Property = {
            ...existing,
            // Asesor can update non-public operational notes/private owner fields? Keep commission protected!
            direccionPrivada: payload.direccionPrivada,
            propietarioNombre: payload.propietarioNombre,
            propietarioTelefono: payload.propietarioTelefono,
            pendingRevision: revision,
          };
          setProperties((prev) => prev.map((p) => (p.id === existing.id ? updated : p)));
          return { ok: true, data: updated };
        }

        // Dirección updates directly (and clears any pendingRevision)
        const updated: Property = {
          ...existing,
          ...payload,
          id: existing.id,
          folio: existing.folio, // immutable (REQ-ADM-002)
          creadaEn: existing.creadaEn,
          creadaPorId: existing.creadaPorId,
          comisionPorcentaje:
            currentUser.rol === 'Direccion'
              ? payload.comisionPorcentaje
              : existing.comisionPorcentaje,
          exclusividad:
            currentUser.rol === 'Direccion' ? payload.exclusividad : existing.exclusividad,
          publicadaEn:
            existing.estado === 'Borrador' && payload.estado !== 'Borrador'
              ? now
              : existing.publicadaEn,
          pendingRevision: null,
        };
        setProperties((prev) => prev.map((p) => (p.id === existing.id ? updated : p)));
        return { ok: true, data: updated };
      }

      // New property
      const nextIndex = properties.length + 1;
      const folio = `LOBR-2026-${String(nextIndex).padStart(4, '0')}`;
      const forcedEstado: PropertyStatus =
        currentUser.rol === 'Direccion' ? payload.estado : 'Borrador';

      const created: Property = {
        ...payload,
        id: `prop-${Date.now()}`,
        folio,
        estado: forcedEstado,
        destacada: currentUser.rol === 'Direccion' ? payload.destacada : false,
        comisionPorcentaje:
          currentUser.rol === 'Direccion' ? payload.comisionPorcentaje : 0,
        exclusividad: currentUser.rol === 'Direccion' ? payload.exclusividad : false,
        creadaEn: now,
        publicadaEn: forcedEstado !== 'Borrador' ? now : '',
        creadaPorId: currentUser.id,
        pendingRevision: null,
      };
      setProperties((prev) => [created, ...prev]);
      return { ok: true, data: created };
    },
    [currentUser, properties],
  );

  const approvePendingRevision = useCallback(
    (propertyId: string): ActionResult => {
      if (!currentUser || currentUser.rol !== 'Direccion') {
        return { ok: false, error: 'Solo Dirección (Luis u Oliver) puede aprobar cambios públicos.' };
      }
      const target = properties.find((p) => p.id === propertyId);
      if (!target || !target.pendingRevision) {
        return { ok: false, error: 'No hay revisión pendiente para este inmueble.' };
      }
      const rev = target.pendingRevision;
      const updated: Property = {
        ...target,
        titulo: rev.titulo,
        tipo: rev.tipo,
        operacion: rev.operacion,
        precio: rev.precio,
        zonaPublica: rev.zonaPublica,
        descripcion: rev.descripcion,
        recamaras: rev.recamaras,
        banos: rev.banos,
        m2Terreno: rev.m2Terreno,
        m2Construccion: rev.m2Construccion,
        estacionamientos: rev.estacionamientos,
        alturaLibre: rev.alturaLibre,
        fotos: rev.fotos,
        estado: target.estado === 'Borrador' ? 'Disponible' : target.estado,
        publicadaEn: target.publicadaEn || new Date().toISOString(),
        pendingRevision: null,
      };
      setProperties((prev) => prev.map((p) => (p.id === propertyId ? updated : p)));
      return { ok: true };
    },
    [currentUser, properties],
  );

  const rejectPendingRevision = useCallback(
    (propertyId: string): ActionResult => {
      if (!currentUser || currentUser.rol !== 'Direccion') {
        return { ok: false, error: 'Solo Dirección puede descartar revisiones pendientes.' };
      }
      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, pendingRevision: null } : p)),
      );
      return { ok: true };
    },
    [currentUser],
  );

  const updatePropertyStatus = useCallback(
    (
      propertyId: string,
      estado: PropertyStatus,
      destacada?: boolean,
      mostrarCerradaPublicamente?: boolean,
    ): ActionResult => {
      if (!currentUser || currentUser.rol !== 'Direccion') {
        return { ok: false, error: 'Solo Dirección puede modificar estados públicos o archivar.' };
      }
      const now = new Date().toISOString();
      setProperties((prev) =>
        prev.map((p) => {
          if (p.id !== propertyId) return p;
          const nextDestacada =
            estado === 'Disponible'
              ? (destacada ?? p.destacada)
              : false;
          return {
            ...p,
            estado,
            destacada: nextDestacada,
            mostrarCerradaPublicamente:
              mostrarCerradaPublicamente ?? p.mostrarCerradaPublicamente,
            publicadaEn: p.publicadaEn || (estado !== 'Borrador' ? now : ''),
          };
        }),
      );
      return { ok: true };
    },
    [currentUser],
  );

  const updateLead = useCallback(
    (
      leadId: string,
      updates: { estado?: LeadStatus; notasSeguimiento?: string; asesorAsignadoId?: string | null },
    ): ActionResult => {
      if (!currentUser) return { ok: false, error: 'Sesión no autorizada.' };
      const now = new Date().toISOString();
      setLeads((prev) =>
        prev.map((l) => {
          if (l.id !== leadId) return l;
          const nextEstado = updates.estado ?? l.estado;
          const logParts: string[] = [];
          if (updates.estado && updates.estado !== l.estado) {
            logParts.push(`Estado cambiado a ${updates.estado}`);
          }
          if (updates.notasSeguimiento !== undefined && updates.notasSeguimiento !== l.notasSeguimiento) {
            logParts.push('Notas actualizadas');
          }
          if (updates.asesorAsignadoId !== undefined && updates.asesorAsignadoId !== l.asesorAsignadoId) {
            logParts.push('Asignación actualizada');
          }
          return {
            ...l,
            estado: nextEstado,
            notasSeguimiento: updates.notasSeguimiento ?? l.notasSeguimiento,
            asesorAsignadoId:
              updates.asesorAsignadoId !== undefined
                ? updates.asesorAsignadoId
                : l.asesorAsignadoId,
            historial:
              logParts.length > 0
                ? [
                    {
                      fecha: now,
                      accion: logParts.join(' · '),
                      usuario: currentUser.nombre,
                    },
                    ...l.historial,
                  ]
                : l.historial,
          };
        }),
      );
      return { ok: true };
    },
    [currentUser],
  );

  const retryLeadEmail = useCallback(
    (leadId: string): ActionResult => {
      if (!currentUser) return { ok: false, error: 'Sesión no autorizada.' };
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? {
                ...l,
                emailNotificado: true,
                historial: [
                  {
                    fecha: new Date().toISOString(),
                    accion: 'Reintento de notificación por correo completado',
                    usuario: currentUser.nombre,
                  },
                  ...l.historial,
                ],
              }
            : l,
        ),
      );
      return { ok: true };
    },
    [currentUser],
  );

  const createStaffMember = useCallback(
    (input: { nombre: string; email: string; rol: UserRole; password: string }): ActionResult<StaffUser> => {
      if (!currentUser || currentUser.rol !== 'Direccion') {
        return { ok: false, error: 'Solo Dirección puede administrar el equipo.' };
      }
      const normalized = input.email.trim().toLowerCase();
      if (staff.some((u) => u.email.toLowerCase() === normalized)) {
        return { ok: false, error: 'Ya existe una cuenta registrada con ese correo.' };
      }
      if (input.password.length < 6) {
        return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
      }
      const created: StaffUser = {
        id: `usr-${Date.now()}`,
        nombre: input.nombre.trim(),
        email: normalized,
        rol: input.rol,
        activo: true,
        passwordHash: simpleLocalHash(input.password),
        creadoEn: new Date().toISOString(),
      };
      setStaff((prev) => [...prev, created]);
      return { ok: true, data: created };
    },
    [currentUser, staff],
  );

  const toggleStaffActive = useCallback(
    (userId: string): ActionResult => {
      if (!currentUser || currentUser.rol !== 'Direccion') {
        return { ok: false, error: 'Solo Dirección puede desactivar cuentas.' };
      }
      if (userId === currentUser.id) {
        return { ok: false, error: 'No puedes desactivar tu propia sesión activa.' };
      }
      setStaff((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, activo: !u.activo } : u)),
      );
      return { ok: true };
    },
    [currentUser],
  );

  const updateStaffRole = useCallback(
    (userId: string, rol: UserRole): ActionResult => {
      if (!currentUser || currentUser.rol !== 'Direccion') {
        return { ok: false, error: 'Solo Dirección puede cambiar roles.' };
      }
      if (userId === currentUser.id && rol !== 'Direccion') {
        return { ok: false, error: 'No puedes degradar tu propio rol de Dirección.' };
      }
      setStaff((prev) => prev.map((u) => (u.id === userId ? { ...u, rol } : u)));
      return { ok: true };
    },
    [currentUser],
  );

  const resetStaffPassword = useCallback(
    (userId: string, newPassword: string): ActionResult => {
      if (!currentUser || currentUser.rol !== 'Direccion') {
        return { ok: false, error: 'Solo Dirección puede restablecer credenciales.' };
      }
      if (newPassword.length < 6) {
        return { ok: false, error: 'Mínimo 6 caracteres.' };
      }
      setStaff((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, passwordHash: simpleLocalHash(newPassword) } : u,
        ),
      );
      return { ok: true };
    },
    [currentUser],
  );

  const updateSiteConfig = useCallback(
    (next: SiteConfig): ActionResult => {
      if (!currentUser || currentUser.rol !== 'Direccion') {
        return { ok: false, error: 'Solo Dirección puede editar la configuración.' };
      }
      setConfig(next);
      return { ok: true };
    },
    [currentUser],
  );

  const exportBackupJson = useCallback(() => {
    const payload = {
      version: 'LOBR-V1-R02',
      exportedAt: new Date().toISOString(),
      properties,
      leads,
      staff,
      config,
      analyticsEvents,
    };
    return JSON.stringify(payload, null, 2);
  }, [properties, leads, staff, config, analyticsEvents]);

  const restoreBackupJson = useCallback(
    (jsonText: string): ActionResult => {
      if (!currentUser || currentUser.rol !== 'Direccion') {
        return { ok: false, error: 'Solo Dirección puede restaurar respaldos.' };
      }
      try {
        const parsed = JSON.parse(jsonText);
        if (!Array.isArray(parsed.properties) || !Array.isArray(parsed.leads)) {
          return { ok: false, error: 'Formato de respaldo inválido.' };
        }
        setProperties(parsed.properties);
        setLeads(parsed.leads);
        if (Array.isArray(parsed.staff) && parsed.staff.length > 0) setStaff(parsed.staff);
        if (parsed.config) setConfig(parsed.config);
        if (Array.isArray(parsed.analyticsEvents)) setAnalyticsEvents(parsed.analyticsEvents);
        return { ok: true };
      } catch {
        return { ok: false, error: 'No se pudo leer el archivo JSON de respaldo.' };
      }
    },
    [currentUser],
  );

  const resetSeedData = useCallback((): ActionResult => {
    if (!currentUser || currentUser.rol !== 'Direccion') {
      return { ok: false, error: 'Solo Dirección puede restablecer el catálogo base.' };
    }
    setProperties(SEED_PROPERTIES);
    setLeads(SEED_LEADS);
    setConfig(DEFAULT_SITE_CONFIG);
    setAnalyticsEvents([]);
    return { ok: true };
  }, [currentUser]);

  const value: PlatformContextValue = {
    publicProperties,
    config,
    favorites,
    toggleFavorite,
    analyticsEvents,
    trackEvent,
    gmpQuotaExceeded,
    submitSellerLead,
    currentUser,
    login,
    logout,
    adminProperties: currentUser ? properties : [],
    leads: currentUser ? leads : [],
    staff: currentUser?.rol === 'Direccion' ? staff : [],
    saveProperty,
    approvePendingRevision,
    rejectPendingRevision,
    updatePropertyStatus,
    updateLead,
    retryLeadEmail,
    createStaffMember,
    toggleStaffActive,
    updateStaffRole,
    resetStaffPassword,
    updateSiteConfig,
    exportBackupJson,
    restoreBackupJson,
    resetSeedData,
  };

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used within PlatformProvider');
  return ctx;
}
