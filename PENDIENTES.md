ShiningCloud Dental — Plan de Acción Consolidado
Última actualización: septiembre 2026
Estado: Producto vendible legalmente en producción
URL: https://shiningclouddental.vercel.app
Modelo: SaaS B2B para clínicas dentales y laboratorios en Chile

1. Contexto y alcance
Este documento consolida el roadmap de pendientes y el sprint del 17-09-2026. Se han eliminado repeticiones y se ha priorizado la información más reciente.

Stack:

Frontend: React 19 + Vite 7 + Tailwind

Backend: Supabase (Postgres + RLS + Edge Functions)

Pagos: MercadoPago (Chile)

Email: Resend (pendiente activar)

Hosting: Vercel

Storage: Supabase Storage

2. Estado actual — Completado
Seguridad y cumplimiento
☑ Cifrado AES-GCM con salt aleatorio
☑ Soft-delete + retención 15 años (Ley 20.584)
☑ RLS server-side con verificación de roles
☑ Audit logs de todas las acciones
☑ Hash SHA-256 de documentos
☑ Consentimiento Ley 19.628 con metadata
☑ Magic bytes en uploads
☑ CSP sin unsafe-eval
☑ Validación RUT módulo 11
☑ Firma digital Ley 19.799
☑ Bucket lab_works privado con RLS + signed URLs (expiración 24h)
☑ Validación de magic bytes en subidas de laboratorio (uploadHandlers.js)
☑ Hardening de funciones RPC (SECURITY INVOKER) y RLS
☑ Webhook MercadoPago implementado y desplegado (mercadopago-webhook)
☑ Registro de clínicas asegurado server-side (validación de suscripción)
Producto
☑ Sistema de suscripción Lab con MercadoPago
☑ Módulo src/pdf/ con membrete, folio, paginación, firmas y auditoría únicos
☑ PDFs: presupuesto, receta, consentimiento, periodontograma, ficha clínica (Decreto 41/2012)
☑ A4 y Carta como parámetro (config.paperFormat, selector en Ajustes)
☑ Legible en blanco y negro: cada color lleva además su letra o símbolo
☑ Ficha del paciente: 5 secciones con sub-pestañas (antes 14 pestañas planas)
☑ Pestaña Resumen como pantalla de entrada
☑ Especialidades visibles solo si el paciente tiene registros
☑ AlertasMedicas en ficha, lista de pacientes y agenda
☑ Panel lateral de evolución sobre cualquier sección
☑ Atajos R / O / E / P
☑ Barra de secciones inferior en móvil
☑ Traspaso de pacientes: asistente 5 pasos, perfiles Dentalink/Reservo/AgendaPro/Excel/papel, plantilla XLSX, deduplicación real, deshacer por import_batch_id, consentStatus: 'heredado'
☑ Tour de bienvenida actualizado con sección Laboratorios
☑ Reset password flow verificado
☑ Inconsistencia HEAD count en useClinicData (financials) corregida en App.jsx
Sistema visual (Sprint 17-09-2026)
☑ zoom: 0.75 reemplazado por reducción de raíz a 12px
☑ Plus Jakarta Sans cargada de verdad
☑ Paleta tokenizada en tailwind.config.js, todos los pares texto/fondo ≥ 4.5:1
☑ Escala tipográfica en px, espaciado en rem
☑ THEMES unificado en un solo tema
☑ Codemod scripts/migrar-tokens.mjs: 79 archivos, 3.879 colores, 661 tamaños
Base de datos (Sprint 17-09-2026)
☑ Columna generada patients.rut_norm con RUT normalizado
☑ Índice único parcial patients_rut_unico_por_clinica sobre (admin_email, rut_norm)
☑ Columnas created_at, updated_at (con trigger) e import_batch_id
☑ Registro de prueba duplicado archivado con borrado suave
☑ Migración versionada en supabase/migrations/20260917_patients_rut_unico.sql
Correcciones puntuales
☑ CORREGIDO: PatientWorkspace pasaba handleGeneratePDF y PatientConsentTab esperaba generatePDF — botón PDF del consentimiento muerto
☑ CORREGIDO: presupuesto perdía condiciones y firmas si era largo
☑ CORREGIDO: periodontograma leía patient.name y patient.rut (campos inexistentes)

3. Plan de acción por frentes
3.1. Seguridad de archivos — continuación
□ Soporte múltiples archivos por trabajo — tabla lab_work_files con FK a lab_works.id
□ LabWorkModal lado clínica: galería de archivos
□ JobDetailModal lado lab: thumbnails + preview con signed URLs

3.2. Módulo Laboratorios
Tier Gratis

□ Chat lab-clínica por trabajo (mensajes + adjuntos)
□ Auto-precio: ver precio del arancel al asignar trabajo
□ Estado "online" del lab (última conexión)
□ Notificaciones de cambio de estado al admin

Tier Pro ($12.990 CLP/mes)

□ Tab "Trabajos externos" — crear trabajos manualmente
□ Tab "Facturación" — boletas SII para el lab
□ Onboarding del lab autoinvitado (sin clínica conectada)
□ Materiales y stock con trazabilidad de lotes
□ Análisis avanzado (revenue mensual, top servicios)
□ Multi-técnico interno

3.3. Landing laboratorio y dental
□ Mejorar diseño estético de landing page de dental y diseño de landing laboratorio, a través de skill o aplicación externa, ya que no convence la actual.
□ Decisión: dominio propio (.cl) vs subruta /laboratorios
□ Hero: "Tu laboratorio, en una sola pantalla"
□ Sección 2 modalidades: Socio gratis vs Pro $12.990
□ Features detalladas
□ FAQ específico
□ CTA "Empezar gratis" → register con role=lab
□ Navbar landing principal: agregar tab "Laboratorios"
□ SEO meta tags

