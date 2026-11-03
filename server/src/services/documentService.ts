
import { randomUUID } from 'node:crypto'
import { adminDb } from '../config/firebaseAdmin.js'
import { supabase } from '../config/supabase.js'
import type {
  DocumentCategory,
  MedicalDocument,
} from '../types/document.js'

// File structure received from Multer memory storage.
interface UploadedFile {
  originalname: string
  mimetype: string
  size: number
  buffer: Buffer
}

const BUCKET_NAME = 'medical-documents'

export interface DocumentMetadataInput {
  category: DocumentCategory
  hospital?: string
  doctor?: string
  documentDate?: string
}

export async function uploadDocument(
  patientId: string,
  file: UploadedFile,
  metadata: DocumentMetadataInput
): Promise<MedicalDocument> {
  const documentRef = adminDb
    .collection('patients')
    .doc(patientId)
    .collection('documents')
    .doc()

  const documentId = documentRef.id

  const safeFileName = file.originalname
    .replace(/[^a-zA-Z0-9._-]/g, '_')

  const fileName = `${randomUUID()}-${safeFileName}`
  const storagePath = `${patientId}/${documentId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`File upload failed: ${uploadError.message}`)
  }

  const document: MedicalDocument = {
    id: documentId,
    patientId,
    fileName,
    originalName: file.originalname,
    category: metadata.category,
    mimeType: file.mimetype,
    fileSize: file.size,
    storagePath,
    ...(metadata.hospital && { hospital: metadata.hospital }),
    ...(metadata.doctor && { doctor: metadata.doctor }),
    ...(metadata.documentDate && {
      documentDate: metadata.documentDate,
    }),
    uploadedAt: new Date().toISOString(),
  }

  try {
    await documentRef.set(document)
    return document
  } catch (error) {
    await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath])

    throw error
  }
}

export async function getPatientDocuments(
  patientId: string
): Promise<MedicalDocument[]> {
  const snapshot = await adminDb
    .collection('patients')
    .doc(patientId)
    .collection('documents')
    .orderBy('uploadedAt', 'desc')
    .get()

  return snapshot.docs.map(
    (doc) => doc.data() as MedicalDocument
  )
}

export async function getDocumentDownloadUrl(
  patientId: string,
  documentId: string
): Promise<string> {
  const documentRef = adminDb
    .collection('patients')
    .doc(patientId)
    .collection('documents')
    .doc(documentId)

  const documentSnapshot = await documentRef.get()

  if (!documentSnapshot.exists) {
    throw new Error('Document not found.')
  }

  const document = documentSnapshot.data() as MedicalDocument

  if (document.patientId !== patientId) {
    throw new Error('Document ownership verification failed.')
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(document.storagePath, 60)

  if (error) {
    throw new Error(`Could not generate download URL: ${error.message}`)
  }

  return data.signedUrl
}

export async function deletePatientDocument(
  patientId: string,
  documentId: string
): Promise<void> {
  const documentRef = adminDb
    .collection('patients')
    .doc(patientId)
    .collection('documents')
    .doc(documentId)

  const documentSnapshot = await documentRef.get()

  if (!documentSnapshot.exists) {
    throw new Error('Document not found.')
  }

  const document = documentSnapshot.data() as MedicalDocument

  if (document.patientId !== patientId) {
    throw new Error('Document ownership verification failed.')
  }

  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([document.storagePath])

  if (storageError) {
    throw new Error(`Could not delete stored file: ${storageError.message}`)
  }

  await documentRef.delete()
}
