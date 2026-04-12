import {
  mockChildProfile,
  mockParentProfile,
  mockParentChildRelation,
} from "../data/mockUsers";
import { supabase } from "../lib/supabase";

export async function getChildProfile() {
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