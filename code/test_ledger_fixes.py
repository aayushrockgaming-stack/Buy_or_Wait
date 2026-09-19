import unittest
from datetime import datetime
from data_loader import FinancialEvent, FinancialProfile, Request
from ledger import LedgerReconstructor, ResolvedEvent, CanonicalLedger

class MockDataset:
    def __init__(self, events):
        self.events = events
        self.financial_events_by_user_id = {'test_user': self.events}
        self.profiles_by_user_id = {
            'test_user': FinancialProfile(
                user_id='test_user',
                home_currency='USD',
                current_available_balance=5000.0,
                minimum_balance_to_keep=1000.0,
                financial_priorities="none",
                protected_spending_categories=[],
                adjustable_spending_categories=[],
                payment_methods_user_will_consider=["full_payment"],
                max_installment_months=12
            )
        }
        self.requests_by_id = {
            'req_1': Request(
                request_id='req_1',
                user_id='test_user',
                request_date='2026-04-01',
                request_type='shopping',
                requested_amount=500.0,
                desired_completion_date='2026-04-10',
                allows_partial_payment=False,
                request_text='test'
            )
        }
        
    def get_request(self, req_id):
        return self.requests_by_id[req_id]
        
    def get_profile(self, user_id):
        return self.profiles_by_user_id[user_id]
        
    def get_user_events(self, user_id):
        return self.financial_events_by_user_id[user_id]
        
    def get_salary_adjustments(self, user_id):
        return []
        
    def get_messages_for_user(self, user_id):
        return []
        
    def get_images_for_user(self, user_id):
        return []
        
    def get_exchange_rate(self, date, from_currency, to_currency):
        return 1.0

class TestLedgerFixes(unittest.TestCase):
    def test_monthly_stream_anchor_not_shifted_by_early_outlier(self):
        events = [
            FinancialEvent('e1', 'test_user', 'expense', 'Test Sub', 'subscription', 'debit', 50.0, 'USD', '2026-01-27', '2026-01-27', 'settled', '', 'fixed', None),
            FinancialEvent('e2', 'test_user', 'expense', 'Test Sub', 'subscription', 'debit', 50.0, 'USD', '2026-02-06', '2026-02-06', 'settled', '', 'fixed', None),
            FinancialEvent('e3', 'test_user', 'expense', 'Test Sub', 'subscription', 'debit', 50.0, 'USD', '2026-03-27', '2026-03-27', 'settled', '', 'fixed', None)
        ]
        ds = MockDataset(events)
        rec = LedgerReconstructor(ds)
        ledger = rec.build_ledger('req_1')
        
        # We expect median of [6, 27, 27] which is 27.
        rec_events = ledger.recurring_expenses
        self.assertEqual(len(rec_events), 1)
        self.assertEqual(rec_events[0].anchor_date, '2026-03-27')
        
    def test_duplicate_pending_debit_deduplicated(self):
        events = [
            FinancialEvent('e1', 'test_user', 'expense', 'Pending Auth', 'transport', 'debit', 53.0, 'USD', '2026-04-02', '2026-04-05', 'pending', '', 'fixed', None),
            FinancialEvent('e2', 'test_user', 'expense', 'Pending Auth', 'transport', 'debit', 53.0, 'USD', '2026-04-02', '2026-04-05', 'pending', '', 'fixed', None)
        ]
        ds = MockDataset(events)
        rec = LedgerReconstructor(ds)
        ledger = rec.build_ledger('req_1')
        
        self.assertEqual(len(ledger.pending_debits), 1)
        self.assertEqual(ledger.pending_debits[0].lifecycle_state, 'PENDING')

if __name__ == '__main__':
    unittest.main()
