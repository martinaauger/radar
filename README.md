# Quantum — Directorio de contactos

Herramienta interna para consultores de [Quantum America](https://quantumamerica.com/): buscar **empresa → país → puesto → contactos**, con mails para licitaciones, seminarios, benchmarking y campañas.

## Qué hace

- **Contactos** (home): búsqueda y filtros por sector, país, tipo de organización, nivel de decisión, mail
- **Empresas**: cuentas por sector/país
- **Resumen**: totales por sector y país (sin métricas internas por perfil)
- **Importar**: CSV (Sales Navigator / LinkedIn export) con origen del dato

## Sectores

Electricidad · Gas · Agua y saneamiento · Generación eléctrica · Nuevos negocios (residuos sólidos) · Transversal

## Cómo correr

```bash
npm install
npm run dev
```

Abrí [http://127.0.0.1:47231](http://127.0.0.1:47231).

La base SQLite se crea en `data/radar.sqlite` al primer uso (incluye datos demo).

## Nota

“Sector” = unidad de negocio de Quantum (antes a veces dicho “BU”). En la UI del consultor no se muestra cobertura por perfil LinkedIn de gerentes; eso queda solo como registro interno al importar.
