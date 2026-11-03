
import { useState } from 'react'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  Pill,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'

import Card from '../common/Card'
import Badge from '../common/Badge'

import {
  generateMedicalSummary,
  type MedicalSummary as MedicalSummaryData,
} from '../../services/medicalSummaryService'

function MedicalSummary() {
  const [summary, setSummary] = useState<MedicalSummaryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await generateMedicalSummary()
      setSummary(result)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to generate your medical summary.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <Card padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <Activity size={24} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                AI Medical Summary
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Get an organized overview of your medical history,
                recorded conditions, prescriptions and allergies.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : summary ? (
              <RefreshCw size={17} />
            ) : (
              <Activity size={17} />
            )}

            {loading
              ? 'Generating...'
              : summary
                ? 'Regenerate summary'
                : 'Generate summary'}
          </button>
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {!summary && !loading && (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
            <FileText size={30} className="mx-auto text-slate-400" />

            <h3 className="mt-3 font-semibold text-slate-800">
              Your medical summary is ready to generate
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              HealP will organize information from your saved medical
              records and prescription reviews.
            </p>
          </div>
        )}

        {loading && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl bg-slate-50 py-10">
            <Loader2 size={32} className="animate-spin text-primary-600" />

            <p className="mt-3 font-medium text-slate-700">
              Analyzing your medical records...
            </p>

            <p className="mt-1 text-xs text-slate-500">
              This may take a few moments.
            </p>
          </div>
        )}
      </Card>

      {summary && (
        <>
          <Card padding="lg">
            <div className="flex items-center gap-2">
              <Activity size={19} className="text-primary-600" />
              <h3 className="font-semibold text-slate-900">
                Health Overview
              </h3>
            </div>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              {summary.overview}
            </p>
          </Card>

          <Card padding="lg">
            <div className="flex items-center gap-2">
              <ClipboardList size={19} className="text-primary-600" />
              <h3 className="font-semibold text-slate-900">
                Known Conditions
              </h3>
            </div>

            {summary.knownConditions.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No known conditions were identified in the available records.
                This does not establish that no conditions exist.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {summary.knownConditions.map((condition, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-100 p-4"
                  >
                    <p className="font-medium text-slate-800">
                      {condition.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {condition.details}
                    </p>
                    {condition.date && (
                      <p className="mt-2 text-xs text-slate-400">
                        {condition.date}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card padding="lg">
            <div className="flex items-center gap-2">
              <CalendarDays size={19} className="text-primary-600" />
              <h3 className="font-semibold text-slate-900">
                Medical Timeline
              </h3>
            </div>

            {summary.medicalTimeline.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No medical timeline events were found.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {summary.medicalTimeline.map((event, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-primary-500" />
                      {index !== summary.medicalTimeline.length - 1 && (
                        <div className="mt-1 min-h-12 w-px flex-1 bg-slate-200" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-slate-800">
                          {event.event}
                        </h4>
                        <Badge variant="info">{event.type}</Badge>
                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        {event.date || 'Date unavailable'}
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {event.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card padding="lg">
              <div className="flex items-center gap-2">
                <Pill size={19} className="text-primary-600" />
                <h3 className="font-semibold text-slate-900">
                  Current Medicines
                </h3>
              </div>

              {summary.currentMedicines.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  No current medicines were identified.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {summary.currentMedicines.map((medicine, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-100 p-3"
                    >
                      <p className="font-medium text-slate-800">
                        {medicine.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {medicine.details}
                      </p>
                      <Badge
                        variant={
                          medicine.verificationStatus === 'patient_reviewed'
                            ? 'success'
                            : 'warning'
                        }
                      >
                        {medicine.verificationStatus.replaceAll('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card padding="lg">
              <div className="flex items-center gap-2">
                <ShieldCheck size={19} className="text-primary-600" />
                <h3 className="font-semibold text-slate-900">
                  Recorded Allergies
                </h3>
              </div>

              {summary.allergies.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  No allergies were identified in the available records.
                  This does not confirm the absence of allergies.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {summary.allergies.map((allergy, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-amber-100 bg-amber-50 p-3"
                    >
                      <p className="font-medium text-amber-900">
                        {allergy.name}
                      </p>
                      {allergy.details && (
                        <p className="mt-1 text-sm text-amber-800">
                          {allergy.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card padding="lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={19} className="text-primary-600" />
              <h3 className="font-semibold text-slate-900">
                Important Notes
              </h3>
            </div>

            {summary.importantNotes.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No additional notes were identified.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {summary.importantNotes.map((note, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm leading-6 text-slate-600"
                  >
                    <CheckCircle2
                      size={16}
                      className="mt-1 shrink-0 text-emerald-600"
                    />
                    {note}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="lg">
            <div className="flex items-center gap-2">
              <AlertTriangle size={19} className="text-amber-600" />
              <h3 className="font-semibold text-slate-900">
                Missing Information
              </h3>
            </div>

            {summary.missingInformation.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No additional missing information was reported by the AI.
              </p>
            ) : (
              <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-6 text-slate-600">
                {summary.missingInformation.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
          </Card>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <ShieldCheck size={19} className="mt-0.5 shrink-0 text-amber-700" />
            <p className="text-sm leading-6 text-amber-900">
              {summary.disclaimer}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default MedicalSummary
