
import { useState, type FormEvent } from 'react'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HeartPulse,
  Loader2,
  ShieldAlert,
  Stethoscope,
} from 'lucide-react'

import Card from '../common/Card'
import Badge from '../common/Badge'

import {
  assessSymptoms,
  type SymptomAssessment,
} from '../../services/symptomCheckerService'

function SymptomChecker() {
  const [symptoms, setSymptoms] = useState('')
  const [duration, setDuration] = useState('')
  const [severity, setSeverity] = useState('mild')

  const [assessment, setAssessment] =
    useState<SymptomAssessment | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAssessment = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (!symptoms.trim() || !duration.trim()) {
      setError('Please provide your symptoms and their duration.')
      return
    }

    setLoading(true)
    setError(null)
    setAssessment(null)

    try {
      const result = await assessSymptoms(
        symptoms,
        duration,
        severity
      )

      setAssessment(result)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to assess symptoms. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const resultSections = assessment
    ? [
        {
          title: 'Possible Causes',
          icon: Activity,
          items: assessment.possibleCauses,
        },
        {
          title: 'Understanding the Symptoms',
          icon: HeartPulse,
          items: assessment.explanations,
        },
        {
          title: 'General Preventive Measures',
          icon: CheckCircle2,
          items: assessment.preventiveMeasures,
        },
        {
          title: 'Warning Signs',
          icon: ShieldAlert,
          items: assessment.warningSigns,
        },
        {
          title: 'Follow-up Questions',
          icon: Stethoscope,
          items: assessment.followUpQuestions,
        },
      ]
    : []

  return (
    <div className="space-y-5">
      <Card padding="lg">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <HeartPulse size={25} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              AI Symptom Checker
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Describe your symptoms to receive educational information
              about possible causes and general preventive measures.
            </p>
          </div>
        </div>

        <form onSubmit={handleAssessment} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="symptoms"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Describe your symptoms
            </label>

            <textarea
              id="symptoms"
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
              placeholder="For example: I have a headache and mild fever..."
              rows={4}
              maxLength={2000}
              disabled={loading}
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="symptom-duration"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Duration
              </label>

              <input
                id="symptom-duration"
                type="text"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                placeholder="e.g. 2 days"
                maxLength={100}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label
                htmlFor="symptom-severity"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Perceived severity
              </label>

              <select
                id="symptom-severity"
                value={severity}
                onChange={(event) => setSeverity(event.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50"
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-amber-700"
            />

            <p className="text-xs leading-5 text-amber-900">
              This tool cannot diagnose medical conditions or reliably
              determine whether symptoms are emergencies. Do not delay
              medical care while using it. If you have severe or rapidly
              worsening symptoms, seek urgent medical attention.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !symptoms.trim() || !duration.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Activity size={18} />
            )}

            {loading ? 'Assessing symptoms...' : 'Check Symptoms'}
          </button>
        </form>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
      </Card>

      {assessment && (
        <>
          <Card padding="lg">
            <div className="flex items-center gap-2">
              <Activity size={21} className="text-primary-600" />

              <h3 className="text-lg font-semibold text-slate-900">
                Symptom Assessment
              </h3>
            </div>

            <div className="mt-4">
              {assessment.emergencyConcern ? (
                <div className="rounded-xl border border-red-300 bg-red-50 p-4">
                  <div className="flex items-center gap-2 font-semibold text-red-800">
                    <AlertTriangle size={19} />
                    Potential Emergency Concern
                  </div>

                  <p className="mt-2 text-sm leading-6 text-red-800">
                    The AI has flagged a potential concern. Seek immediate
                    medical attention. Do not rely on this assessment to
                    determine whether your symptoms are safe.
                  </p>
                </div>
              ) : (
                <Badge variant="success">
                  Educational information generated
                </Badge>
              )}
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <h4 className="font-semibold text-slate-900">
                Recommended Action
              </h4>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                {assessment.recommendedAction}
              </p>
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            {resultSections.map((section) => {
              const Icon = section.icon

              return (
                <Card key={section.title} padding="lg">
                  <div className="flex items-center gap-2">
                    <Icon size={20} className="text-primary-600" />

                    <h3 className="font-semibold text-slate-900">
                      {section.title}
                    </h3>
                  </div>

                  {section.items.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">
                      No additional information provided.
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {section.items.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm leading-6 text-slate-600"
                        >
                          <CheckCircle2
                            size={16}
                            className="mt-1 shrink-0 text-emerald-600"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              )
            })}
          </div>

          <Card padding="lg">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-primary-600" />

              <h3 className="font-semibold text-slate-900">
                Important Reminder
              </h3>
            </div>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              {assessment.disclaimer}
            </p>
          </Card>
        </>
      )}
    </div>
  )
}

export default SymptomChecker
