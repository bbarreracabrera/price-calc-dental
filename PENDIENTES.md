# ShiningCloud Dental — Pendientes

> Estado actual: Producto vendible legalmente. Calidad 
> técnica sólida. Quedan pulidos y mejoras de seguridad/UX 
> para escalar a múltiples clínicas.

---

## 🚧 SPRINT 1 — Hardening de seguridad (antes de escalar a 3+ clientes)
**Tiempo estimado: 2-3 horas**

### Bloqueantes para venta corporativa:

- [ ] **userRole solo en estado React — escalada de privilegios lateral**
  - Archivo: src/App.jsx (~línea 260-276)
  - Solución: Verificar rol en Supabase RLS para cada query crítica. 
    Crear policies que validen auth.email() contra team.role.
  - Impacto: ALTO — un asistente con DevTools puede elevar rol a admin

- [ ] **MASTER_EMAIL visible en bundle de producción**
  - Archivo: src/App.jsx (~línea 94)
  - Solución: Crear Edge Function `verify-master` que use auth.email() 
    server-side. En cliente, llamarla solo cuando se necesite verificar.
  - Impacto: ALTO — facilita ataques dirigidos al super-admin

- [ ] **Upload solo valida MIME del cliente (bypaseable)**
  - Archivo: src/utils/uploadHandlers.js
  - Solución: Validar magic bytes con FileReader antes de subir. 
    Configurar Supabase Storage con transformaciones.
  - Impacto: ALTO — XSS almacenado posible vía SVG malicioso

- [ ] **Historial clínico modificable retroactivamente (Ley 20.584)**
  - Archivo: src/App.jsx (savePatientData)
  - Solución: Crear tabla clinical_notes append-only. RLS bloquea 
    UPDATE/DELETE sobre evoluciones firmadas.
  - Impacto: LEGAL — viola integridad exigida por ley

---

## 🐛 SPRINT 2 — Bugs y robustez
**Tiempo estimado: 1-2 horas**

### Funcionalidad robusta:

- [ ] **getPerioStats/getPatient sin null-safety consistente**
  - Archivo: src/App.jsx (~línea 400-450)
  - Solución: Revisar TODOS los accesos a clinical.perio en PerioTab 
    con optional chaining.

- [ ] **savePatientData puede sobreescribir datos concurrentes entre tabs**
  - Archivo: src/components/PatientPersonalTab.jsx (~línea 75-83)
  - Solución: Leer estado más reciente al momento del save, no del 
    momento del cambio. Usar functional setState o un getter.

- [ ] **Verificar patient.id en PRATab/CariogramTab**
  - Archivos: src/components/PRATab.jsx, CariogramTab.jsx
  - Verificación: Probar guardar evaluaciones y verificar con SQL 
    que se persisten correctamente.

- [ ] **Backfill patient_id sin notificación de duplicados**
  - Archivo: src/App.jsx (backfill useEffect)
  - Solución: Notificar al admin cuando hay N citas sin vincular 
    por nombres duplicados.

- [ ] **Consentimiento Ley 19.628 sin metadata verificable**
  - Archivo: src/components/PublicBooking.jsx
  - Solución: Al guardar reserva, incluir {consent_accepted, 
    consent_version, consent_timestamp, consent_ua}.

- [ ] **Soft-delete inconsistente en sterilization y audit_logs**
  - Archivo: src/hooks/useClinicData.js
  - Solución: Estandarizar — agregar .is('deleted_at', null) o documentar 
    por qué no aplica.

---

## 🎨 SPRINT 3 — UX y estética
**Tiempo estimado: 1-2 horas**

### Pulido visual:

- [ ] **Pie chart Cariogram monocromático (accesibilidad)**
  - Archivo: src/components/tools/CariogramCalculator.jsx
  - Solución: Patrones de relleno (stripes) además de color, o 
    saturación diferenciada para sector "Oportunidad".

- [ ] **Score breakdown PRA roto en iPhone SE (<375px)**
  - Archivo: src/components/tools/PRACalculator.jsx
  - Solución: grid-cols-2 en móvil, grid-cols-3 en sm+.

- [ ] **Sección educativa max-w-4xl vs calculadora max-w-5xl**
  - Archivo: src/components/public/LandingPRA.jsx
  - Solución: Unificar todos a max-w-5xl o max-w-4xl.

- [ ] **Primera evaluación PRA/Cariogram sin contexto de datos precargados**
  - Archivos: src/components/PRATab.jsx, CariogramTab.jsx
  - Solución: Panel "Datos precargados desde la ficha" antes de abrir 
    calculadora, con botón de confirmación.

- [ ] **Recomendaciones Cariogram en columna izquierda (asimetría)**
  - Archivo: src/components/tools/CariogramCalculator.jsx
  - Solución: Mover a sección de ancho completo DEBAJO del grid.

