export type PropertyType =
  | 'Casa'
  | 'Departamento'
  | 'Terreno'
  | 'Oficina'
  | 'Local'
  | 'Bodega';

export interface Property {
  id: number;
  tipo: PropertyType;
  zona: string;
  precio: number;
  recamaras: number | null;
  banos: number | null;
  m2: number;
  estacionamientos: number | null;
  operacion: 'Venta';
  descripcion: string;
  destacados: string[];
  imagen: string;
  alt: string;
}

export interface FilterChip {
  id: 'Todas' | PropertyType;
  label: string;
  icon: string;
}

export const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida/ALJJyrAXVWebrqQjmrLMntfhYWQzZFYOgHLEpZd68_7lvbnwAN0Wq36gbX25vzDcs00YmB92k9GjJb7kPKZcv_Ru6b7khAUhCTHOKKdznSXHIGhnLoqnmlnFTH3SfwKMFgOU8b_rolI20vv4c6S9vrr1uUMV2onwIH3-OuUOeBZIPtDtxzFBhuCNuX4M5Pxfxob8juHL-O5VXNAr1BdgpufBTsgospQ4flaR0FWKZIA_V6-eam3xN1TLXA';

export const SELLER_BANNER_IMAGE =
  'https://lh3.googleusercontent.com/aida/ALJJyrAkWjKoKdUCGM7kTXUCirwiy8lhe5560RffnNJYa2SqALbxtu-AGGxcyVOxmrASHyERw1AhXs50ZV84YXngC6YIqR8GGyOtpYTlXNnd5YuBgnwCV004eEulbyavM7kPzPdxyTTH0-IWHEMmW1KXhS-iAFtYAQfwCu6V-5GQ2BYIVVD8ggRoaAxP96UAyQwVLXY_J7s9T-Qfds-2mUQP40ZzFaNUlbvG5hPcvVDOecwOwNbwkyPBPh8HM3cH';

