export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',

  PATIENT_DASHBOARD: '/patient',
  PATIENT_HEALTH: '/patient/my-health',
  PATIENT_DOCTOR_PRESCRIPTIONS: '/patient/doctor-prescriptions',

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
  PATIENT_APPOINTMENTS: '/patient/appointments',

  DOCTOR_DASHBOARD: '/doctor',
  DOCTOR_PROFILE: '/doctor/profile',
  DOCTOR_PATIENT_SEARCH: '/doctor/patients/search',
  DOCTOR_MY_PATIENTS: '/doctor/my-patients',
  DOCTOR_PATIENT_WORKSPACE: '/doctor/patients/:patientId',
  DOCTOR_PRESCRIPTION_INBOX: '/doctor/prescriptions/inbox',
  DOCTOR_APPOINTMENTS: '/doctor/appointments',

  PATIENT_ACCESS_REQUESTS: '/patient/access-requests',
  PATIENT_ACCESS_MANAGEMENT: '/patient/access-management',

  // Admin Portal
  ADMIN_DASHBOARD: '/admin',
  ADMIN_DOCTORS: '/admin/doctors',
  ADMIN_USERS: '/admin/users',

  NOT_FOUND: '*',
} as const