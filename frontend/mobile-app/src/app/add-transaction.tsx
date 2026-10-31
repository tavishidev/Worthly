import { useAppStyles, useAppTheme } from "@/components/app-theme";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import { BrandLockup } from "@/components/brand-lockup";
import { useFeedback } from "@/components/feedback";
import { MotionPressable as TouchableOpacity, ScreenEntrance } from "@/components/motion";
import { COLORS } from "@/constants/colors";
import {
  addTransaction,
  TransactionType,
} from "@/services/transaction.service";

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Housing",
  "Bills",
  "Healthcare",
  "Education",
  "Salary",
  "Freelance",
  "Other",
];

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isValidCalendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (month < 1 || month > 12 || day < 1) return false;

  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ][month - 1];

  return day <= daysInMonth;
}

export default function AddTransactionScreen() {
  const styles = useAppStyles(baseStyles);
  const { colors } = useAppTheme();
  const { notify } = useFeedback();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(getTodayDate());
  const [category, setCategory] = useState("Food");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    const cleanAmount = amount.trim();
    const numericAmount = Number(cleanAmount);

    if (!cleanAmount || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      notify("Invalid amount", "Enter an amount greater than zero.", "error");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      notify("Invalid date", "Use the YYYY-MM-DD date format.", "error");
      return;
    }

    if (!isValidCalendarDate(date)) {
      notify("Invalid date", "Enter a valid calendar date.", "error");
      return;
    }

    if (!description.trim()) {
      notify("Description required", "Enter a short description.", "error");
      return;
    }

    // Convert rupees to integer paise.
    const amountPaise = Math.round(numericAmount * 100);

    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      notify("Invalid amount", "Enter a valid amount.", "error");
      return;
    }

    setLoading(true);

    try {
      await addTransaction({
        transaction_date: date,
        description: description.trim(),
        amount_paise: amountPaise,
        transaction_type: type,
        category,
      });

      notify(
        "Transaction saved",
        "Your transaction has been added.",
        "success"
      );
      router.replace("/transactions");
    } catch (error: any) {
      notify(
        "Could not save transaction",
        error?.response?.data?.message ||
          error?.message ||
          "Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenEntrance>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BrandLockup compact />
        <Text style={styles.eyebrow}>Worthly · TRANSACTIONS</Text>
        <Text style={styles.heading}>Add transaction</Text>
        <Text style={styles.subtitle}>
          Record your income or expenses to build your financial overview.
        </Text>

        <View style={styles.typeContainer}>
          <TouchableOpacity
            accessibilityRole="radio"
            accessibilityState={{ selected: type === "expense" }}
            accessibilityLabel="Expense transaction"
            style={[
              styles.typeButton,
              type === "expense" && styles.activeExpense,
            ]}
            onPress={() => setType("expense")}
          >
            <Text
              style={[
                styles.typeText,
                type === "expense" && styles.activeTypeText,
              ]}
            >
              Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="radio"
            accessibilityState={{ selected: type === "income" }}
            accessibilityLabel="Income transaction"
            style={[
              styles.typeButton,
              type === "income" && styles.activeIncome,
            ]}
            onPress={() => setType("income")}
          >
            <Text
              style={[
                styles.typeText,
                type === "income" && styles.activeTypeText,
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput
          accessibilityLabel="Amount in rupees"
          style={styles.input}
          placeholder="e.g. 1500.00"
          placeholderTextColor={colors.muted}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          accessibilityLabel="Transaction description"
          style={styles.input}
          placeholder="e.g. Grocery shopping"
          placeholderTextColor={colors.muted}
          value={description}
          onChangeText={setDescription}
          maxLength={100}
        />

        <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
        <TextInput
          accessibilityLabel="Transaction date in YYYY-MM-DD format"
          style={styles.input}
          placeholder="2026-10-31"
          placeholderTextColor={colors.muted}
          value={date}
          onChangeText={setDate}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryContainer}>
          {CATEGORIES.map((item) => (
            <TouchableOpacity
              key={item}
              accessibilityRole="radio"
              accessibilityState={{ selected: category === item }}
              accessibilityLabel={`${item} category`}
              style={[
                styles.categoryChip,
                category === item && styles.activeCategory,
              ]}
              onPress={() => setCategory(item)}
            >
              <Text
                style={[
                  styles.categoryText,
                  category === item && styles.activeCategoryText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? "Saving..." : "Save transaction"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Your entries are stored locally while the backend is not configured.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
    </ScreenEntrance>
  );
}

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    padding: 22,
    paddingBottom: 45,
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
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 25,
  },
  typeContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    padding: 5,
    borderRadius: 14,
    marginBottom: 25,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 13,
    alignItems: "center",
    borderRadius: 10,
  },
  activeExpense: {
    backgroundColor: COLORS.danger,
  },
  activeIncome: {
    backgroundColor: COLORS.success,
  },
  typeText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  activeTypeText: {
    color: "#FFFFFF",
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 9,
    marginTop: 5,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 18,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 25,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeCategory: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  activeCategoryText: {
    color: "#FFFFFF",
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 13,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  note: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 15,
    lineHeight: 18,
  },
});