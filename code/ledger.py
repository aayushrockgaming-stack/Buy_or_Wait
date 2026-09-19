from dataclasses import dataclass, field
from typing import List, Dict, Optional, Set, Tuple
from datetime import datetime
from decimal import Decimal

try:
    from code.data_loader import DataLoader, FinancialEvent, FinancialProfile
    from code.evidence import EvidenceProcessor
    from code.recurrence import detect_recurring_streams
except ImportError:
    from data_loader import DataLoader, FinancialEvent, FinancialProfile
    from evidence import EvidenceProcessor
    from recurrence import detect_recurring_streams

Dataset = DataLoader

@dataclass
class ResolvedEvent:
    event_id: str
    user_id: str
    direction: str  # 'credit' or 'debit'
    category: str
    description: str
    amount: Decimal  # Converted to home currency
    event_date: str
    settlement_date: Optional[str]
    status: str
    lifecycle_state: str  # 'CONFIRMED', 'PENDING', 'CANCELLED', 'UNREALIZED'
    is_recurring: bool
    is_protected: bool
    is_flexible: bool
    minimum_allowed_amount: Optional[Decimal] = None
    cadence: str = "ONE_TIME"
    interval_days: int = 0
    anchor_date: Optional[str] = None

@dataclass
class CanonicalLedger:
    user_id: str
    home_currency: str
    starting_balance: Decimal
    minimum_balance_to_keep: Decimal
    confirmed_income: List[ResolvedEvent] = field(default_factory=list)
    confirmed_expenses: List[ResolvedEvent] = field(default_factory=list)
    pending_debits: List[ResolvedEvent] = field(default_factory=list)
    recurring_income: List[ResolvedEvent] = field(default_factory=list)
    recurring_expenses: List[ResolvedEvent] = field(default_factory=list)
    all_events: List[ResolvedEvent] = field(default_factory=list)

class LedgerReconstructor:
    def __init__(self, loader: DataLoader, evidence: Optional[EvidenceProcessor] = None):
        self.loader = loader
        self.evidence = evidence

    def build_ledger(self, request_id: str, user_id: Optional[str] = None) -> CanonicalLedger:
        req = self.loader.get_request(request_id)
        uid = req.user_id if req else (user_id or request_id)
        profile = self.loader.get_profile(uid)
        if not profile:
            raise ValueError(f"Profile for user {uid} not found")
        events = self.loader.get_user_events(uid)

        # 1. Resolve missing amounts and evidence
        resolved_raw = []
        for ev in events:
            amt = ev.amount
            if amt is None:
                img_refs = self.loader.get_images_for_event(ev.event_id)
                amt = self.evidence.resolve_event_amount(ev.event_id, img_refs) if self.evidence else None
                if amt is None:
                    amt = Decimal("0.0")
                else:
                    amt = Decimal(str(amt))

            # Currency conversion
            conv_date = ev.settlement_date or ev.event_date
            rate = self.loader.get_exchange_rate(conv_date, ev.currency, profile.home_currency)
            converted_amt = amt * rate

            # Lifecycle state
            status = ev.status.lower()
            state = "CONFIRMED"
            if status == "cancelled": state = "CANCELLED"
            elif status == "unrealized": state = "UNREALIZED"
            elif status == "pending": state = "PENDING"

            resolved_raw.append({
                "event_id": ev.event_id,
                "user_id": ev.user_id,
                "direction": ev.direction,
                "category": ev.category,
                "description": ev.description,
                "amount": converted_amt,
                "event_date": ev.event_date,
                "settlement_date": ev.settlement_date,
                "status": status,
                "state": state,
                "flexibility": ev.flexibility,
                "min_amt": Decimal(str(ev.minimum_allowed_amount)) if ev.minimum_allowed_amount is not None else None
            })

        # 2. Deduplicate and resolve conflicts
        final_events = {}
        pending_seen = set()
        resolved_raw.sort(key=lambda x: x["event_date"])
        for r in resolved_raw:
            eid = r["event_id"]
            if r["state"] == "PENDING":
                pkey = (r["user_id"], r["direction"], r["category"].lower(), r["description"].lower(), r["amount"], r["event_date"], r["settlement_date"])
                if pkey in pending_seen:
                    continue
                pending_seen.add(pkey)

            if eid in final_events and final_events[eid]["state"] == "CANCELLED":
                continue

            if r["state"] == "CANCELLED":
                final_events[eid] = r
            else:
                final_events[eid] = r

        # 3. Recurrence detection
        rec_events = []
        for eid, data in final_events.items():
            ev_orig = next(e for e in events if e.event_id == eid)
            rec_events.append(ev_orig)

        rec_keys, rep_ids, cadence_map, anchor_dates = detect_recurring_streams(rec_events)

        # 4. Build the Ledger
        ledger = CanonicalLedger(
            user_id=profile.user_id,
            home_currency=profile.home_currency,
            starting_balance=profile.current_available_balance,
            minimum_balance_to_keep=profile.minimum_balance_to_keep
        )

        for eid, data in final_events.items():
            if data["state"] in ("CANCELLED", "UNREALIZED"):
                continue

            key = f"{data['category'].lower().strip()}::{data['description'].lower().strip()}"
            cat_key = f"{data['category'].lower().strip()}::ALL"
            is_rec = key in rec_keys or cat_key in rec_keys
            cadence = "ONE_TIME"
            interval = 0
            anchor = None
            if is_rec:
                if key in rec_keys:
                    cadence, interval, anchor = cadence_map[key]
                else:
                    cadence, interval, anchor = cadence_map[cat_key]

            # Protection
            is_prot = data["category"] in profile.protected_spending_categories
            is_flex = data["category"] in profile.adjustable_spending_categories or (data["flexibility"] and "flexible" in data["flexibility"].lower())

            rev = ResolvedEvent(
                event_id=eid,
                user_id=data["user_id"],
                direction=data["direction"],
                category=data["category"],
                description=data["description"],
                amount=data["amount"],
                event_date=data["event_date"],
                settlement_date=data["settlement_date"],
                status=data["status"],
                lifecycle_state=data["state"],
                is_recurring=is_rec,
                is_protected=is_prot,
                is_flexible=is_flex,
                minimum_allowed_amount=data["min_amt"],
                cadence=cadence,
                interval_days=interval,
                anchor_date=anchor
            )
            ledger.all_events.append(rev)

            if rev.direction == "credit":
                if rev.lifecycle_state == "CONFIRMED":
                    ledger.confirmed_income.append(rev)
                    if is_rec and eid in rep_ids:
                        ledger.recurring_income.append(rev)
            else:
                if rev.lifecycle_state == "CONFIRMED":
                    ledger.confirmed_expenses.append(rev)
                    if is_rec and eid in rep_ids:
                        ledger.recurring_expenses.append(rev)
                elif rev.lifecycle_state == "PENDING":
                    ledger.pending_debits.append(rev)

        return ledger
