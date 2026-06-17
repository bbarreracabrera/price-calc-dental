/**
 * Multi-Professional Manager
 * Gestiona filtrado, vistas personalizadas y liquidaciones para clínicas con múltiples profesionales
 */

/**
 * Filtra citas por profesional
 * @param {Array} appointments - Lista de citas
 * @param {String} dentistEmail - Email del dentista (o 'all' para todas)
 * @param {String} userEmail - Email del usuario actual (para auto-filtrado si no es admin)
 * @param {String} userRole - Rol del usuario actual
 * @returns {Array} Citas filtradas
 */
export const filterAppointmentsByDentist = (appointments, dentistEmail, userEmail, userRole) => {
  if (!appointments) return [];
  
  // Si no es admin, solo ve sus propias citas
  if (userRole !== 'admin' && userRole !== 'lab') {
    return appointments.filter(a => a.dentist_email === userEmail);
  }
  
  // Si es admin, puede filtrar por dentista o ver todas
  if (dentistEmail === 'all' || !dentistEmail) {
    return appointments;
  }
  
  return appointments.filter(a => a.dentist_email === dentistEmail);
};

/**
 * Calcula liquidación de honorarios por dentista
 * @param {Array} appointments - Lista de citas completadas
 * @param {Array} team - Lista de profesionales
 * @param {String} dentistEmail - Email del dentista
 * @param {Object} dateRange - { startDate, endDate } en formato YYYY-MM-DD
 * @returns {Object} Resumen de liquidación
 */
export const calculateDentistCommission = (appointments, team, dentistEmail, dateRange = null) => {
  const dentist = team.find(m => m.email === dentistEmail);
  if (!dentist) return null;

  const commission = dentist.commission || 0;
  
  let relevantAppts = appointments.filter(a => 
    a.dentist_email === dentistEmail && 
    (a.status === 'atendiendo' || a.status === 'confirmado')
  );

  if (dateRange && dateRange.startDate && dateRange.endDate) {
    relevantAppts = relevantAppts.filter(a => 
      a.date >= dateRange.startDate && a.date <= dateRange.endDate
    );
  }

  const totalIncome = relevantAppts.reduce((sum, a) => sum + (a.price || 0), 0);
  const commissionAmount = (totalIncome * commission) / 100;
  const appointmentCount = relevantAppts.length;

  return {
    dentistName: dentist.name,
    dentistEmail,
    totalIncome,
    commission,
    commissionAmount,
    appointmentCount,
    averageTicket: appointmentCount > 0 ? totalIncome / appointmentCount : 0,
    appointments: relevantAppts,
  };
};

/**
 * Genera reporte de liquidación para todos los dentistas
 * @param {Array} appointments - Lista de citas
 * @param {Array} team - Lista de profesionales
 * @param {Object} dateRange - { startDate, endDate }
 * @returns {Array} Array de liquidaciones por dentista
 */
export const generateMonthlyCommissionReport = (appointments, team, dateRange) => {
  const dentists = team.filter(m => m.role === 'dentist' || m.role === 'admin');
  
  return dentists.map(dentist => 
    calculateDentistCommission(appointments, team, dentist.email, dateRange)
  ).filter(Boolean);
};

/**
 * Filtra pacientes por dentista asignado
 * @param {Array} patients - Lista de pacientes
 * @param {String} dentistEmail - Email del dentista
 * @returns {Array} Pacientes asignados al dentista
 */
export const filterPatientsByDentist = (patients, dentistEmail) => {
  if (!patients) return [];
  return patients.filter(p => p.assigned_dentist === dentistEmail);
};

/**
 * Obtiene estadísticas de productividad por dentista
 * @param {Array} appointments - Lista de citas
 * @param {Array} team - Lista de profesionales
 * @param {Object} dateRange - { startDate, endDate }
 * @returns {Array} Estadísticas de cada dentista
 */
export const getDentistProductivityStats = (appointments, team, dateRange = null) => {
  const dentists = team.filter(m => m.role === 'dentist' || m.role === 'admin');
  
  return dentists.map(dentist => {
    let appts = appointments.filter(a => a.dentist_email === dentist.email);
    
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      appts = appts.filter(a => 
        a.date >= dateRange.startDate && a.date <= dateRange.endDate
      );
    }

    const completed = appts.filter(a => a.status === 'confirmado' || a.status === 'atendiendo').length;
    const noShow = appts.filter(a => a.status === 'no_asistio').length;
    const pending = appts.filter(a => a.status === 'agendado' || a.status === 'espera').length;
    const totalIncome = appts
      .filter(a => a.status === 'confirmado' || a.status === 'atendiendo')
      .reduce((sum, a) => sum + (a.price || 0), 0);

    return {
      dentistName: dentist.name,
      dentistEmail: dentist.email,
      color: dentist.color,
      totalAppointments: appts.length,
      completedAppointments: completed,
      noShowCount: noShow,
      noShowRate: appts.length > 0 ? (noShow / appts.length * 100).toFixed(1) : 0,
      pendingAppointments: pending,
      totalIncome,
      averageTicket: completed > 0 ? totalIncome / completed : 0,
    };
  });
};

/**
 * Valida si un usuario puede ver/editar una cita
 * @param {Object} appointment - La cita
 * @param {String} userEmail - Email del usuario
 * @param {String} userRole - Rol del usuario
 * @returns {Boolean}
 */
export const canEditAppointment = (appointment, userEmail, userRole) => {
  // Admin puede editar todo
  if (userRole === 'admin') return true;
  
  // Dentista solo puede editar sus propias citas
  if (userRole === 'dentist') {
    return appointment.dentist_email === userEmail;
  }
  
  // Asistente no puede editar
  return false;
};

/**
 * Obtiene el dentista asignado a una cita (para vista de paciente)
 * @param {String} dentistEmail - Email del dentista
 * @param {Array} team - Lista de profesionales
 * @returns {Object} Datos del dentista
 */
export const getDentistInfo = (dentistEmail, team) => {
  return team.find(m => m.email === dentistEmail) || null;
};

/**
 * Agrupa citas por dentista (para dashboard)
 * @param {Array} appointments - Lista de citas
 * @param {Array} team - Lista de profesionales
 * @returns {Object} Citas agrupadas por dentista
 */
export const groupAppointmentsByDentist = (appointments, team) => {
  const grouped = {};
  
  team.forEach(dentist => {
    if (dentist.role === 'dentist' || dentist.role === 'admin') {
      grouped[dentist.email] = {
        dentistName: dentist.name,
        color: dentist.color,
        appointments: appointments.filter(a => a.dentist_email === dentist.email),
      };
    }
  });
  
  return grouped;
};
