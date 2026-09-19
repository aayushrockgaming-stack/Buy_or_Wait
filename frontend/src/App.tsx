import { useState, useEffect } from 'react';
import { Sidebar, type TabType } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { PurchaseAnalysisDashboard } from './components/PurchaseAnalysisDashboard';
import { RequestEvaluator } from './components/RequestEvaluator';
import { CashflowChart } from './components/CashflowChart';
import { StressStudio } from './components/StressStudio';
import { PaymentMatrix } from './components/PaymentMatrix';
import { CurrencyConverter } from './components/CurrencyConverter';
import { LedgerWorkbench } from './components/LedgerWorkbench';
import { SavingsPlanner } from './components/SavingsPlanner';
import { SubscriptionAudit } from './components/SubscriptionAudit';
import { FirebaseDrawer } from './components/FirebaseDrawer';
import { EvidenceModal } from './components/EvidenceModal';
import { Footer } from './components/Footer';

import { PROFILES, SAMPLE_EVENTS, SAMPLE_OPTIONS, SAMPLE_REQUESTS } from './data/mockData';
import type { FinancialProfile, FinancialEvent, RequestPaymentOption, EvaluationResult, SimulationDay, SavedEvaluation, RequestItem } from './types';
import { saveEvaluationToCloud } from './firebase';
import { checkBackendHealth, fetchProfilesFromApi, fetchUserLedgerFromApi, evaluateRequestViaApi } from './api/client';

