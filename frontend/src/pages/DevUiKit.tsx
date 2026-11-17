import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  IconButton,
  Card,
  TaskTile,
  Input,
  NumberStepperField,
  Select,
  Tabs,
  SegmentedControl,
  Chip,
  Badge,
  Alert,
  Toast,
  Dialog,
  BottomSheet,
  Tooltip,
  Skeleton,
  EmptyState,
  ErrorState,
  StatCard,
  ScoreBar,
  RangeBar,
  PageHeader,
  Breadcrumb,
  Pagination,
  Container,
  Stack,
  Cluster,
  Grid,
  Section,
} from '../components/ui';
import { KrishiLoader } from '../components/Loader/KrishiLoader';
import { Heart, Search, Check, Info } from 'lucide-react';

export const DevUiKit: React.FC = () => {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState(i18n.language || 'en');
  const [stressMode, setStressMode] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [activeTab, setActiveTab] = useState('tab1');
  const [segmentVal, setSegmentVal] = useState('opt1');
  const [stepperVal, setStepperVal] = useState(90);
  const [page, setPage] = useState(1);

  // Switch locale for dev review
  const handleLangChange = (l: string) => {
    setLang(l);
    i18n.changeLanguage(l);
  };

  const textSample = stressMode
    ? 'अत्यधिक लंबी परीक्षण सामग्री જે લેઆઉટ બ્રેકિંગ અને ઓવરફ્લો ટેસ્ટ કરે છે - Detailed multi-lingual stress test string verifying overflow-wrap anywhere behavior across Indic scripts and mobile viewports.'
    : 'Standard sample agricultural advisory label.';

  return (
    <Container size="lg" className="py-8 pb-24">
      {/* Dev Controls Header */}
      <div className="p-4 mb-8 bg-surface border-2 border-accent rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-accent-contrast bg-accent px-2 py-0.5 rounded">
            Dev Only
          </span>
          <h1 className="text-2xl font-heavy text-soil mt-1">Design System v2 UI Kit</h1>
          <p className="text-xs text-text-muted">Interactive verification of all UI components across scripts and states.</p>
        </div>

        <Cluster gap="3">
          <Cluster gap="1">
            <span className="text-xs font-bold text-soil">Language:</span>
            {(['en', 'hi', 'ur'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => handleLangChange(l)}
                className={`px-3 py-1 text-xs font-bold rounded-md border min-h-[40px] ${
                  lang === l
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface text-soil border-border hover:bg-surface-sunken'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </Cluster>

          <button
            type="button"
            onClick={() => setStressMode(!stressMode)}
            className={`px-3 py-1 text-xs font-bold rounded-md border min-h-[40px] ${
              stressMode
                ? 'bg-danger text-white border-danger'
                : 'bg-surface text-soil border-border hover:bg-surface-sunken'
            }`}
          >
            {stressMode ? '⚠️ Stress Mode ON (+40% length)' : 'Stress Mode OFF'}
          </button>
        </Cluster>
      </div>

      <Stack gap="8">
        {/* Page Header & Breadcrumb */}
        <Section variant="surface" className="p-6 rounded-lg border border-border">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'UI Kit', href: '/dev/ui-kit' },
              { label: 'Components' },
            ]}
            className="mb-4"
          />
          <PageHeader
            title="UI Components Gallery"
            description={textSample}
            badge={<Badge variant="success">Verified v2</Badge>}
            action={<Button size="sm">Primary Action</Button>}
          />
        </Section>

        {/* Buttons & IconButtons */}
        <Section variant="surface" className="p-6 rounded-lg border border-border">
          <h2 className="text-xl font-heavy text-soil mb-4">1. Buttons & IconButtons</h2>
          <Stack gap="4">
            <Cluster gap="3">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="accent">Accent Gold</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Button</Button>
            </Cluster>
            <Cluster gap="3">
              <Button variant="primary" size="sm">Small (40px)</Button>
              <Button variant="primary" size="md">Medium (48px)</Button>
              <Button variant="primary" size="lg">Large (54px)</Button>
              <Button variant="primary" isLoading>Loading State</Button>
              <Button variant="primary" disabled>Disabled State</Button>
            </Cluster>
            <Cluster gap="3">
              <IconButton aria-label="Search" icon={<Search className="w-5 h-5" />} />
              <IconButton aria-label="Favorite" variant="primary" icon={<Heart className="w-5 h-5" />} />
              <IconButton aria-label="Loading" isLoading icon={<Check className="w-5 h-5" />} />
            </Cluster>
          </Stack>
        </Section>

        {/* Inputs & Number Steppers */}
        <Section variant="surface" className="p-6 rounded-lg border border-border">
          <h2 className="text-xl font-heavy text-soil mb-4">2. Form Fields & Number Steppers</h2>
          <Grid cols={1} colsMd={2} gap="6">
            <Input
              label="Standard Text Input"
              placeholder="Enter farmer name"
              helperText="Full legal name as per Aadhaar or land records"
              required
            />
            <Input
              label="Error State Input"
              defaultValue="Invalid Input Value"
              error="Please enter a valid agricultural plot size in acres"
              unit="Acres"
            />
            <Select
              label="Crop Season Select"
              options={[
                { value: 'kharif', label: 'Kharif (Monsoon / ચોમાસું)' },
                { value: 'rabi', label: 'Rabi (Winter / શિયાળુ)' },
                { value: 'zaid', label: 'Zaid (Summer / ઉનાળુ)' },
              ]}
              helperText="Select sowing season for targeted advice"
            />
            <NumberStepperField
              label="Nitrogen (N)"
              value={stepperVal}
              min={0}
              max={140}
              step={5}
              unit="kg/ha"
              helperText="Touch +/- or drag slider"
              onChange={setStepperVal}
            />
          </Grid>
        </Section>

        {/* Cards & Task Tiles */}
        <Section variant="surface" className="p-6 rounded-lg border border-border">
          <h2 className="text-xl font-heavy text-soil mb-4">3. Seed Packet Cards & Task Tiles</h2>
          <Grid cols={1} colsSm={2} colsLg={3} gap="4">
            <Card stripe="wheat" className="p-5">
              <h3 className="font-heavy text-lg mb-2">Wheat Top Stripe</h3>
              <p className="text-sm text-text-muted">{textSample}</p>
            </Card>
            <Card stripe="green" className="p-5">
              <h3 className="font-heavy text-lg mb-2">Paddy Green Stripe</h3>
              <p className="text-sm text-text-muted">{textSample}</p>
            </Card>
            <Card stripe="none" className="p-5" variant="sunken">
              <h3 className="font-heavy text-lg mb-2">Sunken Surface Card</h3>
              <p className="text-sm text-text-muted">{textSample}</p>
            </Card>
          </Grid>

          <div className="mt-6">
            <TaskTile
              href="#task"
              title="Crop Recommendation Advisory"
              description="Get top 3 AI-matched crops for your soil health card metrics."
              badge="CRS ML v1.0"
              actionLabel="Start Advisory"
            />
          </div>
        </Section>

        {/* Metrics, Progress & Ranges */}
        <Section variant="surface" className="p-6 rounded-lg border border-border">
          <h2 className="text-xl font-heavy text-soil mb-4">4. Data Visualization & Metrics</h2>
          <Grid cols={1} colsSm={3} gap="4" className="mb-6">
            <StatCard label="Soil Moisture" value="38" unit="%" trend="Optimal for Sowing" />
            <StatCard label="Rainfall Forecast" value="120" unit="mm" trend="Next 7 Days" />
            <StatCard label="Active Schemes" value="14" unit="Eligible" trend="Centrally Sponsored" />
          </Grid>
          <Stack gap="4">
            <ScoreBar score={94} label="Model Prediction Confidence" />
            <RangeBar
              label="Potassium (K) Soil Content"
              value={43}
              min={0}
              max={250}
              idealMin={35}
              idealMax={60}
              unit="kg/ha"
            />
          </Stack>
        </Section>

        {/* Tabs, Segmented Control & Chips */}
        <Section variant="surface" className="p-6 rounded-lg border border-border">
          <h2 className="text-xl font-heavy text-soil mb-4">5. Navigation & Filter Controls</h2>
          <Stack gap="4">
            <Tabs
              tabs={[
                { id: 'tab1', label: 'Soil Analysis' },
                { id: 'tab2', label: 'Weather Outlook' },
                { id: 'tab3', label: 'Mandi Rates' },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
            <SegmentedControl
              options={[
                { value: 'opt1', label: 'All Crops' },
                { value: 'opt2', label: 'Cereals' },
                { value: 'opt3', label: 'Pulses' },
                { value: 'opt4', label: 'Oilseeds' },
              ]}
              value={segmentVal}
              onChange={setSegmentVal}
            />
            <Cluster gap="2">
              <Chip label="Gujarat" selected />
              <Chip label="Black Loamy Soil" />
              <Chip label="Kharif 2026" onRemove={() => {}} />
            </Cluster>
            <Pagination currentPage={page} totalPages={5} onPageChange={setPage} />
          </Stack>
        </Section>

        {/* Alerts, Empty & Error States */}
        <Section variant="surface" className="p-6 rounded-lg border border-border">
          <h2 className="text-xl font-heavy text-soil mb-4">6. Feedback & Edge States</h2>
          <Stack gap="4">
            <Alert variant="info" title="Seasonal Weather Advisory">
              Pre-monsoon showers expected across Saurashtra within the next 48 hours.
            </Alert>
            <Alert variant="warning" title="Pesticide Safety Warning">
              Wear protective gear before application. Consult a certified Krishi Vigyan Kendra expert.
            </Alert>
            <Alert variant="danger" title="Connection Error">
              Unable to reach local weather station. Retrying in 5 seconds.
            </Alert>
            <div className="p-4 bg-surface-sunken rounded-lg border border-border">
              <h4 className="text-xs font-bold text-text-muted mb-2">Skeleton Loading Shimmer</h4>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="rect" height={36} className="mt-2" />
            </div>
            <EmptyState
              icon={<Search className="w-8 h-8" />}
              title="No Schemes Found"
              description="No central or state agricultural subsidies match your currently applied land filters."
              actionLabel="Clear Filters"
              onAction={() => {}}
            />
            <ErrorState
              title="Failed to Load Market Prices"
              message="The AGMARKNET server is currently undergoing maintenance. Please retry."
              onRetry={() => {}}
            />
          </Stack>
        </Section>

        {/* Dialog & Drawer Triggers */}
        <Section variant="surface" className="p-6 rounded-lg border border-border">
          <h2 className="text-xl font-heavy text-soil mb-4">7. Modals & Loaders</h2>
          <Cluster gap="3">
            <Button variant="secondary" onClick={() => setIsDialogOpen(true)}>
              Open Dialog Modal
            </Button>
            <Button variant="secondary" onClick={() => setIsSheetOpen(true)}>
              Open Bottom Sheet
            </Button>
            <Button variant="secondary" onClick={() => setShowToast(true)}>
              Trigger Toast Notification
            </Button>
            <Tooltip content="Tooltip showing helpful farming context">
              <button type="button" className="p-2.5 rounded-lg border border-border text-soil flex items-center gap-1.5 text-sm font-bold">
                <Info className="w-4 h-4 text-primary" />
                <span>Hover for Tooltip</span>
              </button>
            </Tooltip>
          </Cluster>

          <div className="mt-8 p-6 bg-surface-sunken rounded-lg border border-border text-center">
            <h3 className="text-base font-bold text-soil mb-4">Animated KrishiLoader Mark</h3>
            <KrishiLoader lang={lang} size={90} message="Calculating Soil Suitability..." />
          </div>
        </Section>
      </Stack>

      {/* Interactive Overlays */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Confirm Farm Plot Details"
        description="Verify your plot acreage and soil type before running CRS machine learning."
      >
        <p className="text-sm text-text-muted mb-4">{textSample}</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => setIsDialogOpen(false)}>Confirm</Button>
        </div>
      </Dialog>

      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="More Agricultural Services"
      >
        <div className="flex flex-col gap-2">
          <a href="/nutrition" className="p-3 rounded-lg hover:bg-surface-sunken font-bold text-soil">🥗 Crop Nutrition</a>
          <a href="/profile" className="p-3 rounded-lg hover:bg-surface-sunken font-bold text-soil">👤 Farmer Profile</a>
          <a href="/about" className="p-3 rounded-lg hover:bg-surface-sunken font-bold text-soil">ℹ️ About Platform</a>
        </div>
      </BottomSheet>

      {showToast && (
        <Toast
          type="success"
          message="Farm plot saved successfully to your offline storage."
          onClose={() => setShowToast(false)}
        />
      )}
    </Container>
  );
};

export default DevUiKit;
