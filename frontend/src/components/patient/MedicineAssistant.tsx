
import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  Pill,
  Search,
  ShieldAlert,
  Utensils,
  Package,
} from 'lucide-react'

import Card from '../common/Card'
import Badge from '../common/Badge'

import {
  explainMedicine,
  type MedicineInformation,
} from '../../services/medicineAssistantService'

function MedicineAssistant() {
  const [medicineName, setMedicineName] = useState('')
  const [medicine, setMedicine] = useState<MedicineInformation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!medicineName.trim()) {
      setError('Please enter a medicine name.')
      return
    }

    setLoading(true)
    setError(null)
    setMedicine(null)

    try {
      const result = await explainMedicine(medicineName)
      setMedicine(result)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to retrieve medicine information.'
      )
    } finally {
      setLoading(false)
    }
  }

  const informationSections = medicine
    ? [
        {
          title: 'Common Uses',
          icon: BookOpen,
          items: medicine.uses,
          color: 'blue',
        },
        {
          title: 'Common Side Effects',
          icon: AlertCircle,
          items: medicine.commonSideEffects,
          color: 'amber',
        },
        {
          title: 'Precautions',
          icon: ShieldAlert,
          items: medicine.precautions,
          color: 'orange',
        },
        {
          title: 'Food Interactions',
          icon: Utensils,
          items: medicine.foodInteractions,
          color: 'emerald',
        },
      ]
    : []

  return (
    <div className="space-y-5">
      <Card padding="lg">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <Pill size={25} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              AI Medicine Assistant
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Search for a medicine to understand its uses, side effects,
              precautions, food interactions and storage information.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mt-6">
          <label
            htmlFor="medicine-search"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Medicine name
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="medicine-search"
              type="text"
              value={medicineName}
              onChange={(event) => setMedicineName(event.target.value)}
              placeholder="e.g. Paracetamol"
              maxLength={150}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />

            <button
              type="submit"
              disabled={loading || !medicineName.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Search size={17} />
              )}

              {loading ? 'Searching...' : 'Search medicine'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-6 flex flex-col items-center rounded-xl bg-slate-50 py-8">
            <Loader2 size={30} className="animate-spin text-primary-600" />
            <p className="mt-3 text-sm font-medium text-slate-700">
              Finding medicine information...
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Please wait while HealP processes your request.
            </p>
          </div>
        )}
      </Card>

      {medicine && (
        <>
          <Card padding="lg">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Pill size={23} />
              </div>

              <div className="min-w-0">
                <h3 className="text-xl font-bold text-slate-900">
                  {medicine.medicineName || 'Medicine not identified'}
                </h3>

                {medicine.activeIngredient && (
                  <p className="mt-1 text-sm text-slate-500">
                    Active ingredient: {medicine.activeIngredient}
                  </p>
                )}

                {medicine.medicineCategory && (
                  <div className="mt-2">
                    <Badge variant="info">
                      {medicine.medicineCategory}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {medicine.uncertainties.length > 0 && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 font-semibold text-amber-900">
                  <AlertTriangle size={18} />
                  Identification or information uncertainty
                </div>

                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-800">
                  {medicine.uncertainties.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {medicine.medicineName !== null && (
            <>
              <div className="grid gap-5 lg:grid-cols-2">
                {informationSections.map((section) => {
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
                          No reliable information available.
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
                  <AlertTriangle size={20} className="text-amber-600" />
                  <h3 className="font-semibold text-slate-900">
                    Serious Warnings
                  </h3>
                </div>

                {medicine.seriousWarnings.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    No specific warnings were returned. This does not
                    establish that the medicine has no serious risks.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {medicine.seriousWarnings.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm leading-6 text-red-800"
                      >
                        <AlertTriangle
                          size={17}
                          className="mt-1 shrink-0"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <div className="grid gap-5 lg:grid-cols-2">
                <Card padding="lg">
                  <div className="flex items-center gap-2">
                    <Clock size={20} className="text-primary-600" />
                    <h3 className="font-semibold text-slate-900">
                      Missed Dose
                    </h3>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {medicine.missedDose}
                  </p>
                </Card>

                <Card padding="lg">
                  <div className="flex items-center gap-2">
                    <Package size={20} className="text-primary-600" />
                    <h3 className="font-semibold text-slate-900">
                      Storage Conditions
                    </h3>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {medicine.storageConditions}
                  </p>
                </Card>
              </div>
            </>
          )}

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <Info size={19} className="mt-0.5 shrink-0 text-amber-700" />

            <p className="text-sm leading-6 text-amber-900">
              {medicine.disclaimer}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default MedicineAssistant
