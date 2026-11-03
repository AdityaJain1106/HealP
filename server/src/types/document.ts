
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
