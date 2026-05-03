const requestCache = new Map();

function isFresh(entry) {
  return Boolean(entry && entry.value !== undefined && entry.expiresAt > Date.now());
}

export async function getCachedResource(
  cacheKey,
  load,
  { ttlMs = 15000, force = false } = {}
) {
  if (!cacheKey) {
    return load();
  }

  const existingEntry = requestCache.get(cacheKey);

  if (!force && isFresh(existingEntry)) {
    return existingEntry.value;
  }

  if (!force && existingEntry?.promise) {
    return existingEntry.promise;
  }

  const pendingLoad = (async () => {
    try {
      const value = await load();
      requestCache.set(cacheKey, {
        value,
        expiresAt: Date.now() + ttlMs,
        promise: null,
      });
      return value;
    } catch (error) {
      requestCache.delete(cacheKey);
      throw error;
    }
  })();

  requestCache.set(cacheKey, {
    value: existingEntry?.value,
    expiresAt: existingEntry?.expiresAt || 0,
    promise: pendingLoad,
  });

  return pendingLoad;
}

export function invalidateCacheKey(cacheKey) {
  if (!cacheKey) {
    return;
  }

  requestCache.delete(cacheKey);
}

export function invalidateCachePrefix(prefix) {
  if (!prefix) {
    return;
  }

  Array.from(requestCache.keys()).forEach((key) => {
    if (String(key).startsWith(prefix)) {
      requestCache.delete(key);
    }
  });
}

export function clearRequestCache() {
  requestCache.clear();
}
