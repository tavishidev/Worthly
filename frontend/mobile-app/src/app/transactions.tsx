import { useAppStyles, useAppTheme } from "@/components/app-theme";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, router } from "expo-router";

import { BottomNavigation } from "@/components/bottom-navigation";
import { BrandLockup } from "@/components/brand-lockup";
import { COLORS } from "@/constants/colors";
import { useFeedback } from "@/components/feedback";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { MotionPressable, ScreenEntrance } from "@/components/motion";
import { getTransactions } from "@/services/transaction.service";

interface Transaction {
  id?: string;
  transaction_date: string;
  description: string;
  amount_paise: number;
  transaction_type: "income" | "expense";
  category: string;
}

function formatGroupDate(value: string) {
  if (value === "date-unavailable") return "Date unavailable";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

export default function TransactionsScreen() {
  const styles = useAppStyles(baseStyles);
  const { colors } = useAppTheme();
  const { notify } = useFeedback();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadTransactions = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getTransactions();
      const records = response?.data;

      setTransactions(Array.isArray(records) ? records : []);
    } catch (error: any) {
      notify(
        "Unable to load transactions",
        error?.response?.data?.message ||
          error?.message ||
          "Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  function formatRupees(amountPaise: number) {
    return (amountPaise / 100).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    });
  }

  const filteredTransactions = transactions.filter((item) => {
    const term = search.trim().toLowerCase();
    return (
      !term ||
      item.description.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term)
    );
  });
  const groupedTransactions = filteredTransactions.reduce<
    Record<string, Transaction[]>
  >((groups, item) => {
    const date = item.transaction_date?.slice(0, 10) || "date-unavailable";
    groups[date] = [...(groups[date] ?? []), item];
    return groups;
  }, {});
  const incomeTotal = transactions
    .filter((item) => item.transaction_type === "income")
    .reduce((total, item) => total + item.amount_paise, 0);
  const expenseTotal = transactions
    .filter((item) => item.transaction_type === "expense")
    .reduce((total, item) => total + item.amount_paise, 0);

  return (
    <ScreenEntrance>
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <BrandLockup compact />
        <Text style={styles.eyebrow}>WORTHLY · ACTIVITY</Text>
        <Text style={styles.heading}>Transactions</Text>
        <Text style={styles.subtitle}>
          Review the income and expenses you have recorded.
        </Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Income recorded</Text>
            <Text style={[styles.summaryValue, styles.incomeValue]}>
              {formatRupees(incomeTotal)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Expenses recorded</Text>
            <Text style={[styles.summaryValue, styles.expenseValue]}>
              {formatRupees(expenseTotal)}
            </Text>
          </View>
        </View>

        <MotionPressable
          style={styles.addButton}
          onPress={() => router.push("/add-transaction")}
        >
          <Text style={styles.addButtonText}>+ Add transaction</Text>
        </MotionPressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          <MotionPressable onPress={loadTransactions}>
            <Text style={styles.refreshText}>Refresh</Text>
          </MotionPressable>
        </View>

        <TextInput
          accessibilityLabel="Search transactions"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search descriptions or categories"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
        />

        {loading ? (
          <LoadingSkeleton variant="list" label="Loading transactions" />
        ) : transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyText}>
              Add your first income or expense to get started.
            </Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No matching transactions</Text>
            <Text style={styles.emptyText}>
              Try a different description or category.
            </Text>
          </View>
        ) : (
          Object.entries(groupedTransactions).map(([date, items]) => (
            <View key={date}>
              <Text style={styles.dateGroup}>{formatGroupDate(date)}</Text>
              {items.map((item, index) => {
                const isIncome = item.transaction_type === "income";

                return (
                  <View
                    key={item.id || `${date}-${index}`}
                    style={styles.transactionCard}
                  >
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionName}>
                        {item.description}
                      </Text>
                      <Text style={styles.transactionMeta}>
                        {item.category}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.amount,
                        { color: isIncome ? colors.success : colors.danger },
                      ]}
                    >
                      {isIncome ? "+" : "-"}
                      {formatRupees(item.amount_paise)}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
      <BottomNavigation />
    </View>
    </ScreenEntrance>
  );
}

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  dateGroup: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 7,
    marginBottom: 9,
    letterSpacing: 0.3,
  },
  content: {
    width: "100%",
    maxWidth: 820,
    alignSelf: "center",
    padding: 22,
    paddingBottom: 115,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  heading: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 22,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.navy,
    borderRadius: 16,
    padding: 17,
    marginBottom: 20,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    color: COLORS.onNavySoft,
    fontSize: 10,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 7,
  },
  incomeValue: {
    color: COLORS.successOnDark,
  },
  expenseValue: {
    color: COLORS.dangerOnDark,
  },
  summaryDivider: {
    height: 34,
    width: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.navySeparator,
    marginHorizontal: 10,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 30,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  searchInput: {
    minHeight: 46,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    paddingHorizontal: 13,
    color: COLORS.text,
    fontSize: 13,
    marginBottom: 14,
  },
  refreshText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    marginTop: 5,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  emptyText: {
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  transactionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 13,
    padding: 16,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  transactionMeta: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 6,
  },
  amount: {
    fontSize: 14,
    fontWeight: "800",
  },
});