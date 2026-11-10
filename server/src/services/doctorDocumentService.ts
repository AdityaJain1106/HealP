
import { getPatientDocuments } from './documentService.js'
import { verifyDoctorPatientPermission } from './doctorRecordAccessService.js'
import type { MedicalDocument } from '../types/document.js'

export type DoctorVisibleDocument = Omit<
  MedicalDocument,
  'storagePath' | 'fileName'
>

export async function getDoctorPatientDocuments(
  doctorId: string,
  patientId: string
): Promise<DoctorVisibleDocument[]> {
  // Verify active patient consent before accessing records.
  await verifyDoctorPatientPermission(
    doctorId,
    patientId,
    'documents'
  )

  const documents = await getPatientDocuments(patientId)

  // Return only metadata that doctors need.
  return documents.map((document) => ({
    id: document.id,
    patientId: document.patientId,
    originalName: document.originalName,
    category: document.category,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
    ...(document.hospital && {
      hospital: document.hospital,
    }),
    ...(document.doctor && {
      doctor: document.doctor,
    }),
    ...(document.documentDate && {
      documentDate: document.documentDate,
    }),
    uploadedAt: document.uploadedAt,
  }))
}
