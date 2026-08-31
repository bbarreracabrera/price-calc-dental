import React, { Suspense, lazy } from 'react';
import { Shield, Menu } from 'lucide-react';
import LoadingScreen from './LoadingScreen';
import { Card } from './UIComponents';
import { ArrowRight } from 'lucide-react';
import { PatientSelect } from './SystemModals';

// Lazy imports para optimizar bundle size
const MasterPanel      = lazy(() => import('./MasterPanel'));
const DashboardView    = lazy(() => import('./DashboardView'));
const FinanceCenter    = lazy(() => import('./FinanceCenter'));
const CatalogView      = lazy(() => import('./CatalogView'));
const InventoryView    = lazy(() => import('./InventoryView'));
const LabView          = lazy(() => import('./LabView'));
const SettingsView     = lazy(() => import('./SettingsView'));
const QuoteView        = lazy(() => import('./QuoteView'));
const AgendaView       = lazy(() => import('./AgendaView'));
const PrescriptionView = lazy(() => import('./PrescriptionView'));
const CRMView          = lazy(() => import('./CRMView'));
const PatientWorkspace = lazy(() => import('./PatientWorkspace'));
const SterilizationView = lazy(() => import('./SterilizationView'));
const SupplyView       = lazy(() => import('./SupplyView'));
const HelpView         = lazy(() => import('./HelpView'));
const LegalText        = lazy(() => import('./LegalText'));

