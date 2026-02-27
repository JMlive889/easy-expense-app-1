import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { LicenseProvider } from './contexts/LicenseContext';
import { TaskProvider } from './contexts/TaskContext';
import { PermissionsProvider } from './contexts/PermissionsContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 50 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <LicenseProvider>
              <PermissionsProvider>
                <TaskProvider>
                  <App />
                </TaskProvider>
              </PermissionsProvider>
            </LicenseProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
