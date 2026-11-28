import { useState, FormEvent } from 'react';
import { usePlatform } from '../../services/platformStore';
import { AdminDashboard } from './AdminDashboard';
import { AdminProperties } from './AdminProperties';
import { AdminRequests } from './AdminRequests';
import { AdminTeam } from './AdminTeam';
import { AdminSettings } from './AdminSettings';

type AdminTab = 'dashboard' | 'propiedades' | 'solicitudes' | 'equipo' | 'configuracion';

interface AdminPanelProps {
  onExitToPublic: () => void;
}

export function AdminPanel({ onExitToPublic }: AdminPanelProps) {
  const { currentUser, login, logout } = usePlatform();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    const res = login(email, password);
    if (!res.ok) {
      setLoginError(res.error ?? 'Error al iniciar sesión.');
      return;
    }
    setLoginError('');
    setActiveTab('dashboard');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen w-full bg-surface text-on-surface flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest border border-outline-variant p-6 md:p-8 shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="font-headline text-title-md tracking-wider uppercase block">
                LUIS &amp; OLIVER
              </span>
              <span className="text-label-sm text-on-surface-variant">
                Administración privada
              </span>
            </div>
            <button
              type="button"
              onClick={onExitToPublic}
              className="text-label-sm text-secondary hover:text-on-surface underline underline-offset-4"
            >
              Volver al sitio
            </button>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1">
              <span className="text-label-sm font-semibold">Correo corporativo</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@luisoliver.mx"
                className="rounded-md border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-body-md focus:border-secondary focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-label-sm font-semibold">Contraseña</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-md border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-body-md focus:border-secondary focus:outline-none"
              />
            </label>

            {loginError && (
              <p className="text-label-sm text-error font-medium" role="alert">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-md bg-primary-container text-on-primary-container py-2.5 text-label-lg font-semibold hover:bg-primary transition-colors mt-1"
            >
              Iniciar sesión
            </button>
          </form>

          {/* Preview Testing Credentials Helper */}
          <div className="rounded-lg bg-surface-container-low border border-outline-variant/60 p-3.5 flex flex-col gap-2 text-label-sm text-on-surface-variant">
            <span className="font-semibold text-on-surface">
              Cuentas de validación (V1):
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('oliver@luisoliver.mx');
                  setPassword('Direccion2026!');
                  setLoginError('');
                }}
                className="rounded border border-outline-variant bg-surface-container-lowest px-2.5 py-1 text-on-surface hover:bg-surface-container"
              >
                Dirección (Oliver)
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('sofia@luisoliver.mx');
                  setPassword('Asesor2026!');
                  setLoginError('');
                }}
                className="rounded border border-outline-variant bg-surface-container-lowest px-2.5 py-1 text-on-surface hover:bg-surface-container"
              >
                Asesora (Sofía)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isDirector = currentUser.rol === 'Direccion';

  const navItems: { id: AdminTab; label: string; icon: string; directorOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'analytics' },
    { id: 'propiedades', label: 'Propiedades', icon: 'apartment' },
    { id: 'solicitudes', label: 'Solicitudes', icon: 'inbox' },
    { id: 'equipo', label: 'Equipo', icon: 'group', directorOnly: true },
    { id: 'configuracion', label: 'Configuración', icon: 'settings', directorOnly: true },
  ];

  const visibleNavItems = navItems.filter((item) => !item.directorOnly || isDirector);
  const effectiveTab: AdminTab =
    !isDirector && (activeTab === 'equipo' || activeTab === 'configuracion')
      ? 'dashboard'
      : activeTab;

  return (
    <div className="min-h-screen w-full bg-surface text-on-surface flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Desktop Sidebar (REQ-ADM-007 / 008) */}
      <aside className="hidden md:flex md:w-64 md:shrink-0 flex-col justify-between border-r border-outline-variant/70 bg-surface-container-low p-5">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col">
            <span className="font-headline text-title-md tracking-wider uppercase text-on-surface">
              LUIS &amp; OLIVER
            </span>
            <span className="text-label-sm text-on-surface-variant">
              Panel Administrativo
            </span>
          </div>

          <nav className="flex flex-col gap-1" aria-label="Módulos de administración">
            {visibleNavItems.map((item) => {
              const active = effectiveTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-label-lg transition-colors text-left ${
                    active
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-title-md" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-outline-variant/60 flex flex-col gap-3">
          <div className="text-label-sm">
            <p className="font-semibold text-on-surface truncate">{currentUser.nombre}</p>
            <p className="text-on-surface-variant">
              Rol: {currentUser.rol === 'Direccion' ? 'Dirección' : 'Asesor'}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={onExitToPublic}
              className="w-full rounded-md border border-outline-variant bg-surface-container-lowest py-2 text-label-md text-on-surface hover:bg-surface-container"
            >
              Ver sitio público
            </button>
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-md py-1.5 text-label-sm text-error hover:bg-error-container/30"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Admin Bar */}
      <header className="md:hidden sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-outline-variant/70 px-4 h-14 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="font-headline text-title-md uppercase block truncate">
            Panel · {currentUser.rol === 'Direccion' ? 'Dirección' : 'Asesor'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onExitToPublic}
            className="rounded-md border border-outline-variant px-2.5 py-1 text-label-sm"
          >
            Sitio
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-md text-error px-2 py-1 text-label-sm"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Main Workspace Viewport */}
      <main className="flex-1 min-w-0 p-4 md:p-8 max-w-6xl">
        {effectiveTab === 'dashboard' && <AdminDashboard />}
        {effectiveTab === 'propiedades' && <AdminProperties />}
        {effectiveTab === 'solicitudes' && <AdminRequests />}
        {effectiveTab === 'equipo' && <AdminTeam />}
        {effectiveTab === 'configuracion' && <AdminSettings />}
      </main>

      {/* Mobile Bottom 5-Access Tab Bar (REQ-ADM-007 / 008) */}
      <nav
        aria-label="Navegación móvil administración"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-outline-variant grid grid-flow-col auto-cols-fr h-16"
      >
        {visibleNavItems.map((item) => {
          const active = effectiveTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] ${
                active ? 'text-primary font-semibold' : 'text-on-surface-variant'
              }`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span className="truncate max-w-full px-1">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
