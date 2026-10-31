import AsyncStorage from "@react-native-async-storage/async-storage";
import { isBackendConfigured } from "./api";

const MOCK_TRANSACTIONS_KEY = "creditpulse_mock_transactions";

export type TransactionType = "income" | "expense";

export interface TransactionPayload {
  transaction_date: string;
  description: string;
  amount_paise: number;
  transaction_type: TransactionType;
  category: string;
}

export async function addTransaction(payload: TransactionPayload) {
  if (isBackendConfigured()) {
    const { api } = await import("./api");
    const response = await api.post("/transactions", payload);
    return response.data;
  }

  const saved = await AsyncStorage.getItem(MOCK_TRANSACTIONS_KEY);
  const transactions: TransactionPayload[] = saved
    ? JSON.parse(saved)
    : [];

  const newTransaction = {
    ...payload,
    id: `mock-${Date.now()}`,
  };

  transactions.unshift(newTransaction);

  await AsyncStorage.setItem(
    MOCK_TRANSACTIONS_KEY,
    JSON.stringify(transactions)
  );

  return {
    success: true,
    message: "Transaction saved locally in mock mode.",
    data: newTransaction,
  };
}

export async function getTransactions() {
  if (isBackendConfigured()) {
    const { api } = await import("./api");
    const response = await api.get("/transactions", {
      params: { page: 1, limit: 100 },
    });
    return response.data;
  }

  const saved = await AsyncStorage.getItem(MOCK_TRANSACTIONS_KEY);
  const transactions = saved ? JSON.parse(saved) : [];

  return {
    success: true,
    data: transactions,
  };
}
