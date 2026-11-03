
import type {
  ConfidenceLevel,
  PrescriptionAnalysis,
  PrescriptionDetails,
  PrescriptionMedicine,
  PrescriptionMetadata,
  MedicineInformation,
} from '../types/prescription.js'

function isObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(item => typeof item === 'string')
  )
}

function validatePrescriptionMetadata(
  value: unknown
): value is PrescriptionMetadata {
  if (!isObject(value)) return false

  return (
    isNullableString(value.patientName) &&
    isNullableString(value.prescriberName) &&
    isNullableString(value.hospitalName) &&
    isNullableString(value.prescriptionDate)
  )
}

function validatePrescriptionDetails(
  value: unknown
): value is PrescriptionDetails {
  if (!isObject(value)) return false

  return (
    isNullableString(value.strength) &&
    isNullableString(value.dosage) &&
    isNullableString(value.route) &&
    isNullableString(value.frequency) &&
    isNullableString(value.duration) &&
    isNullableString(value.instructions)
  )
}

function validateMedicineInformation(
  value: unknown
): value is MedicineInformation {
  if (!isObject(value)) return false

  return (
    isStringArray(value.generalUses) &&
    isStringArray(value.commonSideEffects)
  )
}


function validateMedicine(
  value: unknown
): value is PrescriptionMedicine {
  if (!isObject(value)) return false

  const validConfidence: ConfidenceLevel[] = [
    'high',
    'medium',
    'low',
  ]

  if (
    !isNullableString(value.name) ||
    !validatePrescriptionDetails(value.prescriptionDetails) ||
    !validateMedicineInformation(value.medicineInformation) ||
    !validConfidence.includes(value.confidence as ConfidenceLevel) ||
    !isNullableString(value.sourceText) ||
    typeof value.requiresVerification !== 'boolean'
  ) {
    return false
  }

  const medicineName = value.name?.trim()

  const hasVerifiedIdentity =
    medicineName !== undefined &&
    medicineName.length > 0 &&
    value.confidence !== 'low' &&
    value.requiresVerification === false

  if (!hasVerifiedIdentity) {
    return (
      value.medicineInformation.generalUses.length === 0 &&
      value.medicineInformation.commonSideEffects.length === 0 &&
      value.requiresVerification === true
    )
  }

  return true
}


export function validatePrescriptionAnalysis(
  value: unknown
): value is PrescriptionAnalysis {
  if (!isObject(value)) return false

  return (
    validatePrescriptionMetadata(value.prescription) &&
    Array.isArray(value.medicines) &&
    value.medicines.every(validateMedicine) &&
    isStringArray(value.additionalInstructions) &&
    isStringArray(value.extractionWarnings) &&
    isStringArray(value.uncertainFields) &&
    typeof value.requiresProfessionalReview === 'boolean'
  )
}
