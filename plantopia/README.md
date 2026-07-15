# Plantopia — Astro + Supabase

App de bitácora de plantas: sustrato, luz, riego, fertilización y fase de vida, con historial de eventos.

## Stack

- [Astro](https://astro.build) (`output: static`) + TypeScript
- [Supabase](https://supabase.com) — Postgres + Auth + Row Level Security
- Tailwind CSS v4
- Dexie (IndexedDB, caché offline)

## Desarrollo local

1. Instala dependencias:

   ```sh
   npm install
   ```

2. Copia `.env.example` a `.env` y llena las variables con tu proyecto de Supabase:

   ```env
   PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```

3. Aplica el esquema a tu proyecto de Supabase (`supabase/migrations/0001_init.sql`), vía SQL editor del dashboard o `psql` contra el connection pooler.

4. Corre el servidor de desarrollo:

   ```sh
   npm run dev
   ```

   Abre [http://localhost:4321](http://localhost:4321).

## Estructura

```
src/
├── pages/
│   ├── index.astro          # listado de plantas
│   ├── login.astro          # login / signup
│   └── plants/
│       ├── new.astro        # alta de planta
│       ├── edit.astro       # edición
│       └── detail.astro     # detalle + historial de eventos/fases
├── components/
│   └── PlantForm.astro      # formulario compartido alta/edición
├── lib/
│   ├── supabase.ts          # cliente Supabase
│   ├── plants.ts            # queries CRUD de plantas
│   ├── plant-form.ts        # helpers del formulario
│   ├── session.ts           # manejo de sesión
│   └── labels.ts            # labels de enums (fase, luz, etc.)
└── types/
    └── database.ts          # tipos generados del esquema
```

## Esquema de datos

Ver `supabase/migrations/0001_init.sql`. Tablas principales:

- `plants` — datos de cada planta (nombre, sustrato, luz, riego, fertilización, fase actual)
- `plant_events` — bitácora libre de eventos (trasplante, poda, plaga, etc.)
- `plant_phase_log` — historial de cambios de fase de vida

Todas con RLS activo — cada usuario solo puede ver/modificar sus propias plantas.

## Comandos

| Comando           | Acción                                          |
| :----------------- | :----------------------------------------------- |
| `npm install`       | Instala dependencias                             |
| `npm run dev`       | Servidor local en `localhost:4321`               |
| `npm run build`     | Build de producción a `./dist/`                  |
| `npm run preview`   | Preview del build antes de deploy                |
| `npm run astro ...` | Comandos CLI de Astro (`astro add`, `astro check`)|

## Pendientes conocidos

- **Signup real sin probar de punta a punta.** El proyecto de Supabase usa el mailer integrado (sin SMTP propio configurado), limitado a 2 correos/hora — configurar un proveedor SMTP en Auth → SMTP Settings del dashboard de Supabase antes de producción real, o confirmar usuarios manualmente para pruebas.
- Deploy: GitHub Pages + Actions (workflow en `.github/workflows/deploy-pages.yml`, dispara en push a `main`)

## Más documentación

- `docs/plan-migracion-astro-supabase.md` — plan completo de migración (infra + features)
- `../SUPABASE_SETUP.md` — credenciales del proyecto Supabase (NO subir al repo — está en `.gitignore`)
