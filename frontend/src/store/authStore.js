import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set) => ({
            token: null,
            user: null,
            isAuthenticated: false,

            login: (token, user) => {
                set({
                    token,
                    user,
                    isAuthenticated: true,
                });
            },

            updateUser: (updatedUser) => {
                set((state) => ({
                    user: { ...state.user, ...updatedUser },
                }));
            },

            logout: () => {
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                });
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);

export default useAuthStore;