import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { LANGUAGE_STORAGE_KEY, Language, translationStrategies } from './translations';

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (text: string) => string;
  locale: string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): Language {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'en' || stored === 'es') return stored;
  return 'en';
}

function isIgnoredNode(node: Node) {
  const parent = node.parentElement;
  return parent?.closest('script, style, textarea, input, [data-i18n-ignore]') != null;
}

class DomTranslationAdapter {
  private textOriginals = new WeakMap<Text, string>();
  private observer?: MutationObserver;

  constructor(private getLanguage: () => Language) {}

  start() {
    this.translateTree(document.body);
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => this.translateTree(node));
        if (mutation.type === 'characterData') this.translateTree(mutation.target);
      }
    });
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  stop() {
    this.observer?.disconnect();
  }

  refresh() {
    this.translateTree(document.body);
  }

  private translateTree(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      this.translateText(node as Text);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as Element;
    if (element.closest('[data-i18n-ignore]')) return;
    this.translateElement(element);
    element.childNodes.forEach((child) => this.translateTree(child));
  }

  private translateText(node: Text) {
    if (isIgnoredNode(node)) return;
    const raw = node.nodeValue ?? '';
    if (!raw.trim()) return;

    const previousOriginal = this.textOriginals.get(node);
    const isKnownTranslation = previousOriginal
      ? Object.values(translationStrategies).some((strategy) => raw.trim() === strategy.translate(previousOriginal))
      : false;
    const original = previousOriginal && isKnownTranslation
      ? previousOriginal
      : raw;

    this.textOriginals.set(node, original);
    const leading = raw.match(/^\s*/)?.[0] ?? '';
    const trailing = raw.match(/\s*$/)?.[0] ?? '';
    const nextValue = `${leading}${translationStrategies[this.getLanguage()].translate(original)}${trailing}`;
    if (node.nodeValue !== nextValue) node.nodeValue = nextValue;
  }

  private translateElement(element: Element) {
    ['placeholder', 'title', 'aria-label'].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (!value?.trim()) return;
      const originalAttribute = `data-i18n-original-${attribute}`;
      const stored = element.getAttribute(originalAttribute);
      const isKnownTranslation = stored
        ? Object.values(translationStrategies).some((strategy) => value === strategy.translate(stored))
        : false;
      const original = stored && isKnownTranslation ? stored : value;
      element.setAttribute(originalAttribute, original);
      const nextValue = translationStrategies[this.getLanguage()].translate(original);
      if (element.getAttribute(attribute) !== nextValue) element.setAttribute(attribute, nextValue);
    });
  }
}

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const languageRef = useRef(language);
  const adapterRef = useRef<DomTranslationAdapter | null>(null);

  const value = useMemo<LanguageContextValue>(() => {
    const strategy = translationStrategies[language];
    return {
      language,
      setLanguage: (nextLanguage) => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
        setLanguageState(nextLanguage);
      },
      t: strategy.translate,
      locale: strategy.locale,
    };
  }, [language]);

  useEffect(() => {
    languageRef.current = language;
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    adapterRef.current = new DomTranslationAdapter(() => languageRef.current);
    adapterRef.current.start();
    return () => adapterRef.current?.stop();
  }, []);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      adapterRef.current?.refresh();
    });
    return () => window.cancelAnimationFrame(id);
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
