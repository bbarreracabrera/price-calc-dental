import React from 'react';

/**
 * Skeleton Screen para la ficha clínica
 */
export const PatientCardSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-24 bg-[#DFD2C4]/30 rounded-2xl"></div>
    <div className="space-y-3">
      <div className="h-4 bg-[#DFD2C4]/30 rounded w-3/4"></div>
      <div className="h-4 bg-[#DFD2C4]/30 rounded w-1/2"></div>
    </div>
  </div>
);

/**
 * Skeleton Screen para la agenda
 */
export const AppointmentCardSkeleton = () => (
  <div className="animate-pulse space-y-3 p-4 bg-[#FDFBF7] rounded-2xl border border-[#DFD2C4]/30">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-[#DFD2C4]/30 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-[#DFD2C4]/30 rounded w-2/3"></div>
        <div className="h-2.5 bg-[#DFD2C4]/20 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

/**
 * Skeleton Screen para tabla de datos
 */
export const TableRowSkeleton = ({ cols = 5 }) => (
  <div className="animate-pulse flex gap-4 p-4 bg-white rounded-xl border border-[#DFD2C4]/20">
    {Array.from({ length: cols }).map((_, i) => (
      <div key={i} className="flex-1 h-4 bg-[#DFD2C4]/30 rounded"></div>
    ))}
  </div>
);

/**
 * Skeleton Screen para dashboard
 */
export const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* KPI Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-6 bg-white rounded-2xl border border-[#DFD2C4]/30">
          <div className="h-4 bg-[#DFD2C4]/30 rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-[#DFD2C4]/30 rounded w-2/3"></div>
        </div>
      ))}
    </div>
    
    {/* Chart placeholder */}
    <div className="p-6 bg-white rounded-2xl border border-[#DFD2C4]/30 h-64 flex items-center justify-center">
      <div className="w-full h-full bg-[#DFD2C4]/20 rounded-xl"></div>
    </div>
  </div>
);

/**
 * Skeleton Screen para lista de pacientes
 */
export const PatientListSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="p-4 bg-white rounded-xl border border-[#DFD2C4]/20 flex items-center gap-4">
        <div className="w-12 h-12 bg-[#DFD2C4]/30 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-[#DFD2C4]/30 rounded w-2/3"></div>
          <div className="h-2.5 bg-[#DFD2C4]/20 rounded w-1/2"></div>
        </div>
        <div className="w-20 h-8 bg-[#DFD2C4]/30 rounded"></div>
      </div>
    ))}
  </div>
);

/**
 * Skeleton Screen para formulario
 */
export const FormSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="h-3 bg-[#DFD2C4]/30 rounded w-1/4"></div>
        <div className="h-10 bg-[#DFD2C4]/30 rounded-xl"></div>
      </div>
    ))}
  </div>
);

/**
 * Skeleton Screen para ficha de laboratorio
 */
export const LabJobSkeleton = () => (
  <div className="animate-pulse space-y-4 p-6 bg-white rounded-2xl border border-[#DFD2C4]/30">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-16 h-16 bg-[#DFD2C4]/30 rounded-xl"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-[#DFD2C4]/30 rounded w-2/3"></div>
        <div className="h-3 bg-[#DFD2C4]/20 rounded w-1/2"></div>
      </div>
    </div>
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-3 bg-[#DFD2C4]/30 rounded"></div>
      ))}
    </div>
  </div>
);

/**
 * Skeleton Screen genérico para tarjeta
 */
export const CardSkeleton = ({ lines = 3 }) => (
  <div className="animate-pulse space-y-3 p-4 bg-white rounded-xl border border-[#DFD2C4]/20">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className={`h-3 bg-[#DFD2C4]/30 rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}></div>
    ))}
  </div>
);

/**
 * Wrapper que muestra skeleton mientras carga
 */
export const SkeletonWrapper = ({ isLoading, children, skeleton: SkeletonComponent = CardSkeleton }) => {
  if (isLoading) {
    return <SkeletonComponent />;
  }
  return children;
};
