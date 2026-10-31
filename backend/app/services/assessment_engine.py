from collections import defaultdict


WEIGHTS = {
    "savings_behavior": 30,
    "income_consistency": 25,
    "expense_management": 20,
    "cash_flow_health": 15,
    "financial_history": 10
}


def calculate_assessment(transactions):

    monthly_income = defaultdict(int)
    monthly_expenses = defaultdict(int)

    total_income = 0
    total_expenses = 0
    months = set()

    for tx in transactions:

        if tx.get("is_internal_transfer") is True:
            continue

        amount = int(tx["amount_paise"])
        tx_type = tx["transaction_type"].lower()
        month = tx["transaction_date"][:7]

        months.add(month)

        if tx_type == "credit":
            total_income += amount
            monthly_income[month] += amount

        elif tx_type == "debit":
            total_expenses += amount
            monthly_expenses[month] += amount

    factors = []

    def add_factor(name, score, explanation):
        factors.append({
            "factor_name": name,
            "factor_score": round(score, 2) if score is not None else None,
            "weight": WEIGHTS[name],
            "explanation": explanation
        })

    # 1. Savings behaviour
    if total_income > 0:
        savings_ratio = (
            (total_income - total_expenses) / total_income
        ) * 100

        savings_score = max(0, min(100, savings_ratio / 30 * 100))

        add_factor(
            "savings_behavior",
            savings_score,
            f"Savings ratio is {savings_ratio:.2f}%. "
            "Higher positive savings receive a higher prototype score."
        )
    else:
        add_factor(
            "savings_behavior",
            None,
            "Insufficient income data to evaluate savings."
        )

    # 2. Income consistency
    income_values = list(monthly_income.values())

    if len(income_values) >= 2:
        average = sum(income_values) / len(income_values)

        if average > 0:
            variation = (
                (sum((x - average) ** 2 for x in income_values)
                 / len(income_values)) ** 0.5
            ) / average * 100

            consistency_score = max(0, min(100, 100 - variation))

            add_factor(
                "income_consistency",
                consistency_score,
                f"Monthly income variation is {variation:.2f}%. "
                "Lower variation indicates more consistent recorded income."
            )
        else:
            add_factor(
                "income_consistency",
                None,
                "Insufficient income to calculate consistency."
            )
    else:
        add_factor(
            "income_consistency",
            None,
            "At least two different months of income data are required."
        )

    # 3. Expense management
    if total_income > 0:
        expense_ratio = (total_expenses / total_income) * 100

        expense_score = max(
            0,
            min(100, (100 - expense_ratio) / 50 * 100)
        )

        add_factor(
            "expense_management",
            expense_score,
            f"Expenses account for {expense_ratio:.2f}% of recorded income."
        )
    else:
        add_factor(
            "expense_management",
            None,
            "Insufficient income data to evaluate expense management."
        )

    # 4. Cash-flow health
    if months:
        positive_months = sum(
            1 for month in months
            if monthly_income[month] > monthly_expenses[month]
        )

        cashflow_score = (
            positive_months / len(months)
        ) * 100

        add_factor(
            "cash_flow_health",
            cashflow_score,
            f"{positive_months} out of {len(months)} recorded months "
            "showed positive cash flow."
        )
    else:
        add_factor(
            "cash_flow_health",
            None,
            "No transaction history available."
        )

    # 5. Financial history coverage
    coverage_months = len(months)

    history_score = min(100, (coverage_months / 6) * 100)

    add_factor(
        "financial_history",
        history_score,
        f"{coverage_months} month(s) of transaction history found. "
        "Six months receives the maximum prototype score."
    )

    # Calculate weighted score using only available factors
    available_factors = [
        factor for factor in factors
        if factor["factor_score"] is not None
    ]

    total_weight = sum(
        factor["weight"] for factor in available_factors
    )

    if total_weight == 0:
        pulse_score = None
    else:
        pulse_score = sum(
            factor["factor_score"] * factor["weight"]
            for factor in available_factors
        ) / total_weight

    return {
        "pulse_score": round(pulse_score, 2) if pulse_score is not None else None,
        "score_scale": "0-100",
        "data_coverage_months": coverage_months,
        "assessment_status": "preliminary",
        "model_version": "worthly-prototype-v1",
        "factors": factors
    }