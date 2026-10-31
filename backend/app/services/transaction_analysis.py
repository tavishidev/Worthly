from collections import defaultdict
from statistics import pstdev


def analyze_transactions(transactions):
    total_income = 0
    total_expenses = 0

    monthly_income = defaultdict(int)
    category_expenses = defaultdict(int)

    valid_transactions = 0

    for transaction in transactions:

        if transaction.get("is_internal_transfer") is True:
            continue

        amount = int(transaction["amount_paise"])
        transaction_type = transaction["transaction_type"].lower()

        transaction_date = transaction["transaction_date"]
        month = transaction_date[:7]

        valid_transactions += 1

        if transaction_type == "credit":
            total_income += amount
            monthly_income[month] += amount

        elif transaction_type == "debit":
            total_expenses += amount

            category = transaction.get("category") or "Uncategorized"
            category_expenses[category] += amount

    net_savings = total_income - total_expenses

    savings_ratio = (
        round((net_savings / total_income) * 100, 2)
        if total_income > 0 else None
    )

    income_values = list(monthly_income.values())

    if len(income_values) >= 2:
        average_income = sum(income_values) / len(income_values)
        income_variation = (
            round((pstdev(income_values) / average_income) * 100, 2)
            if average_income > 0 else None
        )
    else:
        average_income = income_values[0] if income_values else 0
        income_variation = None

    category_breakdown = [
        {
            "category": category,
            "amount_paise": amount,
            "amount_rupees": round(amount / 100, 2)
        }
        for category, amount in sorted(
            category_expenses.items(),
            key=lambda item: item[1],
            reverse=True
        )
    ]

    monthly_breakdown = [
        {
            "month": month,
            "income_paise": amount,
            "income_rupees": round(amount / 100, 2)
        }
        for month, amount in sorted(monthly_income.items())
    ]

    return {
        "total_transactions": valid_transactions,

        "total_income_paise": total_income,
        "total_income_rupees": round(total_income / 100, 2),

        "total_expenses_paise": total_expenses,
        "total_expenses_rupees": round(total_expenses / 100, 2),

        "net_savings_paise": net_savings,
        "net_savings_rupees": round(net_savings / 100, 2),

        "savings_ratio_percent": savings_ratio,

        "average_monthly_income_rupees": round(
            average_income / 100, 2
        ),

        "income_variation_percent": income_variation,

        "monthly_income": monthly_breakdown,
        "category_wise_expenses": category_breakdown
    }