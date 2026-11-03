
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface PrescriptionMetadata {
  patientName: string | null
  prescriberName: string | null
  hospitalName: string | null
  prescriptionDate: string | null
}

export interface PrescriptionDetails {
  strength: string | null
  dosage: string | null
  route: string | null
  frequency: string | null
  duration: string | null
  instructions: string | null
}

export interface MedicineInformation {
  generalUses: string[]
  commonSideEffects: string[]
}

export interface PrescriptionMedicine {
  name: string | null
  prescriptionDetails: PrescriptionDetails
  medicineInformation: MedicineInformation
  confidence: ConfidenceLevel
  sourceText: string | null
  requiresVerification: boolean
}

export interface PrescriptionAnalysis {
  prescription: PrescriptionMetadata
  medicines: PrescriptionMedicine[]
  additionalInstructions: string[]
  extractionWarnings: string[]
  uncertainFields: string[]
  requiresProfessionalReview: boolean
}

export interface PrescriptionAnalysisResponse {
  success: boolean
  analysis: PrescriptionAnalysis
}
