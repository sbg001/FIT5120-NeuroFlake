import {
  mockChildProfile,
  mockParentProfile,
  mockParentChildRelation,
} from "../data/mockUsers";
import {
  clearRequestCache,
  getCachedResource,
  invalidateCachePrefix,
} from "./requestCache";

const MOCK_USERS_STORAGE_KEY = "neuroflake_mock_users";
const CHILD_PREFERENCES_STORAGE_KEY = "neuroflake_child_preferences";

const API_BASE_URL =
  import.meta.env.VITE_CHATBOT_API_URL || "";

const defaultMockUsers = [
  {
    ...mockParentProfile,
    role: "parent",
    email: "parent@neuroflake.test",
    username: "",
    password: "parent123",
    pin_code: "1111",
    age: null,
    gender: null,
    parent_id: null,
    created_at: new Date().toISOString(),
  },
  {
    ...mockChildProfile,
    role: "child",
    email: "",
    username: "leo",
    password: "child123",
    age: mockChildProfile.age || 7,
    gender: mockChildProfile.gender || "male",
    pin_code: "2222",
    parent_id: mockParentProfile.user_id,
    created_at: new Date().toISOString(),
  },
];

function readMockUsers() {
  const storedUsers = localStorage.getItem(MOCK_USERS_STORAGE_KEY);

  if (!storedUsers) {
    localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(defaultMockUsers));
    return defaultMockUsers;
  }

  try {
    const parsedUsers = JSON.parse(storedUsers);

    if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
      return parsedUsers;
    }

    localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(defaultMockUsers));
    return defaultMockUsers;
  } catch {
    localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(defaultMockUsers));
    return defaultMockUsers;
  }
}

function getCurrentUserId() {
  return localStorage.getItem("current_user_id");
}

function readChildPreferencesStore() {
  const storedPreferences = localStorage.getItem(CHILD_PREFERENCES_STORAGE_KEY);

  if (!storedPreferences) {
    return {};
  }

  try {
    const parsedPreferences = JSON.parse(storedPreferences);
    return parsedPreferences && typeof parsedPreferences === "object"
      ? parsedPreferences
      : {};
  } catch {
    return {};
  }
}

function writeChildPreferencesStore(store) {
  localStorage.setItem(CHILD_PREFERENCES_STORAGE_KEY, JSON.stringify(store));
}

function toLoginProfile(user) {
  return {
    user_id: user.user_id,
    name: user.name,
    role: user.role,
  };
}

async function apiRequest(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: data?.detail || data?.error || "Request failed.",
      };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error.message || "Request failed.",
    };
  }
}

// =======================
// GET CHILD PROFILE
// =======================
export async function getChildProfile() {
  const currentUserId = getCurrentUserId();
  const currentUserRole = String(
    localStorage.getItem("current_user_role") || ""
  ).toLowerCase();
  const currentUserName = localStorage.getItem("current_user_name");
  const activeChildId = localStorage.getItem("current_child_id") || "";
  const cacheKey = `child-profile:${currentUserRole}:${currentUserId || ""}:${activeChildId}`;

  return getCachedResource(
    cacheKey,
    async () => {
      if (currentUserId && currentUserRole === "parent") {
        const childrenResult = await getChildrenByParent(currentUserId);
        const firstChild = childrenResult.data?.[0];

        if (firstChild) {
          return {
            data: {
              ...mockChildProfile,
              ...firstChild,
            },
            error: childrenResult.error,
          };
        }

        return {
          data: null,
          error: childrenResult.error || null,
        };
      }

      if (currentUserId && currentUserRole === "child") {
        return {
          data: {
            ...mockChildProfile,
            user_id: currentUserId,
            role: "child",
            name: currentUserName || mockChildProfile.name,
          },
          error: null,
        };
      }

      return {
        data: null,
        error: null,
      };
    },
    { ttlMs: 30000 }
  );
}
// =======================
// GET PARENT PROFILE
// =======================
export async function getParentProfile() {
  const currentUserId = getCurrentUserId();
  const currentUserRole = String(
    localStorage.getItem("current_user_role") || ""
  ).toLowerCase();
  const currentUserName = localStorage.getItem("current_user_name");

  if (currentUserId && currentUserRole === "parent") {
    return {
      data: {
        ...mockParentProfile,
        user_id: currentUserId,
        role: "parent",
        name: currentUserName || mockParentProfile.name,
      },
      error: null,
    };
  }

  return {
    data: mockParentProfile,
    error: null,
  };
}

// =======================
// GET PARENT CHILD RELATION
// =======================
export async function getParentChildRelation() {
  const currentUserId = getCurrentUserId();

  if (currentUserId) {
    const childrenResult = await getChildrenByParent(currentUserId);
    const child = childrenResult.data?.[0];

    if (child) {
      return {
        data: {
          parent_id: currentUserId,
          child_id: child.user_id,
        },
        error: null,
      };
    }
  }

  return { data: mockParentChildRelation, error: null };
}

