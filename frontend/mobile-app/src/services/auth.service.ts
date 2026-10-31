import AsyncStorage from "@react-native-async-storage/async-storage";
import { emitAccessChange } from "./access-events";
import { ACCESS_TOKEN_KEY, api, isBackendConfigured, tokenStorage } from "./api";

const MOCK_USER_KEY = "creditpulse_mock_user";
const MOCK_SESSION_KEY = "worthly_mock_session";
const PENDING_PROFILE_NAME = "worthly_pending_profile_name";

export type AccountProfile = { fullName: string; email: string; phone: string };
type Session = { access_token: string; user: { id: string; email: string } };
type UserRecord = { id?: string; email?: string; full_name?: string; phone?: string; user_metadata?: { full_name?: string; phone?: string } };

const unwrap = (value: any) => value?.data?.data ?? value?.data ?? value;
const extractToken = (value: any): string | undefined => {
  const body = unwrap(value);
  return body?.access_token ?? body?.token ?? body?.session?.access_token ?? body?.data?.access_token;
};

async function saveBackendSession(value: any): Promise<Session> {
  const token = extractToken(value);
  if (!token) throw new Error("The API did not return an access token. Check the registration/login response in FastAPI.");
  await tokenStorage.set(ACCESS_TOKEN_KEY, token);
  const userBody = unwrap(value);
  const user = userBody?.user ?? userBody;
  emitAccessChange();
  return { access_token: token, user: { id: String(user?.id ?? ""), email: user?.email ?? "" } };
}

export async function signUp(fullName: string, email: string, password: string) {
  const { clearConsentCache } = await import("./consent.service");
  clearConsentCache();
  const cleanEmail = email.trim().toLowerCase();
  if (isBackendConfigured()) {
    const response = await api.post("/auth/register", { email: cleanEmail, password });
    const token = extractToken(response);
    if (token) {
      await saveBackendSession(response);
      // The register contract accepts credentials only; profile name is stored separately.
      try { await api.put("/profile/", { full_name: fullName.trim() }); } catch (error) {
        await tokenStorage.remove(ACCESS_TOKEN_KEY);
        throw error;
      }
      return { user: unwrap(response)?.user ?? unwrap(response), session: { access_token: token } };
    }
    await AsyncStorage.setItem(PENDING_PROFILE_NAME, fullName.trim());
    return { user: unwrap(response)?.user ?? null, session: null };
  }

  const existing = await AsyncStorage.getItem(MOCK_USER_KEY);
  if (existing && JSON.parse(existing).email === cleanEmail) throw new Error("This email is already registered in preview mode.");
  await AsyncStorage.setItem(MOCK_USER_KEY, JSON.stringify({ full_name: fullName.trim(), email: cleanEmail }));
  await AsyncStorage.setItem(MOCK_SESSION_KEY, "active");
  emitAccessChange();
  return { user: { id: "mock-user", email: cleanEmail }, session: { access_token: "mock-access-token" } };
}

export async function signIn(email: string, password: string) {
  const { clearConsentCache } = await import("./consent.service");
  clearConsentCache();
  const cleanEmail = email.trim().toLowerCase();
  if (isBackendConfigured()) {
    let response;
    try {
      response = await api.post("/auth/login", { email: cleanEmail, password });
    } catch (error: any) {
      if (error?.response?.status === 401) {
        throw new Error("Email or password was not accepted. If you created this account in preview mode, sign up again to create it in the backend.");
      }
      throw error;
    }
    const session = await saveBackendSession(response);
    try {
      await api.get("/auth/me");
    } catch (error: any) {
      if ([401, 403].includes(error?.response?.status)) {
        await tokenStorage.remove(ACCESS_TOKEN_KEY);
        emitAccessChange();
        throw new Error("FastAPI accepted the login but rejected its access token on /auth/me. The backend team needs to check token creation and validation use the same signing settings.");
      }
      throw new Error("Login succeeded, but Worthly could not verify the account session. Check the backend connection and try again.");
    }
    const pendingName = await AsyncStorage.getItem(PENDING_PROFILE_NAME);
    if (pendingName) {
      try {
        await api.put("/profile/", { full_name: pendingName });
        await AsyncStorage.removeItem(PENDING_PROFILE_NAME);
      } catch (error) {
        await tokenStorage.remove(ACCESS_TOKEN_KEY);
        emitAccessChange();
        throw error;
      }
    }
    return session;
  }
  const saved = await AsyncStorage.getItem(MOCK_USER_KEY);
  if (!saved) throw new Error("No preview account found. Please sign up first.");
  const user = JSON.parse(saved);
  if (user.email !== cleanEmail || !password.trim()) throw new Error("Please check your email and password.");
  await AsyncStorage.setItem(MOCK_SESSION_KEY, "active");
  emitAccessChange();
  return { access_token: "mock-access-token", user: { id: "mock-user", email: user.email } };
}

