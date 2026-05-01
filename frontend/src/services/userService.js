import {
  mockChildProfile,
  mockParentProfile,
  mockParentChildRelation,
} from "../data/mockUsers";

const MOCK_USERS_STORAGE_KEY = "neuroflake_mock_users";

const API_BASE_URL =
  import.meta.env.VITE_CHATBOT_API_URL || "http://127.0.0.1:8000";

const defaultMockUsers = [
  {
    ...mockParentProfile,
    role: "parent",
    email: "parent@neuroflake.test",
    username: "",
    password: "parent123",
    pin_code: "1111",
    age: null,
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

function getCurrentMockUser() {
  const currentUserId = getCurrentUserId();

  if (!currentUserId) {
    return null;
  }

  return (
    readMockUsers().find(
      (user) => String(user.user_id) === String(currentUserId)
    ) || null
  );
}

function getFirstMockChildForParent(parentId) {
  const users = readMockUsers();

  return (
    users.find(
      (user) =>
        String(user.role).toLowerCase() === "child" &&
        String(user.parent_id) === String(parentId)
    ) ||
    users.find((user) => String(user.role).toLowerCase() === "child") ||
    mockChildProfile
  );
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

  if (currentUserId && currentUserRole === "parent") {
    const childrenResult = await getChildrenByParent(currentUserId);
    const firstChild = childrenResult.data?.[0];

    if (firstChild) {
      return {
        data: {
          ...mockChildProfile,
          ...firstChild,
        },
        error: null,
      };
    }

    return {
      data: null,
      error: null,
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
  return apiRequest("/api/auth/sign-in", {
    method: "POST",
    body: JSON.stringify({
      identifier,
      password,
    }),
  });
}

// =======================
// REGISTER PARENT
// =======================
export async function registerParent({ name, email, password }) {
  return apiRequest("/api/auth/register-parent", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });
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
}) {
  return apiRequest("/api/auth/create-child", {
    method: "POST",
    body: JSON.stringify({
      parentId,
      name,
      username,
      password,
      age: Number(age),
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

  return apiRequest(`/api/auth/children/${parentId}`, {
    method: "GET",
  });
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
  const childProfileResult = await getChildProfile();
  const childProfile = childProfileResult.data;

  const fallbackPreferences = {
    child_id: childProfile?.user_id || null,
    theme: "fun",
    character_style: "star",
    reward_interest: "games",
  };

  return { data: fallbackPreferences, error: null };
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

  return { data: preferencePayload, error: null };
}