export const PROPERTIES: Property[] = [
  {
    id: 1,
    tipo: 'Casa',
    zona: 'Lomas 4ta Sección',
    precio: 6950000,
    recamaras: 3,
    banos: 3.5,
    m2: 280,
    estacionamientos: 2,
    operacion: 'Venta',
    descripcion:
      'Residencia contemporánea de dos niveles con acabados en cantera y madera natural, ubicada en calle tranquila de Lomas 4ta Sección cerca de Av. Sierra Leona.',
    destacados: [
      'Jardín posterior con terraza techada',
      'Cocina integral con cubierta de cuarzo',
      'Recámara principal con vestidor amplio',
    ],
    imagen:
      'https://lh3.googleusercontent.com/aida/ALJJyrBsgIm1G8VH5m92qQo4rsI4zXFg9ms83fnjv5oRT5D12IkqpLSUbya_0jxZd49jixe1fHNb8-Crdxh0eqtktVkOvLgjf4IdaWWCE7W78C9l9JARbwDnl0ySWKI6UEdjw8fnqApRhOLYWXYNUN0fpWH77iNVH1ESlUBbrtXyvQlyJysdSCjyxq9KEsZXhszXL9VG551Ro6d2mP8hhYLWa9blR_qUgWkgeVGRRHnieaea7whXlJZud4_eOc8',
    alt: 'Casa en Lomas 4ta Sección, San Luis Potosí',
  },
  {
    id: 2,
    tipo: 'Departamento',
    zona: 'Villa Magna',
    precio: 3250000,
    recamaras: 2,
    banos: 2,
    m2: 120,
    estacionamientos: 2,
    operacion: 'Venta',
    descripcion:
      'Departamento luminoso en torre residencial al poniente de San Luis Potosí, con vista abierta, elevador privado y acceso controlado las 24 horas.',
    destacados: [
      'Balcón panorámico con orientación oriente',
      'Área social integrada y cuarto de lavado',
      'Acceso rápido a Periférico Poniente',
    ],
    imagen:
      'https://lh3.googleusercontent.com/aida/ALJJyrB3Uk_Ez14Zt4YBob5AIP2gTaZNecKHoCsiPyqmmy1_e0AkNj8FWjwc6a8fLX0Zl4zmRVUWU2EuISOO-vKzhmshAThLVtz45W9iT1ZYOEAPUQdmUh1ku8pQjyCZ87Dtl52tf4z3dg1Wa6KuDqs2CK-8meoV90fRJIHL_QxpwiTukERXlfVKQRaWDg6oGtVGLMwApSsWD1NzvunzKoQZa3uc0ZQ7TCeg1K_Y_mcVel0uWILMzUVh-YLueGr0GEwBvqc',
    alt: 'Departamento en Villa Magna, San Luis Potosí',
  },
  {
    id: 3,
    tipo: 'Terreno',
    zona: 'Alto Lago',
    precio: 1800000,
    recamaras: null,
    banos: null,
    m2: 420,
    estacionamientos: null,
    operacion: 'Venta',
    descripcion:
      'Lote residencial plano dentro de privada con casa club, áreas verdes y vigilancia permanente en Alto Lago, listo para proyecto arquitectónico a medida.',
    destacados: [
      'Frente amplio de 14 metros',
      'Servicios subterráneos a pie de lote',
      'Escrituración inmediata y libre de gravamen',
    ],
    imagen:
      'https://lh3.googleusercontent.com/aida/ALJJyrAYveUZiCg9pGo7zR7BgFKOnfAlYPmp1VlIyM5NjeM09hL5Vn03DbzXWF8KHt7npiNBd3JrthqWgWnAn9sD5W9kg8nENYJgydpjI7cUFoT2Flfx1bTOWNbyNnDtI0LrBuucDh1RKI8VssBdYRb5Xen_kK2zKVFlh4cZdh98ZlEf3oK86g-Mz5dPJ3ebFxyQDS9IMZTW4oVSOOB3aCmi9f5Mrhvf0mSaqZROup8kWmDBj-OdQCqaCc3j9_TBFeZo-SoV',
    alt: 'Terreno en Alto Lago, San Luis Potosí',
  },
  {
    id: 4,
    tipo: 'Casa',
    zona: 'Club de Golf',
    precio: 14500000,
    recamaras: 4,
    banos: 4.5,
    m2: 520,
    estacionamientos: 4,
    operacion: 'Venta',
    descripcion:
      'Residencia de autor frente a área verde en Club de Golf La Loma. Doble altura en estancia, cava climatizada, estudio en planta baja y terraza con asador.',
    destacados: [
      'Vista privilegiada al campo de golf',
      'Paneles solares e hidroneumático instalados',
      'Cuarto de servicio completo y bodega',
    ],
    imagen:
      'https://lh3.googleusercontent.com/aida/ALJJyrCN3l-OHgYW4EsqM6DQRIV3BboTSELC0bz6Q66W8JEH14qXA5Yq8Woi0vazeI5w95Cq3wCP_zNAprFfsZHro1onpXKM_3NW4L3iv_u0vLS6ZicNsdPNgsZWsHbZ_qOarDTZCHfRqf8fOuBMoNIhF54R3hCCaDD6rpdFYZ0wPJu7pK1qBxjLXTmyQqdTPoLMSxVWfUf7WRYbAtpNAKJFmFsxe3QZI6zOnZRRao2ukswfyT0hINzi-P3ResgTI6Y',
    alt: 'Residencia en Club de Golf La Loma, San Luis Potosí',
  },
  {
    id: 5,
    tipo: 'Oficina',
    zona: 'Lomas del Tec',
    precio: 5200000,
    recamaras: null,
    banos: null,
    m2: 180,
    estacionamientos: 4,
    operacion: 'Venta',
    descripcion:
      'Piso corporativo acondicionado en torre ejecutiva de Lomas del Tec, ideal para despacho, consultoría o sede regional con sala de juntas equipada.',
    destacados: [
      'Recepción, 4 privados y sala de juntas',
      'Cajones de estacionamiento techados',
      'Aire acondicionado seccionado y control de acceso',
    ],
    imagen:
      'https://lh3.googleusercontent.com/aida/ALJJyrB5C0AgKTT8Q9PqNisq3nGnxknFXVKQE14v7QjFF6wFDYWBoRgc3iZexI0u_V8c-2YScIlyqS58kC88_LCT4G0z-Xbbc4fCXJOry6Z7NAu5aq4meKuRu-Oj0aG3yObAuexUgZxtumoIGBrw4L7V5Yt1VXc25dyDjgwLVf3T5tIn3Ufvt9c1F9DAanMDT5UGwZugMkT7ENRctIBnAlrsZCgsC6sbDQAJzQjlcN42BYL3ebVv3B6le0vQ3_WUO0jUAWKp',
    alt: 'Oficina en Lomas del Tec, San Luis Potosí',
  },
  {
    id: 6,
    tipo: 'Bodega',
    zona: 'Zona Industrial',
    precio: 8750000,
    recamaras: null,
    banos: null,
    m2: 1200,
    estacionamientos: 6,
    operacion: 'Venta',
    descripcion:
      'Nave industrial con altura libre de 8.5 metros sobre eje estratégico de la Zona Industrial de San Luis Potosí, patio de maniobras y andén de carga.',
    destacados: [
      'Piso de concreto armado de alta resistencia',
      'Subestación eléctrica y oficinas administrativas',
      'Conexión inmediata a Carretera 57',
    ],
    imagen:
      'https://lh3.googleusercontent.com/aida/ALJJyrAie0Ic_iOP9f7Zvh8sevkwffp4siDF5wh6PbrQQacXHwdJLplCMCjKE9YLrjTCWcyTSfOjJcXq3KxdHAeI_UWAN9y4gILILHK526SS28wzkVKBSpztn-bm1lEa52DoDjczHwLhwYnks4ezBgJefwgRQP8Jym-BF4nFcCJCzP-FCMcF6tCvul3sD0Xw2MQC_-FT-lyDf9RQKCAR8lLsINkzbRFW6Fp8cO3-Ur964kz92c5xYfm_INmD-UekPmkpUlgtXRxMQc4',
    alt: 'Bodega en Zona Industrial, San Luis Potosí',
  },
  {
    id: 7,
    tipo: 'Terreno',
    zona: 'Villa de Reyes',
    precio: 1250000,
    recamaras: null,
    banos: null,
    m2: 300,
    estacionamientos: null,
    operacion: 'Venta',
    descripcion:
      'Terreno de inversión en zona de crecimiento habitacional y corredor automotriz de Villa de Reyes, con acceso pavimentado y factibilidad de servicios.',
    destacados: [
      'Alta plusvalía en corredor sur',
      'Topografía regular sin desniveles',
      'Documentación lista para escritura',
    ],
    imagen:
      'https://lh3.googleusercontent.com/aida/ALJJyrDje-w3NfBppFgo27DUctP_khtftfHDO1SVAaNMovD92HJm6QjEoprOwH7BrF5kah4uu7kgDHTYo_zx1z23TGQ2oxlbFN10IUtoqS59icpusnjUDo44tvB81i1hzajoZgzYYt4sN5EfRd8GMT5zvJaOKRkT8fXaTALokiiEQHE2UC3Qas9L8_oSnYm8eKwSB6jRUMa6BF7PzQ-RzldqIC85zZfKTpJ_Aks0raIEOqcxqYBxoYavrCYUyzH07f35FjHKgXY',
    alt: 'Terreno en Villa de Reyes, San Luis Potosí',
  },
  {
    id: 8,
    tipo: 'Departamento',
    zona: 'Himalaya',
    precio: 4150000,
    recamaras: 3,
    banos: 2,
    m2: 145,
    estacionamientos: 2,
    operacion: 'Venta',
    descripcion:
      'Departamento amplio de 3 recámaras en Avenida Himalaya, a minutos del Parque Tangamanga I, centros comerciales y colegios de la zona poniente.',
    destacados: [
      'Terraza privada con vista arbolada',
      'Cocina equipada y alacena independiente',
      'Elevador y bodega privada en sótano',
    ],
    imagen:
      'https://lh3.googleusercontent.com/aida/ALJJyrBHBmSp4atFKj_afOHRumPo-NKoxq9m020iWGfluE0Wf4RHYk9dpK83Tm-z8t7_OnaidfYa0qgJNT0n8hVz1FAvpvsgA9PpO5MjN9mau0c75O4c9U_xDGxNrzdCaX0MArDYWA61ieEbzLNPobYTF48eBhvilzaNGruADnV6qMkupJPDI_ertRbo8vF0fByM1-1A-K7mHY-uUSdJ2IZf1df3BvpG_CzVEi-jrenEU2oGOW-yZ0BecsAyM6NipWCD',
    alt: 'Departamento en Himalaya, San Luis Potosí',
  },
  {
    id: 9,
    tipo: 'Local',
    zona: 'Plaza Lomas',
    precio: 3980000,
    recamaras: null,
    banos: null,
    m2: 120,
    estacionamientos: 3,
    operacion: 'Venta',
    descripcion:
      'Local comercial a pie de calle en corredor de alto flujo peatonal y vehicular de Plaza Lomas, con escaparate de cristal templado y medio baño.',
    destacados: [
      'Frente comercial de 8 metros sobre avenida',
      'Estacionamiento directo para clientes',
      'Ideal para showroom, clínica o boutique',
    ],
    imagen:
      'https://lh3.googleusercontent.com/aida/ALJJyrDOsZt0M5GPvkrhe1qkv6DSjB-N4R6UlvdpJHJtkhx4EPnrXiqu5hPlrDhr-frde2qPIupl5UQirOKdMtC1JGakyibmnaEXjFVMbay52JZchHLu01Au2MuI5xLuitlJkbglKm15awX24nBZRjKIlUPGXalnBhcYRMWsqw40wYbSm69D__jQl-QxftV-S9ds3pCePz_9ZLkEKkUk0jENbiiAl-dYO4MYzBpz7o7mrRyrHuHsKXxEvjiIkjQV27NQ_rvL',
    alt: 'Local comercial en Plaza Lomas, San Luis Potosí',
  },
  {
    id: 10,
    tipo: 'Casa',
    zona: 'Pedregal',
    precio: 9400000,
    recamaras: 4,
    banos: 4,
    m2: 380,
    estacionamientos: 3,
    operacion: 'Venta',
    descripcion:
      'Residencia de cantera blanca y patio interior arbolado en privada exclusiva de Pedregal, con doble altura, cocina equipada y cuarto de juegos.',
    destacados: [
      'Patio central con olivo y terraza techada',
      'Vigilancia 24/7 con acceso controlado',
      'Recámara principal en planta baja',
    ],
    imagen: SELLER_BANNER_IMAGE,
    alt: 'Casa en Pedregal, San Luis Potosí',
  },
  {
    id: 11,
    tipo: 'Casa',
    zona: 'La Loma Residencial',
    precio: 11800000,
    recamaras: 4,
    banos: 4.5,
    m2: 450,
    estacionamientos: 3,
    operacion: 'Venta',
    descripcion:
      'Casa contemporánea con terraza panorámica orientada al poniente en La Loma Residencial, acabados de lujo y jardín de diseño.',
    destacados: [
      'Terraza exterior con fogatero y pérgola',
      'Ventanales de piso a techo termoacústicos',
      'Cerca de colegios y hospitales de zona poniente',
    ],
    imagen: HERO_IMAGE,
    alt: 'Residencia en La Loma Residencial, San Luis Potosí',
  },
];

export const PRIMARY_CHIPS: FilterChip[] = [
  { id: 'Todas', label: 'Todas', icon: 'grid_view' },
  { id: 'Casa', label: 'Casa', icon: 'home' },
  { id: 'Departamento', label: 'Depa', icon: 'apartment' },
  { id: 'Terreno', label: 'Terreno', icon: 'layers' },
];

export const EXTRA_CHIPS: FilterChip[] = [
  { id: 'Oficina', label: 'Oficina', icon: 'work_outline' },
  { id: 'Local', label: 'Local', icon: 'storefront' },
  { id: 'Bodega', label: 'Bodega', icon: 'warehouse' },
];

export function formatMXN(amount: number): string {
  return '$' + amount.toLocaleString('es-MX') + ' MXN';
}
