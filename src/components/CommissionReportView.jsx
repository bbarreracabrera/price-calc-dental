import React, { useState, useMemo } from 'react';
import { DollarSign, Download, Calendar, TrendingUp, Users } from 'lucide-react';
import { Card } from './UIComponents';
import { generateMonthlyCommissionReport, getDentistProductivityStats } from '../utils/multiProfessionalManager';

export default function CommissionReportView({ appointments, team, config }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [viewMode, setViewMode] = useState('commission'); // 'commission' o 'productivity'

  const [year, month] = selectedMonth.split('-');
  const startDate = `${year}-${month}-01`;
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
  const endDate = `${year}-${month}-${lastDay}`;

  const dateRange = { startDate, endDate };

  const commissionReport = useMemo(() => 
    generateMonthlyCommissionReport(appointments || [], team || [], dateRange),
    [appointments, team, selectedMonth]
  );

  const productivityStats = useMemo(() =>
    getDentistProductivityStats(appointments || [], team || [], dateRange),
    [appointments, team, selectedMonth]
  );

  const totalCommissions = commissionReport.reduce((sum, r) => sum + r.commissionAmount, 0);
  const totalIncome = commissionReport.reduce((sum, r) => sum + r.totalIncome, 0);

  const handleExportCSV = () => {
    if (viewMode === 'commission') {
      const headers = ['Profesional', 'Ingresos', 'Comisión %', 'Monto Comisión', 'Citas Realizadas', 'Ticket Promedio'];
      const rows = commissionReport.map(r => [
        r.dentistName,
        `$${r.totalIncome.toLocaleString('es-CL')}`,
        `${r.commission}%`,
        `$${r.commissionAmount.toLocaleString('es-CL')}`,
        r.appointmentCount,
        `$${Math.round(r.averageTicket).toLocaleString('es-CL')}`
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      downloadCSV(csv, `liquidacion-honorarios-${selectedMonth}.csv`);
    } else {
      const headers = ['Profesional', 'Citas Totales', 'Completadas', 'No Asistió', 'Tasa No-Show', 'Ingresos', 'Ticket Promedio'];
      const rows = productivityStats.map(s => [
        s.dentistName,
        s.totalAppointments,
        s.completedAppointments,
        s.noShowCount,
        `${s.noShowRate}%`,
        `$${s.totalIncome.toLocaleString('es-CL')}`,
        `$${Math.round(s.averageTicket).toLocaleString('es-CL')}`
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      downloadCSV(csv, `productividad-${selectedMonth}.csv`);
    }
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in h-full flex flex-col pb-10">
      
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 pb-6 border-b border-[#DFD2C4]/50 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-[#A3968B]"/>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84]">Gestión de Honorarios</p>
          </div>
          <h2 className="text-4xl font-black text-[#312923] tracking-tighter">Liquidación de Comisiones</h2>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-3 bg-white border border-[#DFD2C4] rounded-xl font-bold text-[#312923] outline-none focus:border-[#5B6651]"
          />
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-6 py-3 bg-[#5B6651] text-white font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-[#4a5442] transition-all shadow-lg shadow-[#5B6651]/20"
          >
            <Download size={16}/> Exportar CSV
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
        
        {/* Tabs */}
        <div className="flex gap-2 bg-[#FDFBF7] border border-[#DFD2C4] rounded-2xl p-1 w-fit">
          <button
            onClick={() => setViewMode('commission')}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'commission' 
                ? 'bg-[#5B6651] text-white shadow-sm' 
                : 'text-[#312923] hover:bg-white'
            }`}
          >
            <DollarSign size={14} className="inline mr-1"/> Comisiones
          </button>
          <button
            onClick={() => setViewMode('productivity')}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'productivity' 
                ? 'bg-[#5B6651] text-white shadow-sm' 
                : 'text-[#312923] hover:bg-white'
            }`}
          >
            <TrendingUp size={14} className="inline mr-1"/> Productividad
          </button>
        </div>

        {/* Resumen Global */}
        {viewMode === 'commission' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-2xl border border-[#DFD2C4]/60 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mb-2">Ingresos Totales</p>
                  <p className="text-3xl font-black text-[#312923]">${totalIncome.toLocaleString('es-CL')}</p>
                </div>
                <div className="w-12 h-12 bg-[#5B6651]/10 rounded-xl flex items-center justify-center text-[#5B6651]">
                  <DollarSign size={24}/>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-[#DFD2C4]/60 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mb-2">Comisiones a Pagar</p>
                  <p className="text-3xl font-black text-[#CBAAA2]">${totalCommissions.toLocaleString('es-CL')}</p>
                </div>
                <div className="w-12 h-12 bg-[#CBAAA2]/10 rounded-xl flex items-center justify-center text-[#CBAAA2]">
                  <TrendingUp size={24}/>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-[#DFD2C4]/60 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#9A8F84] mb-2">Profesionales Activos</p>
                  <p className="text-3xl font-black text-[#5B6651]">{commissionReport.length}</p>
                </div>
                <div className="w-12 h-12 bg-[#5B6651]/10 rounded-xl flex items-center justify-center text-[#5B6651]">
                  <Users size={24}/>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tabla de Comisiones */}
        {viewMode === 'commission' && (
          <Card className="rounded-2xl border border-[#DFD2C4]/60 bg-white p-6 shadow-sm overflow-x-auto">
            <h3 className="font-black text-lg text-[#312923] mb-4">Detalle por Profesional</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#DFD2C4]/50">
                  <th className="text-left py-3 px-4 font-black text-[#9A8F84] text-[10px] uppercase tracking-widest">Profesional</th>
                  <th className="text-right py-3 px-4 font-black text-[#9A8F84] text-[10px] uppercase tracking-widest">Ingresos</th>
                  <th className="text-right py-3 px-4 font-black text-[#9A8F84] text-[10px] uppercase tracking-widest">Comisión %</th>
                  <th className="text-right py-3 px-4 font-black text-[#9A8F84] text-[10px] uppercase tracking-widest">Monto</th>
                  <th className="text-right py-3 px-4 font-black text-[#9A8F84] text-[10px] uppercase tracking-widest">Citas</th>
                  <th className="text-right py-3 px-4 font-black text-[#9A8F84] text-[10px] uppercase tracking-widest">Ticket Promedio</th>
                </tr>
              </thead>
              <tbody>
                {commissionReport.map((report, idx) => (
                  <tr key={idx} className="border-b border-[#DFD2C4]/30 hover:bg-[#FDFBF7] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#312923]">{report.dentistName}</td>
                    <td className="text-right py-3 px-4 font-bold text-[#312923]">${report.totalIncome.toLocaleString('es-CL')}</td>
                    <td className="text-right py-3 px-4 font-bold text-[#5B6651]">{report.commission}%</td>
                    <td className="text-right py-3 px-4 font-bold text-[#CBAAA2]">${report.commissionAmount.toLocaleString('es-CL')}</td>
                    <td className="text-right py-3 px-4 font-bold text-[#312923]">{report.appointmentCount}</td>
                    <td className="text-right py-3 px-4 font-bold text-[#5B6651]">${Math.round(report.averageTicket).toLocaleString('es-CL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Tabla de Productividad */}
        {viewMode === 'productivity' && (
          <Card className="rounded-2xl border border-[#DFD2C4]/60 bg-white p-6 shadow-sm overflow-x-auto">
            <h3 className="font-black text-lg text-[#312923] mb-4">Estadísticas de Productividad</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#DFD2C4]/50">
                  <th className="text-left py-3 px-4 font-black text-[#9A8F84] text-[10px] uppercase tracking-widest">Profesional</th>
                  <th className="text-right py-3 px-4 font-black text-[#9A8F84] text-[10px] uppercase tracking-widest">Citas Totales</th>
                  <th className="text-right py-3 px-4 font-black text-[#9A8F84] text-[10px] uppercase tracking-widest">Completadas</th>
                  <th className="text-right py-3 px-4 font-black text-[#9A8F84] text-[10px] uppercase tracking-widest">No Asistió</th>
                  <th className="text-right py-3 px-4 font-black text-[#9A8F84] text-[10px] uppercase tracking-widest">Tasa No-Show</th>
                  <th className="text-right py-3 px-4 font-black text-[#9A8F84] text-[10px] uppercase tracking-widest">Ingresos</th>
                  <th className="text-right py-3 px-4 font-black text-[#9A8F84] text-[10px] uppercase tracking-widest">Ticket Promedio</th>
                </tr>
              </thead>
              <tbody>
                {productivityStats.map((stat, idx) => (
                  <tr key={idx} className="border-b border-[#DFD2C4]/30 hover:bg-[#FDFBF7] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#312923]">{stat.dentistName}</td>
                    <td className="text-right py-3 px-4 font-bold text-[#312923]">{stat.totalAppointments}</td>
                    <td className="text-right py-3 px-4 font-bold text-[#5B6651]">{stat.completedAppointments}</td>
                    <td className="text-right py-3 px-4 font-bold text-[#CBAAA2]">{stat.noShowCount}</td>
                    <td className="text-right py-3 px-4 font-bold text-[#D9A86C]">{stat.noShowRate}%</td>
                    <td className="text-right py-3 px-4 font-bold text-[#312923]">${stat.totalIncome.toLocaleString('es-CL')}</td>
                    <td className="text-right py-3 px-4 font-bold text-[#5B6651]">${Math.round(stat.averageTicket).toLocaleString('es-CL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
