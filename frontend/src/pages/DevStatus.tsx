import { useEffect, useState } from 'react';
import { apiGet, ApiError, HealthCheckResponse } from '../lib/api';
import { KrishiLoader } from '../components/Loader/KrishiLoader';

export function DevStatus() {
  const [data, setData] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<HealthCheckResponse>('/health/');
      setData(res);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to connect to backend API server.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg border border-mist shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-mist">
        <div>
          <h2 className="text-xl font-bold text-paddy">3. Backend API Connection</h2>
          <p className="text-sm text-soil opacity-80">
            Real-time status of Django REST Framework service
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-semibold rounded-md border border-paddy text-paddy hover:bg-mist transition-colors disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {loading && (
        <div className="py-8 flex justify-center">
          <KrishiLoader size={72} message="Connecting to KrishiSetu backend API..." />
        </div>
      )}

      {!loading && error && (
        <div className="p-4 rounded-md bg-red-50 border border-danger text-danger">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-sm">Connection Failed</p>
              <p className="text-sm mt-1">{error}</p>
              <p className="text-xs mt-2 opacity-80">
                Ensure the backend server is running on{' '}
                <code className="bg-white px-1 py-0.5 rounded border border-red-200">
                  http://localhost:8000
                </code>
              </p>
            </div>
            <button
              onClick={fetchHealth}
              className="px-3 py-1.5 text-xs font-bold rounded bg-danger text-white hover:opacity-90 transition-opacity shrink-0"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && data && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-success"></span>
            <span className="font-bold text-success uppercase text-sm tracking-wide">
              Service Healthy ({data.status})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-md bg-mist/50 border border-mist">
              <span className="text-xs opacity-70 block font-medium">Service</span>
              <span className="font-bold text-sm text-soil">{data.service}</span>
            </div>
            <div className="p-3 rounded-md bg-mist/50 border border-mist">
              <span className="text-xs opacity-70 block font-medium">API Version</span>
              <span className="font-bold text-sm text-soil">{data.version}</span>
            </div>
            <div className="p-3 rounded-md bg-mist/50 border border-mist">
              <span className="text-xs opacity-70 block font-medium">Server Time</span>
              <span className="font-mono text-xs text-soil block truncate">
                {new Date(data.time).toLocaleTimeString()} UTC
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
