# ShiningCloud Dental — Roadmap de pendientes

> Última actualización: Mayo 2026
> Estado: Producto vendible legalmente en producción
> URL: https://shiningclouddental.vercel.app
> Modelo: SaaS B2B para clínicas dentales en Chile

---

## ✅ PRIORIDAD ALTA — Seguridad de archivos (COMPLETADO)

Problema: el sistema de archivos adjuntos en lab_works usaba URLs públicas permanentes. Ahora se ha implementado un sistema de URLs firmadas y buckets privados para cumplir con la Ley 19.628.

- [x] Crear bucket Supabase Storage 'lab_works' como PRIVADO con RLS
- [x] Migrar URLs públicas a signed URLs (expiración 24h) en LabView y JobDetailModal
- [x] Validar magic bytes en subidas de laboratorio (implementado en uploadHandlers.js)
- [ ] Soporte múltiples archivos por trabajo (pendiente estructura de tabla)
- [ ] Tabla lab_work_files con FK a lab_works.id
- [ ] LabWorkModal lado clínica: galería de archivos
- [ ] JobDetailModal lado lab: thumbnails + preview (actualizado para usar signed URLs)

---

## 🧪 SPRINT LAB — Continuación

### Tier Gratis pendiente:
- [ ] Chat lab-clínica por trabajo (mensajes + adjuntos)
- [ ] Auto-precio: al asignar trabajo, ver precio del arancel
- [ ] Estado "online" del lab (última conexión)
- [ ] Notificaciones de cambio de estado al admin

### Tier Pro ($12.990 CLP/mes):
- [x] Sistema de suscripción Lab con MercadoPago (Webhook de conciliación implementado)
- [ ] Tab "Trabajos externos" — crear trabajos manualmente
- [ ] Tab "Facturación" — boletas SII para el lab
- [ ] Onboarding del lab autoinvitado (sin clínica conectada)
- [ ] Materiales y stock con trazabilidad de lotes
- [ ] Análisis avanzado (revenue mensual, top servicios)
- [ ] Multi-técnico interno

---

## 🌐 LANDING /laboratorios

- [ ] Decisión: dominio propio (.cl) vs subruta /laboratorios
- [ ] Hero: "Tu laboratorio, en una sola pantalla"
- [ ] Sección 2 modalidades: Socio gratis vs Pro $12.990
- [ ] Features detalladas
- [ ] FAQ específico
- [ ] CTA "Empezar gratis" → register con role=lab
- [ ] Navbar landing principal: agregar tab "Laboratorios"
- [ ] SEO meta tags

---

## 🏆 CERTIFICACIONES

### Sello CENS (Universidad de Chile) — PRIORIDAD para venta a clínicas serias
- [ ] Documentar políticas (privacidad, seguridad, incidentes, continuidad)
- [ ] Documentar cumplimiento Leyes 19.628, 19.799, 20.584
- [ ] Auditoría con CENS (~$500k-2M CLP, 3-6 meses)

Lo que YA tenemos para CENS (gracias a Sprints 1-5):
✓ Cifrado AES-GCM con salt aleatorio
✓ Soft-delete + retención 15 años (Ley 20.584)
✓ RLS server-side con verificación de roles
✓ Audit logs de todas las acciones
✓ Hash SHA-256 de documentos
✓ Consentimiento Ley 19.628 con metadata
✓ Magic bytes en uploads (excepto lab_works)
✓ CSP sin unsafe-eval
✓ Validación RUT módulo 11
✓ Firma digital Ley 19.799

### ISO/IEC 27001 — Para venta enterprise
- [ ] SGSI formal
- [ ] Auditoría con empresa certificadora (~$5-15M CLP, 6-12 meses)

---

## 🎓 TIER 1 — Tutoriales de higiene

- [ ] 6 tutoriales con SVG propio (sin copyright issues):
   - Cepillado Bass modificada
   - Hilo dental
   - Cepillo interdental
   - Higiene en ortodoncia
   - Cuidados post-extracción
   - Enjuague clorhexidina
- [ ] URLs públicas /tutoriales/cepillado, etc.
- [ ] Email automático post-cita con tutoriales relevantes

---

## 💎 TIER 2 — Productos premium

