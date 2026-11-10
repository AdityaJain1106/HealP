import { auth } from '../lib/firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export type DoctorAccessPermission =
  | 'profile'
  | 'medicalHistory'
  | 'documents'
  | 'prescriptions'
  | 'prescriptionCreation'

export type DoctorAccessStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revoked'

export interface DoctorPatientSearchResult {
  patientId: string
  name: string
}

export interface DoctorAccessRequest {
  requestId: string
  doctorId: string
  patientId: string
  reason: string
  permissions: DoctorAccessPermission[]
  approvedPermissions?: DoctorAccessPermission[]
  status: DoctorAccessStatus
  createdAt?: {
    _seconds?: number
    seconds?: number
  } | string
  respondedAt?: {
    _seconds?: number
    seconds?: number
  } | string
}

export interface DoctorApprovedPatient {
  patientId: string
  name: string
  permissions: DoctorAccessPermission[]
  grantId: string
  grantedAt?: {
    _seconds?: number
    seconds?: number
  }
}

export interface DoctorPatientProfile {
  name: string
  email: string
  dateOfBirth: string
  gender: string
  phone: string
  address: string
  bloodGroup: string
  height: string
  weight: string
  allergies: string[]
  chronicConditions: string[]
  currentMedicines: string[]
  emergencyContactName: string
  emergencyContactPhone: string
  insuranceProvider: string
  insurancePolicyNumber: string
  organDonor: boolean
}

export interface DoctorPatientMedicalRecord {
  [key: string]: unknown
}

export interface DoctorPatientDocument {
  id: string
  patientId: string
  originalName: string
  category: string
  mimeType: string
  fileSize: number
  hospital?: string
  doctor?: string
  documentDate?: string
  uploadedAt: string
}

export interface DoctorPrescriptionDetails {
  strength: string | null
  dosage: string | null
  route: string | null
  frequency: string | null
  duration: string | null
  instructions: string | null
}

export interface DoctorPrescriptionMedicine {
  name: string
  prescriptionDetails: DoctorPrescriptionDetails
}

export interface DoctorPatientPrescription {
  prescriptionId: string
  patientId: string
  doctorId: string
  doctorName: string
  hospitalName: string | null
  diagnosis: string
  prescriptionDate: string
  followUpDate: string | null
  medicines: DoctorPrescriptionMedicine[]
  additionalInstructions: string[]
  status:
    | 'pending_patient_review'
    | 'accepted'
    | 'clarification_requested'
  clarificationRequest: string | null
  clarificationResponse: string | null
  acceptedAt: unknown
  createdAt: unknown
  updatedAt: unknown
}

export interface CreateDoctorPrescriptionInput {
  diagnosis: string
  prescriptionDate: string
  followUpDate: string | null
  medicines: DoctorPrescriptionMedicine[]
  additionalInstructions: string[]
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  patient?: T
  profile?: T
  requestId?: string
  requests?: T
  patients?: T
  records?: T
  documents?: T
  prescriptions?: T
  totalPrescriptions?: number
  downloadUrl?: string
  expiresIn?: number
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser

  if (!user) {
    throw new Error('Please log in to continue.')
  }

  const token = await user.getIdToken()

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function handleResponse<T>(
  response: Response
): Promise<T> {
  const data = await response.json() as ApiResponse<T>

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || 'Something went wrong. Please try again.'
    )
  }

  return data as T
}

// Search for a patient using ID, email or phone.
export async function searchDoctorPatient(
  searchTerm: string
): Promise<DoctorPatientSearchResult> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/doctor/patients/search?q=${encodeURIComponent(searchTerm.trim())}`,
    { headers }
  )

  const data = await handleResponse<{
    patient: DoctorPatientSearchResult
  }>(response)

  return data.patient
}

// Submit a consent-based patient access request.
export async function submitDoctorAccessRequest(input: {
  patientId: string
  reason: string
  permissions: DoctorAccessPermission[]
}): Promise<string> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/doctor/access-requests`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    }
  )

  const data = await handleResponse<{
    requestId: string
  }>(response)

  return data.requestId
}

// Retrieve all access requests sent by the logged-in doctor.
export async function getDoctorAccessRequests(): Promise<DoctorAccessRequest[]> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/doctor/access-requests`,
    { headers }
  )

  const data = await handleResponse<{
    requests: DoctorAccessRequest[]
  }>(response)

  return data.requests
}

// Retrieve patients who have granted active access to the logged-in doctor.
export async function getDoctorApprovedPatients(): Promise<DoctorApprovedPatient[]> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/doctor/my-patients`,
    { headers }
  )

  const data = await handleResponse<{
    patients: DoctorApprovedPatient[]
  }>(response)

  return data.patients
}

// Retrieve an approved patient's profile.
export async function getDoctorPatientProfile(
  patientId: string
): Promise<DoctorPatientProfile> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/doctor/patients/${encodeURIComponent(patientId)}/profile`,
    { headers }
  )

  const data = await handleResponse<{
    profile: DoctorPatientProfile
  }>(response)

  return data.profile
}

// Retrieve an approved patient's medical history.
export async function getDoctorPatientMedicalHistory(
  patientId: string
): Promise<DoctorPatientMedicalRecord[]> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/doctor/patients/${encodeURIComponent(patientId)}/medical-history`,
    { headers }
  )

  const data = await handleResponse<{
    records: DoctorPatientMedicalRecord[]
  }>(response)

  return data.records
}

// Retrieve an approved patient's documents.
export async function getDoctorPatientDocuments(
  patientId: string
): Promise<DoctorPatientDocument[]> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/doctor/patients/${encodeURIComponent(patientId)}/documents`,
    { headers }
  )

  const data = await handleResponse<{
    documents: DoctorPatientDocument[]
  }>(response)

  return data.documents
}

// Generate a temporary, consent-protected document download URL.
export async function getDoctorPatientDocumentDownloadUrl(
  patientId: string,
  documentId: string
): Promise<string> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/doctor/patients/${encodeURIComponent(patientId)}/documents/${encodeURIComponent(documentId)}/download`,
    { headers }
  )

  const data = await handleResponse<{
    downloadUrl: string
    expiresIn: number
  }>(response)

  return data.downloadUrl
}

// Retrieve an approved patient's previous doctor-issued prescriptions.
export async function getDoctorPatientPrescriptions(
  patientId: string
): Promise<DoctorPatientPrescription[]> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/doctor/patients/${encodeURIComponent(patientId)}/prescriptions`,
    { headers }
  )

  const data = await handleResponse<{
    prescriptions: DoctorPatientPrescription[]
    totalPrescriptions: number
  }>(response)

  return data.prescriptions
}

// Create a new prescription for an approved patient.
export async function createDoctorPrescription(
  patientId: string,
  input: CreateDoctorPrescriptionInput
): Promise<string> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/doctor/patients/${encodeURIComponent(patientId)}/prescriptions`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    }
  )

  const data = await handleResponse<{
    prescriptionId: string
  }>(response)

  return data.prescriptionId
}