export function App() {
  const [profiles, setProfiles] = useState<Record<string, FinancialProfile>>(PROFILES);
  const [currentProfileId, setCurrentProfileId] = useState<string>('usr_001');
  const [userEvents, setUserEvents] = useState<FinancialEvent[]>(SAMPLE_EVENTS);
  const [simulationDays, setSimulationDays] = useState<SimulationDay[]>([]);
  const [currentResult, setCurrentResult] = useState<EvaluationResult | null>(null);

  const [isFirebaseDrawerOpen, setIsFirebaseDrawerOpen] = useState<boolean>(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState<boolean>(false);
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState<boolean>(false);
  const [isLiveApiConnected, setIsLiveApiConnected] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  useEffect(() => {
    const initApi = async () => {
      const isHealthy = await checkBackendHealth();
      setIsLiveApiConnected(isHealthy);
      if (isHealthy) {
        const loadedProfiles = await fetchProfilesFromApi();
        setProfiles(loadedProfiles);
        if (!loadedProfiles[currentProfileId]) {
          const firstKey = Object.keys(loadedProfiles)[0];
          if (firstKey) setCurrentProfileId(firstKey);
        }
      }
    };
    initApi();
  }, []);

  useEffect(() => {
    const loadLedgerAndRun = async () => {
      let events = SAMPLE_EVENTS;
      if (isLiveApiConnected) {
        events = await fetchUserLedgerFromApi(currentProfileId);
        setUserEvents(events);
      }
      // Initial evaluation run for usr_001
      const defaultReq: RequestItem = {
        request_id: 'req_101',
        user_id: currentProfileId,
        request_date: '2026-09-19',
        request_type: 'purchase',
        requested_amount: 1200,
        desired_completion_date: '2026-11-15',
        allows_partial_payment: true,
        request_text: 'Can I afford this M3 MacBook Air laptop for work and side projects?'
      };
      const defaultOpts = SAMPLE_OPTIONS['req_101'] || [];
      const currentProf = profiles[currentProfileId] || PROFILES['usr_001'];
      const res = await evaluateRequestViaApi(currentProf, events, defaultReq, defaultOpts);
      setCurrentResult(res.result);
      setSimulationDays(res.simulation);
    };
    loadLedgerAndRun();
  }, [currentProfileId, isLiveApiConnected]);

  const profile: FinancialProfile = profiles[currentProfileId] || PROFILES['usr_001'] || {
    user_id: currentProfileId,
    user_name: `User ${currentProfileId}`,
    home_currency: 'USD',
    current_available_balance: 1000,
    minimum_balance_to_keep: 100,
    financial_priorities: 'Reserve maintenance',
    protected_spending_categories: ['Housing'],
    adjustable_spending_categories: ['Dining Out'],
    payment_methods_user_will_consider: ['full_payment', 'partial_payment', 'installments', 'wait'],
    max_installment_months: 6
  };

  const handleEvaluationComplete = (result: EvaluationResult, simulation: SimulationDay[]) => {
    setCurrentResult(result);
    setSimulationDays(simulation);
  };

  const handleSelectRequestFromDashboard = async (sampleId: string) => {
    const sample = SAMPLE_REQUESTS.find(r => r.request_id === sampleId);
    if (!sample) return;
    const activeReq: RequestItem = {
      request_id: sampleId,
      user_id: profile.user_id,
      request_date: sample.request_date,
      request_type: sample.request_type,
      requested_amount: Number(sample.requested_amount),
      desired_completion_date: sample.desired_completion_date,
      allows_partial_payment: sample.allows_partial_payment,
      request_text: sample.request_text
    };
    const opts = SAMPLE_OPTIONS[sampleId] || [];
    const { result, simulation } = await evaluateRequestViaApi(profile, userEvents, activeReq, opts);
    setCurrentResult(result);
    setSimulationDays(simulation);
  };

  const handleApplyStress = (_delayDays: number, emergencyBill: number, stoppedIds: string[]) => {
    if (simulationDays.length > 0) {
      const updatedSim = simulationDays.map((day) => {
        let adjustedEnd = day.ending_balance - emergencyBill;
        const stoppedSet = new Set(stoppedIds);
        let flexSavings = 0;
        for (const evt of userEvents) {
          if (stoppedSet.has(evt.event_id) && (evt.event_date === day.date || evt.settlement_date === day.date)) {
            flexSavings += Number(evt.amount);
          }
        }

        adjustedEnd += flexSavings;
        const isSafe = adjustedEnd >= profile.minimum_balance_to_keep;

        return {
          ...day,
          ending_balance: adjustedEnd,
          is_safe: isSafe
        };
      });

      setSimulationDays(updatedSim);
    }
  };

  const handleSaveToCloud = async (result: EvaluationResult, requestTitle: string, amount: number) => {
    const saved: SavedEvaluation = {
      id: `eval_${Date.now()}`,
      userId: profile.user_id,
      requestTitle,
      requestedAmount: amount,
      currency: profile.home_currency,
      result,
      timestamp: new Date().toISOString()
    };
    await saveEvaluationToCloud(saved);
    setIsFirebaseDrawerOpen(true);
  };

  const handleSelectSaved = (saved: SavedEvaluation) => {
    console.log('Loaded saved evaluation:', saved);
  };

  const options: RequestPaymentOption[] = SAMPLE_OPTIONS['req_101'] || [];

  return (
    <div className="min-h-screen bg-[#030305] text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-indigo-500/30 selection:text-indigo-200 flex">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        currentProfile={profile}
        profiles={profiles}
        onSelectProfile={(id) => setCurrentProfileId(id)}
        onOpenFirebaseDrawer={() => setIsFirebaseDrawerOpen(true)}
        isLiveApiConnected={isLiveApiConnected}
        isOpenMobile={isOpenMobileSidebar}
        onToggleMobile={() => setIsOpenMobileSidebar(!isOpenMobileSidebar)}
      />

      {/* Main Content Area (Shifted right for sidebar) */}
      <div className="flex-1 lg:ml-72 flex flex-col min-w-0">
        
        <Navbar
          currentProfile={profile}
          onToggleMobileSidebar={() => setIsOpenMobileSidebar(!isOpenMobileSidebar)}
        />

        <HeroSection profile={profile} />

        <main className="flex-1 space-y-6 pb-12">
          {activeTab === 'dashboard' && (
            <PurchaseAnalysisDashboard
              profile={profile}
              events={userEvents}
              currentResult={currentResult}
              simulationDays={simulationDays}
              onSelectRequest={handleSelectRequestFromDashboard}
              isLiveApiConnected={isLiveApiConnected}
            />
          )}

          {activeTab === 'simulator' && (
            <>
              <RequestEvaluator
                profile={profile}
                events={userEvents}
                onEvaluationComplete={handleEvaluationComplete}
                onSaveToCloud={handleSaveToCloud}
              />

              <CashflowChart
                simulationDays={simulationDays}
                profile={profile}
              />
            </>
          )}

          {activeTab === 'stress' && (
            <div className="space-y-6">
              <StressStudio
                profile={profile}
                events={userEvents}
                onApplyStress={handleApplyStress}
              />

              <CashflowChart
                simulationDays={simulationDays}
                profile={profile}
              />
            </div>
          )}

          {activeTab === 'matrix' && (
            <PaymentMatrix
              options={options}
              profile={profile}
              requestedAmount={1200}
              requestDate="2026-09-19"
              earliestSafeDate={currentResult?.earliest_date_for_full_payment || null}
            />
          )}

          {activeTab === 'planner' && (
            <SavingsPlanner profile={profile} />
          )}

          {activeTab === 'subscriptions' && (
            <SubscriptionAudit profile={profile} />
          )}

          {activeTab === 'converter' && (
            <CurrencyConverter
              initialAmount={1200}
              initialFromCurrency={profile.home_currency}
            />
          )}

          {activeTab === 'ledger' && (
            <LedgerWorkbench
              profile={profile}
              events={userEvents}
            />
          )}
        </main>

        <Footer />
      </div>

      {/* Modals & Drawers */}
      <FirebaseDrawer
        isOpen={isFirebaseDrawerOpen}
        onClose={() => setIsFirebaseDrawerOpen(false)}
        onSelectSaved={handleSelectSaved}
      />

      <EvidenceModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        imageId="image_01"
        imageTitle="Payroll Slip Attachment"
      />

    </div>
  );
}

export default App;
