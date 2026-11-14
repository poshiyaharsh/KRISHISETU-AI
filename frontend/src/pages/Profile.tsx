import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import {
  createPlotApi,
  deletePlotApi,
  getPlotsApi,
} from '@/features/auth/api';
import type { FarmPlot } from '@/features/auth/types';
import { fetchStates, fetchDistricts } from '@/features/weather/api';
import type { StateItem, DistrictItem } from '@/features/weather/types';
import { KrishiLoader } from '@/components/Loader/KrishiLoader';

export const Profile: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();

  const [displayName, setDisplayName] = useState(user?.profile?.display_name || '');
  const [preferredLang, setPreferredLang] = useState(user?.profile?.preferred_language || i18n.language);
  const [selectedState, setSelectedState] = useState<number | ''>(user?.profile?.state || '');
  const [selectedDistrict, setSelectedDistrict] = useState<number | ''>(user?.profile?.district || '');
  const [landAreaValue, setLandAreaValue] = useState<string>(
    user?.profile?.land_area_value !== null && user?.profile?.land_area_value !== undefined
      ? String(user.profile.land_area_value)
      : ''
  );
  const [landAreaUnit, setLandAreaUnit] = useState<string>(user?.profile?.land_area_unit || 'acre');
  const [irrigationSource, setIrrigationSource] = useState<string>(
    user?.profile?.primary_irrigation_source || 'rainfed'
  );

  const [states, setStates] = useState<StateItem[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [plots, setPlots] = useState<FarmPlot[]>([]);
  const [isLoadingPlots, setIsLoadingPlots] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New plot form state
  const [isAddingPlot, setIsAddingPlot] = useState(false);
  const [plotName, setPlotName] = useState('');
  const [plotArea, setPlotArea] = useState('');
  const [plotUnit, setPlotUnit] = useState('acre');
  const [plotSoil, setPlotSoil] = useState('alluvial');
  const [plotNotes, setPlotNotes] = useState('');
  const [isCreatingPlot, setIsCreatingPlot] = useState(false);

  // Fetch states
  useEffect(() => {
    fetchStates().then(setStates).catch(() => {});
  }, []);

  // Fetch districts when state changes
  useEffect(() => {
    if (selectedState) {
      fetchDistricts(Number(selectedState)).then(setDistricts).catch(() => {});
    } else {
      setDistricts([]);
    }
  }, [selectedState]);

  // Load farmer plots
  const loadPlots = () => {
    setIsLoadingPlots(true);
    getPlotsApi()
      .then(setPlots)
      .catch(() => {})
      .finally(() => setIsLoadingPlots(false));
  };

  useEffect(() => {
    loadPlots();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      await updateProfile({
        display_name: displayName.trim(),
        preferred_language: preferredLang,
        state: selectedState ? Number(selectedState) : null,
        district: selectedDistrict ? Number(selectedDistrict) : null,
        land_area_value: landAreaValue ? parseFloat(landAreaValue) : null,
        land_area_unit: landAreaUnit as 'acre' | 'hectare' | 'bigha' | 'guntha',
        primary_irrigation_source: irrigationSource as 'rainfed' | 'canal' | 'borewell' | 'open_well' | 'drip_sprinkler' | 'other',
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plotName || !plotArea || parseFloat(plotArea) <= 0) return;

    setIsCreatingPlot(true);
    setErrorMessage(null);

    try {
      await createPlotApi({
        name: plotName.trim(),
        area_value: parseFloat(plotArea),
        area_unit: plotUnit as 'acre' | 'hectare' | 'bigha' | 'guntha',
        soil_type: plotSoil,
        district: selectedDistrict ? Number(selectedDistrict) : null,
        notes: plotNotes.trim(),
      });
      setPlotName('');
      setPlotArea('');
      setPlotNotes('');
      setIsAddingPlot(false);
      loadPlots();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add plot');
    } finally {
      setIsCreatingPlot(false);
    }
  };

  const handleDeletePlot = async (id: number) => {
    if (!window.confirm(t('profile.confirm_delete_plot', 'Are you sure you want to remove this plot?'))) {
      return;
    }
    try {
      await deletePlotApi(id);
      loadPlots();
    } catch {
      setErrorMessage('Failed to delete plot');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-mist gap-4">
        <div>
          <h1 className="text-3xl font-bold text-heading">
            {t('profile.title', 'Farmer Profile & Settings')}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t('profile.subtitle', 'Manage your agricultural holdings, land plots, and personal preferences.')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-sm font-medium text-soil bg-cream hover:bg-mist rounded-xl transition-colors"
          >
            {t('profile.back_dashboard', 'View Dashboard')}
          </button>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
          >
            {t('auth.logout', 'Sign Out')}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium">
          {t('profile.save_success', 'Your profile details have been saved successfully.')}
        </div>
      )}

      {errorMessage && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
          {errorMessage}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Profile Form */}
        <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-2xl border border-mist shadow-sm">
          <h2 className="text-xl font-bold text-heading mb-6">
            {t('profile.farm_details', 'Farm & Account Information')}
          </h2>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div>
              <label htmlFor="display_name" className="block text-sm font-medium text-soil mb-1">
                {t('profile.display_name', 'Farmer Name / Nickname')}
              </label>
              <input
                id="display_name"
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Rameshbhai Patel"
                className="w-full px-4 py-2.5 border border-mist rounded-xl text-soil placeholder:text-muted focus:ring-2 focus:ring-paddy focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="preferred_lang" className="block text-sm font-medium text-soil mb-1">
                {t('profile.preferred_language', 'Preferred Language')}
              </label>
              <select
                id="preferred_lang"
                value={preferredLang}
                onChange={e => setPreferredLang(e.target.value)}
                className="w-full px-4 py-2.5 border border-mist rounded-xl text-soil focus:ring-2 focus:ring-paddy focus:outline-none"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
              </select>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-soil mb-1">
                {t('auth.email_label', 'Email Address')}
              </label>
              <input
                id="email"
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-2.5 bg-gray-50 border border-mist rounded-xl text-muted cursor-not-allowed"
              />
              <span className="text-xs text-muted mt-1 block">
                {t('profile.email_immutable', 'Email is verified and cannot be changed directly.')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-soil mb-1">
                  {t('profile.state', 'State')}
                </label>
                <select
                  id="state"
                  value={selectedState}
                  onChange={e => {
                    const val = e.target.value ? Number(e.target.value) : '';
                    setSelectedState(val);
                    setSelectedDistrict('');
                  }}
                  className="w-full px-4 py-2.5 border border-mist rounded-xl text-soil focus:ring-2 focus:ring-paddy focus:outline-none"
                >
                  <option value="">{t('common.select_option', '-- Select State --')}</option>
                  {states.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="district" className="block text-sm font-medium text-soil mb-1">
                  {t('profile.district', 'District')}
                </label>
                <select
                  id="district"
                  value={selectedDistrict}
                  disabled={!selectedState}
                  onChange={e => setSelectedDistrict(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-2.5 border border-mist rounded-xl text-soil focus:ring-2 focus:ring-paddy focus:outline-none disabled:opacity-50"
                >
                  <option value="">{t('common.select_option', '-- Select District --')}</option>
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="land_area" className="block text-sm font-medium text-soil mb-1">
                  {t('profile.total_land', 'Total Land Area')}
                </label>
                <input
                  id="land_area"
                  type="number"
                  step="0.1"
                  min="0"
                  value={landAreaValue}
                  onChange={e => setLandAreaValue(e.target.value)}
                  placeholder="5.0"
                  className="w-full px-4 py-2.5 border border-mist rounded-xl text-soil placeholder:text-muted focus:ring-2 focus:ring-paddy focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <label htmlFor="land_unit" className="block text-sm font-medium text-soil mb-1">
                  {t('profile.land_unit', 'Area Unit')}
                </label>
                <select
                  id="land_unit"
                  value={landAreaUnit}
                  onChange={e => setLandAreaUnit(e.target.value)}
                  className="w-full px-4 py-2.5 border border-mist rounded-xl text-soil focus:ring-2 focus:ring-paddy focus:outline-none"
                >
                  <option value="acre">{t('profile.units.acre', 'Acre')}</option>
                  <option value="hectare">{t('profile.units.hectare', 'Hectare')}</option>
                  <option value="bigha">{t('profile.units.bigha', 'Bigha')}</option>
                  <option value="guntha">{t('profile.units.guntha', 'Guntha')}</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="irrigation" className="block text-sm font-medium text-soil mb-1">
                {t('profile.irrigation_source', 'Primary Irrigation Source')}
              </label>
              <select
                id="irrigation"
                value={irrigationSource}
                onChange={e => setIrrigationSource(e.target.value)}
                className="w-full px-4 py-2.5 border border-mist rounded-xl text-soil focus:ring-2 focus:ring-paddy focus:outline-none"
              >
                <option value="rainfed">{t('profile.irrigation.rainfed', 'Rainfed (Monsoon only)')}</option>
                <option value="canal">{t('profile.irrigation.canal', 'Canal')}</option>
                <option value="borewell">{t('profile.irrigation.borewell', 'Borewell / Tubewell')}</option>
                <option value="open_well">{t('profile.irrigation.open_well', 'Open Well')}</option>
                <option value="drip_sprinkler">{t('profile.irrigation.drip_sprinkler', 'Drip / Sprinkler')}</option>
                <option value="other">{t('profile.irrigation.other', 'Other')}</option>
              </select>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-paddy text-on-dark font-semibold rounded-xl hover:bg-paddy-light disabled:opacity-50 transition-colors shadow-sm"
              >
                {isSaving ? t('common.loading', 'Saving...') : t('common.save', 'Save Profile')}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Registered Plots (Max 5) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-mist shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-heading">
                {t('profile.plots_title', 'Farm Plots')}
              </h2>
              <span className="text-xs px-2.5 py-1 bg-cream rounded-full font-semibold text-soil">
                {plots.length} / 5
              </span>
            </div>

            <p className="text-xs text-muted mb-4">
              {t('profile.plots_subtitle', 'Register up to 5 distinct farm fields or orchards.')}
            </p>

            {isLoadingPlots ? (
              <div className="py-6 flex justify-center">
                <KrishiLoader />
              </div>
            ) : plots.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-mist rounded-xl text-muted text-sm">
                {t('profile.no_plots', 'No farm plots registered yet.')}
              </div>
            ) : (
              <ul className="space-y-3">
                {plots.map(p => (
                  <li
                    key={p.id}
                    className="p-3 bg-cream/40 rounded-xl border border-mist flex items-start justify-between"
                  >
                    <div>
                      <h3 className="font-semibold text-soil text-sm">{p.name}</h3>
                      <p className="text-xs text-muted mt-0.5">
                        {p.area_value} {p.area_unit} {p.soil_type ? `• ${p.soil_type}` : ''}
                      </p>
                      {p.notes && <p className="text-xs text-muted italic mt-1">{p.notes}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePlot(p.id)}
                      className="text-xs text-red-600 hover:text-red-800 p-1 font-medium"
                      title={t('common.delete', 'Delete')}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add Plot Section */}
            {plots.length < 5 && (
              <div className="mt-6 pt-4 border-t border-mist">
                {!isAddingPlot ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingPlot(true)}
                    className="w-full py-2.5 px-4 text-sm font-semibold text-paddy bg-cream hover:bg-mist rounded-xl transition-colors"
                  >
                    + {t('profile.add_plot', 'Add New Plot')}
                  </button>
                ) : (
                  <form onSubmit={handleCreatePlot} className="space-y-3">
                    <h3 className="text-sm font-bold text-soil">
                      {t('profile.add_plot_heading', 'New Plot Details')}
                    </h3>
                    <input
                      type="text"
                      required
                      placeholder={t('profile.plot_name_placeholder', 'Plot name (e.g. North Acre)')}
                      value={plotName}
                      onChange={e => setPlotName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-mist rounded-lg text-soil focus:outline-none focus:ring-1 focus:ring-paddy"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        required
                        placeholder="Size"
                        value={plotArea}
                        onChange={e => setPlotArea(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-mist rounded-lg text-soil focus:outline-none focus:ring-1 focus:ring-paddy tabular-nums"
                      />
                      <select
                        value={plotUnit}
                        onChange={e => setPlotUnit(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-mist rounded-lg text-soil focus:outline-none focus:ring-1 focus:ring-paddy"
                      >
                        <option value="acre">Acre</option>
                        <option value="hectare">Hectare</option>
                        <option value="bigha">Bigha</option>
                        <option value="guntha">Guntha</option>
                      </select>
                    </div>

                    <select
                      value={plotSoil}
                      onChange={e => setPlotSoil(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-mist rounded-lg text-soil focus:outline-none focus:ring-1 focus:ring-paddy"
                    >
                      <option value="alluvial">Alluvial Soil</option>
                      <option value="black">Black Soil (Regur)</option>
                      <option value="red_yellow">Red / Yellow Soil</option>
                      <option value="loamy">Loamy Soil</option>
                      <option value="sandy">Sandy Soil</option>
                      <option value="clayey">Clayey Soil</option>
                      <option value="other">Other Soil</option>
                    </select>

                    <input
                      type="text"
                      placeholder={t('profile.plot_notes_placeholder', 'Optional notes')}
                      value={plotNotes}
                      onChange={e => setPlotNotes(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-mist rounded-lg text-soil focus:outline-none focus:ring-1 focus:ring-paddy"
                    />

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={isCreatingPlot}
                        className="flex-1 py-2 bg-paddy text-on-dark text-xs font-semibold rounded-lg hover:bg-paddy-light disabled:opacity-50"
                      >
                        {isCreatingPlot ? t('common.loading', 'Adding...') : t('common.save', 'Add')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingPlot(false)}
                        className="px-3 py-2 text-xs text-muted hover:text-soil"
                      >
                        {t('common.cancel', 'Cancel')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
