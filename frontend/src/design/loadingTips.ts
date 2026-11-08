/**
 * Short farming tips shown under the loader.
 * Temporary home: Phase 5 moves these into i18next JSON files.
 * Hindi and Gujarati text needs native-speaker review before launch.
 */
export type TipLanguage = 'en' | 'hi' | 'gu';

export const LOADING_TIPS: Record<TipLanguage, string[]> = {
  en: [
    'Test your soil before choosing a crop.',
    'Check the weather forecast before irrigating.',
    'Rotate crops to keep your soil healthy.',
    'Government schemes may help with your costs.',
  ],
  hi: [
    'फसल चुनने से पहले मिट्टी की जांच कराएं।',
    'सिंचाई से पहले मौसम का पूर्वानुमान देखें।',
    'मिट्टी को स्वस्थ रखने के लिए फसल चक्र अपनाएं।',
    'सरकारी योजनाएं आपकी लागत कम करने में मदद कर सकती हैं।',
  ],
  gu: [
    'પાક પસંદ કરતા પહેલાં માટીની તપાસ કરાવો.',
    'સિંચાઈ પહેલાં હવામાનની આગાહી જુઓ.',
    'માટીને સ્વસ્થ રાખવા પાકની ફેરબદલી કરો.',
    'સરકારી યોજનાઓ તમારા ખર્ચમાં મદદ કરી શકે છે.',
  ],
};

export function getTips(lang: string): string[] {
  return LOADING_TIPS[(lang as TipLanguage)] ?? LOADING_TIPS.en;
}
