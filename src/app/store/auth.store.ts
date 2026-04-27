import { create } from 'zustand';
import { Persona, UserRole } from '../../shared/types/domain';

interface AuthState {
  userId: string | null;
  perfil: Persona | null;
  rol: UserRole | null;
  setSession: (payload: { userId: string; perfil?: Persona | null; rol?: UserRole | null }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: localStorage.getItem('votify_user_id'),
  perfil: null,
  rol: null,
  setSession: ({ userId, perfil = null, rol = null }) => {
    localStorage.setItem('votify_user_id', userId);
    set({ userId, perfil, rol });
  },
  logout: () => {
    localStorage.removeItem('votify_user_id');
    set({ userId: null, perfil: null, rol: null });
  }
}));
