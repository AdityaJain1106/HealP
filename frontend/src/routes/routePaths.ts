
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',

  PATIENT_DASHBOARD: '/patient',
  PATIENT_HEALTH: '/patient/my-health',

  // AI Health Assistant
  PATIENT_AI: '/patient/ai-assistant',
  PATIENT_AI_SUMMARY: '/patient/ai-assistant/summary',
  PATIENT_AI_CHAT: '/patient/ai-assistant/chat',
  PATIENT_AI_MEDICINE: '/patient/ai-assistant/medicine',
  PATIENT_AI_SYMPTOMS: '/patient/ai-assistant/symptoms',
  PATIENT_AI_PRESCRIPTIONS: '/patient/ai-assistant/prescriptions',

  PATIENT_REPORTS: '/patient/reports',
  PATIENT_PROFILE: '/patient/profile',

  PATIENT_HOSPITALS: '/patient/services/hospitals',
  PATIENT_PHARMACIES: '/patient/services/pharmacies',
  PATIENT_BLOOD_BANKS: '/patient/services/blood-banks',
  PATIENT_DIAGNOSTICS: '/patient/services/diagnostic-centers',

  DOCTOR_DASHBOARD: '/doctor',

  NOT_FOUND: '*',
} as const
