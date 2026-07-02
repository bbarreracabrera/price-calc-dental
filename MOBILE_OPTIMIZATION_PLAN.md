# Plan de Optimización Móvil y Simulación Clínica
## ShiningCloud Dental - Análisis y Roadmap

**Fecha**: 2 de Julio de 2026  
**Versión**: 1.0  
**Objetivo**: Transformar la aplicación de un prototipo de escritorio a una herramienta clínica profesional con soporte móvil completo y flujos de trabajo optimizados.

---

## 1. ANÁLISIS DE LA ARQUITECTURA ACTUAL

### 1.1 Estado Actual
- **Framework**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Responsive Design**: Implementado parcialmente (Sidebar colapsable en móvil, pero componentes principales no optimizados)
- **Problema Crítico**: `PatientWorkspace.jsx` y otros componentes clínicos carecen de clases responsivas (`md:`, `sm:`, `lg:`)

### 1.2 Componentes Críticos para Optimización Móvil
| Componente | Estado | Prioridad | Impacto |
|-----------|--------|-----------|---------|
| `PatientWorkspace.jsx` | Sin responsive | CRÍTICA | Interfaz principal de clínica |
| `PatientEvolutionTab.jsx` | Parcial | ALTA | Entrada de datos clínicos |
| `OdontogramTab.jsx` | Sin responsive | ALTA | Visualización de dientes |
| `InventoryView.jsx` | Parcial | MEDIA | Gestión de insumos |
| `LabView.jsx` | Sin responsive | MEDIA | Gestión de laboratorio |
| `SterilizationView.jsx` | Sin responsive | MEDIA | Gestión de esterilización |

---

## 2. FASE 1: OPTIMIZACIÓN MÓVIL

### 2.1 Estrategia de Responsive Design
**Breakpoints Tailwind a utilizar:**
- `sm`: 640px (Teléfono pequeño)
- `md`: 768px (Tablet)
- `lg`: 1024px (Escritorio)
- `xl`: 1280px (Escritorio grande)

### 2.2 Cambios Principales en `PatientWorkspace.jsx`
```
ESCRITORIO (lg+):
├── Sidebar (w-56)
├── Menú Lateral de Pestañas (w-56)
└── Área de Contenido (flex-1)

TABLET (md-lg):
├── Sidebar Colapsable (w-20)
├── Menú Lateral (w-48)
└── Área de Contenido (flex-1)

MÓVIL (sm-md):
├── Sidebar Oculto (drawer)
├── Tabs Horizontales (scroll)
└── Área de Contenido (full-width)
```

### 2.3 Cambios Principales en Componentes Clínicos
- **Odontograma**: Grid responsivo (2 columnas en móvil, 4 en tablet, 8 en escritorio)
- **Evolución Clínica**: Botones de plantillas en grid responsivo
- **Inventario**: Cards en 1 columna en móvil, 2 en tablet, 2 en escritorio
- **Laboratorio**: Tablas convertidas a cards en móvil

---

## 3. FASE 2: TABLAS DE ESPECIALIDADES

### 3.1 Ortodoncia
**Campos de Seguimiento:**
- Tipo de aparato (fijo, removible, alineadores)
- Torque y angulación por diente
- Tipo de arco (NiTi, acero)
- Fecha de cambio de arco
- Elastómeros (color, tipo)
- Notas de activación

### 3.2 Implantología
**Campos de Seguimiento:**
- Marca y modelo del implante
- Diámetro y largo
- Torque de inserción
- Fecha de colocación
- Etapa (osteointegración, rehabilitación)
- Abutment y corona
- Seguimiento óseo

### 3.3 Endodoncia
**Campos de Seguimiento:**
- Diente tratado
- Diagnóstico (pulpitis, necrosis, etc.)
- Longitud de trabajo
- Instrumentos utilizados (tamaño, conicidad)
- Medicación intraconducto
- Material de obturación
- Seguimiento radiográfico

---

## 4. FASE 3: SIMULACIÓN CLÍNICA - CASOS 1 Y 2

### 4.1 CASO 1: Radiografía Externa + Integración Automática
**Escenario**: Dentista realiza exodoncia, toma radiografía con sistema externo (PACS/Radiografía digital), quiere verla inmediatamente en el sistema.

**Flujo Actual**: Manual (copiar archivo, subir a galería)

**Solución Propuesta**:
1. **Webhook Receptor**: Crear endpoint en Supabase para recibir radiografías desde sistemas externos
2. **Auto-Upload**: Radiografía se carga automáticamente en `PatientImagesTab`
3. **Notificación**: Alerta visual en tiempo real cuando la imagen llega
4. **Integración**: Mostrar en evolución clínica con timestamp

**Implementación**:
- Edge Function de Supabase para webhook
- API REST para recibir imágenes (POST /api/radiography)
- Validación de autenticación y paciente
- Almacenamiento en Storage de Supabase

### 4.2 CASO 2: Evaluación Rápida en Primera Visita
**Escenario**: Paciente llega, dentista quiere:
1. Registrar datos personales rápidamente
2. Tomar foto intraoral
3. Hacer odontograma básico
4. Generar presupuesto
5. **TODO SIN TOCAR MUCHO LA COMPUTADORA**

**Flujo Actual**: Múltiples clics, navegación compleja

