import type { FinancialProfile, FinancialEvent, RequestItem, RequestPaymentOption } from '../types';

export const PROFILES: Record<string, FinancialProfile> = {
  usr_001: {
    user_id: 'usr_001',
    user_name: 'Alex Rivera',
    home_currency: 'USD',
    current_available_balance: 4550.00,
    minimum_balance_to_keep: 1000.00,
    financial_priorities: 'Maintain reserve balance and complete educational goals.',
    protected_spending_categories: ['Housing', 'Utilities', 'Healthcare'],
    adjustable_spending_categories: ['Dining Out', 'Subscriptions', 'Entertainment'],
    payment_methods_user_will_consider: ['full_payment', 'partial_payment', 'installments', 'wait'],
    max_installment_months: 6
  },
  usr_002: {
    user_id: 'usr_002',
    user_name: 'Priya Sharma',
    home_currency: 'INR',
    current_available_balance: 185000.00,
    minimum_balance_to_keep: 40000.00,
    financial_priorities: 'Emergency cushion and debt reduction.',
    protected_spending_categories: ['Rent', 'Groceries', 'Insurance'],
    adjustable_spending_categories: ['Shopping', 'Fitness', 'Travel'],
    payment_methods_user_will_consider: ['full_payment', 'installments', 'wait'],
    max_installment_months: 12
  },
  usr_003: {
    user_id: 'usr_003',
    user_name: 'Lars Lindqvist',
    home_currency: 'EUR',
    current_available_balance: 2800.00,
    minimum_balance_to_keep: 800.00,
    financial_priorities: 'Travel and skill acquisition.',
    protected_spending_categories: ['Rent', 'Utilities'],
    adjustable_spending_categories: ['Hobbies', 'Dining Out'],
    payment_methods_user_will_consider: ['full_payment', 'partial_payment', 'wait'],
    max_installment_months: null
  },
  usr_004: {
    user_id: 'usr_004',
    user_name: 'Sipho Ndlovu',
    home_currency: 'ZAR',
    current_available_balance: 32000.00,
    minimum_balance_to_keep: 5000.00,
    financial_priorities: 'Family transfers and essential living costs.',
    protected_spending_categories: ['Family Care', 'Housing'],
    adjustable_spending_categories: ['Leisure', 'Subscriptions'],
    payment_methods_user_will_consider: ['full_payment', 'partial_payment', 'installments', 'wait'],
    max_installment_months: 3
  },
  usr_005: {
    user_id: 'usr_005',
    user_name: 'Budi Santoso',
    home_currency: 'IDR',
    current_available_balance: 45000000.00,
    minimum_balance_to_keep: 10000000.00,
    financial_priorities: 'Business growth and equipment purchase.',
    protected_spending_categories: ['Operational Essentials', 'Health'],
    adjustable_spending_categories: ['Entertainment', 'Gadgets'],
    payment_methods_user_will_consider: ['full_payment', 'installments', 'wait'],
    max_installment_months: 12
  }
};

export const SAMPLE_EVENTS: FinancialEvent[] = [
  {
    event_id: 'evt_001_sal_1',
    user_id: 'usr_001',
    event_type: 'salary',
    description: 'Monthly Salary Tech Corp',
    category: 'Income',
    direction: 'credit',
    amount: 3200.00,
    currency: 'USD',
    event_date: '2026-08-01',
    settlement_date: '2026-08-01',
    status: 'settled',
    linked_event_id: null,
    flexibility: null,
    minimum_allowed_amount: null,
    is_recurring: true,
    frequency_days: 30
  },
  {
    event_id: 'evt_001_sal_2',
    user_id: 'usr_001',
    event_type: 'salary',
    description: 'Monthly Salary Tech Corp',
    category: 'Income',
    direction: 'credit',
    amount: 3200.00,
    currency: 'USD',
    event_date: '2026-09-01',
    settlement_date: '2026-09-01',
    status: 'settled',
    linked_event_id: null,
    flexibility: null,
    minimum_allowed_amount: null,
    is_recurring: true,
    frequency_days: 30
  },
  {
    event_id: 'evt_001_rent',
    user_id: 'usr_001',
    event_type: 'bill',
    description: 'Apartment Monthly Rent',
    category: 'Housing',
    direction: 'debit',
    amount: 1400.00,
    currency: 'USD',
    event_date: '2026-09-05',
    settlement_date: '2026-09-05',
    status: 'settled',
    linked_event_id: null,
    flexibility: 'protected',
    minimum_allowed_amount: null,
    is_recurring: true,
    frequency_days: 30
  },
  {
    event_id: 'evt_001_gym',
    user_id: 'usr_001',
    event_type: 'bill',
    description: 'Premium Fitness Club Subscription',
    category: 'Fitness',
    direction: 'debit',
    amount: 120.00,
    currency: 'USD',
    event_date: '2026-09-10',
    settlement_date: '2026-09-10',
    status: 'settled',
    linked_event_id: null,
    flexibility: 'flexible',
    minimum_allowed_amount: 30.00,
    is_recurring: true,
    frequency_days: 30
  },
  {
    event_id: 'evt_001_sub',
    user_id: 'usr_001',
    event_type: 'bill',
    description: 'Streaming & Cloud Storage Bundle',
    category: 'Subscriptions',
    direction: 'debit',
    amount: 65.00,
    currency: 'USD',
    event_date: '2026-09-15',
    settlement_date: null,
    status: 'pending',
    linked_event_id: null,
    flexibility: 'flexible',
    minimum_allowed_amount: 0.00,
    is_recurring: true,
    frequency_days: 30
  },
  {
    event_id: 'evt_002_sal',
    user_id: 'usr_002',
    event_type: 'salary',
    description: 'Corporate Payroll Deposit',
    category: 'Income',
    direction: 'credit',
    amount: 95000.00,
    currency: 'INR',
    event_date: '2026-09-01',
    settlement_date: '2026-09-01',
    status: 'settled',
    linked_event_id: null,
    flexibility: null,
    minimum_allowed_amount: null,
    is_recurring: true,
    frequency_days: 30
  },
  {
    event_id: 'evt_002_rent',
    user_id: 'usr_002',
    event_type: 'bill',
    description: 'Residential Apartment Rent',
    category: 'Rent',
    direction: 'debit',
    amount: 32000.00,
    currency: 'INR',
    event_date: '2026-09-05',
    settlement_date: '2026-09-05',
    status: 'settled',
    linked_event_id: null,
    flexibility: 'protected',
    minimum_allowed_amount: null,
    is_recurring: true,
    frequency_days: 30
  }
];

