# 🌿 Plantop.ia

**Plantop.ia** es una app para llevar la bitácora real de cuidado de tus plantas: sustrato, luz, riego, fertilización y fase de vida (vegetativo, floración, fructificación, recesión/dormancia, latencia), con historial de eventos y cambios de fase.

> Migrado en julio 2026 de Next.js + Firebase a **Astro (static) + Supabase**, siguiendo el mismo patrón que [Rastrum](https://rastrum.org). Ver `docs/plan-migracion-astro-supabase.md` para el plan completo y `docs/roadmap-dev.md` para el roadmap histórico (Next.js, archivado).

## 🚀 Estado actual (julio 2026)

**Rama activa:** `astro-supabase-migration` → PR [#1](https://github.com/Pamela-ruiz9/Plantop.ia/pull/1)

### ✅ Funcionando y verificado
- Auth con Supabase (email/password: login + signup)
- Listado de plantas del usuario (con RLS — cada usuario ve solo las suyas)
- Alta, edición y borrado de plantas (sustrato, luz, riego, fertilización, fase de vida)
- Vista de detalle con historial: stats, bitácora de eventos (`plant_events`) y log de fases (`plant_phase_log`), solo lectura por ahora
- PWA instalable (manifest, íconos, service worker)
- Esquema Postgres completo aplicado en un proyecto Supabase real, con RLS policies activas

### ⏳ Pendiente
- Verificación de clics reales en navegador (solo se verificó build + endpoints HTTP 200 + CRUD contra Supabase por separado)
- **Signup real de punta a punta sin probar.** El proyecto de Supabase no tiene SMTP propio configurado, así que usa el mailer integrado de Supabase con límite de **2 correos/hora** — las pruebas de registro se topan con ese límite rápido. Para producción real hay que configurar un proveedor SMTP (Resend, Postmark, etc.) en el dashboard de Supabase (Auth → SMTP Settings) o confirmar usuarios manualmente mientras se prueba.
- Deploy público (GitHub Pages + Actions — ver estado abajo)
- Dominio propio (`plantopia.mx` está disponible pero aún no comprado)

## 🛠️ Tech Stack

- **Framework:** [Astro](https://astro.build) (`output: static`)
- **Backend:** [Supabase](https://supabase.com) — Postgres + Auth + RLS
- **Estilos:** Tailwind CSS v4
- **Offline cache:** Dexie (IndexedDB)
- **PWA:** manifest.webmanifest + service worker instalable

El código vive en `plantopia/` — ver `plantopia/README.md` para instrucciones de desarrollo local.

## 📁 Estructura

```
Plantop.ia/
├── plantopia/           # App Astro + Supabase (código activo)
│   ├── src/
│   │   ├── pages/       # index, login, plants/{new,edit,detail}
│   │   ├── lib/         # supabase.ts, plants.ts, session.ts, labels.ts
│   │   ├── components/  # PlantForm.astro
│   │   └── layouts/
│   └── supabase/
│       └── migrations/  # 0001_init.sql — esquema de la DB
├── docs/
│   ├── plan-migracion-astro-supabase.md
│   └── roadmap-dev.md   # roadmap histórico (versión Next.js, archivado)
└── SUPABASE_SETUP.md    # credenciales del proyecto Supabase (NO se sube al repo, ver .gitignore)
```

## 🗺️ Roadmap

Ver `docs/plan-migracion-astro-supabase.md` para el plan de migración detallado (infraestructura + features) y su estado de avance.

## 🔐 Seguridad

- `SUPABASE_SETUP.md` (contiene la password de la base de datos) está en `.gitignore` — nunca se sube al repo.
- `.env` / `.env.local` (URL + anon key) también están ignorados.
- Usar `.env.example` como plantilla para configurar tu propio `.env` local.

## 🤝 Contribuir

1. Fork del repo
2. Crea una rama: `git checkout -b feature/tu-feature`
3. Commit: `git commit -m 'feat: tu cambio'`
4. Push: `git push origin feature/tu-feature`
5. Abre un Pull Request