export default function MainViewManager(props) {
    const {
        activeTab, isMasterAdmin, supabase, notify, config, userRole, themeMode, t,
        totalCollected, totalExpenses, netProfit, chartData, todaysAppointments,
        setActiveTab, setFinanceTab, setModal, openApptModal, setSelectedPatientId,
        setQuoteMode, lowStockItems, pendingLabWorks, expirationAlerts, incomeRecords,
        financeTab, financialRecords, setFinancialRecords, expenseRecords, totalDebt,
        patientRecords, saveToSupabase, sendWhatsApp, getPatientPhone, onOpenAbonoModal,
        session, team, setTeam, clinicOwner, isLoadingFinancials, hasOlderData, dateRange, setDateRange,
        catalog, setCatalog, setNewCatalogItem, inventory, setInventory, filteredInventory,
        inventorySearch, setInventorySearch, setNewItem, labWorks, setLabWorks, setNewLabWork,
        setConfigLocal, logoInputRef, handleLogoUpload, newMember, setNewMember,
        quoteItems, setQuoteItems, newQuoteItem, setNewQuoteItem, sessionData, setSessionData,
        getPatient, savePatientData, handleGeneratePDF, appointments, setNewAppt,
        setPatientRecords, rxPatient, setRxPatient, medInput, setMedInput, prescription,
        setPrescription, getRecalls, supplyOrders, handleOrderCreate, sterilizationItems,
        setSterilizationItems, saveToSupabaseWrapper, setShowImportModal, setPatientSearchQuery,
        patientSearchQuery, filteredPatientKeys, totalPatients, hasMorePatients, loadMorePatients,
        patientsLoading, selectedPatientId, patientTab, setPatientTab, activeFormType,
        setActiveFormType, viewingForm, setViewingForm, odontogramMode, setOdontogramMode,
        odontogramType, setOdontogramType, toothModalData, setToothModalData, isListening,
        voiceStatus, toggleVoice, voiceConfirmationEnabled, toggleVoiceConfirmation,
        newEvolution, setNewEvolution, activeFolder, setActiveFolder,
        uploading, consentTemplate, setConsentTemplate, consentText, setConsentText,
        setPerioData, restoreSnapshot, savePerioSnapshot, getPerioStats, logAction,
        handleImageUpload, setSelectedImg, setMobileMenuOpen, isWorkspaceActive
    } = props;

    return (
        <main className={`flex-1 flex flex-col p-3 sm:p-4 md:p-6 lg:p-8 min-h-0 overflow-y-auto transition-all duration-300 ${isWorkspaceActive ? 'md:ml-20' : 'md:ml-20 lg:ml-64'}`}>
            <div className="md:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
                <button onClick={() => setMobileMenuOpen(true)} className={`p-2 rounded-xl bg-[#FDFBF7] text-[#5C544D]`}><Menu /></button>
                <span className="font-black text-lg tracking-tight">ShiningCloud <span className="text-[#A3968B]">Dental</span></span>
                <div className="w-8"></div>
            </div>

            <Suspense fallback={<LoadingScreen />}>
                {activeTab === 'master_panel' && (
                    isMasterAdmin ? (
                        <MasterPanel supabase={supabase} notify={notify} session={session} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-24 px-6 text-center">
                            <Shield size={48} className="text-[#A3968B] mb-4 opacity-60" />
                            <h2 className="text-xl font-black text-[#312923] mb-2">Acceso restringido</h2>
                            <p className="text-sm text-[#9A8F84] mb-6 max-w-xs">Este panel está reservado para administradores del sistema.</p>
                            <button onClick={() => setActiveTab('dashboard')} className="px-5 py-2.5 bg-[#312923] text-white rounded-2xl font-bold text-sm hover:bg-black transition-colors">
                                Volver al inicio
                            </button>
                        </div>
                    )
                )}
                {activeTab === 'dashboard' && <DashboardView config={config} userRole={userRole} themeMode={themeMode} t={t} totalCollected={totalCollected} totalExpenses={totalExpenses} netProfit={netProfit} chartData={chartData} todaysAppointments={todaysAppointments} setActiveTab={setActiveTab} setFinanceTab={setFinanceTab} setModal={setModal} openApptModal={openApptModal} setSelectedPatientId={setSelectedPatientId} setQuoteMode={setQuoteMode} lowStockItems={lowStockItems} pendingLabWorks={pendingLabWorks} expirationAlerts={expirationAlerts} incomeRecords={incomeRecords} />}
                {activeTab === 'history' && (userRole === 'admin' || userRole === 'assistant' || userRole === 'dentist') && <FinanceCenter themeMode={themeMode} t={t} financeTab={financeTab} setFinanceTab={setFinanceTab} financialRecords={financialRecords} setFinancialRecords={setFinancialRecords} incomeRecords={incomeRecords} expenseRecords={expenseRecords} totalCollected={totalCollected} totalExpenses={totalExpenses} totalDebt={totalDebt} netProfit={netProfit} patientRecords={patientRecords} saveToSupabase={saveToSupabase} notify={notify} sendWhatsApp={sendWhatsApp} getPatientPhone={getPatientPhone} onOpenAbonoModal={onOpenAbonoModal} session={session} team={team} userRole={userRole} adminEmail={clinicOwner} isLoadingFinancials={isLoadingFinancials} hasOlderData={hasOlderData} dateRange={dateRange} setDateRange={setDateRange} />}
                {activeTab === 'catalog' && (userRole === 'admin' || userRole === 'dentist') && <CatalogView themeMode={themeMode} t={t} catalog={catalog} setCatalog={setCatalog} clinicOwner={clinicOwner} session={session} setNewCatalogItem={setNewCatalogItem} setModal={setModal} saveToSupabase={saveToSupabase} notify={notify} />}
                {activeTab === 'inventory' && (userRole === 'admin' || userRole === 'assistant' || userRole === 'dentist') && <InventoryView themeMode={themeMode} t={t} inventory={inventory} setInventory={setInventory} filteredInventory={filteredInventory} inventorySearch={inventorySearch} setInventorySearch={setInventorySearch} setNewItem={setNewItem} setModal={setModal} saveToSupabase={saveToSupabase} session={session} team={team} notify={notify} />}
                {activeTab === 'lab' && <LabView themeMode={themeMode} t={t} labWorks={labWorks} setLabWorks={setLabWorks} setNewLabWork={setNewLabWork} setModal={setModal} notify={notify} team={team} sendWhatsApp={sendWhatsApp} config={config} />}
                {activeTab === 'settings' && <SettingsView themeMode={themeMode} t={t} config={config} setConfigLocal={setConfigLocal} logoInputRef={logoInputRef} handleLogoUpload={handleLogoUpload} userRole={userRole} saveToSupabase={saveToSupabase} notify={notify} team={team} setTeam={setTeam} newMember={newMember} setNewMember={setNewMember} session={session} />}
                {activeTab === 'help' && <HelpView />}
                {activeTab === 'terms' && <LegalText />}
                {activeTab === 'quote' && (userRole === 'admin' || userRole === 'dentist' || userRole === 'assistant') && <QuoteView themeMode={themeMode} t={t} quoteItems={quoteItems} setQuoteItems={setQuoteItems} newQuoteItem={newQuoteItem} setNewQuoteItem={setNewQuoteItem} catalog={catalog} patientRecords={patientRecords} sessionData={sessionData} setSessionData={setSessionData} getPatient={getPatient} savePatientData={savePatientData} saveToSupabase={saveToSupabase} notify={notify} generatePDF={handleGeneratePDF} setActiveTab={setActiveTab} adminEmail={clinicOwner} />}
                {activeTab === 'agenda' && <AgendaView themeMode={themeMode} t={t} appointments={appointments} team={team} onOpenModal={(apptData) => { setNewAppt(apptData); setModal('appt'); }} onGoToPatient={(patientId) => { setSelectedPatientId(patientId); setActiveTab('ficha'); }} />}
                {activeTab === 'clinical' && (userRole === 'admin' || userRole === 'dentist') && <PrescriptionView themeMode={themeMode} t={t} patientRecords={patientRecords} getPatient={getPatient} savePatientData={savePatientData} setPatientRecords={setPatientRecords} rxPatient={rxPatient} setRxPatient={setRxPatient} medInput={medInput} setMedInput={setMedInput} prescription={prescription} setPrescription={setPrescription} notify={notify} generatePDF={handleGeneratePDF} adminEmail={clinicOwner} />}
                {activeTab === 'recalls' && (userRole === 'admin' || userRole === 'assistant') && <CRMView themeMode={themeMode} t={t} getRecalls={getRecalls} patientRecords={patientRecords} setActiveTab={setActiveTab} setSelectedPatientId={setSelectedPatientId} sendWhatsApp={sendWhatsApp} getPatientPhone={getPatientPhone} />}
                {activeTab === 'supply' && (userRole === 'admin' || userRole === 'dentist') && <SupplyView orders={supplyOrders} catalog={catalog} onOrderCreate={handleOrderCreate} notify={notify} />}
                {activeTab === 'sterilization' && (userRole === 'admin' || userRole === 'assistant' || userRole === 'dentist') && <SterilizationView themeMode={themeMode} t={t} sterilizationItems={sterilizationItems} setSterilizationItems={setSterilizationItems} saveToSupabase={saveToSupabaseWrapper} supabase={supabase} notify={notify} session={session} config={config} />}

                {activeTab === 'ficha' && !selectedPatientId && (
                    <div className="space-y-4 animate-in slide-in-from-bottom">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="shrink-0 px-4 py-3 bg-[#FDFBF7] border border-[#DFD2C4] rounded-2xl text-sm font-black text-[#312923] hover:bg-[#DFD2C4]/30 transition-colors whitespace-nowrap"
                                title="Importar pacientes desde CSV"
                            >
                                📥 CSV
                            </button>
                            <PatientSelect theme={themeMode} patients={patientRecords} placeholder="Buscar o Crear Paciente..." adminEmail={clinicOwner} onQueryChange={setPatientSearchQuery} onSelect={async (p) => {
                                if (p.id === 'new') {
                                    let nombreReal = p.name;
                                    if (!nombreReal || nombreReal.trim() === "") { nombreReal = await prompt("Confirma el nombre del nuevo paciente:"); if (!nombreReal) return; }
                                    const newId = "pac_" + Date.now().toString();
                                    const newPatient = getPatient(newId);
                                    newPatient.id = newId; newPatient.name = nombreReal;
                                    if (!newPatient.personal) newPatient.personal = {};
                                    newPatient.personal.legalName = nombreReal;
                                    savePatientData(newId, newPatient);
                                    setSelectedPatientId(newId);
                                    notify("Paciente Creado Exitosamente");
                                } else {
                                    setPatientRecords(prev => ({ ...prev, [p.id]: p }));
                                    setSelectedPatientId(p.id);
                                }
                            }} />
                        </div>
                        {totalPatients > 0 && (
                            <p className="text-[11px] font-bold text-[#A3968B] uppercase tracking-widest px-1">
                                {patientSearchQuery.length >= 2
                                    ? `${filteredPatientKeys.length} resultado${filteredPatientKeys.length !== 1 ? 's' : ''} para "${patientSearchQuery}"`
                                    : `Mostrando ${Object.keys(patientRecords).length} de ${totalPatients} pacientes`}
                            </p>
                        )}
                        <div className="grid gap-3">
                            {filteredPatientKeys.map(k => (
                                <Card key={k} onClick={() => setSelectedPatientId(k)} className="cursor-pointer py-5 px-6 flex justify-between items-center group hover:bg-white hover:border-[#A3968B] transition-all">
                                    <span className="font-bold capitalize text-[#2A2421] group-hover:text-[#A3968B]">{patientRecords[k]?.personal?.legalName || 'Paciente sin nombre'}</span>
                                    <div className="w-8 h-8 rounded-full bg-[#FDFBF7] flex items-center justify-center text-[#5C544D] group-hover:bg-[#E5E7EB] transition-colors">
                                        <ArrowRight size={16} />
                                    </div>
                                </Card>
                            ))}
                            {filteredPatientKeys.length === 0 && patientSearchQuery.length >= 2 && (
                                <div className="text-center py-10 bg-[#FDFBF7] border border-dashed border-[#DFD2C4] rounded-3xl">
                                    <p className="text-sm font-bold text-[#9A8F84]">No se encontraron pacientes con "{patientSearchQuery}"</p>
                                </div>
                            )}
                        </div>
                        {hasMorePatients && (
                            <button
                                onClick={loadMorePatients}
                                disabled={patientsLoading}
                                className="w-full py-3 bg-[#FDFBF7] border border-[#DFD2C4] rounded-2xl text-sm font-black text-[#312923] hover:bg-[#DFD2C4]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {patientsLoading ? 'Cargando...' : `Cargar más (${totalPatients - Object.keys(patientRecords).length} restantes)`}
                            </button>
                        )}
                    </div>
                )}

                {activeTab === 'ficha' && selectedPatientId && (
                    <PatientWorkspace
                        selectedPatientId={selectedPatientId} setSelectedPatientId={setSelectedPatientId}
                        patientTab={patientTab} setPatientTab={setPatientTab}
                        userRole={userRole} themeMode={themeMode} session={session} clinicOwner={clinicOwner}
                        patientRecords={patientRecords} setActiveTab={setActiveTab} activeFormType={activeFormType}
                        setActiveFormType={setActiveFormType} viewingForm={viewingForm} setViewingForm={setViewingForm}
                        odontogramMode={odontogramMode} setOdontogramMode={setOdontogramMode}
                        odontogramType={odontogramType} setOdontogramType={setOdontogramType}
                        toothModalData={toothModalData} setToothModalData={setToothModalData}
                        catalog={catalog} sessionData={sessionData} setSessionData={setSessionData}
                        isListening={isListening} voiceStatus={voiceStatus} toggleVoice={toggleVoice}
                        voiceConfirmationEnabled={voiceConfirmationEnabled} toggleVoiceConfirmation={toggleVoiceConfirmation}
                        newEvolution={newEvolution} setNewEvolution={setNewEvolution}
                        activeFolder={activeFolder} setActiveFolder={setActiveFolder}
                        uploading={uploading} consentTemplate={consentTemplate} setConsentTemplate={setConsentTemplate}
                        consentText={consentText} setConsentText={setConsentText} modal={props.modal}
                        getPatient={getPatient} savePatientData={savePatientData}
                        setPatientRecords={setPatientRecords} setModal={setModal}
                        setQuoteItems={setQuoteItems} setPerioData={setPerioData}
                        restoreSnapshot={restoreSnapshot} savePerioSnapshot={savePerioSnapshot}
                        getPerioStats={getPerioStats} logAction={logAction}
                        handleGeneratePDF={handleGeneratePDF} handleImageUpload={handleImageUpload}
                        notify={notify} sendWhatsApp={sendWhatsApp} setSelectedImg={setSelectedImg}
                        config={config}
                    />
                )}
            </Suspense>
        </main>
    );
}
