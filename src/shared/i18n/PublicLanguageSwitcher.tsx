import { useLocation } from 'react-router-dom';
import { LanguageSwitcher } from './LanguageSwitcher';

export function PublicLanguageSwitcher() {
  const { pathname } = useLocation();
  const usesNavbar =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/juez') ||
    pathname.startsWith('/participante');

  if (usesNavbar) return null;

  return (
    <div className="fixed right-4 top-4 z-[70]">
      <LanguageSwitcher />
    </div>
  );
}
