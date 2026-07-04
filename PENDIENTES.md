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