// =======================
// GET USERS
// =======================
export async function getUsers() {
  // There is no dedicated /api/auth/users endpoint yet.
  // Keep this compatible for legacy UI by returning mock login profiles.
  return {
    data: readMockUsers().map(toLoginProfile),
    error: null,
  };
}

// =======================
// OLD PIN LOGIN - kept for compatibility
// =======================
export async function loginWithPin(userId, pinCode) {
  const normalizedUserId = String(userId);
  const normalizedPinCode = String(pinCode).trim();

  const fallbackUser =
    readMockUsers().find((item) => String(item.user_id) === normalizedUserId) ||
    null;

  if (!fallbackUser) {
    return { data: null, error: "User not found." };
  }

  if (String(fallbackUser.pin_code || "") !== normalizedPinCode) {
    return { data: null, error: "Invalid PIN." };
  }

  return { data: fallbackUser, error: null };
}

// =======================
// UNIFIED SIGN IN
// Parent: email + password
// Child: username + password
// =======================
export async function signInUser({ identifier, password }) {
  const result = await apiRequest("/api/auth/sign-in", {
    method: "POST",
    body: JSON.stringify({
      identifier,
      password,
    }),
  });

  if (!result.error) {
    clearRequestCache();
  }

  return result;
}

// =======================
// REGISTER PARENT
// =======================
export async function registerParent({ name, email, password }) {
  const result = await apiRequest("/api/auth/register-parent", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });

  if (!result.error) {
    clearRequestCache();
  }

  return result;
}

// =======================
// CREATE CHILD ACCOUNT
// Parent only
// =======================
export async function createChildAccount({
  parentId,
  name,
  username,
  password,
  age,
  gender,
}) {
  const result = await apiRequest("/api/auth/create-child", {
    method: "POST",
    body: JSON.stringify({
      parentId,
      name,
      username,
      password,
      age: Number(age),
      gender,
    }),
  });

  if (!result.error) {
    invalidateCachePrefix("children-by-parent:");
    invalidateCachePrefix("child-profile:");
  }

  return result;
}

export async function updateChildPassword({ parentId, childId, password }) {
  return apiRequest(`/api/auth/children/${childId}/password`, {
    method: "PUT",
    body: JSON.stringify({
      parentId,
      childId,
      password,
    }),
  });
}

export async function updateParentPassword({ parentId, password }) {
  return apiRequest(`/api/auth/parents/${parentId}/password`, {
    method: "PUT",
    body: JSON.stringify({
      parentId,
      password,
    }),
  });
}

// =======================
// GET CHILDREN BY PARENT
// =======================
export async function getChildrenByParent(parentId) {
  if (!parentId) {
    return { data: [], error: null };
  }

  return getCachedResource(
    `children-by-parent:${parentId}`,
    () =>
      apiRequest(`/api/auth/children/${parentId}`, {
        method: "GET",
      }),
    { ttlMs: 30000 }
  );
}

// =======================
// OLD PARENT SIGN IN - kept for compatibility
// =======================
export async function signInParent({ email, password }) {
  return signInUser({ identifier: email, password });
}

// =======================
// GET CHILD PREFERENCES
// =======================
export async function getChildPreferences() {
  const currentUserId = localStorage.getItem("current_user_id");
  const currentUserRole = String(
    localStorage.getItem("current_user_role") || ""
  ).toLowerCase();

  const childId =
    currentUserRole === "child"
      ? currentUserId
      : localStorage.getItem("current_child_id");

  const fallbackPreferences = {
    child_id: childId || null,
    character_style: "dog",
  };

  if (!childId) {
    return { data: fallbackPreferences, error: null };
  }

  const preferenceStore = readChildPreferencesStore();
  const storedPreference = preferenceStore[String(childId)];

  if (storedPreference) {
    return {
      data: {
        ...fallbackPreferences,
        ...storedPreference,
        child_id: childId,
      },
      error: null,
    };
  }

  return { data: fallbackPreferences, error: null };
}

// =======================
// UPSERT CHILD PREFERENCES
// =======================
export async function upsertChildPreferences(payload) {
  const currentUserId = localStorage.getItem("current_user_id");
  const currentUserRole = String(
    localStorage.getItem("current_user_role") || ""
  ).toLowerCase();
  const fallbackChildId =
    currentUserRole === "child"
      ? currentUserId
      : localStorage.getItem("current_child_id");
  const childId = payload.child_id || fallbackChildId;

  const preferencePayload = {
    child_id: childId,
    character_style: payload.character_style || "dog",
    updated_at: new Date().toISOString(),
  };

  if (!childId) {
    return { data: null, error: "Child preferences could not be saved." };
  }

  const preferenceStore = readChildPreferencesStore();
  preferenceStore[String(childId)] = preferencePayload;
  writeChildPreferencesStore(preferenceStore);

  return { data: preferencePayload, error: null };
}
