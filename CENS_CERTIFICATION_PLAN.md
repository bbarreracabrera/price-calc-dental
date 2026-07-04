# Plan de Certificación CENS - ShiningCloud Dental

## 1. Introducción
El Centro Nacional en Sistemas de Información en Salud (CENS) de Chile establece estándares para la interoperabilidad, seguridad y calidad de los Sistemas de Información en Salud (SIS). Este documento establece el plan de acción para que ShiningCloud Dental obtenga el Sello CENS.

## 2. Pilares de Evaluación CENS

### 2.1. Interoperabilidad (HL7 FHIR)
- **Estado Actual**: Arquitectura JSON/REST basada en Supabase.
- **Brecha**: No se soportan estándares HL7 FHIR nativamente.
- **Acción Requerida**: Implementar una capa de adaptación (Edge Functions) que exponga endpoints HL7 FHIR para el intercambio de recursos (Patient, Encounter, Observation).

### 2.2. Seguridad de la Información (Ley 19.628 y Ley 20.584)
- **Estado Actual**: 
  - ✅ Autenticación OTP/Magic Links (Supabase Auth).
  - ✅ RLS (Row Level Security) implementado en todas las tablas y buckets.
  - ✅ Archivos clínicos y de laboratorio protegidos mediante Signed URLs con expiración.
  - ✅ Auditoría básica de transacciones.
- **Brecha**: Falta trazabilidad completa (Audit Logs) para accesos de lectura (quién vio qué ficha y cuándo).
- **Acción Requerida**: Implementar triggers en PostgreSQL para registrar eventos de lectura (SELECT) en tablas críticas (`patients`, `medical_records`).

### 2.3. Calidad del Software
- **Estado Actual**: React + Vite, base de datos relacional robusta (PostgreSQL).
- **Brecha**: Falta documentación formal de QA y pruebas automatizadas (E2E).
- **Acción Requerida**: Implementar suite de pruebas con Cypress o Playwright y documentar casos de uso clínicos.

## 3. Plan de Acción (Próximos 3-6 Meses)

| Fase | Tarea | Responsable | Estado |
|------|-------|-------------|--------|
| **Fase 1** | Auditoría interna de seguridad y cumplimiento Ley 19.628 | Equipo Dev | ✅ Completado |
| **Fase 2** | Implementación de Audit Logs completos (Lectura/Escritura) | Equipo Dev | Pendiente |
| **Fase 3** | Diseño de API HL7 FHIR (Capa de interoperabilidad) | Arquitectura | Pendiente |
| **Fase 4** | Documentación de QA y Pruebas Automatizadas | QA | Pendiente |
| **Fase 5** | Postulación formal al Sello CENS | Dirección | Pendiente |

## 4. Requisitos Documentales a Preparar
1. **Manual de Arquitectura y Seguridad**: Detallar el uso de Supabase RLS y Signed URLs.
2. **Políticas de Privacidad y Términos de Uso**: Adaptados estrictamente a la normativa chilena.
3. **Plan de Continuidad de Negocio (BCP)**: Estrategia de backups (actualmente provista por AWS/Supabase).

---
*Documento generado para el proceso de auditoría y certificación de ShiningCloud Dental.*
