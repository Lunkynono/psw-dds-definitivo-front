import { Globe2 } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { Language, translationStrategies } from './translations';

const languages: Language[] = ['en', 'es'];

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white/90 p-1 shadow-sm backdrop-blur ${
        compact ? '' : 'shadow-gray-200/70'
      }`}
      aria-label="Language selector"
    >
      {!compact && <Globe2 size={15} className="ml-2 text-gray-400" />}
      {languages.map((item) => {
        const active = language === item;
        const strategy = translationStrategies[item];
        return (
          <button
            key={item}
            type="button"
            onClick={() => setLanguage(item)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
              active
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
            title={strategy.label}
          >
            {strategy.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
