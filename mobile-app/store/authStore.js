import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';
import { getCurrentSession } from '../services/authService';

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    try {
      const session = await getCurrentSession();
      set({ session, user: session?.user || null, initialized: true, loading: false });

      supabase.auth.onAuthStateChange((_event, newSession) => {
        set({ session: newSession, user: newSession?.user || null, loading: false, initialized: true });
      });
    } catch (error) {
      set({ loading: false, initialized: true });
      throw error;
    }
  },

  setLoading: (loading) => set({ loading }),
}));
