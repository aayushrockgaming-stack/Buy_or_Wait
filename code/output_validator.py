import csv
from pathlib import Path
from typing import List, Dict

class OutputValidator:
    def validate(self, output_path: Path) -> bool:
        """ Basic schema validation for output.csv """
        try:
            with open(output_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                expected = ["request_id", "amount_safe_to_pay", "affordability_status", "recommended_payment_method", "payment_plan", "earliest_date_for_full_payment", "spending_changes_needed", "decision_explanation"]
                if not all(col in reader.fieldnames for col in expected):
                    return False
                return True
        except Exception:
            return False
