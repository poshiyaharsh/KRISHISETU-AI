import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import {
  deleteSavedSchemeApi,
  getPlotsApi,
  getPredictionsHistoryApi,
  getSavedSchemesApi,
} from '@/features/auth/api';
import type {
  FarmPlot,
  SavedSchemeItem,
  UserPredictionRecord,
} from '@/features/auth/types';
import { fetchWeather } from '@/features/weather/api';
import type { WeatherResponse } from '@/features/weather/types';
import { KrishiLoader } from '@/components/Loader/KrishiLoader';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  const [predictions, setPredictions] = useState<UserPredictionRecord[]>([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(true);

  const [savedSchemes, setSavedSchemes] = useState<SavedSchemeItem[]>([]);
  const [isLoadingSchemes, setIsLoadingSchemes] = useState(true);

  const [plots, setPlots] = useState<FarmPlot[]>([]);
  const [isLoadingPlots, setIsLoadingPlots] = useState(true);

  // 1. Fetch Weather for farmer's district if configured
  useEffect(() => {
    if (user?.profile?.district) {
      setIsLoadingWeather(true);
      fetchWeather({ district: user.profile.district })
        .then(setWeatherData)
        .catch(() => {})
        .finally(() => setIsLoadingWeather(false));
    }
  }, [user?.profile?.district]);

  // 2. Fetch Recent Recommendations
  useEffect(() => {
    setIsLoadingPredictions(true);
    getPredictionsHistoryApi(1)
      .then(res => setPredictions(res.results.slice(0, 5)))
      .catch(() => {})
      .finally(() => setIsLoadingPredictions(false));
  }, []);

  // 3. Fetch Saved Schemes
  const loadSavedSchemes = () => {
    setIsLoadingSchemes(true);
    getSavedSchemesApi()
      .then(setSavedSchemes)
      .catch(() => {})
      .finally(() => setIsLoadingSchemes(false));
  };

  useEffect(() => {
    loadSavedSchemes();
  }, []);

  // 4. Fetch Plots
  useEffect(() => {
    setIsLoadingPlots(true);
    getPlotsApi()
      .then(setPlots)
      .catch(() => {})
      .finally(() => setIsLoadingPlots(false));
  }, []);

  const handleRemoveScheme = async (slug: string) => {
    try {
      await deleteSavedSchemeApi(slug);
      setSavedSchemes(prev => prev.filter(s => s.slug !== slug));
    } catch {
      // Silently catch
    }
  };

  const displayName = user?.profile?.display_name || user?.email?.split('@')[0] || t('dashboard.kisan', 'Farmer');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-paddy text-on-dark p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-leaf">
            {t('dashboard.overview', 'Farmer Portal')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            {t('dashboard.greeting', 'Namaste, {{name}}!', { name: displayName })}
          </h1>
          <p className="mt-2 text-sm text-on-dark/90 max-w-xl">
            {t('dashboard.welcome_msg', 'Access your farm plots, recent crop recommendations, bookmarked schemes, and real-time advisory.')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="px-4 py-2.5 bg-cream text-paddy text-sm font-semibold rounded-xl hover:bg-mist transition-colors shadow-sm"
          >
            {t('dashboard.edit_profile', 'Edit Farm Profile')}
          </Link>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => navigate('/recommend')}
          className="p-4 bg-white border border-mist rounded-2xl hover:border-paddy hover:shadow-sm transition-all text-start group"
        >
          <span className="text-2xl block mb-2">🌾</span>
          <h2 className="text-sm font-bold text-heading group-hover:text-paddy transition-colors">
            {t('nav.recommend', 'Crop Advisory')}
          </h2>
          <p className="text-xs text-muted mt-1">
            {t('dashboard.quick_recommend', 'Calculate ideal crop')}
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/weather')}
          className="p-4 bg-white border border-mist rounded-2xl hover:border-paddy hover:shadow-sm transition-all text-start group"
        >
          <span className="text-2xl block mb-2">⛅</span>
          <h2 className="text-sm font-bold text-heading group-hover:text-paddy transition-colors">
            {t('nav.weather', 'Local Weather')}
          </h2>
          <p className="text-xs text-muted mt-1">
            {t('dashboard.quick_weather', '7-day rain & temp')}
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/schemes')}
          className="p-4 bg-white border border-mist rounded-2xl hover:border-paddy hover:shadow-sm transition-all text-start group"
        >
          <span className="text-2xl block mb-2">🏛️</span>
          <h2 className="text-sm font-bold text-heading group-hover:text-paddy transition-colors">
            {t('nav.schemes', 'Govt Schemes')}
          </h2>
          <p className="text-xs text-muted mt-1">
            {t('dashboard.quick_schemes', 'Subsidies & welfare')}
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/chat')}
          className="p-4 bg-white border border-mist rounded-2xl hover:border-paddy hover:shadow-sm transition-all text-start group"
        >
          <span className="text-2xl block mb-2">🤖</span>
          <h2 className="text-sm font-bold text-heading group-hover:text-paddy transition-colors">
            {t('nav.chat', 'Krishi Mitra')}
          </h2>
          <p className="text-xs text-muted mt-1">
            {t('dashboard.quick_chat', 'AI farming assistant')}
          </p>
        </button>
      </div>

      {/* Main Grid: Weather & Plots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Local Weather Card */}
        <div className="bg-white p-6 rounded-2xl border border-mist shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-mist">
            <h2 className="text-lg font-bold text-heading flex items-center gap-2">
              <span>🌦️</span> {t('dashboard.weather_title', 'Local Weather')}
            </h2>
            {user?.profile?.district_name && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-cream rounded-full text-soil">
                {user.profile.district_name}
              </span>
            )}
          </div>

          <div className="mt-4">
            {isLoadingWeather ? (
              <div className="py-8 flex justify-center">
                <KrishiLoader />
              </div>
            ) : weatherData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-extrabold text-soil tabular-nums">
                      {Math.round(weatherData.current.temperature)}°C
                    </span>
                    <span className="block text-xs text-muted mt-0.5">
                      {weatherData.current.condition || 'Current Condition'}
                    </span>
                  </div>
                  <div className="text-end text-xs text-muted space-y-1">
                    <div>
                      {t('weather.humidity', 'Humidity')}:{' '}
                      <span className="font-semibold text-soil tabular-nums">
                        {weatherData.current.relative_humidity}%
                      </span>
                    </div>
                    <div>
                      {t('weather.wind', 'Wind')}:{' '}
                      <span className="font-semibold text-soil tabular-nums">
                        {weatherData.current.wind_speed} km/h
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-mist/50">
                  <Link
                    to="/weather"
                    className="text-xs font-semibold text-paddy hover:underline block text-center"
                  >
                    {t('dashboard.view_full_forecast', 'View 7-day agricultural forecast →')}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted">
                  {t('dashboard.set_district_prompt', 'Select your state and district in profile to see localized weather updates.')}
                </p>
                <Link
                  to="/profile"
                  className="mt-3 inline-block text-xs font-semibold text-paddy hover:underline"
                >
                  {t('dashboard.configure_location', 'Configure Farm Location →')}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Farm Plots Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-mist shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-mist">
            <div>
              <h2 className="text-lg font-bold text-heading">
                {t('profile.plots_title', 'Farm Plots')}
              </h2>
              <span className="text-xs text-muted">
                {t('dashboard.plots_count', '{{count}} of 5 plots registered', { count: plots.length })}
              </span>
            </div>
            <Link
              to="/profile"
              className="text-xs font-semibold text-paddy hover:underline"
            >
              + {t('profile.add_plot', 'Manage Plots')}
            </Link>
          </div>

          <div className="mt-4">
            {isLoadingPlots ? (
              <div className="py-8 flex justify-center">
                <KrishiLoader />
              </div>
            ) : plots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted">
                  {t('dashboard.no_plots_yet', 'No farm plots added yet. Register your fields to track soil type and acreage.')}
                </p>
                <Link
                  to="/profile"
                  className="mt-3 inline-block px-4 py-2 bg-paddy text-on-dark text-xs font-semibold rounded-xl hover:bg-paddy-light transition-colors"
                >
                  {t('profile.add_first_plot', 'Add Your First Plot')}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {plots.map(p => (
                  <div
                    key={p.id}
                    className="p-3.5 bg-cream/30 border border-mist rounded-xl hover:border-paddy/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-soil">{p.name}</h3>
                      <span className="text-xs font-semibold text-paddy tabular-nums">
                        {p.area_value} {p.area_unit}
                      </span>
                    </div>
                    {p.soil_type && (
                      <span className="inline-block mt-1.5 text-xs px-2 py-0.5 bg-white border border-mist/80 rounded-md text-muted">
                        {p.soil_type}
                      </span>
                    )}
                    {p.notes && (
                      <p className="text-xs text-muted mt-2 line-clamp-1 italic">
                        {p.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Row: Recent Recommendations & Saved Schemes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Recommendations */}
        <div className="bg-white p-6 rounded-2xl border border-mist shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-mist">
            <h2 className="text-lg font-bold text-heading">
              {t('dashboard.recent_recommendations', 'Recent Crop Recommendations')}
            </h2>
            <Link
              to="/recommend"
              className="text-xs font-semibold text-paddy hover:underline"
            >
              + {t('dashboard.new_test', 'New Advisory')}
            </Link>
          </div>

          <div className="mt-4">
            {isLoadingPredictions ? (
              <div className="py-8 flex justify-center">
                <KrishiLoader />
              </div>
            ) : predictions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted">
                  {t('dashboard.no_predictions', 'No crop recommendations generated on this account yet.')}
                </p>
                <Link
                  to="/recommend"
                  className="mt-3 inline-block px-4 py-2 bg-paddy text-on-dark text-xs font-semibold rounded-xl hover:bg-paddy-light transition-colors"
                >
                  {t('dashboard.start_recommendation', 'Run First Advisory')}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {predictions.map(pred => {
                  const topResult = pred.results?.[0];
                  const dateStr = new Date(pred.created_at).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={pred.id}
                      className="p-3.5 bg-cream/30 border border-mist rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-heading text-sm capitalize">
                            {topResult?.crop || 'Crop'}
                          </span>
                          {topResult?.score && (
                            <span className="text-xs px-2 py-0.5 bg-paddy/10 text-paddy font-semibold rounded-md tabular-nums">
                              {Math.round(topResult.score * 100)}% match
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted block mt-1">
                          {dateStr} • N:{pred.nitrogen} P:{pred.phosphorus} K:{pred.potassium} pH:{pred.ph}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bookmarked Schemes */}
        <div className="bg-white p-6 rounded-2xl border border-mist shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-mist">
            <h2 className="text-lg font-bold text-heading">
              {t('dashboard.saved_schemes', 'Bookmarked Government Schemes')}
            </h2>
            <Link
              to="/schemes"
              className="text-xs font-semibold text-paddy hover:underline"
            >
              {t('dashboard.browse_all_schemes', 'Browse All →')}
            </Link>
          </div>

          <div className="mt-4">
            {isLoadingSchemes ? (
              <div className="py-8 flex justify-center">
                <KrishiLoader />
              </div>
            ) : savedSchemes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted">
                  {t('dashboard.no_saved_schemes', 'You have not bookmarked any government schemes yet.')}
                </p>
                <Link
                  to="/schemes"
                  className="mt-3 inline-block px-4 py-2 bg-paddy text-on-dark text-xs font-semibold rounded-xl hover:bg-paddy-light transition-colors"
                >
                  {t('dashboard.explore_schemes', 'Explore Schemes Catalog')}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {savedSchemes.map(scheme => (
                  <div
                    key={scheme.id}
                    className="p-3.5 bg-cream/30 border border-mist rounded-xl flex items-start justify-between gap-3"
                  >
                    <div>
                      <Link
                        to={`/schemes/${scheme.slug}`}
                        className="text-sm font-bold text-soil hover:text-paddy transition-colors block"
                      >
                        {scheme.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-white border border-mist/80 rounded text-muted uppercase font-medium">
                          {scheme.level}
                        </span>
                        {scheme.category && (
                          <span className="text-xs text-muted">
                            {scheme.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {scheme.official_url && (
                        <a
                          href={scheme.official_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2.5 py-1 bg-white border border-mist hover:border-paddy rounded text-soil hover:text-paddy transition-colors"
                        >
                          {t('schemes.apply_now', 'Portal')} ↗
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveScheme(scheme.slug)}
                        className="text-muted hover:text-red-600 text-xs p-1"
                        title={t('common.delete', 'Remove')}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
