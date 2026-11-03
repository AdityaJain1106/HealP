
import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom'

import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/auth/LoginPage'
import PatientDashboardPage from '../pages/patient/PatientDashboardPage'
import PatientSectionPage from '../pages/patient/PatientSectionPage'
import DoctorDashboardPage from '../pages/doctor/DoctorDashboardPage'
import NotFoundPage from '../pages/NotFoundPage'

import PatientLayout from '../components/layout/PatientLayout'
import ProtectedRoute from '../components/auth/ProtectedRoute'

import { ROUTES } from './routePaths'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route
          path={ROUTES.HOME}
          element={<LandingPage />}
        />

        <Route
          path={ROUTES.LOGIN}
          element={<LoginPage />}
        />

        {/* PROTECTED PATIENT PORTAL */}
        <Route element={<ProtectedRoute allowedRole="patient" />}>
          <Route
            path={ROUTES.PATIENT_DASHBOARD}
            element={<PatientLayout />}
          >
            <Route
              index
              element={<PatientDashboardPage />}
            />

            <Route
              path="my-health"
              element={<PatientSectionPage section="health" />}
            />

            {/* AI HEALTH ASSISTANT */}
            <Route
              path="ai-assistant"
              element={<PatientSectionPage section="ai" />}
            />

            <Route
              path="ai-assistant/summary"
              element={<PatientSectionPage section="ai-summary" />}
            />

            <Route
              path="ai-assistant/chat"
              element={<PatientSectionPage section="ai-chat" />}
            />

            <Route
              path="ai-assistant/medicine"
              element={<PatientSectionPage section="ai-medicine" />}
            />

            <Route
              path="ai-assistant/symptoms"
              element={<PatientSectionPage section="ai-symptoms" />}
            />

            <Route
              path="ai-assistant/prescriptions"
              element={<PatientSectionPage section="ai-prescriptions" />}
            />

            <Route
              path="reports"
              element={<PatientSectionPage section="reports" />}
            />

            <Route
              path="profile"
              element={<PatientSectionPage section="profile" />}
            />

            {/* HEALTHCARE SERVICES */}
            <Route
              path="services/hospitals"
              element={<PatientSectionPage section="hospitals" />}
            />

            <Route
              path="services/pharmacies"
              element={<PatientSectionPage section="pharmacies" />}
            />

            <Route
              path="services/blood-banks"
              element={<PatientSectionPage section="bloodBanks" />}
            />

            <Route
              path="services/diagnostic-centers"
              element={<PatientSectionPage section="diagnostics" />}
            />
          </Route>
        </Route>

        {/* PROTECTED DOCTOR PORTAL */}
        <Route element={<ProtectedRoute allowedRole="doctor" />}>
          <Route
            path={ROUTES.DOCTOR_DASHBOARD}
            element={<DoctorDashboardPage />}
          />
        </Route>

        {/* 404 */}
        <Route
          path={ROUTES.NOT_FOUND}
          element={<NotFoundPage />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
