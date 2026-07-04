# Notas de Deuda Técnica Financiera

## Hallazgos en useClinicData.js y FinanceCenter.jsx
1.  **Inconsistencia de Conteo (Head Count):**
    *   `useClinicData.js` carga `financials` basados en un `dateRange` (por defecto 90 días).
    *   `App.jsx` calcula `totalCollected`, `totalExpenses` y `netProfit` usando **todos** los registros cargados en `financialRecords`.
    *   `FinanceCenter.jsx` recibe estas métricas globales por props, pero también calcula sus propias métricas locales (`filteredCollected`, `filteredExpenses`, `filteredProfit`) basándose en los mismos registros cargados.
    *   **El problema:** Si el usuario cambia el rango de fechas en `FinanceCenter`, se dispara `loadFinancials` en el hook, lo que actualiza `financialRecords`. Sin embargo, hay una confusión entre "lo que hay en memoria" y "lo que representa el rango seleccionado".
    *   **Corrección sugerida:** Asegurar que `totalCollected` y compañía en `App.jsx` siempre reflejen fielmente lo que está en `financialRecords`, y que `FinanceCenter` use estas métricas de forma consistente. La inconsistencia de "Head Count" mencionada en `PENDIENTES.md` probablemente se refiere a que el dashboard o los reportes no coinciden con el total real de registros si la paginación o el filtrado por fecha no es exacto.

## Hallazgos en Reset Password
*   `ResetPasswordPage.jsx` es funcional pero básico. No maneja estados de error de Supabase (como enlaces expirados) de forma elegante antes de intentar el cambio.

## Hallazgos en Welcome Tour
*   `WelcomeTour.jsx` necesita actualizar los pasos para incluir las nuevas secciones (como Laboratorios) y mejorar la UX en móviles (cerrar el menú al terminar).
