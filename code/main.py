import csv
import os
import sys
from pathlib import Path
from decimal import Decimal

# Ensure code_dir and repo_root are on sys.path
code_dir = Path(__file__).parent.resolve()
repo_root = code_dir.parent.resolve()
for p in (str(repo_root), str(code_dir)):
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from code.data_loader import DataLoader
    from code.evidence import EvidenceProcessor
    from code.ledger import LedgerReconstructor
    from code.cashflow_simulator import CashflowSimulator
    from code.payment_planner import PaymentPlanner
    from code.decision_engine import DecisionEngine
    from code.output_validator import OutputValidator
except ImportError:
    from data_loader import DataLoader
    from evidence import EvidenceProcessor
    from ledger import LedgerReconstructor
    from cashflow_simulator import CashflowSimulator
    from payment_planner import PaymentPlanner
    from decision_engine import DecisionEngine
    from output_validator import OutputValidator


def main():
    print("==================================================================")
    print("BUY OR WAIT? FINANCIAL DECISION AGENT PIPELINE (V2 ENGINE)")
    print("==================================================================\n")

    dataset_dir = repo_root / "dataset"
    output_path = repo_root / "output.csv"

    print(f"Loading dataset from: {dataset_dir}")
    loader = DataLoader(str(dataset_dir))
    evidence = EvidenceProcessor(str(dataset_dir))
    reconstructor = LedgerReconstructor(loader, evidence)
    simulator = CashflowSimulator()
    planner = PaymentPlanner(simulator)
    engine = DecisionEngine()

    results = []
    print(f"Processing {len(loader.requests)} requests from requests.csv...")

    for req in loader.requests:
        ledger = reconstructor.build_ledger(req.request_id)

        # Baselines
        safe_now = planner.calculate_amount_safe_to_pay(ledger, req.request_date, req.requested_amount)
        earliest_full = planner.calculate_earliest_full_payment_date(ledger, req.request_date, req.requested_amount)

        # Candidates
        candidates = planner.generate_candidates(ledger, req, loader.get_payment_options(req.request_id), loader.get_profile(req.user_id))

        # Decision
        decision = engine.compute_decision(ledger, req, candidates)

        # Fill in baseline values
        decision["amount_safe_to_pay"] = f"{safe_now:.2f}"
        decision["earliest_date_for_full_payment"] = earliest_full if earliest_full else ""

        # Final Polish: if affordable_now, earliest_date must be request_date
        if decision["affordability_status"] == "affordable_now":
            decision["earliest_date_for_full_payment"] = req.request_date

        results.append({
            "request_id": req.request_id,
            "amount_safe_to_pay": decision["amount_safe_to_pay"],
            "affordability_status": decision["affordability_status"],
            "recommended_payment_method": decision["recommended_payment_method"],
            "payment_plan": decision["payment_plan"],
            "earliest_date_for_full_payment": decision["earliest_date_for_full_payment"],
            "spending_changes_needed": decision["spending_changes_needed"],
            "decision_explanation": decision["decision_explanation"]
        })

    # Write root output.csv
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "request_id", "amount_safe_to_pay", "affordability_status",
            "recommended_payment_method", "payment_plan",
            "earliest_date_for_full_payment", "spending_changes_needed", "decision_explanation"
        ])
        writer.writeheader()
        writer.writerows(results)

    # Validate output
    validator = OutputValidator()
    valid = validator.validate(output_path)

    # Ensure evaluation usage report exists inside code/evaluation/
    eval_dir = code_dir / "evaluation"
    eval_dir.mkdir(parents=True, exist_ok=True)
    usage_report_path = eval_dir / "usage_report.md"

    usage_report_content = f"""# Token Usage and Cost Analysis

## Pipeline Details
- **Engine Version**: Deterministic Financial Decision Engine V2
- **Requests Evaluated**: {len(results)}
- **Model Provider**: Rule-based Deterministic Pipeline (Zero API LLM Calls)
- **Total API Token Usage**: 0
- **Total LLM Cost**: $0.00

All financial decisions, ledger reconstructions, cash flow simulations, and payment plans were executed using exact mathematical rules and deterministic algorithms.
"""
    with open(usage_report_path, "w", encoding="utf-8") as f:
        f.write(usage_report_content)

    print("\n------------------------------------------------------------------")
    print("PIPELINE EXECUTION SUMMARY")
    print("------------------------------------------------------------------")
    print(f"Total Requests Processed:     {len(results)}")
    print(f"Output File Path:             {output_path.resolve()}")
    print(f"Validation Result:            {'SUCCESS (100% Validated)' if valid else 'FAILED'}")
    print(f"Usage Report Path:            {usage_report_path.resolve()}")
    print("==================================================================\n")


if __name__ == "__main__":
    main()
