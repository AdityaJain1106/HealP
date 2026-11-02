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

import { ROUTES } from './routePaths'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path={ROUTES.HOME}
          element={<LandingPage />}
        />

        <Route
          path={ROUTES.LOGIN}
          element={<LoginPage />}
        />

        {/* PATIENT PORTAL */}
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

          <Route
            path="ai-assistant"
            element={<PatientSectionPage section="ai" />}
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

        {/* DOCTOR PORTAL */}
        <Route
          path={ROUTES.DOCTOR_DASHBOARD}
          element={<DoctorDashboardPage />}
        />

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