3.4. Certificaciones
Sello CENS (Universidad de Chile) — prioridad para venta a clínicas serias
□ Documentar políticas (privacidad, seguridad, incidentes, continuidad)
□ Documentar cumplimiento Leyes 19.628, 19.799, 20.584
□ Auditoría con CENS (~$500k-2M CLP, 3-6 meses)
ISO/IEC 27001 — para venta enterprise
□ SGSI formal
□ Auditoría con empresa certificadora (~$5-15M CLP, 6-12 meses)

3.5. Tutoriales y contenido
Tier 1 — Higiene (6 tutoriales con SVG propio, sin copyright issues)
□ Cepillado Bass modificada
□ Hilo dental
□ Cepillo interdental
□ Higiene en ortodoncia
□ Cuidados post-extracción
□ Enjuague clorhexidina
□ URLs públicas /tutoriales/cepillado, etc.
□ Email automático post-cita con tutoriales relevantes

Tier 2 — Productos premium
□ Diseño de sonrisa (basado en Excel + plantillas PPT) continuar proyecto a paralelo y enlazar
□ Edición de fotos clínicas (recortar fondo, mejorar calidad)
□ Visor de radiografías profesional (filtros, anotaciones, comparación temporal)

3.6. Infraestructura
□ Comprar dominio shiningclouddental.cl (~$10k-15k CLP/año en NIC.cl)
□ Configurar Resend con dominio verificado para emails custom
□ Configurar RESEND_API_KEY en Supabase secrets
□ Configurar RESEND_FROM_EMAIL en Supabase secrets
□ Activar Edge Function invite-lab (ya deployada, espera Resend)
□ Conectar dominio propio en Vercel
□ Activar Analytics en Vercel (opcional)

3.7. Bugs y deuda técnica menor
□ LabDashboard: filtros de fecha en kanban
□ PatientWorkspace: 10 tabs en mobile (ya mitigado con grupos, pulir)
□ Validación cross-browser (Safari, Firefox móvil)
□ Repasar a ojo las pantallas de más tráfico: los iconos de lucide crecen al quitar el zoom (tamaño en px)
□ Formulario de anamnesis: conectar campos de detalle de CONDICIONES_MEDICAS y bloques de BLOQUES_CONDICIONALES en PatientAnamnesisTab
□ Documentos PDF faltantes: orden de laboratorio, comprobante de abono, certificado de atención
□ Fuente incrustada en el PDF (hoy Helvetica de jsPDF, WinAnsi: sin signo −)
□ Ofrecer traspaso de pacientes en el recorrido de bienvenida (no solo en lista de pacientes)

3.8. Métricas a trackear (cuando haya usuarios)
- Conversión landing → registro (target: 5-10%)

- Activación: % usuarios que crean primer paciente en 24h (target: 70%+)

- Retención 30 días (target: 60%+)

- Uso de calculadoras PRA/Cariogram

- Tasa de no-shows con vs sin recordatorios

- Boletas SII emitidas (señal de uso real)

- RPU mensual (target: $9.990 plan dental, $12.990 plan lab)

4. Normativa verificada (fuentes oficiales, septiembre 2026)
- Decreto 41/2012 MINSAL: contenido mínimo de la ficha clínica, entrega y conservación

- Ley 21.719: entra en vigencia el 1 de diciembre de 2026. Reforma la 19.628, crea la Agencia de Protección de Datos, exige notificar brechas en 72 horas y fiscaliza evidencia operativa (registros de acceso), no políticas escritas

- Ley 19.799: firma electrónica simple, válida para consentimientos

- Código Sanitario art. 100-101: receta en papel sigue plenamente válida; el SNRE es voluntario para quien prescribe en esta etapa

5. Referencias técnicas
|Estructura de tablas principales
- patients, appointments, financials, inventory, sterilization (JSONB data + soft-delete)

- lab_works (schema híbrido: top-level críticos + data JSONB)

- lab_pricing (lab_email + data JSONB con servicios)

- team (miembros de la clínica con roles)

- settings (config + laboratories array)

- audit_logs (auditoría completa)

- clinical_evolutions (append-only por RLS)

|Edge Functions activas
- mp-oauth-exchange — OAuth MercadoPago

- create-payment — preferencias MP

- mercadopago-webhook — HMAC verificado

- notify-booking — Resend emails

- send-reminders — cron diario 12 UTC

- verify-master — verificación server-side de super admin

- invite-lab — lista para activar con Resend

|Variables de entorno
- Vercel:

      VITE_SUPABASE_URL

      VITE_SUPABASE_ANON_KEY

      (VITE_MASTER_EMAIL eliminada — ahora server-side)

- Supabase secrets:

      MASTER_EMAIL=b.barreracabrera.dent@gmail.com

      RESEND_API_KEY (pendiente)

      RESEND_FROM_EMAIL (pendiente)

6. Resumen de prioridades inmediatas
- Múltiples archivos por trabajo — tabla lab_work_files + UI clínica/lab

- Infraestructura: comprar dominio + configurar Resend → desbloquea invite-lab y recordatorios

- Lab Tier Gratis: chat, auto-precio, estado online, notificaciones

- Landing /laboratorios: captación de labs

- Documentos PDF faltantes: orden de laboratorio, comprobante de abono, certificado de atención

- Anamnesis: conectar campos de detalle y bloques condicionales

- Certificaciones: documentación CENS + ISO 27001

- Deuda técnica: filtros kanban LabDashboard, cross-browser, iconos lucide