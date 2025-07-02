import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface ApiMutationResponse<T> {
  mutate: (data: any) => Promise<T>;
  loading: boolean;
  error: string | null;
}

export function useSupabaseQuery<T>(
  endpoint: string,
  dependencies: any[] = []
): ApiResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: response, error: fetchError } = await supabase.functions.invoke('admin-api', {
        body: { endpoint, method: 'GET' }
      });

      if (fetchError) throw fetchError;
      
      setData(response);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
}

export function useSupabaseMutation<T>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST'
): ApiMutationResponse<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (data: any): Promise<T> => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: response, error: mutationError } = await supabase.functions.invoke('admin-api', {
        body: { endpoint, method, data }
      });

      if (mutationError) throw mutationError;
      
      return response;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}