const NEON_REST_URL =
  import.meta.env.VITE_NEON_REST_URL ||
  "https://ep-lucky-firefly-an19xs0x.apirest.c-6.us-east-1.aws.neon.tech/neondb/rest/v1";

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

async function neonRequest(path, options = {}) {
  try {
    const response = await fetch(`${NEON_REST_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      return {
        data: null,
        error:
          data?.message ||
          data?.error ||
          data?.hint ||
          `Neon request failed with status ${response.status}`,
      };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error.message || "Neon request failed.",
    };
  }
}

export async function neonSelect(table, params = {}) {
  return neonRequest(`/${table}${buildQuery(params)}`, {
    method: "GET",
  });
}

export async function neonInsert(table, payload) {
  return neonRequest(`/${table}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function neonUpdate(table, filters = {}, payload) {
  return neonRequest(`/${table}${buildQuery(filters)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function neonDelete(table, filters = {}) {
  return neonRequest(`/${table}${buildQuery(filters)}`, {
    method: "DELETE",
  });
}

export function maybeSingle(data) {
  if (Array.isArray(data)) {
    return data[0] || null;
  }

  return data || null;
}