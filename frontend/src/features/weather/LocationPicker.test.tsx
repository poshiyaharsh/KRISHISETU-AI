import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocationPicker } from './LocationPicker';
import * as api from './api';
import '@/i18n';

vi.mock('./api', () => ({
  fetchStates: vi.fn(),
  fetchDistricts: vi.fn(),
  searchLocations: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithQueryClient = (ui: React.ReactElement) => {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('LocationPicker Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.fetchStates).mockResolvedValue([
      { id: 1, name: 'Gujarat', code: 'GJ', latitude: 22.25, longitude: 71.19 },
      { id: 2, name: 'Punjab', code: 'PB', latitude: 31.14, longitude: 75.34 },
    ]);
    vi.mocked(api.fetchDistricts).mockResolvedValue([
      {
        id: 10,
        state: 1,
        state_name: 'Gujarat',
        name: 'Rajkot',
        latitude: 22.3,
        longitude: 70.8,
        coord_source: 'LGD_2026',
      },
    ]);
    vi.mocked(api.searchLocations).mockResolvedValue([
      { name: 'Gondal', latitude: 21.96, longitude: 70.79, admin1: 'Gujarat' },
    ]);
  });

  it('renders state and district dropdowns', async () => {
    renderWithQueryClient(
      <LocationPicker selectedLocation={null} onSelectLocation={vi.fn()} />
    );

    expect(screen.getByLabelText(/Select State/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Select District/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Gujarat')).toBeInTheDocument();
      expect(screen.getByText('Punjab')).toBeInTheDocument();
    });
  });

  it('loads districts when state is selected and triggers onSelectLocation on district choice', async () => {
    const handleSelect = vi.fn();
    renderWithQueryClient(
      <LocationPicker selectedLocation={null} onSelectLocation={handleSelect} />
    );

    await waitFor(() => screen.getByText('Gujarat'));

    const stateSelect = screen.getByLabelText(/Select State/i);
    fireEvent.change(stateSelect, { target: { value: '1' } });

    await waitFor(() => {
      expect(api.fetchDistricts).toHaveBeenCalledWith(1);
      expect(screen.getByText('Rajkot')).toBeInTheDocument();
    });

    const districtSelect = screen.getByLabelText(/Select District/i);
    fireEvent.change(districtSelect, { target: { value: '10' } });

    expect(handleSelect).toHaveBeenCalledWith({
      label: 'Rajkot, Gujarat',
      latitude: 22.3,
      longitude: 70.8,
      districtId: 10,
      stateId: 1,
    });
  });

  it('handles village search and selection', async () => {
    const handleSelect = vi.fn();
    renderWithQueryClient(
      <LocationPicker selectedLocation={null} onSelectLocation={handleSelect} />
    );

    const searchInput = screen.getByPlaceholderText(/Search village, town, or mandi/i);
    fireEvent.change(searchInput, { target: { value: 'Gondal' } });

    await waitFor(() => {
      expect(api.searchLocations).toHaveBeenCalledWith('Gondal');
      expect(screen.getByText('Gondal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Gondal'));

    expect(handleSelect).toHaveBeenCalledWith({
      label: 'Gondal, Gujarat',
      latitude: 21.96,
      longitude: 70.79,
    });
  });

  it('handles geolocation permission denial gracefully with a polite message', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((_success, error) => {
        error({ code: 1, PERMISSION_DENIED: 1, message: 'User denied Geolocation' });
      }),
    };
    vi.stubGlobal('navigator', { geolocation: mockGeolocation });

    renderWithQueryClient(
      <LocationPicker selectedLocation={null} onSelectLocation={vi.fn()} />
    );

    const geoBtn = screen.getByRole('button', { name: /Use My Location/i });
    fireEvent.click(geoBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Location access was denied. You can select your state and district manually./i)
      ).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });
});
