import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/contexts/AuthContext"
import { SettingsProvider } from "@/contexts/SettingsContext"
import Layout from "@/components/Layout"
import ImportPage from "@/pages/ImportPage"
import ImportImagePage from "@/pages/ImportImagePage"
import ContactsPage from "@/pages/ContactsPage"
import ContactDetailPage from "@/pages/ContactDetailPage"
import SettingsPage from "@/pages/SettingsPage"

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Routes>
          {/* Redirect login to contacts */}
          <Route path="/login" element={<Navigate to="/contacts" replace />} />

          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/contacts" replace />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="import-image" element={<ImportImagePage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="contacts/:id" element={<ContactDetailPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </SettingsProvider>
    </AuthProvider>
  )
}
