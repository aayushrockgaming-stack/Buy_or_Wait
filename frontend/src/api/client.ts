import type { FinancialProfile, FinancialEvent, RequestItem, RequestPaymentOption, EvaluationResult, SimulationDay } from '../types';
import { evaluateAffordability } from '../engine/evaluator';
import { PROFILES, SAMPLE_EVENTS } from '../data/mockData';

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080/api';
let activeApiBaseUrl = DEFAULT_API_URL;

export interface EvaluateResponse {
  result: EvaluationResult;
  simulation: SimulationDay[];
  isLiveApi: boolean;
}

export const checkBackendHealth = async (): Promise<boolean> => {
  const candidateUrls = [
    import.meta.env.VITE_API_URL,
    'http://127.0.0.1:8080/api',
    'http://localhost:8000/api',
    'http://127.0.0.1:8000/api'
  ].filter(Boolean) as string[];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(`${url}/health`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'online') {
          activeApiBaseUrl = url;
          return true;
        }
      }
    } catch {
      // try next URL
    }
  }
  return false;
};

export const fetchProfilesFromApi = async (): Promise<Record<string, FinancialProfile>> => {
  try {
    const res = await fetch(`${activeApiBaseUrl}/profiles`);
    if (res.ok) {
      const list: FinancialProfile[] = await res.json();
      const map: Record<string, FinancialProfile> = {};
      for (const p of list) {
        map[p.user_id] = p;
      }
      return map;
    }
  } catch (err) {
    console.warn('Using local profiles fallback', err);
  }
  return PROFILES;
};

export const fetchUserLedgerFromApi = async (userId: string): Promise<FinancialEvent[]> => {
  try {
    const res = await fetch(`${activeApiBaseUrl}/profiles/${userId}/ledger`);
    if (res.ok) {
      const data = await res.json();
      return data.events || [];
    }
  } catch (err) {
    console.warn('Using local ledger fallback', err);
  }
  return SAMPLE_EVENTS.filter(e => e.user_id === userId);
};

export const evaluateRequestViaApi = async (
  profile: FinancialProfile,
  events: FinancialEvent[],
  request: RequestItem,
  options: RequestPaymentOption[]
): Promise<EvaluateResponse> => {
  try {
    const res = await fetch(`${activeApiBaseUrl}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: profile.user_id,
        request_id: request.request_id,
        request_date: request.request_date,
        request_type: request.request_type,
        requested_amount: Number(request.requested_amount),
        desired_completion_date: request.desired_completion_date,
        allows_partial_payment: request.allows_partial_payment,
        request_text: request.request_text,
        custom_payment_options: options
      })
    });

    if (res.ok) {
      const data = await res.json();
      const evalResult: EvaluationResult = {
        request_id: request.request_id,
        amount_safe_to_pay: data.amount_safe_to_pay,
        affordability_status: data.result.affordability_status,
        recommended_payment_method: data.result.recommended_payment_method,
        payment_plan: data.result.payment_plan,
        earliest_date_for_full_payment: data.earliest_date_for_full_payment,
        spending_changes_needed: data.result.spending_changes_needed,
        decision_explanation: data.result.decision_explanation,
        evaluated_at: new Date().toISOString()
      };

      return {
        result: evalResult,
        simulation: data.simulation,
        isLiveApi: true
      };
    }
  } catch (err) {
    console.warn('Live API call failed, running local evaluation engine', err);
  }

  // Fallback to client-side deterministic evaluation
  const fallback = evaluateAffordability(profile, events, request, options);
  return {
    result: fallback.result,
    simulation: fallback.simulation,
    isLiveApi: false
  };
};
