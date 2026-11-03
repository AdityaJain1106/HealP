
import { auth } from '../lib/firebase'
import { createNotification } from './notificationService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export type DocumentCategory =
  | 'prescription'
  | 'blood_report'
  | 'mri'
  | 'ct_scan'
  | 'x_ray'
  | 'ecg'
  | 'medical_certificate'
  | 'other'

export interface MedicalDocument {
  id: string
  patientId: string
  fileName: string
  originalName: string
  category: DocumentCategory
  mimeType: string
  fileSize: number
  storagePath: string
  hospital?: string
  doctor?: string
  documentDate?: string
  uploadedAt: string
}

export interface DocumentMetadata {
  category: DocumentCategory
  hospital?: string
  doctor?: string
  documentDate?: string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  documents?: T[]
  document?: T
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

// Upload a medical document
export async function uploadMedicalDocument(
  file: File,
  metadata: DocumentMetadata
): Promise<MedicalDocument> {
  const headers = await getAuthHeaders()
  const formData = new FormData()

  formData.append('file', file)
  formData.append('category', metadata.category)

  if (metadata.hospital) {
    formData.append('hospital', metadata.hospital)
  }

  if (metadata.doctor) {
    formData.append('doctor', metadata.doctor)
  }

  if (metadata.documentDate) {
    formData.append('documentDate', metadata.documentDate)
  }

  const response = await fetch(
    `${API_BASE_URL}/api/documents/upload`,
    {
      method: 'POST',
      headers,
      body: formData,
    }
  )

  const data = await handleResponse<{
    document: MedicalDocument
  }>(response)

  // Create notification only after a successful upload.
  try {
    await createNotification({
      title: 'Medical document uploaded',
      message: `"${data.document.originalName}" has been uploaded successfully.`,
      type: 'document',
      route: '/patient/reports',
    })
  } catch (error) {
    console.error('Document upload notification could not be created:', error)
  }

  return data.document
}

// Retrieve all patient documents
export async function getMedicalDocuments(): Promise<MedicalDocument[]> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/documents`,
    { headers }
  )

  const data = await handleResponse<{
    documents: MedicalDocument[]
  }>(response)

  return data.documents
}

// Generate a temporary document download URL
export async function getDocumentDownloadUrl(
  documentId: string
): Promise<string> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/documents/${encodeURIComponent(documentId)}/download`,
    { headers }
  )

  const data = await handleResponse<{
    downloadUrl: string
  }>(response)

  return data.downloadUrl
}

// Delete a medical document
export async function deleteMedicalDocument(
  documentId: string
): Promise<void> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/documents/${encodeURIComponent(documentId)}`,
    {
      method: 'DELETE',
      headers,
    }
  )

  await handleResponse(response)
}
