import { useState, FormEvent, ChangeEvent } from 'react';
import { usePlatform } from '../../services/platformStore';

export function AdminSettings() {
  const {
    config,
    currentUser,
    adminProperties,
    updateSiteConfig,
    updatePropertyStatus,
    exportBackupJson,
    restoreBackupJson,
    resetSeedData,
  } = usePlatform();

  const [draftConfig, setDraftConfig] = useState(config);
  const [message, setMessage] = useState('');

  if (currentUser?.rol !== 'Direccion') {
    return (
      <div className="rounded-xl bg-surface-container-lowest border border-outline-variant p-6 text-center">
        <p className="font-headline text-title-md text-error">Acceso restringido</p>
        <p className="text-body-md text-on-surface-variant mt-1">
          Solo Dirección puede modificar la configuración general del sitio y respaldos.
        </p>
      </div>
    );
  }

  const handleSaveConfig = (e: FormEvent) => {
    e.preventDefault();
    const res = updateSiteConfig(draftConfig);
    setMessage(res.ok ? 'Configuración pública actualizada sin tocar código.' : res.error ?? 'Error');
  };

  const handleDownloadBackup = () => {
    const json = exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respaldo-luisoliver-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Respaldo JSON descargado.');
  };

  const handleRestoreFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = restoreBackupJson(String(reader.result ?? ''));
      setMessage(res.ok ? 'Respaldo restaurado correctamente.' : res.error ?? 'Error al restaurar.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const availableProps = adminProperties.filter((p) => p.estado === 'Disponible');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-headline-md text-on-surface">
          Configuración del sitio y respaldos
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Personaliza la imagen principal del hero, textos comerciales, propiedades destacadas y
          copias de seguridad.
        </p>
      </div>

      {message && (
        <div className="rounded-lg border border-secondary/50 bg-secondary-container/40 px-4 py-2.5 text-label-md text-on-surface">
          {message}
        </div>
      )}

      {/* Hero & Commercial Texts */}
      <form
        onSubmit={handleSaveConfig}
        className="rounded-xl bg-surface-container-lowest border border-outline-variant/70 p-5 flex flex-col gap-4"
      >
        <h2 className="font-headline text-title-md text-on-surface">
          Hero y textos comerciales
        </h2>

        <label className="flex flex-col gap-1">
          <span className="text-label-sm font-semibold">URL fotografía principal del Hero</span>
          <input
            type="url"
            required
            value={draftConfig.heroImageUrl}
            onChange={(e) => setDraftConfig({ ...draftConfig, heroImageUrl: e.target.value })}
            className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-label-sm font-semibold">
            Título del Hero en móvil (escritorio se mantiene limpio sin eslogan)
          </span>
          <input
            type="text"
            required
            value={draftConfig.mobileHeroTitle}
            onChange={(e) => setDraftConfig({ ...draftConfig, mobileHeroTitle: e.target.value })}
            className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md"
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-label-sm font-semibold">Título sección captación</span>
            <input
              type="text"
              required
              value={draftConfig.sellerTitle}
              onChange={(e) => setDraftConfig({ ...draftConfig, sellerTitle: e.target.value })}
              className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-label-sm font-semibold">Subtítulo captación (móvil)</span>
            <input
              type="text"
              required
              value={draftConfig.sellerSubtitle}
              onChange={(e) => setDraftConfig({ ...draftConfig, sellerSubtitle: e.target.value })}
              className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-body-md"
            />
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-primary-container text-on-primary-container px-5 py-2.5 text-label-md font-semibold hover:bg-primary"
          >
            Guardar configuración
          </button>
        </div>
      </form>

      {/* Featured Selection */}
      <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/70 p-5 flex flex-col gap-3">
        <h2 className="font-headline text-title-md text-on-surface">
          Selección rápida de destacadas (solo disponibles)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {availableProps.map((prop) => (
            <label
              key={prop.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-outline-variant/60 bg-surface-container-low px-3 py-2 text-body-md cursor-pointer"
            >
              <span className="truncate">
                <span className="font-mono text-label-sm text-secondary mr-1.5">
                  {prop.folio}
                </span>
                {prop.titulo}
              </span>
              <input
                type="checkbox"
                checked={prop.destacada}
                onChange={(e) =>
                  updatePropertyStatus(prop.id, prop.estado, e.target.checked)
                }
              />
            </label>
          ))}
        </div>
      </div>

      {/* Backup & Restore (REQ-SEC-002) */}
      <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/70 p-5 flex flex-col gap-3">
        <h2 className="font-headline text-title-md text-on-surface">
          Respaldo y restauración (REQ-SEC-002)
        </h2>
        <p className="text-body-md text-on-surface-variant">
          Descarga una copia completa del inventario, solicitudes, equipo, configuración y eventos
          analíticos, o restaura desde un archivo previo.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="inline-flex items-center gap-2 rounded-md bg-primary-container text-on-primary-container px-4 py-2 text-label-md font-semibold"
          >
            <span className="material-symbols-outlined text-title-md" aria-hidden="true">
              download
            </span>
            <span>Exportar respaldo JSON</span>
          </button>

          <label className="inline-flex items-center gap-2 rounded-md border border-outline-variant bg-surface-container-lowest px-4 py-2 text-label-md cursor-pointer hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-title-md" aria-hidden="true">
              upload_file
            </span>
            <span>Restaurar desde JSON</span>
            <input type="file" accept="application/json" onChange={handleRestoreFile} className="hidden" />
          </label>

          <button
            type="button"
            onClick={() => {
              resetSeedData();
              setMessage('Datos base restablecidos.');
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-error/40 text-error px-4 py-2 text-label-md hover:bg-error-container/30"
          >
            <span>Restablecer catálogo inicial</span>
          </button>
        </div>
      </div>
    </div>
  );
}