- [ ] **Historial PRA/Cariogram sin "ver detalle"**
  - Archivos: src/components/PRATab.jsx, CariogramTab.jsx
  - Solución: Botón "Ver detalle" que expanda los 6 scores. 
    "Recargar en calculadora" para comparar.

- [ ] **handleSaveToDB función vacía (código muerto)**
  - Archivo: src/components/PatientPersonalTab.jsx (~línea 89)
  - Solución: Eliminar.

---

## ⚡ SPRINT 4 — Performance
**Tiempo estimado: 1 hora**

### Optimizaciones cuando lleguen 50+ usuarios:

- [ ] **App.jsx sin code splitting (bundle inicial 2-4x mayor)**
  - Archivo: src/App.jsx
  - Solución: React.lazy() + Suspense para vistas principales 
    (LabDashboard, Inventario, Esterilización, MasterPanel).

- [ ] **PRACalculator recalcula con dataColor**
  - Archivo: src/components/tools/PRACalculator.jsx
  - Solución: React.memo() en HexagonChart.

- [ ] **Sección educativa LandingPRA pesa el LCP**
  - Archivo: src/components/public/LandingPRA.jsx
  - Solución: IntersectionObserver + React.lazy para secciones 
    debajo del fold.

- [ ] **Selector de color del PRA no persiste**
  - Archivo: src/components/tools/PRACalculator.jsx
  - Solución: localStorage.getItem('pra_color') ?? '#5B6651'.

---

## 🛡️ SPRINT 5 — Seguridad enterprise (cuando escales a 10+ clínicas)
**Tiempo estimado: 2-3 horas**

### Para venta a clínicas grandes/redes:

- [ ] **Rate limiting en PublicBooking**
  - Archivo: src/components/PublicBooking.jsx + Edge Function
  - Solución: Honeypot debe cortar ANTES de Supabase. Rate limit por IP.

- [ ] **PDFs sin watermark de usuario que descargó**
  - Archivo: src/utils/pdfGenerator.js
  - Solución: Header del PDF con nombre del usuario que descargó.

- [ ] **PDFs sin firma digital verificable**
  - Archivo: src/utils/pdfGenerator.js
  - Solución: Calcular SHA-256 del PDF al generar, guardar en 
    audit_logs para verificación posterior.