export const SAMPLE_REQUESTS: RequestItem[] = [
  {
    request_id: 'req_101',
    user_id: 'usr_001',
    request_date: '2026-09-19',
    request_type: 'purchase',
    requested_amount: 1200.00,
    desired_completion_date: '2026-11-15',
    allows_partial_payment: true,
    request_text: 'Can I afford this M3 MacBook Air laptop for work and side projects?'
  },
  {
    request_id: 'req_102',
    user_id: 'usr_001',
    request_date: '2026-09-19',
    request_type: 'travel',
    requested_amount: 3800.00,
    desired_completion_date: '2026-10-30',
    allows_partial_payment: false,
    request_text: 'Can I book a 2-week vacation flight and hotel package to Europe?'
  },
  {
    request_id: 'req_103',
    user_id: 'usr_002',
    request_date: '2026-09-19',
    request_type: 'education',
    requested_amount: 65000.00,
    desired_completion_date: '2026-12-01',
    allows_partial_payment: true,
    request_text: 'Can I enroll in an Executive AI Certification Course?'
  },
  {
    request_id: 'req_104',
    user_id: 'usr_003',
    request_date: '2026-09-19',
    request_type: 'housing',
    requested_amount: 1500.00,
    desired_completion_date: '2026-10-15',
    allows_partial_payment: false,
    request_text: 'Can I pay my annual home security & heating maintenance upgrade upfront?'
  }
];

export const SAMPLE_OPTIONS: Record<string, RequestPaymentOption[]> = {
  req_101: [
    {
      request_id: 'req_101',
      payment_option_id: 'opt_101_full',
      payment_method: 'full_payment',
      first_payment_date: '2026-09-19',
      payment_frequency_days: 0,
      number_of_payments: 1,
      payment_amount: 1200.00,
      financing_fee: 0.00,
      total_payable_amount: 1200.00
    },
    {
      request_id: 'req_101',
      payment_option_id: 'opt_101_inst3',
      payment_method: 'installments',
      first_payment_date: '2026-09-19',
      payment_frequency_days: 30,
      number_of_payments: 3,
      payment_amount: 400.00,
      financing_fee: 0.00,
      total_payable_amount: 1200.00
    },
    {
      request_id: 'req_101',
      payment_option_id: 'opt_101_inst6',
      payment_method: 'installments',
      first_payment_date: '2026-09-19',
      payment_frequency_days: 30,
      number_of_payments: 6,
      payment_amount: 210.00,
      financing_fee: 60.00,
      total_payable_amount: 1260.00
    }
  ],
  req_102: [
    {
      request_id: 'req_102',
      payment_option_id: 'opt_102_full',
      payment_method: 'full_payment',
      first_payment_date: '2026-09-19',
      payment_frequency_days: 0,
      number_of_payments: 1,
      payment_amount: 3800.00,
      financing_fee: 0.00,
      total_payable_amount: 3800.00
    }
  ],
  req_103: [
    {
      request_id: 'req_103',
      payment_option_id: 'opt_103_full',
      payment_method: 'full_payment',
      first_payment_date: '2026-09-19',
      payment_frequency_days: 0,
      number_of_payments: 1,
      payment_amount: 65000.00,
      financing_fee: 0.00,
      total_payable_amount: 65000.00
    },
    {
      request_id: 'req_103',
      payment_option_id: 'opt_103_inst4',
      payment_method: 'installments',
      first_payment_date: '2026-09-19',
      payment_frequency_days: 30,
      number_of_payments: 4,
      payment_amount: 16250.00,
      financing_fee: 0.00,
      total_payable_amount: 65000.00
    }
  ]
};
