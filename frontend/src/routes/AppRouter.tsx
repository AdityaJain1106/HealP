
import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom'

import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/auth/LoginPage'

import PatientDashboardPage from '../pages/patient/PatientDashboardPage'
import PatientSectionPage from '../pages/patient/PatientSectionPage'
import PatientDoctorPrescriptionsPage from '../pages/patient/PatientDoctorPrescriptionsPage'
import PatientAccessRequestsPage from '../pages/patient/PatientAccessRequestsPage'
import PatientAccessManagementPage from '../pages/patient/PatientAccessManagementPage'
import PatientAppointmentsPage from '../pages/patient/PatientAppointmentsPage'

import DoctorDashboardPage from '../pages/doctor/DoctorDashboardPage'
import DoctorPatientSearchPage from '../pages/doctor/DoctorPatientSearchPage'
import DoctorMyPatientsPage from '../pages/doctor/DoctorMyPatientsPage'
import DoctorPrescriptionInboxPage from '../pages/doctor/DoctorPrescriptionInboxPage'
import DoctorPatientWorkspacePage from '../pages/doctor/DoctorPatientWorkspacePage'
import DoctorAppointmentsPage from '../pages/doctor/DoctorAppointmentsPage'
import DoctorProfilePage from '../pages/doctor/DoctorProfilePage'
import PatientLayout from '../components/layout/PatientLayout'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import NotFoundPage from '../pages/NotFoundPage'

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
              path={ROUTES.PATIENT_ACCESS_MANAGEMENT}
              element={<PatientAccessManagementPage />}
            />

            <Route
              path="access-requests"
              element={<PatientAccessRequestsPage />}
            />

            <Route
              path="appointments"
              element={<PatientAppointmentsPage />}
            />

            <Route
              path="my-health"
              element={<PatientSectionPage section="health" />}
            />

            <Route
              path="doctor-prescriptions"
              element={<PatientDoctorPrescriptionsPage />}
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

          <Route
            path={ROUTES.DOCTOR_PATIENT_SEARCH}
            element={<DoctorPatientSearchPage />}
          />

          <Route
            path={ROUTES.DOCTOR_MY_PATIENTS}
            element={<DoctorMyPatientsPage />}
          />

          <Route
            path={ROUTES.DOCTOR_PRESCRIPTION_INBOX}
            element={<DoctorPrescriptionInboxPage />}
          />
        </Route>

        <Route
          path={ROUTES.DOCTOR_PATIENT_WORKSPACE}
          element={<DoctorPatientWorkspacePage />}
        />

        <Route
          path={ROUTES.DOCTOR_APPOINTMENTS}
          element={<DoctorAppointmentsPage />}
        />

        <Route
          path={ROUTES.DOCTOR_PROFILE}
          element={<DoctorProfilePage />}
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
