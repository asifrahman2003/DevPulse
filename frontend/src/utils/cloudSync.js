const CLOUD_SESSION_KEY = "devpulse-cloud-session";

function getSupabaseConfig() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
}

export function isCloudConfigured() {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
}

function persistSession(session) {
  localStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify(session));
}

export function getCloudSession() {
  try {
    const raw = localStorage.getItem(CLOUD_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.access_token || !session?.user?.id) return null;
    return session;
  } catch {
    return null;
  }
}

export function clearCloudSession() {
  localStorage.removeItem(CLOUD_SESSION_KEY);
}

async function authRequest(path, payload) {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error("Cloud sync is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }

  const response = await fetch(`${url}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.msg || data?.error_description || data?.error || "Authentication failed.");
  }

  return data;
}

export async function signUpWithEmail(email, password) {
  const data = await authRequest("signup", { email, password });
  if (data?.access_token && data?.user) {
    persistSession(data);
  }
  return data;
}

export async function signInWithEmail(email, password) {
  const data = await authRequest("token?grant_type=password", { email, password });
  if (data?.access_token && data?.user) {
    persistSession(data);
  }
  return data;
}

export function signOutCloud() {
  clearCloudSession();
}

function getRestHeaders(accessToken) {
  const { anonKey } = getSupabaseConfig();
  return {
    "Content-Type": "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function uploadCloudPayload(payload) {
  const { url } = getSupabaseConfig();
  const session = getCloudSession();

  if (!url || !session?.access_token || !session?.user?.id) {
    throw new Error("You must be signed in to sync.");
  }

  const response = await fetch(`${url}/rest/v1/user_data`, {
    method: "POST",
    headers: {
      ...getRestHeaders(session.access_token),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify([
      {
        user_id: session.user.id,
        payload,
        updated_at: new Date().toISOString(),
      },
    ]),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Cloud upload failed.");
  }

  return data;
}

export async function downloadCloudPayload() {
  const { url } = getSupabaseConfig();
  const session = getCloudSession();

  if (!url || !session?.access_token || !session?.user?.id) {
    throw new Error("You must be signed in to sync.");
  }

  const query = new URLSearchParams({
    select: "payload,updated_at",
    user_id: `eq.${session.user.id}`,
    order: "updated_at.desc",
    limit: "1",
  });

  const response = await fetch(`${url}/rest/v1/user_data?${query.toString()}`, {
    method: "GET",
    headers: getRestHeaders(session.access_token),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Cloud download failed.");
  }

  if (!Array.isArray(data) || data.length === 0 || !data[0].payload) {
    return null;
  }

  return {
    payload: data[0].payload,
    updatedAt: data[0].updated_at,
  };
}
