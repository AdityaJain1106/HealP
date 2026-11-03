
import type {
  PrescriptionAnalysis,
  PrescriptionMedicine,
} from '../types/prescription.js'

export function applyPrescriptionSafety(
  analysis: PrescriptionAnalysis
): PrescriptionAnalysis {
  const uncertainFields = new Set(analysis.uncertainFields)
  const extractionWarnings = new Set(analysis.extractionWarnings)

  const medicines: PrescriptionMedicine[] = analysis.medicines.map(
    (medicine, index) => {
      const details = medicine.prescriptionDetails

      const fields = [
        'strength',
        'dosage',
        'route',
        'frequency',
        'duration',
        'instructions',
      ] as const

      for (const field of fields) {
        if (!details[field]?.trim()) {
          const fieldName = `medicines[${index}].${field}`

          uncertainFields.add(fieldName)
          extractionWarnings.add(
            `${medicine.name || 'A medicine'}: ${field} is missing or unreadable.`
          )
        }
      }

      if (!medicine.name?.trim()) {
        uncertainFields.add(`medicines[${index}].name`)
        extractionWarnings.add(
          `Medicine ${index + 1} could not be reliably identified.`
        )
      }

      const requiresVerification =
        medicine.requiresVerification ||
        medicine.confidence !== 'high' ||
        !medicine.name?.trim() ||
        fields.some(field => !details[field]?.trim())

      return {
        ...medicine,
        requiresVerification,
        medicineInformation: requiresVerification
          ? {
              generalUses: [],
              commonSideEffects: [],
            }
          : medicine.medicineInformation,
      }
    }
  )

  return {
    ...analysis,
    medicines,
    uncertainFields: [...uncertainFields],
    extractionWarnings: [...extractionWarnings],
    requiresProfessionalReview: true,
  }
}
