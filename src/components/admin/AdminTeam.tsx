import { useState, FormEvent } from 'react';
import { UserRole } from '../../types/domain';
import { usePlatform } from '../../services/platformStore';

export function AdminTeam() {
  const {
    staff,
    currentUser,
    createStaffMember,
    toggleStaffActive,
    updateStaffRole,
    resetStaffPassword,
  } = usePlatform();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<UserRole>('Asesor');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState('');
  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [resetPassValue, setResetPassValue] = useState('');

  if (currentUser?.rol !== 'Direccion') {
    return (
      <div className="rounded-xl bg-surface-container-lowest border border-outline-variant p-6 text-center">
        <p className="font-headline text-title-md text-error">Acceso restringido</p>
        <p className="text-body-md text-on-surface-variant mt-1">
          Solo Dirección (Luis u Oliver) puede administrar las cuentas del equipo.
        </p>
      </div>
    );
  }

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    const res = createStaffMember({ nombre, email, rol, password });
    if (!res.ok) {
      setFeedback(res.error ?? 'Error al crear cuenta.');
      return;
    }
    setNombre('');
    setEmail('');
    setPassword('');
    setFeedback(`Cuenta creada para ${res.data?.nombre}.`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-headline-md text-on-surface">
          Equipo y control de acceso
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Cuentas individuales de Dirección y Asesores. Desactivar una cuenta revoca su acceso de
          inmediato.
        </p>
      </div>

      {/* Create Staff Form */}
      <form
        onSubmit={handleCreate}
        className="rounded-xl bg-surface-container-lowest border border-outline-variant/70 p-4 md:p-5 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
      >
        <label className="flex flex-col gap-1">
          <span className="text-label-sm font-semibold">Nombre completo</span>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Ana Gómez"
            className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-label-sm font-semibold">Correo</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ana@luisoliver.mx"
            className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-label-sm font-semibold">Rol</span>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value as UserRole)}
            className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md"
          >
            <option value="Asesor">Asesor</option>
            <option value="Direccion">Dirección</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-label-sm font-semibold">Contraseña inicial</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mín. 6 caracteres"
            className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md"
          />
        </label>

        <div className="md:col-span-4 flex flex-wrap items-center justify-between gap-3 pt-1">
          {feedback ? (
            <span className="text-label-sm text-secondary font-medium">{feedback}</span>
          ) : (
            <span />
          )}
          <button
            type="submit"
            className="rounded-md bg-primary-container text-on-primary-container px-5 py-2 text-label-md font-semibold hover:bg-primary transition-colors"
          >
            Crear cuenta
          </button>
        </div>
      </form>

      {/* Staff List */}
      <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/70 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/60 bg-surface-container-low text-label-sm text-on-surface-variant">
              <th className="py-3 px-4 font-semibold">Nombre</th>
              <th className="py-3 px-4 font-semibold">Correo</th>
              <th className="py-3 px-4 font-semibold">Rol</th>
              <th className="py-3 px-4 font-semibold">Estado</th>
              <th className="py-3 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40 text-body-md">
            {staff.map((user) => (
              <tr key={user.id}>
                <td className="py-3 px-4 font-medium text-on-surface">{user.nombre}</td>
                <td className="py-3 px-4 font-mono text-label-sm text-on-surface-variant">
                  {user.email}
                </td>
                <td className="py-3 px-4">
                  <select
                    aria-label={`Rol de ${user.nombre}`}
                    value={user.rol}
                    disabled={user.id === currentUser.id}
                    onChange={(e) => {
                      const res = updateStaffRole(user.id, e.target.value as UserRole);
                      if (!res.ok && res.error) setFeedback(res.error);
                    }}
                    className="rounded-md border border-outline-variant bg-surface-container-low px-2.5 py-1 text-label-sm disabled:opacity-60"
                  >
                    <option value="Direccion">Dirección</option>
                    <option value="Asesor">Asesor</option>
                  </select>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`text-label-sm font-medium ${
                      user.activo ? 'text-emerald-800' : 'text-error'
                    }`}
                  >
                    {user.activo ? 'Activa' : 'Desactivada'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => {
                      setResetTargetId(user.id);
                      setResetPassValue('');
                    }}
                    className="rounded-md border border-outline-variant px-2.5 py-1 text-label-sm hover:bg-surface-container-low"
                  >
                    Clave
                  </button>
                  {user.id !== currentUser.id && (
                    <button
                      type="button"
                      onClick={() => toggleStaffActive(user.id)}
                      className="rounded-md border border-outline-variant px-2.5 py-1 text-label-sm hover:bg-surface-container-low"
                    >
                      {user.activo ? 'Desactivar' : 'Reactivar'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resetTargetId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 p-4"
          onClick={() => setResetTargetId(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-surface border border-outline-variant p-5 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-headline text-title-md">Restablecer contraseña</h2>
            <input
              type="password"
              minLength={6}
              value={resetPassValue}
              onChange={(e) => setResetPassValue(e.target.value)}
              placeholder="Nueva contraseña (mín. 6)"
              className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetTargetId(null)}
                className="rounded-md border border-outline-variant px-3 py-1.5 text-label-md"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = resetStaffPassword(resetTargetId, resetPassValue);
                  if (res.ok) {
                    setFeedback('Contraseña actualizada.');
                    setResetTargetId(null);
                  } else if (res.error) {
                    setFeedback(res.error);
                  }
                }}
                className="rounded-md bg-primary-container text-on-primary-container px-4 py-1.5 text-label-md"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