export async function getAccountProfile(): Promise<AccountProfile | null> {
  let user: UserRecord | null;
  if (isBackendConfigured()) {
    if (!(await tokenStorage.get(ACCESS_TOKEN_KEY))) return null;
    const [userResponse, profileResponse] = await Promise.all([api.get("/auth/me"), api.get("/profile/")]);
    const authUser = unwrap(userResponse);
    const profile = unwrap(profileResponse);
    user = { ...authUser, ...profile };
  } else {
    const saved = await AsyncStorage.getItem(MOCK_USER_KEY);
    if (!saved) return null;
    user = (JSON.parse(saved) as UserRecord | null) ?? {};
  }
  const account = user ?? {};
  return { fullName: account.full_name ?? account.user_metadata?.full_name ?? "", email: account.email ?? "", phone: account.phone ?? account.user_metadata?.phone ?? "" };
}

export async function updateAccountProfile(profile: Pick<AccountProfile, "fullName" | "phone">) {
  const fullName = profile.fullName.trim();
  const phone = profile.phone.trim();
  if (isBackendConfigured()) {
    if (phone) throw new Error("The current FastAPI profile contract cannot save phone numbers. Your name was not changed.");
    const response = await api.put("/profile/", { full_name: fullName });
    const updated = unwrap(response);
    return { fullName: updated.full_name ?? fullName, email: updated.email ?? (await getAccountProfile())?.email ?? "", phone: updated.phone ?? "" } satisfies AccountProfile;
  }
  const saved = await AsyncStorage.getItem(MOCK_USER_KEY);
  if (!saved) throw new Error("No preview account found. Create an account or sign in first.");
  const user = JSON.parse(saved) as UserRecord;
  user.full_name = fullName; user.phone = phone;
  await AsyncStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
  return { fullName, email: user.email ?? "", phone } satisfies AccountProfile;
}

export async function requestPasswordReset(_email: string, _redirectTo: string): Promise<never> {
  throw new Error("Password recovery is not available in the current FastAPI contract. Ask the backend team to add a reset-password endpoint.");
}
export async function completePasswordRecovery(_url: string) { return false; }
export async function updatePassword(_password: string): Promise<never> {
  throw new Error("Password updates are not available in the current FastAPI contract.");
}

export async function signOut() {
  await Promise.all([tokenStorage.remove(ACCESS_TOKEN_KEY), AsyncStorage.removeItem(MOCK_SESSION_KEY)]);
  const { clearConsentCache } = await import("./consent.service");
  clearConsentCache();
  emitAccessChange();
}

export async function getCurrentSession(): Promise<Session | null> {
  if (isBackendConfigured()) {
    const token = await tokenStorage.get(ACCESS_TOKEN_KEY);
    if (!token) return null;
    try {
      const response = await api.get("/auth/me");
      const user = unwrap(response);
      return { access_token: token, user: { id: String(user?.id ?? ""), email: user?.email ?? "" } };
    } catch (error: any) {
      if ([401, 403].includes(error?.response?.status)) {
        await tokenStorage.remove(ACCESS_TOKEN_KEY);
        return null;
      }
      throw error;
    }
  }
  const [state, saved] = await Promise.all([AsyncStorage.getItem(MOCK_SESSION_KEY), AsyncStorage.getItem(MOCK_USER_KEY)]);
  if (state !== "active" || !saved) return null;
  const user = JSON.parse(saved) as UserRecord;
  return { access_token: "mock-access-token", user: { id: "mock-user", email: user.email ?? "" } };
}

export async function getPostAuthRoute(): Promise<"/consent" | "/financial-profile" | "/dashboard"> {
  const [{ hasActiveConsent }, { getFinancialProfile }] = await Promise.all([import("./consent.service"), import("./profile.service")]);
  if (!(await hasActiveConsent())) return "/consent";
  const response = await getFinancialProfile();
  const profile = response?.data ?? response;
  return Number(profile?.monthly_income) > 0 ? "/dashboard" : "/financial-profile";
}
