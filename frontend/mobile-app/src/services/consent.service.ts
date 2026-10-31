import AsyncStorage from "@react-native-async-storage/async-storage";
import { emitAccessChange } from "./access-events";
import { isBackendConfigured } from "./api";

const MOCK_CONSENT_KEY = "worthly_mock_consent";
const LEGACY_MOCK_CONSENT_KEY = "creditpulse_mock_consent";
const CONSENT_CACHE_MS = 30_000;
let consentCache: { record: any; checkedAt: number } | null = null;

export interface ConsentPayload {
  consent_given: boolean;
  purpose: string;
  data_categories?: string[];
  consent_version?: string;
}

export async function saveConsent(payload: ConsentPayload) {
  if (isBackendConfigured()) {
    const { api } = await import("./api");
    const response = await api.post("/consents/", {
      consent_given: payload.consent_given,
      purpose: payload.data_categories?.length
        ? `${payload.purpose} (categories: ${payload.data_categories.join(", ")})`
        : payload.purpose,
      consent_version: "1.0",
    });
    consentCache = {
      record: { ...payload, status: payload.consent_given ? "active" : "revoked", saved_at: new Date().toISOString() },
      checkedAt: Date.now(),
    };
    emitAccessChange();
    return response.data;
  }

  const record = {
      ...payload,
      status: "active",
      saved_at: new Date().toISOString(),
    };
  await AsyncStorage.setItem(MOCK_CONSENT_KEY, JSON.stringify(record));
  consentCache = { record, checkedAt: Date.now() };
  emitAccessChange();

  return {
    success: true,
    message: "Mock consent saved locally.",
    data: {
      consent_id: "mock-consent",
      status: "active",
    },
  };
}

export async function getConsent() {
  if (consentCache && Date.now() - consentCache.checkedAt < CONSENT_CACHE_MS) {
    return consentCache.record;
  }
  if (isBackendConfigured()) {
    const { api } = await import("./api");
    try {
      const response = await api.get("/consents/me");
      const body = response.data;
      const value = body?.data?.consent ?? body?.data ?? body?.consent ?? body;
      const records = Array.isArray(value) ? value : value?.consents;
      const record = Array.isArray(records)
        ? records.find((item: any) => item?.consent_given) ?? records[0] ?? null
        : value;
      consentCache = { record, checkedAt: Date.now() };
      return record;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        consentCache = { record: null, checkedAt: Date.now() };
        return null;
      }
      throw error;
    }
  }

  let savedConsent = await AsyncStorage.getItem(MOCK_CONSENT_KEY);
  if (!savedConsent) {
    savedConsent = await AsyncStorage.getItem(LEGACY_MOCK_CONSENT_KEY);
    if (savedConsent) {
      await AsyncStorage.setItem(MOCK_CONSENT_KEY, savedConsent);
      await AsyncStorage.removeItem(LEGACY_MOCK_CONSENT_KEY);
    }
  }
  const record = savedConsent ? JSON.parse(savedConsent) : null;
  consentCache = { record, checkedAt: Date.now() };
  return record;
}

export async function hasActiveConsent() {
  const consent = await getConsent();
  return Boolean(
    (consent?.consent_given || consent?.status === "active" || consent?.status === "granted") &&
      consent?.status !== "revoked" &&
      consent?.status !== "withdrawn"
  );
}

export function clearConsentCache() {
  consentCache = null;
}

export async function revokeConsent() {
  if (isBackendConfigured()) {
    const { api } = await import("./api");
    const response = await api.post("/consents/", {
      consent_given: false,
      purpose: "Financial wellness assessment",
      consent_version: "1.0",
    } satisfies ConsentPayload);
    consentCache = {
      record: { consent_given: false, status: "revoked", data_categories: [] },
      checkedAt: Date.now(),
    };
    emitAccessChange();
    return response.data;
  }

  const savedConsent = await AsyncStorage.getItem(MOCK_CONSENT_KEY);
  const current = savedConsent ? JSON.parse(savedConsent) : {};
  const revoked = {
    ...current,
    consent_given: false,
    status: "revoked",
    revoked_at: new Date().toISOString(),
  };
  await AsyncStorage.setItem(MOCK_CONSENT_KEY, JSON.stringify(revoked));
  consentCache = { record: revoked, checkedAt: Date.now() };
  emitAccessChange();
  return { success: true, data: revoked };
}
