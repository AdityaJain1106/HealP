export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',

  PATIENT_DASHBOARD: '/patient',
  PATIENT_HEALTH: '/patient/my-health',
  PATIENT_AI: '/patient/ai-assistant',
  PATIENT_REPORTS: '/patient/reports',
  PATIENT_PROFILE: '/patient/profile',

  PATIENT_HOSPITALS: '/patient/services/hospitals',
  PATIENT_PHARMACIES: '/patient/services/pharmacies',
  PATIENT_BLOOD_BANKS: '/patient/services/blood-banks',
  PATIENT_DIAGNOSTICS: '/patient/services/diagnostic-centers',

  DOCTOR_DASHBOARD: '/doctor',

  NOT_FOUND: '*',
} as const