
import { useEffect, useState, type FormEvent } from 'react'
import {
    CalendarDays,
    ClipboardList,
    Edit2,
    Plus,
    RefreshCw,
    Save,
    Search,
    SlidersHorizontal,
    Stethoscope,
    X,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import {
    addMedicalHistoryRecord,
    getMedicalHistory,
    updateMedicalHistoryRecord,
    type MedicalHistoryRecord,
    type MedicalRecordType,
} from '../../services/medicalHistoryService'
import { usePageTitle } from '../../hooks/usePageTitle'

type MedicalHistoryInput = Omit<
    MedicalHistoryRecord,
    'id' | 'createdAt' | 'updatedAt'
>

const initialForm: MedicalHistoryInput = {
    type: 'consultation',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    hospital: '',
    doctor: '',
    diagnosis: '',
    medicines: [],
    notes: '',
}

const recordTypes: { value: MedicalRecordType; label: string }[] = [
    { value: 'hospital_visit', label: 'Hospital Visit' },
    { value: 'consultation', label: 'Doctor Consultation' },
    { value: 'diagnosis', label: 'Diagnosis' },
    { value: 'surgery', label: 'Surgery' },
    { value: 'allergy', label: 'Allergy' },
    { value: 'vaccination', label: 'Vaccination' },
    { value: 'medicine', label: 'Medicine' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'prescription', label: 'Doctor Prescription' },
]

const selectClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

const inputClass =
    'w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

function formatDate(date: string) {
    if (!date) return 'Date not available'

    return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

function PatientHealthPage() {
  usePageTitle('My Health')
    const { user } = useAuth()

    const [records, setRecords] = useState<MedicalHistoryRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formOpen, setFormOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState<MedicalHistoryInput>(initialForm)
    const [medicinesText, setMedicinesText] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Timeline filters
    const [selectedYear, setSelectedYear] = useState('')
    const [diagnosisSearch, setDiagnosisSearch] = useState('')
    const [selectedHospital, setSelectedHospital] = useState('')
    const [selectedDoctor, setSelectedDoctor] = useState('')

    async function loadRecords() {
        if (!user?.uid) {
            setRecords([])
            setLoading(false)
            return
        }

        try {
            setError('')
            const history = await getMedicalHistory(user.uid)
            setRecords(history)
        } catch (err) {
            console.error('Failed to load medical history:', err)
            setError('Unable to load your medical history. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadRecords()
    }, [user?.uid])

    // Build filter options from existing records.
    const availableYears = Array.from(
        new Set(
            records
                .map((record) => record.date?.slice(0, 4))
                .filter((year): year is string => Boolean(year))
        )
    ).sort((a, b) => Number(b) - Number(a))

    const availableHospitals = Array.from(
        new Set(
            records
                .map((record) => record.hospital?.trim())
                .filter((hospital): hospital is string => Boolean(hospital))
        )
    ).sort((a, b) => a.localeCompare(b))

    const availableDoctors = Array.from(
        new Set(
            records
                .map((record) => record.doctor?.trim())
                .filter((doctor): doctor is string => Boolean(doctor))
        )
    ).sort((a, b) => a.localeCompare(b))

    const filteredRecords = records.filter((record) => {
        const matchesYear =
            !selectedYear || record.date?.startsWith(selectedYear)

        const search = diagnosisSearch.trim().toLowerCase()

        const matchesDiagnosis =
            !search ||
            record.diagnosis?.toLowerCase().includes(search) ||
            record.title.toLowerCase().includes(search) ||
            record.description.toLowerCase().includes(search)

        const matchesHospital =
            !selectedHospital || record.hospital === selectedHospital

        const matchesDoctor =
            !selectedDoctor || record.doctor === selectedDoctor

        return (
            matchesYear &&
            matchesDiagnosis &&
            matchesHospital &&
            matchesDoctor
        )
    })

    const hasActiveFilters = Boolean(
        selectedYear ||
        diagnosisSearch.trim() ||
        selectedHospital ||
        selectedDoctor
    )

    function clearFilters() {
        setSelectedYear('')
        setDiagnosisSearch('')
        setSelectedHospital('')
        setSelectedDoctor('')
    }

    function openAddForm() {
        setForm({
            ...initialForm,
            date: new Date().toISOString().split('T')[0],
        })
        setMedicinesText('')
        setEditingId(null)
        setError('')
        setSuccess('')
        setFormOpen(true)
    }

    function openEditForm(record: MedicalHistoryRecord) {
        if (record.source === 'doctor_prescription') {
            setError('Doctor-issued prescriptions cannot be edited here.')
            return
        }

        setForm({
            type: record.type,
            title: record.title,
            description: record.description,
            date: record.date,
            hospital: record.hospital || '',
            doctor: record.doctor || '',
            diagnosis: record.diagnosis || '',
            medicines: record.medicines || [],
            notes: record.notes || '',
        })

        setMedicinesText((record.medicines || []).join(', '))
        setEditingId(record.id || null)
        setError('')
        setSuccess('')
        setFormOpen(true)
    }

    function closeForm() {
        setFormOpen(false)
        setEditingId(null)
        setForm({ ...initialForm })
        setMedicinesText('')
    }

    function updateField(
        field: keyof MedicalHistoryInput,
        value: string
    ) {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }))
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!user?.uid) {
            setError('Please sign in again to save your medical record.')
            return
        }

        if (!form.title.trim() || !form.description.trim() || !form.date) {
            setError('Please complete all required fields.')
            return
        }

        const payload: MedicalHistoryInput = {
            ...form,
            title: form.title.trim(),
            description: form.description.trim(),
            hospital: form.hospital?.trim() || '',
            doctor: form.doctor?.trim() || '',
            diagnosis: form.diagnosis?.trim() || '',
            notes: form.notes?.trim() || '',
            medicines: medicinesText
                .split(',')
                .map((medicine) => medicine.trim())
                .filter(Boolean),
        }

        try {
            setSaving(true)
            setError('')
            setSuccess('')

            if (editingId) {
                await updateMedicalHistoryRecord(user.uid, editingId, payload)
                setSuccess('Medical record updated successfully.')
            } else {
                await addMedicalHistoryRecord(user.uid, payload)
                setSuccess('Medical record added successfully.')
            }

            closeForm()
            await loadRecords()
        } catch (err) {
            console.error('Failed to save medical record:', err)
            setError('Unable to save this record. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6">
            {success && (
                <div
                    role="status"
                    className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                >
                    {success}
                </div>
            )}

            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            {/* Add and edit form */}
            {formOpen && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">
                                {editingId ? 'Edit Medical Record' : 'Add Medical Record'}
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                {editingId
                                    ? 'Update the details of this existing record.'
                                    : 'Add a new entry to your medical history. Older records will be preserved.'}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={closeForm}
                            aria-label="Close form"
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <label className="block">
                                <span className="mb-2 block text-sm font-medium text-slate-700">
                                    Record Type *
                                </span>
                                <select
                                    required
                                    value={form.type}
                                    onChange={(event) =>
                                        setForm((previous) => ({
                                            ...previous,
                                            type: event.target.value as MedicalRecordType,
                                        }))
                                    }
                                    className={selectClass}
                                >
                                    {recordTypes
                                        .filter((type) => type.value !== 'prescription')
                                        .map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-sm font-medium text-slate-700">
                                    Date *
                                </span>
                                <input
                                    type="date"
                                    required
                                    value={form.date}
                                    onChange={(event) => updateField('date', event.target.value)}
                                    className={inputClass}
                                />
                            </label>

                            <label className="block sm:col-span-2">
                                <span className="mb-2 block text-sm font-medium text-slate-700">
                                    Record Title *
                                </span>
                                <input
                                    required
                                    type="text"
                                    value={form.title}
                                    onChange={(event) => updateField('title', event.target.value)}
                                    placeholder="e.g. General health check-up"
                                    className={inputClass}
                                />
                            </label>

                            <label className="block sm:col-span-2">
                                <span className="mb-2 block text-sm font-medium text-slate-700">
                                    Description *
                                </span>
                                <textarea
                                    required
                                    rows={3}
                                    value={form.description}
                                    onChange={(event) =>
                                        updateField('description', event.target.value)
                                    }
                                    placeholder="Describe the visit, treatment or medical event..."
                                    className={`${inputClass} resize-y`}
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-sm font-medium text-slate-700">
                                    Hospital / Clinic
                                </span>
                                <input
                                    type="text"
                                    value={form.hospital}
                                    onChange={(event) => updateField('hospital', event.target.value)}
                                    placeholder="Hospital or clinic name"
                                    className={inputClass}
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-sm font-medium text-slate-700">
                                    Doctor
                                </span>
                                <input
                                    type="text"
                                    value={form.doctor}
                                    onChange={(event) => updateField('doctor', event.target.value)}
                                    placeholder="Doctor's name"
                                    className={inputClass}
                                />
                            </label>

                            <label className="block sm:col-span-2">
                                <span className="mb-2 block text-sm font-medium text-slate-700">
                                    Diagnosis
                                </span>
                                <input
                                    type="text"
                                    value={form.diagnosis}
                                    onChange={(event) => updateField('diagnosis', event.target.value)}
                                    placeholder="Diagnosis, if applicable"
                                    className={inputClass}
                                />
                            </label>

                            <label className="block sm:col-span-2">
                                <span className="mb-2 block text-sm font-medium text-slate-700">
                                    Medicines
                                </span>
                                <input
                                    type="text"
                                    value={medicinesText}
                                    onChange={(event) => setMedicinesText(event.target.value)}
                                    placeholder="Enter medicine names separated by commas"
                                    className={inputClass}
                                />
                                <span className="mt-1 block text-xs text-slate-400">
                                    Separate multiple medicines with commas.
                                </span>
                            </label>

                            <label className="block sm:col-span-2">
                                <span className="mb-2 block text-sm font-medium text-slate-700">
                                    Additional Notes
                                </span>
                                <textarea
                                    rows={3}
                                    value={form.notes}
                                    onChange={(event) => updateField('notes', event.target.value)}
                                    placeholder="Any additional information..."
                                    className={`${inputClass} resize-y`}
                                />
                            </label>
                        </div>

                        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={saving}
                                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Save size={17} />
                                {saving
                                    ? 'Saving...'
                                    : editingId
                                        ? 'Update Record'
                                        : 'Save Record'}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {/* Medical timeline */}
            <section className="mt-6">
                <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">
                            Medical Timeline
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Your saved medical records, arranged by date.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {!loading && (
                            <span className="w-fit rounded-full bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
                                {filteredRecords.length} of {records.length} Records
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={() => void loadRecords()}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={openAddForm}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        >
                            <Plus size={18} />
                            Add Medical Record
                        </button>
                    </div>
                </div>

                {/* Filters */}
                {!loading && records.length > 0 && (
                    <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                <SlidersHorizontal size={17} className="text-blue-600" />
                                Filter Medical Records
                            </div>

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="text-sm font-medium text-blue-600 transition hover:text-blue-800"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <label className="block">
                                <span className="mb-2 block text-xs font-medium text-slate-500">
                                    Filter by year
                                </span>
                                <select
                                    value={selectedYear}
                                    onChange={(event) => setSelectedYear(event.target.value)}
                                    className={selectClass}
                                >
                                    <option value="">All years</option>
                                    {availableYears.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-medium text-slate-500">
                                    Search diagnosis
                                </span>
                                <div className="relative">
                                    <Search
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        type="search"
                                        value={diagnosisSearch}
                                        onChange={(event) => setDiagnosisSearch(event.target.value)}
                                        placeholder="e.g. Fever"
                                        className={`${inputClass} pl-9`}
                                    />
                                </div>
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-medium text-slate-500">
                                    Filter by hospital
                                </span>
                                <select
                                    value={selectedHospital}
                                    onChange={(event) => setSelectedHospital(event.target.value)}
                                    className={selectClass}
                                >
                                    <option value="">All hospitals</option>
                                    {availableHospitals.map((hospital) => (
                                        <option key={hospital} value={hospital}>
                                            {hospital}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-medium text-slate-500">
                                    Filter by doctor
                                </span>
                                <select
                                    value={selectedDoctor}
                                    onChange={(event) => setSelectedDoctor(event.target.value)}
                                    className={selectClass}
                                >
                                    <option value="">All doctors</option>
                                    {availableDoctors.map((doctor) => (
                                        <option key={doctor} value={doctor}>
                                            {doctor}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                        <RefreshCw
                            className="mx-auto animate-spin text-blue-600"
                            size={26}
                        />
                        <p className="mt-3 text-sm text-slate-500">
                            Loading your medical history...
                        </p>
                    </div>
                ) : records.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <ClipboardList size={27} />
                        </div>

                        <h3 className="mt-4 text-lg font-semibold text-slate-900">
                            No medical records yet
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                            Start building your digital health history by adding your first
                            medical record. You can add more records whenever you need.
                        </p>

                        <button
                            type="button"
                            onClick={openAddForm}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            <Plus size={17} />
                            Add Your First Record
                        </button>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                        <Search size={28} className="mx-auto text-slate-400" />

                        <h3 className="mt-4 text-lg font-semibold text-slate-900">
                            No matching records
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            No medical records match your selected filters.
                        </p>

                        <button
                            type="button"
                            onClick={clearFilters}
                            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800"
                        >
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredRecords.map((record) => (
                            <article
                                key={record.id}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                            >
                                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                                    <div className="flex gap-4">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                            <CalendarDays size={21} />
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold text-slate-900">
                                                    {record.title}
                                                </h3>

                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                                    {recordTypes.find(
                                                        (type) => type.value === record.type
                                                    )?.label || record.type}
                                                </span>

                                                {record.source === 'doctor_prescription' && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                                        <Stethoscope size={13} />
                                                        Doctor issued
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mt-1 text-xs font-medium text-slate-500">
                                                {formatDate(record.date)}
                                            </p>

                                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                                {record.description}
                                            </p>
                                        </div>
                                    </div>

                                    {record.source !== 'doctor_prescription' && (
                                        <button
                                            type="button"
                                            onClick={() => openEditForm(record)}
                                            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                        >
                                            <Edit2 size={15} />
                                            Edit
                                        </button>
                                    )}
                                </div>

                                {(record.hospital ||
                                    record.doctor ||
                                    record.diagnosis ||
                                    record.medicines?.length ||
                                    record.notes) && (
                                        <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                                            {record.hospital && (
                                                <div>
                                                    <p className="text-xs font-medium text-slate-400">
                                                        Hospital / Clinic
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-700">
                                                        {record.hospital}
                                                    </p>
                                                </div>
                                            )}

                                            {record.doctor && (
                                                <div>
                                                    <p className="text-xs font-medium text-slate-400">
                                                        Doctor
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-700">
                                                        {record.doctor}
                                                    </p>
                                                </div>
                                            )}

                                            {record.diagnosis && (
                                                <div>
                                                    <p className="text-xs font-medium text-slate-400">
                                                        Diagnosis
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-700">
                                                        {record.diagnosis}
                                                    </p>
                                                </div>
                                            )}

                                            {record.medicines && record.medicines.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-medium text-slate-400">
                                                        Medicines
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-700">
                                                        {record.medicines.join(', ')}
                                                    </p>
                                                </div>
                                            )}

                                            {record.notes && (
                                                <div className="sm:col-span-2">
                                                    <p className="text-xs font-medium text-slate-400">
                                                        Additional Notes
                                                    </p>
                                                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                                                        {record.notes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

export default PatientHealthPage
