import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios, { AxiosError } from 'axios';

export interface User {
  id: string;
  email: string;
  name: string;
  userName: string;
}

interface LoginResponse {
  user: User;
  message: string;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // State
      user: null,
      isLoggedIn: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user, isLoggedIn: !!user }),
      
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await axios.post<LoginResponse>('https://shuttlr.onrender.com/api/login', credentials, {
            headers: {
              'Content-Type': 'application/json'
            },
            withCredentials: true
          });

          if (response.status === 200) {
            set({
              user: response.data.user,
              isLoggedIn: true,
              isLoading: false,
              error: null
            });
            return { success: true, user: response.data.user };
          }
          return { success: false, error: 'Login failed' };
        } catch (error) {
          const axiosError = error as AxiosError<{ message: string }>;
          const errorMessage = axiosError.response?.data?.message || 'Login failed';
          set({
            user: null,
            isLoggedIn: false,
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        try {
          await axios.post('https://shuttlr.onrender.com/api/logout', {}, {
            withCredentials: true
          });
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            isLoggedIn: false,
            isLoading: false,
            error: null
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);

export default useAuthStore;
