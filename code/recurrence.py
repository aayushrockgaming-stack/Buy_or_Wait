from datetime import datetime, date, timedelta
from typing import List, Tuple, Set, Dict, Optional
from decimal import Decimal

def _median(values: List[int]) -> int:
    if not values: return 30
    s = sorted(values)
    n = len(s)
    if n % 2 == 1:
        return s[n // 2]
    return (s[n // 2 - 1] + s[n // 2]) // 2

def _analyze_stream(evs: List) -> Optional[Tuple[str, int, str, str]]:
    sorted_evs = sorted(evs, key=lambda e: e.settlement_date or e.event_date)
    dates = [datetime.strptime(e.settlement_date or e.event_date, "%Y-%m-%d").date()
             for e in sorted_evs if e.settlement_date or e.event_date]

    if len(dates) < 2:
        return None

    gaps = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
    interval = _median(gaps)

    # Handle Salary/Rent specifically if we have multiple entries
    cat = sorted_evs[0].category.lower().strip()
    is_salary_like = cat in ("salary", "payroll", "income")

    if 6 <= interval <= 8:
        tag = "WEEKLY"
    elif 13 <= interval <= 15:
        tag = "BIWEEKLY"
    elif 25 <= interval <= 35:
        days = [d.day for d in dates]
        most_common_day = max(set(days), key=days.count)
        if days.count(most_common_day) / len(days) >= 0.5:
            tag = "MONTHLY"
        elif is_salary_like and len(dates) >= 2:
            tag = "MONTHLY"
        elif len(set(gaps)) == 1 and interval >= 45:
            tag = "LONG_INTERVAL_RECURRING"
        else:
            return None
    elif interval == 10:
        tag = "TEN_DAYS"
    elif len(set(gaps)) == 1 and interval >= 45:
        tag = "LONG_INTERVAL_RECURRING"
    else:
        return None

    days = [d.day for d in dates]
    anchor_day = max(set(days), key=days.count)
    last_dt = dates[-1]
    try:
        anchor_date = date(last_dt.year, last_dt.month, anchor_day)
    except ValueError:
        anchor_date = last_dt.replace(day=1)

    return tag, interval, anchor_date.isoformat(), sorted_evs[-1].event_id

def detect_recurring_streams(events: List) -> Tuple[Set[str], Set[str], Dict[str, Tuple[str, int, str]], Dict[str, str]]:
    """
    Identifies recurring financial streams.
    Prioritizes detailed matches, then falls back to category-level if consistent.
    """
    detailed_groups: Dict[str, List] = {}
    category_groups: Dict[str, List] = {}

    for ev in events:
        if ev.status.lower() in ("cancelled", "unrealized", "failed"): continue
        cat = ev.category.lower().strip()
        desc = ev.description.lower().strip()
        detailed_key = f"{cat}::{desc}"
        category_key = f"{cat}::ALL"
        detailed_groups.setdefault(detailed_key, []).append(ev)
        category_groups.setdefault(category_key, []).append(ev)

    recurring_keys = set()
    representative_ids = set()
    cadence_map = {}
    anchor_dates = {}

    # 1. Detailed matches
    for key, evs in detailed_groups.items():
        if len(evs) < 2: continue
        res = _analyze_stream(evs)
        if res:
            tag, interval, anchor_date_str, last_id = res
            recurring_keys.add(key)
            representative_ids.add(last_id)
            cadence_map[key] = (tag, interval, anchor_date_str)
            anchor_dates[key] = anchor_date_str

    # 2. Category fallback
    for key, evs in category_groups.items():
        if len(evs) < 2: continue
        res = _analyze_stream(evs)
        if res:
            tag, interval, anchor_date_str, last_id = res
            if key not in recurring_keys:
                recurring_keys.add(key)
                representative_ids.add(last_id)
                cadence_map[key] = (tag, interval, anchor_date_str)
                anchor_dates[key] = anchor_date_str

    return recurring_keys, representative_ids, cadence_map, anchor_dates
