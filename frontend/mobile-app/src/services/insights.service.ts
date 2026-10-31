import AsyncStorage from "@react-native-async-storage/async-storage";
import { isBackendConfigured } from "./api";

const MOCK_INSIGHTS_KEY = "worthly_mock_insights";

export interface Insight {
  type: "positive" | "opportunity" | "risk" | "tip";
  title: string;
  description: string;
}

const MOCK_INSIGHTS: Insight[] = [
  {
    type: "positive",
    title: "A steady savings habit",
    description: "Your sample financial profile indicates room to keep building savings month by month.",
  },
  {
    type: "opportunity",
    title: "Review your largest spending category",
    description: "Look at recurring costs in your highest-spend category and identify one manageable adjustment.",
  },
  {
    type: "tip",
    title: "Keep a cash-flow buffer",
    description: "A small emergency reserve can help cover unexpected costs without disrupting regular commitments.",
  },
];

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function buildInsights(analysis: any): Insight[] {
  if (!analysis || Number(analysis.total_transactions) <= 0) return [];

  const income = Number(analysis.total_income_rupees ?? 0);
  const expenses = Number(analysis.total_expenses_rupees ?? 0);
  const netSavings = Number(analysis.net_savings_rupees ?? income - expenses);
  const savingsRatio = analysis.savings_ratio_percent == null
    ? null
    : Number(analysis.savings_ratio_percent);
  const monthlyIncome = Array.isArray(analysis.monthly_income) ? analysis.monthly_income : [];
  const categories = Array.isArray(analysis.category_wise_expenses)
    ? analysis.category_wise_expenses
    : [];
  const findings: Insight[] = [];

  if (netSavings < 0) {
    findings.push({
      type: "risk",
      title: "Spending is above recorded income",
      description: `Recorded expenses exceed recorded income by ${formatRupees(Math.abs(netSavings))}. Review upcoming discretionary spending and make sure all income sources are included.`,
    });
  } else if (savingsRatio != null && savingsRatio >= 20) {
    findings.push({
      type: "positive",
      title: "Strong recorded savings margin",
      description: `You retained ${savingsRatio.toFixed(1)}% of recorded income (${formatRupees(netSavings)} across the period). Keeping this pattern consistent can strengthen your cash-flow buffer.`,
    });
  } else if (savingsRatio != null) {
    findings.push({
      type: "opportunity",
      title: "Create more room for savings",
      description: `Your recorded savings margin is ${savingsRatio.toFixed(1)}%. Reviewing repeat expenses may help increase the amount left after essential costs.`,
    });
  }

  const topCategory = categories[0];
  if (topCategory && expenses > 0) {
    const categoryAmount = Number(topCategory.amount_rupees ?? 0);
    const share = categoryAmount / expenses * 100;
    findings.push({
      type: "tip",
      title: `${topCategory.category || "Uncategorized"} is your largest expense`,
      description: `This category accounts for ${share.toFixed(1)}% of recorded expenses (${formatRupees(categoryAmount)}). Check whether the total includes one-off costs or recurring spending you can plan for.`,
    });
  }

  const variation = analysis.income_variation_percent == null
    ? null
    : Number(analysis.income_variation_percent);
  if (variation != null && monthlyIncome.length >= 2) {
    findings.push(variation > 20
      ? {
          type: "opportunity",
          title: "Income varies from month to month",
          description: `Recorded monthly income variation is ${variation.toFixed(1)}%. Planning essential payments around a conservative income month can help smooth cash flow.`,
        }
      : {
          type: "positive",
          title: "Income has been relatively consistent",
          description: `Recorded monthly income variation is ${variation.toFixed(1)}% across ${monthlyIncome.length} months. This consistency can make regular budgeting easier.`,
        });
  }

  return findings;
}

async function fetchTransactionInsights() {
  const { api } = await import("./api");
  const response = await api.get("/analysis/transactions");
  const body = response.data?.data ?? response.data;
  return buildInsights(body?.analysis ?? null);
}

export async function generateInsights(assessmentId: string) {
  if (!assessmentId) {
    throw new Error("Generate a financial assessment first.");
  }

  if (isBackendConfigured()) {
    return {
      success: true,
      mock: false,
      data: await fetchTransactionInsights(),
    };
  }

  await AsyncStorage.setItem(MOCK_INSIGHTS_KEY, JSON.stringify(MOCK_INSIGHTS));
  return {
    success: true,
    mock: true,
    message: "Illustrative sample insights generated locally.",
    data: MOCK_INSIGHTS,
  };
}

export async function getInsights() {
  if (isBackendConfigured()) {
    return {
      success: true,
      mock: false,
      data: await fetchTransactionInsights(),
    };
  }

  const savedInsights = await AsyncStorage.getItem(MOCK_INSIGHTS_KEY);
  return {
    success: true,
    mock: true,
    data: savedInsights ? JSON.parse(savedInsights) : [],
  };
}
