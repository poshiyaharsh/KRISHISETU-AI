import { useState } from 'react';
import { KrishiLoader, Skeleton } from './components';
import { DevStatus } from './pages/DevStatus';

export function App() {
  const [showFullLoader, setShowFullLoader] = useState(false);

  return (
    <div className="min-h-screen bg-cream text-soil p-6 md:p-12">
      {showFullLoader && (
        <KrishiLoader
          fullScreen
          message="Loading KrishiSetu Platform..."
          className="cursor-pointer"
          tipIntervalMs={2500}
        />
      )}

      <header className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-mist">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="KrishiSetu AI" className="h-12 w-auto" />
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-semibold bg-mist text-paddy">
            <span className="w-2 h-2 rounded-full bg-success"></span>
            Phase 1 Foundation Live
          </span>
          <button
            onClick={() => setShowFullLoader(!showFullLoader)}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-paddy text-cream hover:opacity-90 transition-opacity"
          >
            Test Fullscreen Loader
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Loader Verification Card */}
          <section className="bg-white p-6 rounded-lg border border-mist shadow-sm flex flex-col items-center">
            <h2 className="text-xl font-bold text-paddy mb-4 self-start">
              1. Animated KrishiLoader Verification
            </h2>
            <div className="w-full py-4">
              <KrishiLoader
                message="Analyzing agricultural parameters..."
                size={100}
                tipIntervalMs={3000}
              />
            </div>
          </section>

          {/* Skeleton Verification Card */}
          <section className="bg-white p-6 rounded-lg border border-mist shadow-sm">
            <h2 className="text-xl font-bold text-paddy mb-4">
              2. Shimmer Skeleton State Verification
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton variant="circle" width={56} height={56} />
                <div className="flex-1">
                  <Skeleton variant="text" lines={2} />
                </div>
              </div>
              <Skeleton variant="rect" height={120} />
              <div className="flex justify-between items-center pt-2">
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="25%" />
              </div>
            </div>
          </section>
        </div>

        {/* Live Backend Connection Card */}
        <DevStatus />
      </main>

      <footer className="max-w-4xl mx-auto mt-12 pt-6 border-t border-mist text-center text-sm opacity-75">
        KrishiSetu AI • Smarter Farming. Better Decisions. Brighter Tomorrow.
      </footer>
    </div>
  );
}

export default App;
