import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// Main application store using Zustand
const useAppStore = create()(
  devtools(
    persist(
      (set, get) => ({
        // User state
        user: null,
        isAuthenticated: false,
        
        // Theme state
        theme: 'light',
        
        // Training state
        currentProgram: null,
        sessions: [],
        
        // UI state
        loading: false,
        errors: [],
        
        // Actions
        setUser: (user) => set({ user, isAuthenticated: !!user }),
        
        clearUser: () => set({ user: null, isAuthenticated: false }),
        
        setTheme: (theme) => set({ theme }),
        
        toggleTheme: () => set((state) => ({ 
          theme: state.theme === 'light' ? 'dark' : 'light' 
        })),
        
        setCurrentProgram: (program) => set({ currentProgram: program }),
        
        setSessions: (sessions) => set({ sessions }),
        
        addSession: (session) => set((state) => ({
          sessions: [...state.sessions, session]
        })),
        
        updateSession: (sessionId, updates) => set((state) => ({
          sessions: state.sessions.map(session => 
            session.id === sessionId ? { ...session, ...updates } : session
          )
        })),
        
        removeSession: (sessionId) => set((state) => ({
          sessions: state.sessions.filter(session => session.id !== sessionId)
        })),
        
        setLoading: (loading) => set({ loading }),
        
        addError: (error) => set((state) => ({
          errors: [...state.errors, { id: Date.now(), message: error }]
        })),
        
        removeError: (errorId) => set((state) => ({
          errors: state.errors.filter(error => error.id !== errorId)
        })),
        
        clearErrors: () => set({ errors: [] }),
        
        // Computed values
        get isLoading() {
          return get().loading
        },
        
        get hasErrors() {
          return get().errors.length > 0
        },
        
        get isDarkMode() {
          return get().theme === 'dark'
        }
      }),
      {
        name: 'merlins-playbook-store',
        partialize: (state) => ({
          theme: state.theme,
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          currentProgram: state.currentProgram
        })
      }
    ),
    {
      name: 'merlins-playbook-store'
    }
  )
)

export default useAppStore