- [ ] Diseño de sonrisa (basado en Excel + plantillas PPT del usuario)
- [ ] Edición de fotos clínicas (recortar fondo, mejorar calidad)
- [ ] Visor de radiografías profesional (filtros, anotaciones, comparación temporal)

---

## 🌍 INFRAESTRUCTURA

- [ ] Comprar dominio shiningclouddental.cl (~$10k-15k CLP/año en NIC.cl)
- [ ] Configurar Resend con dominio verificado para emails custom
- [ ] Configurar RESEND_API_KEY en Supabase secrets
- [ ] Configurar RESEND_FROM_EMAIL en Supabase secrets
- [ ] Activar Edge Function invite-lab (ya está deployada, espera Resend)

---

## 📊 MÉTRICAS A TRACKEAR (cuando tengas usuarios)

- Conversión landing → registro (target: 5-10%)
- Activación: % usuarios que crean primer paciente en 24h (target: 70%+)
- Retención 30 días (target: 60%+)
- Uso de calculadoras PRA/Cariogram
- Tasa de no-shows con vs sin recordatorios
- Boletas SII emitidas (señal de uso real)
- RPU mensual (target: $9.990 plan dental, $12.990 plan lab)

---

## 🔧 BUGS Y DEUDA TÉCNICA MENOR

- [x] Inconsistencia HEAD count en useClinicData (financials) (Corregido en App.jsx)
- [ ] LabDashboard: filtros de fecha en kanban
- [ ] PatientWorkspace: 10 tabs en mobile (ya mitigado con grupos pero pulir)
- [x] Reset password flow: verificado y funcional (manejo básico)
- [x] Tour de bienvenida: actualizado con sección de Laboratorios y mejoras en UX móvil
- [ ] Validación cross-browser (Safari, Firefox móvil)

---

## ⚙️ CONFIGURACIÓN PENDIENTE EN SUPABASE/VERCEL

### Supabase
- [x] Hardening de seguridad: Corregidas funciones RPC (SECURITY INVOKER) y RLS
- [x] Webhook de MercadoPago: Implementado y desplegado (`mercadopago-webhook`)
- [x] Registro de Clínicas: Flujo de registro asegurado server-side (validación de suscripción)
- [ ] Configurar RESEND_API_KEY como secret (cuando haya dominio)
- [ ] Configurar RESEND_FROM_EMAIL como secret

### Vercel
- [ ] Conectar dominio propio cuando se compre
- [ ] Activar Analytics (opcional)

---

## 📚 REFERENCIAS TÉCNICAS

### Stack
- Frontend: React 19 + Vite 7 + Tailwind
- Backend: Supabase (Postgres + RLS + Edge Functions)
- Pagos: MercadoPago (Chile)
- Email: Resend (pendiente activar)
- Hosting: Vercel
- Storage: Supabase Storage

### Estructura de tablas principales
- patients, appointments, financials, inventory, sterilization (todas con JSONB data + soft-delete)
- lab_works (schema híbrido: top-level críticos + data JSONB)
- lab_pricing (lab_email + data JSONB con servicios)
- team (miembros de la clínica con roles)
- settings (config + laboratories array)
- audit_logs (auditoría completa)
- clinical_evolutions (append-only por RLS)

### Edge Functions activas
- mp-oauth-exchange (OAuth MercadoPago)
- create-payment (preferencias MP)
- mercadopago-webhook (HMAC verified)
- notify-booking (Resend emails)
- send-reminders (cron diario 12 UTC)
- verify-master (verificación server-side de super admin)
- invite-lab (lista para activar con Resend)

### Variables de entorno
Vercel:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- (VITE_MASTER_EMAIL eliminada — ahora server-side)

Supabase secrets:
- MASTER_EMAIL=b.barreracabrera.dent@gmail.com
- (RESEND_API_KEY pendiente)
- (RESEND_FROM_EMAIL pendiente)

---

## SPRINT 17-09-2026 — CUATRO FRENTES

### Aplicado en Supabase
- [x] Columna generada `patients.rut_norm` con el RUT normalizado
- [x] Índice único parcial `patients_rut_unico_por_clinica` sobre (admin_email, rut_norm)
      — antes NO existía ninguna restricción de RUT en la base