- [ ] **Disclaimer calculadoras no prominente**
  - Archivos: src/components/tools/*.jsx
  - Solución: Modal de bienvenida en versión pública con disclaimer 
    que el usuario debe cerrar activamente.

---

## 🛠️ MEJORAS FUTURAS — Tier 2 (Plan pago)

Features que diferencian la versión paga. No son fixes, son nuevos productos.

- [ ] **Tutoriales de higiene** (con contenido propio SVG/animaciones)
  - Tier 1 lead magnet completaría con PRA + Cariogram + Tutoriales
  - 6 tutoriales iniciales (cepillado, hilo, interdental, ortodoncia, 
    post-extracción, clorhexidina)
  - Email automático post-cita con tutoriales relevantes
  - QR para que paciente acceda desde el móvil

- [ ] **Diseño de sonrisa**
  - Base: Excel + plantillas PPT que el usuario ya tiene
  - Upload foto frontal del paciente
  - Aplicar plantillas con proporciones áureas
  - Exportar como PDF/imagen

- [ ] **Edición de fotos clínicas**
  - Mejora de calidad
  - Recorte de fondo (estilo Remini/PhotoRoom)
  - Comparaciones antes/después

- [ ] **Visor de radiografías profesional**
  - Mejora del visor básico actual
  - Filtros (brillo, contraste, negativo, zoom)
  - Anotaciones sobre la imagen
  - Comparación de radiografías a lo largo del tiempo

---

## 🧪 SPRINT LAB — Producto híbrido (vista gratis + Pro suscripción)

Modelo de negocio:
- Lab Socio (GRATIS): trabajos de clínicas ShiningCloud
- Lab Pro ($12.990 CLP/mes): + trabajos externos + facturación SII + stock

### Etapa 1 — LabDashboard Tier Gratis funcional
- [ ] Migración de lab_works → lab_jobs con campo `source`
- [ ] Tab "Mi Arancel" — CRUD del catálogo de servicios del lab
- [ ] Tab "Mis Clínicas Socias" — stats por clínica SaaS conectada
- [ ] Detalle expandido de trabajo (modal) con datos completos
- [ ] Chat lab-clínica por trabajo (mensajes + archivos)
- [ ] Stats reales en header del Kanban (recibidos hoy, en curso, vence)
- [ ] Cuando clínica asigna trabajo, se autocompleta precio desde arancel
- [ ] **Sistema de archivos adjuntos por trabajo de lab**
  - Múltiples archivos por orden (no solo uno como hoy)
  - Bucket Supabase Storage 'lab-work-files' con RLS
  - Tipos soportados: STL, PDF, JPG, PNG (validación magic bytes)
  - Lado clínica: subir desde LabWorkModal
  - Lado lab: previsualizar en JobDetailModal con thumbnails
  - Botón descargar por archivo
  - Soft-delete con `deleted_at`

### Etapa 2 — Lab Pro (suscripción)
- [ ] Sistema de suscripción Lab con MercadoPago
- [ ] Tab "Trabajos externos" — crear trabajos manualmente
- [ ] Tab "Facturación" — boletas SII para el lab
- [ ] Onboarding del lab que se autoinvita (sin clínica conectada)

### Etapa 3 — Premium (futuro)
- [ ] Materiales y stock con trazabilidad de lotes
- [ ] Análisis avanzado (revenue mensual, top servicios, clínica top)
- [ ] Multi-técnico interno

---

## 🌐 LANDING /laboratorios (cuando LabDashboard Etapa 1 esté listo)

- [ ] Crear /laboratorios.jsx con landing específica
- [ ] Hero: "Tu laboratorio, en una sola pantalla"
- [ ] Sección 2 modalidades: Socio gratis vs Pro $12.990
- [ ] Sección features detallada
- [ ] FAQ específico para labs
- [ ] CTA "Empezar gratis" (lleva a register con role=lab)
- [ ] Navbar: agregar tab "Laboratorios" en landing principal
- [ ] SEO meta tags para keywords lab dental chile

---

## 🏆 CERTIFICACIONES — Etapa de credibilidad (cuando tengas 5+ clientes)

### Sello CENS (Universidad de Chile) — PRIORIDAD
Certificación específica para software de salud en Chile.

- [ ] Documentar políticas de privacidad y términos
- [ ] Documentar políticas de seguridad de información
- [ ] Documentar proceso de manejo de incidentes
- [ ] Documentar plan de continuidad operacional
- [ ] Documentar cumplimiento Ley 19.628, 19.799, 20.584
- [ ] Auditoría con CENS (proceso 3-6 meses, ~$500k-2M CLP)
- [ ] Mostrar sello en landing y dashboard

Lo que YA tenemos para CENS (gracias a Sprints 1-5):
✓ Cifrado AES-GCM con salt aleatorio
✓ Soft-delete + retención 15 años (Ley 20.584)
✓ RLS server-side con verificación de roles
✓ Audit logs de todas las acciones
✓ Hash SHA-256 de documentos
✓ Consentimiento Ley 19.628 con metadata
✓ Magic bytes en uploads
✓ CSP sin unsafe-eval
✓ Validación RUT módulo 11
✓ Firma digital Ley 19.799

### ISO/IEC 27001 — Etapa internacional
Para venta a redes grandes, ISAPRES, contratos B2B.

- [ ] Política de Sistema de Gestión de Seguridad de Información (SGSI)
- [ ] Análisis de riesgos formal
- [ ] Plan de tratamiento de riesgos
- [ ] Métricas de SGSI
- [ ] Auditoría interna
- [ ] Auditoría con empresa certificadora (6-12 meses, $5-15M CLP)
- [ ] Mostrar sello en landing

### HIPAA-aligned (si vas a expandir a EEUU/internacional)
- [ ] BAA (Business Associate Agreement) templates
- [ ] Audit trail inmutable
- [ ] Encryption at rest verificado

---

## 📊 Métricas de éxito a monitorear

Cuando empieces a tener usuarios, trackear:

- [ ] Conversión landing → registro (target: 5-10%)
- [ ] Activación: % usuarios que crean primer paciente en 24h (target: 70%+)
- [ ] Retención: % usuarios activos a los 30 días (target: 60%+)
- [ ] Uso de calculadoras PRA/Cariogram (esperado: alto inicialmente)
- [ ] Tasa de no-shows con vs sin recordatorios automáticos
- [ ] Boletas SII emitidas (señal de uso clínico real)
- [ ] Revenue per Active User (RPU): target $9.990 CLP/mes

---

## 🚀 Próximos pasos sugeridos

1. **Validación con dentistas reales** (PRIORIDAD MÁXIMA)
   - Conseguir 5-10 dentistas beta gratis
   - Feedback semanal
   - Iterar con datos reales antes de invertir más tiempo en código

2. **Después de 5 dentistas usando la app activamente:**
   - Sprint 1 (hardening seguridad)
   - Sprint 2 (bugs y robustez)

3. **Después de 10 dentistas:**
   - Sprint 3 (UX)
   - Sprint 4 (performance)

4. **Cuando llegues a 20 dentistas pagando:**
   - Sprint 5 (seguridad enterprise)
   - Tier 2 (productos premium)

---

*Última actualización: 19 de mayo de 2026*
*Producto: ShiningCloud Dental v1.0*
*Estado: Producción · Vendible legalmente · 24 mejoras técnicas + roadmap Lab + Certificaciones*
