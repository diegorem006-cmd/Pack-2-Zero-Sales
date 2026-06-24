import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, ProtectedRoute } from "@/contexts/AuthContext"
import { SettingsProvider } from "@/contexts/SettingsContext"
import Layout from "@/components/Layout"
import LoginPage from "@/pages/LoginPage"
import ImportPage from "@/pages/ImportPage"
import ImportImagePage from "@/pages/ImportImagePage"
import ContactsPage from "@/pages/ContactsPage"
import ContactDetailPage from "@/pages/ContactDetailPage"
import SettingsPage from "@/pages/SettingsPage"

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <SettingsProvider>
                <Layout />
              </SettingsProvider>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/contacts" replace />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="import-image" element={<ImportImagePage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="contacts/:id" element={<ContactDetailPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
