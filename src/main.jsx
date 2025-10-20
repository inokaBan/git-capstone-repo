import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { BookingProvider } from './context/BookingContext'
import { AlertDialogProvider } from './context/AlertDialogContext'
import AlertDialog from './components/AlertDialog'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BookingProvider>
        <AlertDialogProvider>
          <App />
          <AlertDialog />
        </AlertDialogProvider>
      </BookingProvider>
    </AuthProvider>
  </StrictMode>
)
