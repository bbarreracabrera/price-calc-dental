import { useState } from 'react';
import { AlertTriangle, Info, ChevronDown, Pencil } from 'lucide-react';
import { CONDICIONES_MEDICAS } from '../constants';

// ============================================================================
// ALERTAS MÉDICAS
// ----------------------------------------------------------------------------
// Antes esto vivía dentro de PatientWorkspace y solo se veía en la cabecera de
// la ficha. Si estabas en el odontograma, en la agenda o en la lista de
// pacientes, la alergia a penicilina no existía.
//
// Ahora es un componente propio con tres presentaciones:
//
//   <AlertasMedicas p={p} />              barra completa, dentro de la ficha
//   <AlertasMedicas p={p} variante="chip" /> resumen de una línea, para la
//                                            fila del paciente en la lista
//   <AlertasMedicas p={p} variante="punto" /> un punto de color, para la
//                                             tarjeta de la cita en la agenda
//
// Un detalle deliberado: una condición marcada que exige detalle y no lo tiene
// se muestra como incompleta, en vez de esconderse. "Alergias: sí" sin decir a
// qué no sirve de nada en el box, y hasta ahora el sistema no lo pedía.
// ============================================================================

const ordenNivel = { critica: 0, alta: 1, contexto: 2 };

export function alertasDe(p) {
  const marcadas = p?.anamnesis?.conditions || {};
  const detalles = p?.anamnesis?.details || {};

  return CONDICIONES_MEDICAS
    .filter(c => marcadas[c.id])
    .map(c => ({
      ...c,
      detalle: detalles[c.id] || '',
      incompleta: c.pideDetalle && !detalles[c.id],
    }))
    .sort((a, b) => ordenNivel[a.nivel] - ordenNivel[b.nivel]);
}

const ESTILO = {
  critica:  { fondo: 'bg-danger text-white border-danger', suave: 'bg-danger-soft text-danger border-danger/30', punto: 'bg-danger' },
  alta:     { fondo: 'bg-warn text-white border-warn',     suave: 'bg-warn-soft text-warn border-warn/30',       punto: 'bg-warn' },
  contexto: { fondo: 'bg-raised text-ink border-line',     suave: 'bg-raised text-muted border-line',            punto: 'bg-faint' },
};

export default function AlertasMedicas({ p, variante = 'barra', onEditar, className = '' }) {
  const [abierta, setAbierta] = useState(null);
  const alertas = alertasDe(p);

  if (!alertas.length) {
    if (variante === 'barra') {
      return (
        <div className={`flex items-center gap-2 rounded-card border border-line bg-canvas px-3 py-2 ${className}`}>
          <Info size={14} className="text-faint shrink-0" />
          <span className="text-2xs font-semibold text-muted">
            Sin antecedentes médicos declarados
          </span>
          {onEditar && (
            <button onClick={onEditar} className="ml-auto text-2xs font-bold text-accent hover:underline">
              Completar anamnesis
            </button>
          )}
        </div>
      );
    }
    return null;
  }

  // --- Punto de color para la agenda ---
  if (variante === 'punto') {
    const peor = alertas[0].nivel;
    return (
      <span
        className={`inline-block w-2 h-2 rounded-full shrink-0 ${ESTILO[peor].punto} ${className}`}
        title={alertas.map(a => a.label).join(' · ')}
        aria-label={`Alertas médicas: ${alertas.map(a => a.label).join(', ')}`}
      />
    );
  }

  // --- Chip compacto para la lista de pacientes ---
  if (variante === 'chip') {
    const criticas = alertas.filter(a => a.nivel === 'critica');
    const visibles = (criticas.length ? criticas : alertas).slice(0, 2);
    const resto = alertas.length - visibles.length;
    return (
      <span className={`inline-flex items-center gap-1 flex-wrap ${className}`}>
        {visibles.map(a => (
          <span
            key={a.id}
            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-2xs font-bold ${ESTILO[a.nivel].suave}`}
            title={a.detalle || a.label}
          >
            <AlertTriangle size={9} className="shrink-0" />
            {a.label}
          </span>
        ))}
        {resto > 0 && <span className="text-2xs font-bold text-muted">+{resto}</span>}
      </span>
    );
  }

  // --- Barra completa, la que acompaña a la ficha en todas sus secciones ---
  return (
    <div className={`rounded-card border border-line bg-surface overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-stretch gap-px bg-line">
        {alertas.map(a => {
          const activa = abierta === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setAbierta(activa ? null : a.id)}
              aria-expanded={activa}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-2xs font-extrabold border transition-colors
                ${activa ? ESTILO[a.nivel].fondo : ESTILO[a.nivel].suave}
                ${a.nivel === 'critica' ? 'grow' : ''}`}
            >
              <AlertTriangle size={11} className="shrink-0" />
              <span className="truncate">{a.label}</span>
              {a.incompleta && (
                <span className="rounded bg-white/85 px-1 text-2xs font-black text-danger">falta detalle</span>
              )}
              {a.detalle && <ChevronDown size={10} className={`shrink-0 transition-transform ${activa ? 'rotate-180' : ''}`} />}
            </button>
          );
        })}
      </div>

      {abierta && (
        <div className="border-t border-line bg-canvas px-3 py-2">
          {(() => {
            const a = alertas.find(x => x.id === abierta);
            if (!a) return null;
            return (
              <div className="flex items-start gap-2">
                <p className="text-xs leading-relaxed text-ink">
                  <span className="font-bold">{a.label}: </span>
                  {a.detalle || (
                    <span className="text-danger font-semibold">
                      no hay detalle registrado. {a.placeholder ? `Falta indicar ${a.placeholder.toLowerCase()}.` : ''}
                    </span>
                  )}
                </p>
                {onEditar && (
                  <button
                    onClick={onEditar}
                    className="ml-auto flex shrink-0 items-center gap-1 text-2xs font-bold text-accent hover:underline"
                  >
                    <Pencil size={10} /> Editar
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
