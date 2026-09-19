import csv
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Dict, Optional, Set, Tuple
from decimal import Decimal

@dataclass
class FinancialProfile:
    user_id: str
    home_currency: str
    current_available_balance: Decimal
    minimum_balance_to_keep: Decimal
    financial_priorities: str
    protected_spending_categories: List[str]
    adjustable_spending_categories: List[str]
    payment_methods_user_will_consider: List[str]
    max_installment_months: Optional[int]

@dataclass
class FinancialEvent:
    event_id: str
    user_id: str
    event_type: str
    description: str
    category: str
    direction: str  # 'credit' or 'debit'
    amount: Optional[Decimal]
    currency: str
    event_date: str
    settlement_date: Optional[str]
    status: str
    linked_event_id: Optional[str]
    flexibility: Optional[str]
    minimum_allowed_amount: Optional[Decimal]

@dataclass
class Request:
    request_id: str
    user_id: str
    request_date: str
    request_type: str
    requested_amount: Decimal
    desired_completion_date: str
    allows_partial_payment: bool
    request_text: str

@dataclass
class RequestPaymentOption:
    request_id: str
    payment_option_id: str
    payment_method: str
    first_payment_date: str
    payment_frequency_days: Optional[int]
    number_of_payments: int
    payment_amount: Decimal
    financing_fee: Decimal
    total_payable_amount: Decimal

class DataLoader:
    def __init__(self, dataset_dir: str, requests_file: str = "requests.csv"):
        self.dataset_dir = Path(dataset_dir)
        self.requests_file = requests_file
        self.profiles: Dict[str, FinancialProfile] = {}
        self.events: List[FinancialEvent] = []
        self.exchange_rates: Dict[Tuple[str, str, str], Decimal] = {} # (date, from, to) -> rate
        self.requests: List[Request] = []
        self.payment_options: Dict[str, List[RequestPaymentOption]] = {}
        self.messages: List[dict] = []
        self.images: List[dict] = []
        self._load_all()

    def _load_all(self):
        # Profiles
        with open(self.dataset_dir / "financial_profiles.csv", "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                self.profiles[r["user_id"]] = FinancialProfile(
                    user_id=r["user_id"],
                    home_currency=r["home_currency"],
                    current_available_balance=Decimal(r["current_available_balance"]),
                    minimum_balance_to_keep=Decimal(r["minimum_balance_to_keep"]),
                    financial_priorities=r["financial_priorities"],
                    protected_spending_categories=[c.strip() for c in r["expense_categories_to_protect"].split("|")] if r["expense_categories_to_protect"] else [],
                    adjustable_spending_categories=[c.strip() for c in r["expense_categories_user_is_willing_to_reduce"].split("|")] if r["expense_categories_user_is_willing_to_reduce"] else [],
                    payment_methods_user_will_consider=[m.strip() for m in r["payment_methods_user_will_consider"].split("|")] if r["payment_methods_user_will_consider"] else [],
                    max_installment_months=int(r["max_installment_months"]) if r["max_installment_months"] else None
                )

        # Events
        with open(self.dataset_dir / "financial_events.csv", "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                self.events.append(FinancialEvent(
                    event_id=r["event_id"],
                    user_id=r["user_id"],
                    event_type=r["event_type"],
                    description=r["description"],
                    category=r["category"],
                    direction=r["direction"],
                    amount=Decimal(r["amount"]) if r["amount"] else None,
                    currency=r["currency"],
                    event_date=r["event_date"],
                    settlement_date=r["settlement_date"] if r["settlement_date"] else None,
                    status=r["status"],
                    linked_event_id=r["linked_event_id"] if r["linked_event_id"] else None,
                    flexibility=r["flexibility"] if r["flexibility"] else None,
                    minimum_allowed_amount=Decimal(r["minimum_allowed_amount"]) if r["minimum_allowed_amount"] else None
                ))

        # Exchange Rates
        with open(self.dataset_dir / "exchange_rates.csv", "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                self.exchange_rates[(r["rate_date"], r["from_currency"], r["to_currency"])] = Decimal(r["rate"])

        # Requests
        with open(self.dataset_dir / self.requests_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                self.requests.append(Request(
                    request_id=r["request_id"],
                    user_id=r["user_id"],
                    request_date=r["request_date"],
                    request_type=r["request_type"],
                    requested_amount=Decimal(r["requested_amount"]),
                    desired_completion_date=r["desired_completion_date"],
                    allows_partial_payment=r["allows_partial_payment"].lower() == "true",
                    request_text=r["request_text"]
                ))

        # Payment Options
        with open(self.dataset_dir / "request_payment_options.csv", "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                opt = RequestPaymentOption(
                    request_id=r["request_id"],
                    payment_option_id=r["payment_option_id"],
                    payment_method=r["payment_method"],
                    first_payment_date=r["first_payment_date"],
                    payment_frequency_days=int(r["payment_frequency_days"]) if r["payment_frequency_days"] else None,
                    number_of_payments=int(r["number_of_payments"]),
                    payment_amount=Decimal(r["payment_amount"]),
                    financing_fee=Decimal(r["financing_fee"]),
                    total_payable_amount=Decimal(r["total_payable_amount"])
                )
                self.payment_options.setdefault(opt.request_id, []).append(opt)

        # Messages
        with open(self.dataset_dir / "messages.csv", "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                self.messages.append(r)

        # Images
        with open(self.dataset_dir / "images.csv", "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                self.images.append(r)

    def get_profile(self, user_id: str) -> Optional[FinancialProfile]:
        return self.profiles.get(user_id)

    def get_user_events(self, user_id: str) -> List[FinancialEvent]:
        return [e for e in self.events if e.user_id == user_id]

    def get_request(self, request_id: str) -> Optional[Request]:
        return next((r for r in self.requests if r.request_id == request_id), None)

    def get_payment_options(self, request_id: str) -> List[RequestPaymentOption]:
        return self.payment_options.get(request_id, [])

    def get_exchange_rate(self, date_str: str, from_curr: str, to_curr: str) -> Decimal:
        if from_curr == to_curr:
            return Decimal("1.0")
        return self.exchange_rates.get((date_str, from_curr, to_curr), Decimal("1.0"))

    def get_messages_for_user(self, user_id: str) -> List[dict]:
        return [m for m in self.messages if m.get("user_id") == user_id]

    def get_images_for_event(self, event_id: str) -> List[dict]:
        return [i for i in self.images if i.get("related_event_id") == event_id]

def load_dataset(dataset_dir: str, requests_file: str = "requests.csv") -> DataLoader:
    return DataLoader(dataset_dir, requests_file)

Dataset = DataLoader

