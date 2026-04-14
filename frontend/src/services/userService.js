import {
  mockChildProfile,
  mockParentProfile,
  mockParentChildRelation,
} from "../data/mockUsers";
import { supabase } from "../lib/supabase";

export async function getChildProfile() {
  if (!supabase) {
    return { data: mockChildProfile, error: null };
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", "child")
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: mockChildProfile, error: null };
  }

  return { data: data || mockChildProfile, error: null };
}

export async function getParentProfile() {
  if (!supabase) {
    return { data: mockParentProfile, error: null };
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", "parent")
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
      data: [mockChildProfile, mockParentProfile],
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) {
    return {
      data: [mockChildProfile, mockParentProfile],
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

    if (String(matchedUser.pin_code) !== normalizedPinCode) {
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