**Solución Propuesta**:
1. **Modo Clínico Rápido**: Interfaz simplificada con 4 pasos
2. **Captura de Foto**: Botón grande para cámara (móvil)
3. **Odontograma Rápido**: Seleccionar dientes problemáticos (no detalles)
4. **Presupuesto Automático**: Basado en servicios preseleccionados
5. **Confirmación Verbal**: Opción de dictar notas

**Implementación**:
- Componente `QuickEvaluation.jsx` con wizard de 4 pasos
- Acceso rápido desde dashboard
- Integración con cámara del dispositivo
- Plantillas de presupuesto predefinidas

---

## 5. FASE 4: SIMULACIÓN CLÍNICA - CASOS 3 Y 4

### 5.1 CASO 3: Sistema de Esterilización
**Escenario**: Después de terminar un tratamiento, dentista quiere:
1. Marcar instrumentos como "para esterilizar"
2. Ver inventario de material esterilizable
3. Registrar lote de esterilización
4. Confirmar cuando está listo

**Flujo Actual**: `SterilizationView` existe pero no está integrado con inventario

**Solución Propuesta**:
1. **Pestaña Adicional en SterilizationView**: "Inventario Esterilizable"
2. **Integración con InventoryView**: Mostrar solo items esterilizables
3. **Flujo de Esterilización**:
   - Marcar item como "en esterilización"
   - Registrar lote (fecha, método, temperatura)
   - Confirmar finalización
   - Retornar a disponible
4. **Reporte**: Historial de esterilizaciones

**Implementación**:
- Agregar campo `sterilizable: boolean` a items de inventario
- Crear tabla `sterilization_batches` en Supabase
- Componente `SterilizationInventoryTab.jsx`
- Flujo de estado: disponible → en_esterilizacion → disponible

### 5.2 CASO 4: Flujo Completo de Laboratorio
**Escenario**: Dentista prepara corona/prótesis, quiere:
1. Crear orden de laboratorio
2. Especificar detalles (material, color, etc.)
3. Enviar a laboratorio
4. Laboratorista recibe y confirma
5. Dentista ve estado en tiempo real
6. Laboratorista marca como listo
7. Dentista recibe notificación

**Flujo Actual**: `LabView` y `LabDashboard` existen pero:
- No hay confirmación de recepción del laboratorista
- Interfaz del laboratorista no está funcional
- No hay notificaciones en tiempo real

**Solución Propuesta**:
1. **Orden de Laboratorio Mejorada**:
   - Detalles técnicos (material, color, forma)
   - Fotos de referencia
   - Instrucciones especiales
   - Fecha de entrega requerida

2. **Interfaz del Laboratorista**:
   - Dashboard de órdenes pendientes
   - Confirmación de recepción (con foto)
   - Actualización de estado (en_proceso, en_revision, listo)
   - Fotos del trabajo en progreso

3. **Notificaciones**:
   - Dentista: "Orden recibida por laboratorio"
   - Dentista: "Trabajo en revisión"
   - Dentista: "Trabajo listo para retirar"
   - Laboratorista: "Nueva orden recibida"

4. **Seguimiento**:
   - Timeline visual de estados
   - Historial de comunicación
   - Archivo de trabajos completados

**Implementación**:
- Mejorar `LabWorkModal.jsx` con detalles técnicos
- Crear `LabTechnicianDashboard.jsx` (nueva interfaz)
- Implementar sistema de notificaciones en tiempo real (Supabase Realtime)
- Crear tabla `lab_work_updates` para historial de cambios
- Agregar confirmación de recepción con timestamp

---

## 6. TABLA DE IMPLEMENTACIÓN

| Fase | Componente | Estimado | Prioridad |
|------|-----------|----------|-----------|
| 1 | PatientWorkspace Responsive | 4h | CRÍTICA |
| 1 | OdontogramTab Responsive | 3h | CRÍTICA |
| 1 | PatientEvolutionTab Responsive | 2h | ALTA |
| 1 | InventoryView Responsive | 2h | ALTA |
| 2 | Componentes de Especialidades | 6h | ALTA |
| 3 | Webhook de Radiografía | 3h | MEDIA |
| 3 | QuickEvaluation Component | 4h | MEDIA |
| 4 | SterilizationInventory Tab | 3h | MEDIA |
| 4 | LabTechnicianDashboard | 5h | MEDIA |
| 4 | Notificaciones Realtime | 3h | MEDIA |

**Total Estimado**: ~35 horas de desarrollo

---

## 7. PRÓXIMOS PASOS

1. ✅ Refactorizar `PatientWorkspace.jsx` con clases responsivas
2. ✅ Refactorizar `OdontogramTab.jsx` para móvil
3. ✅ Crear componentes de especialidades
4. ✅ Implementar webhook de radiografía
5. ✅ Crear interfaz de evaluación rápida
6. ✅ Mejorar sistema de esterilización
7. ✅ Completar flujo de laboratorio
8. ✅ Pruebas clínicas end-to-end
9. ✅ Despliegue a producción

---

## 8. CRITERIOS DE ÉXITO

- ✅ Aplicación completamente usable en móvil (pantalla de 375px)
- ✅ Primera visita completable en <5 minutos sin tocar computadora
- ✅ Radiografías se cargan automáticamente en <30 segundos
- ✅ Laboratorista recibe órdenes en tiempo real
- ✅ Esterilización completamente rastreada
- ✅ Cero errores de sintaxis en compilación
- ✅ Cumplimiento con Ley 19.628 (datos protegidos)

---

**Documento Preparado por**: Manus AI  
**Última Actualización**: 2 de Julio de 2026
