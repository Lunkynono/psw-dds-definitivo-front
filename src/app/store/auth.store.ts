import { create } from 'zustand';
import { Persona, UserRole } from '../../shared/types/domain';

interface AuthState {
  userId: string | null;
  perfil: Persona | null;
  roles: UserRole[];
  setSession: (payload: { userId: string; perfil?: Persona | null; roles?: UserRole[] }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: localStorage.getItem('votify_user_id'),
  perfil: null,
  roles: [],
  setSession: ({ userId, perfil = null, roles = [] }) => {
    localStorage.setItem('votify_user_id', userId);
    set({ userId, perfil, roles });
  },
  logout: () => {
    localStorage.removeItem('votify_user_id');
    set({ userId: null, perfil: null, roles: [] });
  }
}));
