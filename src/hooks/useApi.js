/**
 * src/hooks/useApi.js
 * Generic data-fetching hook that handles loading, error, and data states.
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * @param {Function} fetchFn  – async function to call
 * @param {any[]}    deps     – re-fetch when these change
 * @param {boolean}  enabled  – set false to skip initial fetch
 */
export function useApi(fetchFn, deps = [], enabled = true) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError]     = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (enabled) execute();
  }, [execute, enabled]);

  return { data, loading, error, refetch: execute };
}
