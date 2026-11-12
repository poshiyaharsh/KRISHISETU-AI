import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Search, Compass, Loader2 } from 'lucide-react';
import { fetchStates, fetchDistricts, searchLocations } from './api';
import type { SelectedLocation, LocationSearchResult } from './types';

interface LocationPickerProps {
  selectedLocation: SelectedLocation | null;
  onSelectLocation: (location: SelectedLocation) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  selectedLocation,
  onSelectLocation,
}) => {
  const { t } = useTranslation();
  const [selectedStateId, setSelectedStateId] = useState<number | ''>(
    selectedLocation?.stateId ?? ''
  );
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | ''>(
    selectedLocation?.districtId ?? ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);
  const [isDetectingGeo, setIsDetectingGeo] = useState(false);

  // States query
  const { data: states = [], isLoading: isLoadingStates } = useQuery({
    queryKey: ['locations', 'states'],
    queryFn: fetchStates,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Districts query
  const { data: districts = [], isLoading: isLoadingDistricts } = useQuery({
    queryKey: ['locations', 'districts', selectedStateId],
    queryFn: () => (typeof selectedStateId === 'number' ? fetchDistricts(selectedStateId) : []),
    enabled: typeof selectedStateId === 'number',
    staleTime: 1000 * 60 * 60,
  });

  // Search debounce
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : '';
    setSelectedStateId(val);
    setSelectedDistrictId('');
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : '';
    setSelectedDistrictId(val);
    if (val) {
      const dist = districts.find((d) => d.id === val);
      if (dist) {
        onSelectLocation({
          label: `${dist.name}, ${dist.state_name}`,
          latitude: dist.latitude,
          longitude: dist.longitude,
          districtId: dist.id,
          stateId: typeof selectedStateId === 'number' ? selectedStateId : undefined,
        });
      }
    }
  };

  const handleSelectSearchResult = (res: LocationSearchResult) => {
    const label = res.admin1 ? `${res.name}, ${res.admin1}` : res.name;
    onSelectLocation({
      label,
      latitude: res.latitude,
      longitude: res.longitude,
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleUseMyLocation = () => {
    setGeoNotice(null);
    if (!navigator.geolocation) {
      setGeoNotice(t('weather.locationPicker.locationUnavailable'));
      return;
    }

    setIsDetectingGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGeo(false);
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        onSelectLocation({
          label: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`,
          latitude: lat,
          longitude: lon,
        });
      },
      (err) => {
        setIsDetectingGeo(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoNotice(t('weather.locationPicker.locationDenied'));
        } else {
          setGeoNotice(t('weather.locationPicker.locationUnavailable'));
        }
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-mist p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-soil font-semibold text-lg">
          <MapPin className="w-5 h-5 text-paddy shrink-0" aria-hidden="true" />
          <span>{selectedLocation ? selectedLocation.label : t('weather.locationPicker.selectDistrict')}</span>
        </div>

        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isDetectingGeo}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cream/70 hover:bg-cream text-soil text-sm font-medium border border-wheat/40 transition-colors focus:outline-none focus:ring-2 focus:ring-leaf min-h-[48px]"
        >
          {isDetectingGeo ? (
            <Loader2 className="w-4 h-4 text-paddy animate-spin" aria-hidden="true" />
          ) : (
            <Compass className="w-4 h-4 text-paddy" aria-hidden="true" />
          )}
          <span>
            {isDetectingGeo
              ? t('weather.locationPicker.detecting')
              : t('weather.locationPicker.useMyLocation')}
          </span>
        </button>
      </div>

      {geoNotice && (
        <div
          role="status"
          className="p-3 text-sm rounded-lg bg-wheat/15 border border-wheat/40 text-soil flex items-center gap-2"
        >
          <span>{geoNotice}</span>
        </div>
      )}

      {/* State & District Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="state-select" className="block text-sm font-medium text-soil mb-1.5">
            {t('weather.locationPicker.selectState')}
          </label>
          <select
            id="state-select"
            value={selectedStateId}
            onChange={handleStateChange}
            disabled={isLoadingStates}
            className="w-full h-12 px-3 py-2 bg-white border border-mist rounded-lg text-soil focus:outline-none focus:ring-2 focus:ring-leaf text-sm"
          >
            <option value="">{t('weather.locationPicker.selectState')}...</option>
            {states.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="district-select" className="block text-sm font-medium text-soil mb-1.5">
            {t('weather.locationPicker.selectDistrict')}
          </label>
          <select
            id="district-select"
            value={selectedDistrictId}
            onChange={handleDistrictChange}
            disabled={!selectedStateId || isLoadingDistricts}
            className="w-full h-12 px-3 py-2 bg-white border border-mist rounded-lg text-soil focus:outline-none focus:ring-2 focus:ring-leaf text-sm disabled:opacity-50"
          >
            <option value="">{t('weather.locationPicker.selectDistrict')}...</option>
            {districts.map((dst) => (
              <option key={dst.id} value={dst.id}>
                {dst.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Input for Towns / Villages */}
      <div className="relative">
        <label htmlFor="location-search" className="block text-sm font-medium text-soil mb-1.5">
          {t('weather.locationPicker.searchPlaceholder')}
        </label>
        <div className="relative">
          <input
            id="location-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('weather.locationPicker.searchPlaceholder')}
            className="w-full h-12 pl-10 pr-10 bg-white border border-mist rounded-lg text-soil focus:outline-none focus:ring-2 focus:ring-leaf text-sm"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" aria-hidden="true" />
          {isSearching && (
            <Loader2 className="w-4 h-4 text-paddy animate-spin absolute right-3 top-4" aria-hidden="true" />
          )}
        </div>

        {searchResults.length > 0 && (
          <ul
            role="listbox"
            className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-auto bg-white border border-mist rounded-lg shadow-lg py-1 text-sm divide-y divide-mist"
          >
            {searchResults.map((item, idx) => (
              <li
                key={`${item.name}-${item.latitude}-${item.longitude}-${idx}`}
                role="option"
                aria-selected="false"
                tabIndex={0}
                onClick={() => handleSelectSearchResult(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectSearchResult(item);
                  }
                }}
                className="px-4 py-3 hover:bg-mist/30 cursor-pointer flex items-center justify-between text-soil focus:bg-mist/40 focus:outline-none"
              >
                <div>
                  <span className="font-medium">{item.name}</span>
                  {item.admin1 && <span className="text-soil/80 text-xs ml-2">({item.admin1})</span>}
                </div>
                <span className="text-xs text-gray-400">
                  {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
