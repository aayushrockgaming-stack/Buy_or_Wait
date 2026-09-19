export type AffordabilityStatus = 
  | 'affordable_now'
  | 'affordable_with_plan'
  | 'affordable_later'
  | 'not_affordable';

export type PaymentMethod = 
  | 'full_payment'
  | 'partial_payment'
  | 'installments'
  | 'wait'
  | 'not_recommended';

export interface FinancialProfile {
  user_id: string;
  user_name: string;
  home_currency: string;
  current_available_balance: number;
  minimum_balance_to_keep: number;
  financial_priorities: string;
  protected_spending_categories: string[];
  adjustable_spending_categories: string[];
  payment_methods_user_will_consider: PaymentMethod[];
  max_installment_months: number | null;
}

export interface FinancialEvent {
  event_id: string;
  user_id: string;
  event_type: 'transaction' | 'salary' | 'investment' | 'bill' | 'transfer';
  description: string;
  category: string;
  direction: 'credit' | 'debit';
  amount: number;
  currency: string;
  event_date: string;
  settlement_date: string | null;
  status: 'settled' | 'pending' | 'confirmed' | 'cancelled' | 'unrealized';
  linked_event_id: string | null;
  flexibility: 'protected' | 'flexible' | null;
  minimum_allowed_amount: number | null;
  is_recurring?: boolean;
  frequency_days?: number;
}

export interface RequestPaymentOption {
  request_id: string;
  payment_option_id: string;
  payment_method: PaymentMethod;
  first_payment_date: string;
  payment_frequency_days: number;
  number_of_payments: number;
  payment_amount: number;
  financing_fee: number;
  total_payable_amount: number;
}

export interface RequestItem {
  request_id: string;
  user_id: string;
  request_date: string;
  request_type: string;
  requested_amount: number;
  desired_completion_date: string;
  allows_partial_payment: boolean;
  request_text: string;
}

export interface CandidatePlan {
  id: string;
  payment_method: PaymentMethod;
  payment_option_id?: string;
  payment_schedule: { date: string; amount: number }[];
  spending_changes: string[];
  total_cost: number;
  is_safe: boolean;
  first_payment_date: string;
  number_of_payments: number;
  rejection_reason?: string;
}

export interface EvaluationResult {
  request_id: string;
  amount_safe_to_pay: number;
  affordability_status: AffordabilityStatus;
  recommended_payment_method: PaymentMethod;
  payment_plan: string;
  earliest_date_for_full_payment: string;
  spending_changes_needed: string;
  decision_explanation: string;
  winning_candidate?: CandidatePlan;
  evaluated_at: string;
}

export interface SimulationDay {
  date: string;
  starting_balance: number;
  income: number;
  pending_debits: number;
  essential_expenses: number;
  flexible_expenses: number;
  request_payments: number;
  ending_balance: number;
  minimum_reserve: number;
  is_safe: boolean;
  events: { name: string; amount: number; type: 'income' | 'expense' | 'payment' }[];
}

export interface SavedEvaluation {
  id: string;
  userId: string;
  requestTitle: string;
  requestedAmount: number;
  currency: string;
  result: EvaluationResult;
  timestamp: string;
}
