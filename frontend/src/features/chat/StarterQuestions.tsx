import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';

interface StarterQuestionsProps {
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export const StarterQuestions: React.FC<StarterQuestionsProps> = ({ onSelect, disabled }) => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').slice(0, 2);

  const questionsByLang: Record<string, string[]> = {
    hi: [
      'पीएम किसान योजना में ₹6,000 की किस्त के लिए कौन पात्र है?',
      'धान (चावल) की फसल के लिए कैसी मिट्टी और तापमान उपयुक्त है?',
      'पकी हुई मूंग दाल में कितना प्रोटीन और पोषण मिलता है?',
      'मिट्टी की जांच (Soil Health Card) के लिए नमूना कैसे लें?',
      'खेत में ड्रिप सिंचाई (टपक पद्धति) पर कितनी सरकारी सब्सिडी मिलती है?',
    ],
    gu: [
      'પીએમ કિસાન યોજના હેઠળ ખેડૂતને કેટલી સહાય મળે છે?',
      'ડાંગર (ચોખા) ના પાક માટે કેટલો વરસાદ અને કેવું તાપમાન જોઈએ?',
      'રાંધેલા ભાતમાં ૧૦૦ ગ્રામ દીઠ કેટલી કેલરી અને કાર્બોહાઇડ્રેટ મળે?',
      'સોઇલ હેલ્થ કાર્ડ માટે જમીનનો નમૂનો કઈ રીતે લેવો?',
      'ટપક સિંચાઈ (ડ્રિપ) વસાવવા માટે સરકાર કેટલી સબસિડી આપે છે?',
    ],
    en: [
      'What are the eligibility criteria and benefits of PM-KISAN?',
      'What are the ideal soil and rainfall conditions for growing rice?',
      'What is the nutritional difference between cooked and raw chickpeas?',
      'How do I collect a soil sample for a Soil Health Card test?',
      'What government subsidy is available for micro-irrigation (PMKSY)?',
    ],
  };

  const list = questionsByLang[lang] || questionsByLang.en;

  return (
    <div className="py-4">
      <div className="flex items-center gap-2 mb-3 text-xs font-semibold tracking-wider text-forest-700/80 uppercase">
        <Sparkles className="w-3.5 h-3.5 text-leaf-600" aria-hidden="true" />
        <span>Suggested Farming Questions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {list.map((q, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(q)}
            className="text-left text-xs sm:text-sm px-3.5 py-2 rounded-full border border-forest-200 bg-white/90 hover:bg-forest-50 hover:border-forest-400 text-forest-900 transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-forest-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};

