# Sample Requests Validation Report

- **Total Reference Samples**: 25
- **Exact Match Count**: 9 / 25 (36.0%)
- **Mismatch Count**: 16 / 25

## Detailed Per-Request Comparison

| Request ID | Status (Exp vs Our) | Method (Exp vs Our) | Result | Mismatch Reason |
| :--- | :--- | :--- | :--- | :--- |
| `request_01` | `affordable_now` / `affordable_with_plan` | `full_payment` / `full_payment` | **MISMATCH** | status (exp: affordable_now, our: affordable_with_plan), plan (exp: 2024-03-03:25256, our: 2024-03-03:25256.00), earliest_date (exp: '2024-03-03', our: '2024-04-15'), spending_changes (exp: none, our: stop:event_31) |
| `request_02` | `affordable_with_plan` / `not_affordable` | `installments` / `not_recommended` | **MISMATCH** | status (exp: affordable_with_plan, our: not_affordable), method (exp: installments, our: not_recommended), plan (exp: 2025-08-08:15952906.67|2025-09-07:15952906.67|2025-10-07:15952906.67, our: none), earliest_date (exp: '2025-09-15', our: '2025-10-15') |
| `request_03` | `affordable_later` / `not_affordable` | `wait` / `not_recommended` | **MISMATCH** | status (exp: affordable_later, our: not_affordable), method (exp: wait, our: not_recommended), plan (exp: 2019-11-15:5491000, our: none), earliest_date (exp: '2019-11-15', our: '') |
| `request_04` | `affordable_later` / `not_affordable` | `wait` / `not_recommended` | **MISMATCH** | status (exp: affordable_later, our: not_affordable), method (exp: wait, our: not_recommended), plan (exp: 2024-06-15:12693000, our: none), earliest_date (exp: '2024-06-15', our: '') |
| `request_05` | `not_affordable` / `affordable_now` | `not_recommended` / `full_payment` | **MISMATCH** | status (exp: not_affordable, our: affordable_now), method (exp: not_recommended, our: full_payment), plan (exp: none, our: 2025-11-06:15488.00), earliest_date (exp: '', our: '2025-11-06') |
| `request_06` | `affordable_with_plan` / `not_affordable` | `full_payment` / `not_recommended` | **MISMATCH** | status (exp: affordable_with_plan, our: not_affordable), method (exp: full_payment, our: not_recommended), plan (exp: 2026-01-03:620.40, our: none), earliest_date (exp: '2026-01-15', our: ''), spending_changes (exp: stop:event_476, our: none) |
| `request_07` | `affordable_with_plan` / `affordable_with_plan` | `installments` / `installments` | **MISMATCH** | plan (exp: 2024-09-12:68432|2024-10-10:68432|2024-11-07:68432, our: 2024-09-12:68432.00|2024-10-10:68432.00|2024-11-07:68432.00), earliest_date (exp: '2024-10-23', our: '2024-10-15') |
| `request_08` | `affordable_later` / `not_affordable` | `wait` / `not_recommended` | **MISMATCH** | status (exp: affordable_later, our: not_affordable), method (exp: wait, our: not_recommended), plan (exp: 2025-04-15:996.60, our: none), earliest_date (exp: '2025-04-15', our: '') |
| `request_09` | `affordable_now` / `affordable_now` | `full_payment` / `full_payment` | **MATCH** | Exact Match |
| `request_10` | `not_affordable` / `not_affordable` | `not_recommended` / `not_recommended` | **MISMATCH** | earliest_date (exp: '', our: '2024-12-06') |
| `request_11` | `affordable_with_plan` / `affordable_later` | `full_payment` / `wait` | **MISMATCH** | status (exp: affordable_with_plan, our: affordable_later), method (exp: full_payment, our: wait), plan (exp: 2025-05-03:13110000, our: 2025-06-12:13110000.00), earliest_date (exp: '2025-07-15', our: '2025-05-15'), spending_changes (exp: reduce_to:event_989:665950, our: none) |
| `request_12` | `affordable_with_plan` / `affordable_with_plan` | `installments` / `installments` | **MATCH** | Exact Match |
| `request_13` | `affordable_later` / `affordable_now` | `wait` / `full_payment` | **MISMATCH** | status (exp: affordable_later, our: affordable_now), method (exp: wait, our: full_payment), plan (exp: 2024-05-15:941.60, our: 2024-03-07:941.60), earliest_date (exp: '2024-05-15', our: '2024-03-07') |
| `request_14` | `not_affordable` / `not_affordable` | `not_recommended` / `not_recommended` | **MATCH** | Exact Match |
| `request_15` | `not_affordable` / `not_affordable` | `not_recommended` / `not_recommended` | **MATCH** | Exact Match |
| `request_16` | `affordable_now` / `not_affordable` | `full_payment` / `not_recommended` | **MISMATCH** | status (exp: affordable_now, our: not_affordable), method (exp: full_payment, our: not_recommended), plan (exp: 2023-08-12:122500, our: none), earliest_date (exp: '2023-08-12', our: '') |
| `request_17` | `affordable_with_plan` / `affordable_with_plan` | `installments` / `installments` | **MISMATCH** | earliest_date (exp: '2026-03-15', our: '2026-05-15'), spending_changes (exp: none, our: stop:event_1476|reduce_to:event_1534:2935.00|reduce_to:event_1536:2935.00) |
| `request_18` | `affordable_later` / `affordable_later` | `wait` / `wait` | **MATCH** | Exact Match |
| `request_19` | `affordable_with_plan` / `not_affordable` | `partial_payment` / `not_recommended` | **MISMATCH** | status (exp: affordable_with_plan, our: not_affordable), method (exp: partial_payment, our: not_recommended), plan (exp: 2024-09-04:28820|2024-09-15:10840, our: none), earliest_date (exp: '2024-09-15', our: '2024-11-15') |
| `request_20` | `not_affordable` / `not_affordable` | `not_recommended` / `not_recommended` | **MATCH** | Exact Match |
| `request_21` | `affordable_with_plan` / `affordable_with_plan` | `full_payment` / `full_payment` | **MISMATCH** | spending_changes (exp: stop:event_1815|reduce_to:event_1816:23.50, our: stop:event_1815) |
| `request_22` | `affordable_with_plan` / `affordable_with_plan` | `installments` / `installments` | **MATCH** | Exact Match |
| `request_23` | `affordable_later` / `not_affordable` | `wait` / `not_recommended` | **MISMATCH** | status (exp: affordable_later, our: not_affordable), method (exp: wait, our: not_recommended), plan (exp: 2025-07-15:38016, our: none), earliest_date (exp: '2025-07-15', our: '') |
| `request_24` | `not_affordable` / `not_affordable` | `not_recommended` / `not_recommended` | **MATCH** | Exact Match |
| `request_25` | `not_affordable` / `not_affordable` | `not_recommended` / `not_recommended` | **MATCH** | Exact Match |

## Architectural Note

Per the challenge specification, sample_requests.csv is for inspection and comparative reference. The deterministic engine enforces official challenge rules (problem_statement.md) and does not hard-code or alter logic to force sample matches.