import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { BookingProvider } from './context/BookingContext'
import { AlertDialogProvider } from './context/AlertDialogContext'
import AlertDialog from './components/AlertDialog'
import { ToastProvider } from './context/ToastContext'
import Toast from './components/Toast'
import { ThemeProvider } from './context/ThemeContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BookingProvider>
          <AlertDialogProvider>
            <ToastProvider>
              <App />
              <AlertDialog />
              <Toast />
            </ToastProvider>
          </AlertDialogProvider>
        </BookingProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)
