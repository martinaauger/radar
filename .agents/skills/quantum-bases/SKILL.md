---
name: quantum-bases
description: Process Quantum Radar contact bases from the 4 LinkedIn/Sales Navigator profiles (Fernando, Elías, César, Laura). Use when Martina asks to import, merge, or procesar bases de los perfiles / gerentes.
user-invocable: true
---

# Quantum Radar — Procesar bases de 4 perfiles

## Context

Martina centraliza contactos de **4 perfiles** Quantum:

| Owner key | Quién | Uso típico del export |
|-----------|--------|------------------------|
| `fernando` | Fernando (GG / owner) | Connections / Sales Nav general |
| `elias` | Elías (Electricidad) | Sector electricidad |
| `cesar` | César (Gas) | Sector gas |
| `laura` | Laura (Administración) | Base clasificada (Excel/CSV) |

App: vista **Operativa** → Importar. Datos en SQLite local (`data/radar.sqlite`), PII fuera de git.

## When to use

- “Procesá la base de Elías / César / …”
- “Importá Connections / Sales Navigator”
- “Unificá las 4 bases”
- Revisar colas después de un import

## Workflow (one profile at a time)

1. **Identificar perfil** (`fernando` | `elias` | `cesar` | `laura`) y tipo de archivo:
   - LinkedIn Connections → `sourceType: linkedin_export` (CSV con `Notes:` + `First Name,Last Name,URL,...`)
   - Sales Navigator → `sourceType: sales_navigator`
   - Base Laura / manual clasificada → `sourceType: manual` (or `asociados` if cámara list)
   - Auto: `inspectCsvUpload(csv, filename)` en `lib/csv.ts` — tipo por headers; owner por nombre de archivo (`Connections_elias.csv`) o columna `owners`
2. **Pedir el archivo** si no está en `data/uploads/` ni adjunto en el chat.
3. **Importar** atribuyendo **un solo owner** (el perfil de esa base):
   - UI: Operativa → Importar → subir CSV (auto-detecta perfil + tipo y carga)
   - Override manual solo si el filename no alcanza (detalle “Forzar perfil / tipo”)
   - O script batch: `scripts/import_uploads.py` (Laura Excel + Connections)
   - API: `POST /api/import` con `{ csv, filename }` (opcional `owners` / `forceManual`)
   - Parser: `lib/csv.ts` (salta preamble LinkedIn, merge por URL)
4. **Dedupe esperado:**
   - Empresa: mismo nombre+país
   - Contacto: merge por LinkedIn URL — **suma** el owner, no pisa los existentes
5. **Verificar cobertura** `GET /api/coverage` → `byOwner` para ese perfil. Reportar `imported` / `merged` / errores.
6. **Colas post-import** (vista Operativa / Resumen operativa):
   - Solo LinkedIn (sin mail)
   - Pendiente enriquecer mail
   - Potenciales socios
   - Sin canal
7. **No inventar** antecedentes SGQ (trabajos Quantum–empresa). Eso es pendiente de SGQ; ver `docs/pendientes-presentacion.md`.

## Brief listo para otro agente

Ver `docs/brief-agente-import.md`.

## Order suggestion for a full pass

1. Laura (base ya clasificada)  
2. Fernando (Connections amplias)  
3. Elías  
4. César  

Después: pasar colas, marcar potenciales socios, completar CV corto donde importe.

## Rules

- Español, corto, accionable.
- Siempre dejar claro **qué perfil** se está procesando.
- Separar **Actividad en el Radar** vs **Antecedentes SGQ**.
- No poner colas ni import en la vista Consultor.
