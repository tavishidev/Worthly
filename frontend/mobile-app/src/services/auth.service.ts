import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";
import { emitAccessChange } from "./access-events";

const MOCK_USER_KEY = "creditpulse_mock_user";
const MOCK_SESSION_KEY = "worthly_mock_session";

export type AccountProfile = {
  fullName: string;
  email: string;
  phone: string;
};

type MockUser = {
  full_name?: string;
  email?: string;
  phone?: string;
};

type MockSession = {
  access_token: string;
  user: { id: string; email: string };
};

function isSupabaseConfigured() {
  return Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function signUp(
  fullName: string,
  email: string,
  password: string
) {
  const { clearConsentCache } = await import("./consent.service");
  clearConsentCache();
  if (isSupabaseConfigured()) {
    const { supabase } = await import("./supabase");

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    });

    if (error) throw error;
    emitAccessChange();
    return data;
  }

  const existingUser = await AsyncStorage.getItem(MOCK_USER_KEY);

  if (existingUser) {
    const parsed = JSON.parse(existingUser);

    if (parsed.email === email.trim().toLowerCase()) {
      throw new Error("This email is already registered in mock mode.");
    }
  }

  await AsyncStorage.setItem(
    MOCK_USER_KEY,
    JSON.stringify({
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
    })
  );
  await AsyncStorage.setItem(MOCK_SESSION_KEY, "active");
  emitAccessChange();

  return {
    user: {
      id: "mock-user",
      email: email.trim().toLowerCase(),
    },
    session: {
      access_token: "mock-access-token",
    },
  };
}

export async function signIn(email: string, password: string) {
  const { clearConsentCache } = await import("./consent.service");
  clearConsentCache();
  if (isSupabaseConfigured()) {
    const { supabase } = await import("./supabase");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) throw error;
    emitAccessChange();
    return data;
  }

  const savedUser = await AsyncStorage.getItem(MOCK_USER_KEY);

  if (!savedUser) {
    throw new Error("No mock account found. Please sign up first.");
  }

  const user = JSON.parse(savedUser);

  if (user.email !== email.trim().toLowerCase() || !password.trim()) {
    throw new Error("Please check your email and password.");
  }

  await AsyncStorage.setItem(MOCK_SESSION_KEY, "active");
  emitAccessChange();

  return {
    user: {
      id: "mock-user",
      email: user.email,
    },
    session: {
      access_token: "mock-access-token",
    },
  };
}

export async function getAccountProfile(): Promise<AccountProfile | null> {
  if (isSupabaseConfigured()) {
    const { supabase } = await import("./supabase");
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session) return null;

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) throw error;
    if (!user) {
      throw new Error("The account provider returned no user profile.");
    }

    return {
      fullName: user.user_metadata.full_name ?? "",
      email: user.email ?? "",
      phone: user.user_metadata.phone ?? "",
    };
  }

  const savedUser = await AsyncStorage.getItem(MOCK_USER_KEY);
  if (!savedUser) return null;

  const user = JSON.parse(savedUser) as MockUser;
  return {
    fullName: user.full_name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
  };
}

export async function updateAccountProfile(
  profile: Pick<AccountProfile, "fullName" | "phone">
) {
  const fullName = profile.fullName.trim();
  const phone = profile.phone.trim();

  if (isSupabaseConfigured()) {
    const { supabase } = await import("./supabase");
    const { data, error } = await supabase.auth.updateUser({
      data: { full_name: fullName, phone },
    });

    if (error) throw error;
    if (!data.user) {
      throw new Error("The account provider returned no updated user profile.");
    }

    return {
      fullName: data.user.user_metadata.full_name ?? "",
      email: data.user.email ?? "",
      phone: data.user.user_metadata.phone ?? "",
    } satisfies AccountProfile;
  }

  const savedUser = await AsyncStorage.getItem(MOCK_USER_KEY);
  if (!savedUser) {
    throw new Error("No preview account found. Create an account or sign in first.");
  }

  const user = JSON.parse(savedUser) as MockUser;
  user.full_name = fullName;
  user.phone = phone;
  await AsyncStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));

  return {
    fullName,
    email: user.email ?? "",
    phone,
  } satisfies AccountProfile;
}

export async function requestPasswordReset(email: string, redirectTo: string) {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Password recovery is unavailable in preview mode. Connect an account backend to receive reset emails."
    );
  }

  const { supabase } = await import("./supabase");
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo }
  );

  if (error) throw error;
}

export async function completePasswordRecovery(url: string) {
  if (!isSupabaseConfigured()) return false;

  const parsedUrl = new URL(url);
  const params = new URLSearchParams(parsedUrl.search);
  const fragment = parsedUrl.hash.startsWith("#")
    ? parsedUrl.hash.slice(1)
    : parsedUrl.hash;
  new URLSearchParams(fragment).forEach((value, key) => {
    params.set(key, value);
  });

  const { supabase } = await import("./supabase");
  const code = params.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return true;
  }

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken || params.get("type") !== "recovery") {
    return false;
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) throw error;
  return true;
}

export async function updatePassword(password: string) {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Password updates are unavailable in preview mode. Connect an account backend to change your password."
    );
  }

  const { supabase } = await import("./supabase");
  const { error } = await supabase.auth.updateUser({ password });

  if (error) throw error;
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const { supabase } = await import("./supabase");
    const { error } = await supabase.auth.signOut();

    if (error) throw error;
    const { clearConsentCache } = await import("./consent.service");
    clearConsentCache();
    emitAccessChange();
    return;
  }

  await AsyncStorage.removeItem(MOCK_SESSION_KEY);
  const { clearConsentCache } = await import("./consent.service");
  clearConsentCache();
  emitAccessChange();
}

export async function getCurrentSession(): Promise<Session | MockSession | null> {
  if (isSupabaseConfigured()) {
    const { supabase } = await import("./supabase");
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;
    return data.session;
  }

  const [sessionState, savedUser] = await Promise.all([
    AsyncStorage.getItem(MOCK_SESSION_KEY),
    AsyncStorage.getItem(MOCK_USER_KEY),
  ]);
  if (sessionState !== "active" || !savedUser) return null;
  const user = JSON.parse(savedUser) as MockUser;
  return {
    access_token: "mock-access-token",
    user: { id: "mock-user", email: user.email ?? "" },
  };
}

export async function getPostAuthRoute(): Promise<"/consent" | "/financial-profile" | "/dashboard"> {
  const [{ hasActiveConsent }, { getFinancialProfile }] = await Promise.all([
    import("./consent.service"), import("./profile.service"),
  ]);
  if (!(await hasActiveConsent())) return "/consent";

  const profileResponse = await getFinancialProfile();
  const profile = profileResponse?.data ?? profileResponse;
  return Number(profile?.monthly_income) > 0 ? "/dashboard" : "/financial-profile";
}
