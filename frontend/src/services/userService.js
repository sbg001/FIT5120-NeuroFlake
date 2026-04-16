import {
  mockChildProfile,
  mockParentProfile,
  mockParentChildRelation,
} from "../data/mockUsers";
import { supabase } from "../lib/supabase";

const mockUserPins = {
  [mockChildProfile.user_id]: "1111",
  [mockParentProfile.user_id]: "2222",
};

function toLoginProfile(user) {
  return {
    user_id: user.user_id,
    name: user.name,
    role: user.role,
  };
}

export async function getChildProfile() {
  const currentUserId = localStorage.getItem("current_user_id");

  if (!supabase) {
    return { data: mockChildProfile, error: null };
  }

  if (currentUserId) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", currentUserId)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const normalizedRole = String(data.role || "").toLowerCase();
      if (normalizedRole === "child") {
        return { data, error: null };
      }
    }
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("role", "child")
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: mockChildProfile, error: null };
  }

  return { data: data || mockChildProfile, error: null };
}

export async function getParentProfile() {
  const currentUserId = localStorage.getItem("current_user_id");

  if (!supabase) {
    return { data: mockParentProfile, error: null };
  }

  if (currentUserId) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", currentUserId)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const normalizedRole = String(data.role || "").toLowerCase();
      if (normalizedRole === "parent") {
        return { data, error: null };
      }
    }
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("role", "parent")
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: mockParentProfile, error: null };
  }

  return { data: data || mockParentProfile, error: null };
}

export async function getParentChildRelation() {
  if (!supabase) {
    return { data: mockParentChildRelation, error: null };
  }

  const { data, error } = await supabase
    .from("parent_child_relation")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: mockParentChildRelation, error: null };
  }

  return { data: data || mockParentChildRelation, error: null };
}

export async function getUsers() {
  if (!supabase) {
    return {
      data: [toLoginProfile(mockChildProfile), toLoginProfile(mockParentProfile)],
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("users")
    .select("user_id, name, role, created_at")
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) {
    return {
      data: [toLoginProfile(mockChildProfile), toLoginProfile(mockParentProfile)],
      error: null,
    };
  }

  return { data, error: null };
}

export async function loginWithPin(userId, pinCode) {
  const normalizedUserId = String(userId);
  const normalizedPinCode = String(pinCode);

  if (!supabase) {
    const mockUsers = [mockChildProfile, mockParentProfile];
    const matchedUser =
      mockUsers.find((user) => String(user.user_id) === normalizedUserId) || null;

    if (!matchedUser) {
      return { data: null, error: "User not found." };
    }

    if (String(mockUserPins[matchedUser.user_id]) !== normalizedPinCode) {
      return { data: null, error: "Invalid PIN." };
    }

    return { data: matchedUser, error: null };
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", normalizedUserId)
    .eq("pin_code", normalizedPinCode)
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: "Invalid PIN." };
  }

  return { data, error: null };
}
// =======================
// GET CHILD PREFERENCES
// =======================
export async function getChildPreferences() {
  const childProfileResult = await getChildProfile();
  const childProfile = childProfileResult.data;

  const fallbackPreferences = {
    child_id: childProfile?.user_id || null,
    theme: "fun",
    character_style: "star",
    reward_interest: "games",
  };

  if (!supabase || !childProfile?.user_id) {
    return { data: fallbackPreferences, error: null };
  }

  const { data, error } = await supabase
    .from("child_preferences")
    .select("*")
    .eq("child_id", childProfile.user_id)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { data: fallbackPreferences, error: null };
  }

  return { data, error: null };
}

// =======================
// UPSERT CHILD PREFERENCES
// =======================
export async function upsertChildPreferences(payload) {
  const childProfileResult = await getChildProfile();
  const childProfile = childProfileResult.data;
  const childId = payload.child_id || childProfile?.user_id;

  const preferencePayload = {
    child_id: childId,
    theme: payload.theme || "fun",
    character_style: payload.character_style || "star",
    reward_interest: payload.reward_interest || "games",
    updated_at: new Date().toISOString(),
  };

  if (!supabase || !childId) {
    return { data: preferencePayload, error: null };
  }

  const { data, error } = await supabase
    .from("child_preferences")
    .upsert(preferencePayload, { onConflict: "child_id" })
    .select()
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: preferencePayload, error: null };
  }

  return { data, error: null };
}