- [x] Columnas `created_at`, `updated_at` (con trigger) e `import_batch_id`
- [x] Registro de prueba duplicado archivado con borrado suave
- Migración versionada en `supabase/migrations/20260917_patients_rut_unico.sql`

### Sistema visual
- [x] `zoom: 0.75` reemplazado por reducción de la raíz a 12px — misma densidad,
      sin el reescalado no entero que provocaba el aspecto pixelado
- [x] Plus Jakarta Sans cargada de verdad (antes no se cargaba ninguna tipografía)
- [x] Paleta tokenizada en `tailwind.config.js`, todos los pares texto/fondo ≥ 4.5:1
      — el `#9A8F84` anterior daba 3.06:1 sobre el crema
- [x] Escala tipográfica en px, espaciado en rem
- [x] `THEMES` unificado en un solo tema
- [x] Codemod `scripts/migrar-tokens.mjs`: 79 archivos, 3.879 colores, 661 tamaños
- [ ] Repasar a ojo las pantallas de más tráfico: los iconos de lucide crecen al
      quitar el zoom porque su tamaño va en px

### Ficha del paciente
- [x] De 14 pestañas planas a 5 secciones con sub-pestañas
- [x] Pestaña Resumen como pantalla de entrada
- [x] Especialidades visibles solo si el paciente tiene registros
- [x] `AlertasMedicas` en ficha, lista de pacientes y agenda
- [x] Panel lateral de evolución sobre cualquier sección
- [x] Atajos R / O / E / P
- [x] Barra de secciones inferior en móvil
- [x] CORREGIDO: PatientWorkspace pasaba `handleGeneratePDF` y PatientConsentTab
      esperaba `generatePDF` — el botón de PDF del consentimiento estaba muerto
- [ ] Formulario de anamnesis: conectar los campos de detalle de `CONDICIONES_MEDICAS`
      y los bloques de `BLOQUES_CONDICIONALES` dentro de PatientAnamnesisTab

### Documentos PDF
- [x] Módulo `src/pdf/` con membrete, folio, paginación, firmas y auditoría únicos
- [x] Presupuesto, receta, consentimiento, periodontograma y ficha clínica imprimible
- [x] Ficha clínica nueva, conforme al Decreto 41/2012 (art. 5, 6 a-d, 7, 10, 11)
- [x] A4 y Carta como parámetro (`config.paperFormat`, selector en Ajustes)
- [x] Legible en blanco y negro: cada color lleva además su letra o símbolo
- [x] CORREGIDO: el presupuesto perdía condiciones y firmas si era largo
- [x] CORREGIDO: el periodontograma leía `patient.name` y `patient.rut`, campos
      que no existen — salía siempre sin nombre y sin RUT
- [x] Periodontograma por hemiarcada con gráfico de sondaje
- [ ] Faltan: orden de laboratorio, comprobante de abono, certificado de atención
- [ ] Fuente incrustada en el PDF (hoy Helvetica de jsPDF, WinAnsi: sin signo −)

### Traspaso de pacientes
- [x] Asistente de 5 pasos: origen, mapeo, validación, conflictos, resumen
- [x] Perfiles Dentalink / Reservo / AgendaPro / Excel propio / fichas en papel
- [x] Plantilla XLSX descargable
- [x] Validación de RUT, fechas (serie de Excel incluida) y teléfono chileno
- [x] Deduplicación real contra la clínica y dentro del propio archivo
- [x] Deshacer el lote completo por `import_batch_id`
- [x] `consentStatus: 'heredado'` en los importados
- [ ] Ofrecer el traspaso también en el recorrido de bienvenida, no solo en la
      lista de pacientes

### Normativa verificada (fuentes oficiales, septiembre 2026)
- Decreto 41/2012 MINSAL: contenido mínimo de la ficha, entrega y conservación
- Ley 21.719: entra en vigencia el **1 de diciembre de 2026**. Reforma la 19.628,
  crea la Agencia de Protección de Datos, exige notificar brechas en 72 horas y
  fiscaliza evidencia operativa (registros de acceso), no políticas escritas
- Ley 19.799: firma electrónica simple, válida para consentimientos
- Código Sanitario art. 100-101: receta en papel sigue plenamente válida; el SNRE
  es voluntario para quien prescribe en esta etapa
