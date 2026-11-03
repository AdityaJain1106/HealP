
import { useEffect, useRef, useState } from 'react'
import {
    Upload,
    FileImage,
    X,
    Loader2,
    Sparkles,
    ShieldCheck,
    AlertTriangle,
    CheckCircle2,
    Pill,
    CalendarDays,
    UserRound,
    Stethoscope,
    Building2,
    Info,
    Pencil,
    ClipboardCheck,
    Lock,
    Trash2,
} from 'lucide-react'

import Badge from '../common/Badge'
import Card from '../common/Card'

import {
    analyzePrescription,
    getPrescriptionReviews,
    getPrescriptionReview,
    deletePrescriptionReview,
    savePrescriptionReview,
    type PrescriptionReviewSummary,
    type PrescriptionAnalysis,
    type PrescriptionAnalysisResult,
    type PrescriptionMedicine,
    type PrescriptionDetails,
} from '../../services/prescriptionService'

const inputClass =
    'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100'

function cloneAnalysis(analysis: PrescriptionAnalysis): PrescriptionAnalysis {
    return JSON.parse(JSON.stringify(analysis)) as PrescriptionAnalysis
}

function PrescriptionReader() {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] =
        useState<PrescriptionAnalysisResult | null>(null)

    const [savedReviews, setSavedReviews] =
        useState<PrescriptionReviewSummary[]>([])
    const [reviewsLoading, setReviewsLoading] = useState(true)
    const [reviewsError, setReviewsError] = useState<string | null>(null)
    const [openingReviewId, setOpeningReviewId] = useState<string | null>(null)
    const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null)

    const loadSavedReviews = async () => {
        setReviewsLoading(true)
        setReviewsError(null)

        try {
            const reviews = await getPrescriptionReviews()
            setSavedReviews(reviews)
        } catch (err) {
            setReviewsError(
                err instanceof Error
                    ? err.message
                    : 'Unable to load saved prescriptions.'
            )
        } finally {
            setReviewsLoading(false)
        }
    }

    useEffect(() => {
        void loadSavedReviews()
    }, [])

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl)
        }
    }, [previewUrl])

    const selectFile = (selectedFile?: File) => {
        if (!selectedFile) return

        if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) {
            setError('Please select a JPEG or PNG image.')
            return
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            setError('The image must be smaller than 10 MB.')
            return
        }

        setPreviewUrl(URL.createObjectURL(selectedFile))
        setFile(selectedFile)
        setResult(null)
        setError(null)
    }

    const clearSelection = () => {
        setFile(null)
        setPreviewUrl(null)
        setResult(null)
        setError(null)

        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleAnalyze = async () => {
        if (!file) {
            setError('Please upload a prescription image first.')
            return
        }

        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const analysisResult = await analyzePrescription(file)
            setResult(analysisResult)
            await loadSavedReviews()
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to analyze this prescription. Please try again.'
            )
        } finally {
            setLoading(false)
        }
    }

    const handleOpenReview = async (reviewId: string) => {
        setOpeningReviewId(reviewId)
        setReviewsError(null)
        setError(null)

        try {
            const review = await getPrescriptionReview(reviewId)

            setResult({
                reviewId: review.reviewId,
                analysis: review.patientReview ?? review.originalAnalysis,
                savedDocument: null,
                saveError: null,
            })

            setFile(null)
            setPreviewUrl(null)

            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }

            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (err) {
            setReviewsError(
                err instanceof Error
                    ? err.message
                    : 'Unable to open this prescription review.'
            )
        } finally {
            setOpeningReviewId(null)
        }
    }

    const handleDeleteReview = async (reviewId: string) => {
        const confirmed = window.confirm(
            'Are you sure you want to permanently delete this prescription review? The original uploaded image in Reports & Documents will not be deleted.'
        )

        if (!confirmed) return

        setDeletingReviewId(reviewId)
        setReviewsError(null)

        try {
            await deletePrescriptionReview(reviewId)

            setSavedReviews((current) =>
                current.filter((review) => review.reviewId !== reviewId)
            )

            if (result?.reviewId === reviewId) {
                setResult(null)
            }
        } catch (err) {
            setReviewsError(
                err instanceof Error
                    ? err.message
                    : 'Unable to delete this prescription review.'
            )
        } finally {
            setDeletingReviewId(null)
        }
    }

    return (
        <div className="space-y-6">
            <Card padding="lg">
                <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                        <Sparkles size={24} />
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            AI Prescription Reader
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            Upload a prescription image to extract medicine names,
                            dosage instructions and other readable information.
                        </p>
                    </div>
                </div>

                <div className="mt-6">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        onChange={(event) => selectFile(event.target.files?.[0])}
                    />

                    {!previewUrl ? (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center transition hover:border-primary-400 hover:bg-primary-50/40"
                        >
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
                                <Upload size={26} />
                            </div>

                            <span className="mt-4 font-semibold text-slate-800">
                                Upload your prescription
                            </span>

                            <span className="mt-2 text-sm text-slate-500">
                                Click to browse JPEG or PNG images
                            </span>

                            <span className="mt-1 text-xs text-slate-400">
                                Maximum file size: 10 MB
                            </span>
                        </button>
                    ) : (
                        <div className="overflow-hidden rounded-2xl border border-slate-200">
                            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    <FileImage size={18} className="shrink-0 text-primary-600" />
                                    <span className="truncate text-sm font-medium text-slate-700">
                                        {file?.name}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    disabled={loading}
                                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-red-600 disabled:opacity-50"
                                    aria-label="Remove prescription"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex max-h-[420px] justify-center overflow-auto bg-slate-100 p-4">
                                <img
                                    src={previewUrl}
                                    alt="Prescription preview"
                                    className="max-h-96 max-w-full rounded-lg object-contain shadow-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={!file || loading}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <Loader2 size={19} className="animate-spin" />
                            Analyzing prescription...
                        </>
                    ) : (
                        <>
                            <Sparkles size={19} />
                            Analyze prescription
                        </>
                    )}
                </button>

                <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                    Your prescription image is saved to Reports & Documents
                    after successful analysis.
                </p>
            </Card>

            {/* Saved prescription reviews */}
            <Card padding="lg">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                            Saved Prescription Reviews
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Reopen previous analyses and patient-reviewed corrections.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadSavedReviews()}
                        disabled={reviewsLoading}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        {reviewsLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                {reviewsError && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {reviewsError}
                    </div>
                )}

                {reviewsLoading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                        <Loader2 size={18} className="animate-spin" />
                        Loading saved reviews...
                    </div>
                ) : savedReviews.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                        No saved prescription reviews yet.
                    </p>
                ) : (
                    <div className="mt-5 space-y-3">
                        {savedReviews.map((review) => (
                            <div
                                key={review.reviewId}
                                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-slate-800">
                                        {review.prescriberName || 'Prescription review'}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        {review.prescriptionDate || 'Date not detected'}
                                    </p>

                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <Badge
                                            variant={
                                                review.reviewStatus === 'patient_reviewed'
                                                    ? 'success'
                                                    : 'warning'
                                            }
                                        >
                                            {review.reviewStatus === 'patient_reviewed'
                                                ? 'Patient reviewed'
                                                : 'Awaiting review'}
                                        </Badge>

                                        <span className="text-xs text-slate-500">
                                            {review.medicineNames.length}{' '}
                                            medicines
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => void handleOpenReview(review.reviewId)}
                                        disabled={
                                            openingReviewId === review.reviewId ||
                                            deletingReviewId === review.reviewId
                                        }
                                        className="flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                                    >
                                        {openingReviewId === review.reviewId ? (
                                            <Loader2 size={15} className="animate-spin" />
                                        ) : null}
                                        {openingReviewId === review.reviewId
                                            ? 'Opening...'
                                            : 'Open review'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => void handleDeleteReview(review.reviewId)}
                                        disabled={
                                            deletingReviewId === review.reviewId ||
                                            openingReviewId === review.reviewId
                                        }
                                        className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    >
                                        {deletingReviewId === review.reviewId ? (
                                            <Loader2 size={15} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={15} />
                                        )}
                                        {deletingReviewId === review.reviewId
                                            ? 'Deleting...'
                                            : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {result && (
                <PrescriptionResults
                    key={result.reviewId}
                    reviewId={result.reviewId}
                    analysis={result.analysis}
                    saveError={result.saveError}
                    saved={Boolean(result.savedDocument)}
                    onReviewSaved={() => void loadSavedReviews()}
                />
            )}
        </div>
    )
}

function getMissingDetails(medicine: PrescriptionMedicine): string[] {
    const details = medicine.prescriptionDetails

    const fields: { key: keyof PrescriptionDetails; label: string }[] = [
        { key: 'strength', label: 'Strength' },
        { key: 'dosage', label: 'Dosage' },
        { key: 'route', label: 'Route' },
        { key: 'frequency', label: 'Frequency' },
        { key: 'duration', label: 'Duration' },
        { key: 'instructions', label: 'Instructions' },
    ]

    return fields
        .filter(({ key }) => !details[key]?.trim())
        .map(({ label }) => label)
}

function PrescriptionResults({
    reviewId,
    analysis,
    saved,
    saveError,
    onReviewSaved,
}: {
    reviewId: string
    analysis: PrescriptionAnalysis
    saved: boolean
    saveError: string | null
    onReviewSaved: () => void
}) {
    const [draft, setDraft] = useState<PrescriptionAnalysis>(
        () => cloneAnalysis(analysis)
    )
    const [editing, setEditing] = useState(false)
    const [confirmed, setConfirmed] = useState(false)
    const [savingReview, setSavingReview] = useState(false)
    const [reviewSaveError, setReviewSaveError] = useState<string | null>(null)

    useEffect(() => {
        setDraft(cloneAnalysis(analysis))
        setEditing(false)
        setConfirmed(false)
        setReviewSaveError(null)
    }, [analysis])

    const updateMetadata = (
        field: keyof PrescriptionAnalysis['prescription'],
        value: string
    ) => {
        setDraft((current) => ({
            ...current,
            prescription: {
                ...current.prescription,
                [field]: value || null,
            },
        }))
    }

    const updateMedicine = (
        index: number,
        changes: Partial<PrescriptionMedicine>
    ) => {
        setDraft((current) => ({
            ...current,
            medicines: current.medicines.map((medicine, medicineIndex) =>
                medicineIndex === index
                    ? { ...medicine, ...changes }
                    : medicine
            ),
        }))
    }

    const updateMedicineDetail = (
        index: number,
        field: keyof PrescriptionDetails,
        value: string
    ) => {
        const medicine = draft.medicines[index]

        updateMedicine(index, {
            prescriptionDetails: {
                ...medicine.prescriptionDetails,
                [field]: value || null,
            },
        })
    }

    const updateAdditionalInstructions = (value: string) => {
        setDraft((current) => ({
            ...current,
            additionalInstructions: value
                .split('\n')
                .map((item) => item.trim())
                .filter(Boolean),
        }))
    }

    const handleConfirm = async () => {
        setSavingReview(true)
        setReviewSaveError(null)

        try {
            await savePrescriptionReview(reviewId, draft)
            setConfirmed(true)
            setEditing(false)
            onReviewSaved()
        } catch (err) {
            setReviewSaveError(
                err instanceof Error
                    ? err.message
                    : 'Unable to save your review. Please try again.'
            )
        } finally {
            setSavingReview(false)
        }
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <Badge variant="success" dot>
                        Analysis completed
                    </Badge>

                    <h2 className="mt-3 text-xl font-bold text-slate-900">
                        Prescription analysis
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Review and correct the information extracted from your prescription.
                    </p>
                </div>

                {saved ? (
                    <Badge variant="success">
                        <span className="flex items-center gap-1">
                            <CheckCircle2 size={13} />
                            Original image saved
                        </span>
                    </Badge>
                ) : (
                    <Badge variant="warning">Image save incomplete or previously saved</Badge>
                )}
            </div>

            {saveError && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold">
                            Analysis completed, but image saving failed.
                        </p>
                        <p className="mt-1">{saveError}</p>
                    </div>
                </div>
            )}

            {confirmed && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-700" />
                    <div>
                        <p className="font-semibold text-emerald-900">
                            Review saved to your health record
                        </p>
                        <p className="mt-1 text-sm leading-5 text-emerald-800">
                            Your reviewed version has been saved separately from the original AI analysis. It has not been clinically verified.
                        </p>
                    </div>
                </div>
            )}

            <Card padding="lg">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold text-slate-900">
                        Prescription information
                    </h3>

                    {!editing && !confirmed && (
                        <button
                            type="button"
                            onClick={() => {
                                setReviewSaveError(null)
                                setEditing(true)
                            }}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            <Pencil size={15} />
                            Edit information
                        </button>
                    )}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {editing ? (
                        <>
                            <ReviewInput
                                label="Patient name"
                                value={draft.prescription.patientName}
                                onChange={(value) => updateMetadata('patientName', value)}
                            />
                            <ReviewInput
                                label="Prescriber name"
                                value={draft.prescription.prescriberName}
                                onChange={(value) => updateMetadata('prescriberName', value)}
                            />
                            <ReviewInput
                                label="Hospital / Clinic"
                                value={draft.prescription.hospitalName}
                                onChange={(value) => updateMetadata('hospitalName', value)}
                            />
                            <ReviewInput
                                label="Prescription date"
                                value={draft.prescription.prescriptionDate}
                                onChange={(value) => updateMetadata('prescriptionDate', value)}
                            />
                        </>
                    ) : (
                        <>
                            <MetadataItem
                                icon={<UserRound size={17} />}
                                label="Patient"
                                value={draft.prescription.patientName}
                            />
                            <MetadataItem
                                icon={<Stethoscope size={17} />}
                                label="Prescriber"
                                value={draft.prescription.prescriberName}
                            />
                            <MetadataItem
                                icon={<Building2 size={17} />}
                                label="Hospital / Clinic"
                                value={draft.prescription.hospitalName}
                            />
                            <MetadataItem
                                icon={<CalendarDays size={17} />}
                                label="Prescription date"
                                value={draft.prescription.prescriptionDate}
                            />
                        </>
                    )}
                </div>
            </Card>

            <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Pill size={20} className="text-primary-600" />
                        <h3 className="font-semibold text-slate-900">
                            Detected medicines ({draft.medicines.length})
                        </h3>
                    </div>
                </div>

                {draft.medicines.length === 0 ? (
                    <Card padding="lg">
                        <p className="text-sm text-slate-500">
                            No medicines could be reliably extracted from this image.
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {draft.medicines.map((medicine, index) => (
                            <MedicineCard
                                key={index}
                                medicine={medicine}
                                index={index}
                                editing={editing}
                                onNameChange={(value) =>
                                    updateMedicine(index, { name: value || null })
                                }
                                onDetailChange={(field, value) =>
                                    updateMedicineDetail(index, field, value)
                                }
                            />
                        ))}
                    </div>
                )}
            </div>

            {draft.additionalInstructions.length > 0 || editing ? (
                <Card padding="lg">
                    <h3 className="font-semibold text-slate-900">
                        Additional instructions
                    </h3>

                    {editing ? (
                        <ReviewTextarea
                            label="One instruction per line"
                            value={draft.additionalInstructions.join('\n')}
                            onChange={updateAdditionalInstructions}
                        />
                    ) : (
                        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-600">
                            {draft.additionalInstructions.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    )}
                </Card>
            ) : null}

            {reviewSaveError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold">Review could not be saved.</p>
                        <p className="mt-1">{reviewSaveError}</p>
                    </div>
                </div>
            )}

            {editing && (
                <Card padding="lg">
                    <div className="space-y-3">
                        <div className="flex items-start gap-2">
                            <Info size={18} className="mt-0.5 shrink-0 text-primary-600" />
                            <div>
                                <h3 className="font-semibold text-slate-900">
                                    Review your corrections
                                </h3>
                                <p className="mt-1 text-sm leading-5 text-slate-500">
                                    Compare every correction with the original prescription.
                                    Leave unreadable details empty. Do not guess missing dosage
                                    or instructions.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => setEditing(false)}
                                disabled={savingReview}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Cancel editing
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={savingReview}
                                className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
                            >
                                {savingReview ? (
                                    <Loader2 size={17} className="animate-spin" />
                                ) : (
                                    <ClipboardCheck size={17} />
                                )}
                                {savingReview
                                    ? 'Saving review...'
                                    : 'Save reviewed information'}
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            {!editing && !confirmed && (
                <Card padding="lg">
                    <div className="flex items-start gap-3">
                        <ClipboardCheck size={21} className="mt-0.5 shrink-0 text-primary-600" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">
                                Review extracted information
                            </h3>
                            <p className="mt-1 text-sm leading-5 text-slate-500">
                                Check the extracted details against the original prescription.
                                You can edit them before confirming this review draft.
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    setReviewSaveError(null)
                                    setEditing(true)
                                }}
                                className="mt-4 flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
                            >
                                <Pencil size={16} />
                                Review and correct information
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            {confirmed && (
                <Card padding="lg">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="font-semibold text-slate-900">
                                Review saved to your health record
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                You can still reopen this draft to make corrections.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setConfirmed(false)
                                setReviewSaveError(null)
                                setEditing(true)
                            }}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            <Pencil size={15} />
                            Edit again
                        </button>
                    </div>
                </Card>
            )}

            {(draft.extractionWarnings.length > 0 ||
                draft.uncertainFields.length > 0) && (
                <Card padding="lg">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={19} className="text-amber-600" />
                        <h3 className="font-semibold text-slate-900">
                            AI extraction warnings
                        </h3>
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                        These warnings describe the original AI extraction and are not
                        automatically removed when you edit the review draft.
                    </p>

                    {draft.extractionWarnings.length > 0 && (
                        <ul className="mt-4 space-y-2 text-sm text-slate-600">
                            {draft.extractionWarnings.map((warning, index) => (
                                <li key={index} className="flex gap-2">
                                    <span className="text-amber-600">•</span>
                                    {warning}
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            )}

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-amber-900">
                    <ShieldCheck size={19} />
                    <h3 className="font-semibold">Medical review required</h3>
                </div>

                <p className="mt-2 text-sm leading-6 text-amber-800">
                    AI extraction and patient corrections can contain mistakes.
                    This information is not medical advice or a verified prescription.
                    Do not start, stop, or change medication based on this draft.
                    Always verify the original prescription with a qualified
                    healthcare professional.
                </p>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                <Lock size={15} className="mt-0.5 shrink-0" />
                <p>
                    The reviewed version is saved separately in Firestore when you confirm it.
                    The original AI analysis remains unchanged, and neither version is
                    clinically verified. The uploaded prescription image is stored separately.
                </p>
            </div>
        </div>
    )
}

function MedicineCard({
    medicine,
    index,
    editing,
    onNameChange,
    onDetailChange,
}: {
    medicine: PrescriptionMedicine
    index: number
    editing: boolean
    onNameChange: (value: string) => void
    onDetailChange: (field: keyof PrescriptionDetails, value: string) => void
}) {
    const missingDetails = getMissingDetails(medicine)

    const hasReadableIdentity =
        Boolean(medicine.name?.trim()) && medicine.confidence !== 'low'

    const detailsComplete = missingDetails.length === 0

    const needsVerification =
        medicine.requiresVerification ||
        !hasReadableIdentity ||
        !detailsComplete

    const detailFields: {
        key: keyof PrescriptionDetails
        label: string
    }[] = [
        { key: 'strength', label: 'Strength' },
        { key: 'dosage', label: 'Dosage' },
        { key: 'route', label: 'Route' },
        { key: 'frequency', label: 'Frequency' },
        { key: 'duration', label: 'Duration' },
        { key: 'instructions', label: 'Instructions' },
    ]

    return (
        <Card padding="lg">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                        <Pill size={20} />
                    </div>

                    <div>
                        {editing ? (
                            <input
                                aria-label={`Medicine ${index + 1} name`}
                                className={inputClass}
                                value={medicine.name || ''}
                                placeholder="Medicine name"
                                onChange={(event) => onNameChange(event.target.value)}
                            />
                        ) : (
                            <h4 className="font-semibold text-slate-900">
                                {medicine.name || `Medicine ${index + 1}`}
                            </h4>
                        )}

                        <p className="text-xs text-slate-500">
                            Original AI name readability: {medicine.confidence}
                        </p>
                    </div>
                </div>

                {needsVerification ? (
                    <Badge variant="warning">
                        <span className="flex items-center gap-1">
                            <AlertTriangle size={12} />
                            Verify details
                        </span>
                    </Badge>
                ) : (
                    <Badge variant="success">
                        <span className="flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            Details extracted
                        </span>
                    </Badge>
                )}
            </div>

            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-600">
                        Extraction status
                    </p>

                    {hasReadableIdentity ? (
                        <span className="text-xs font-medium text-emerald-700">
                            Medicine name readable
                        </span>
                    ) : (
                        <span className="text-xs font-medium text-amber-700">
                            Medicine identity uncertain
                        </span>
                    )}
                </div>

                <p className="mt-2 text-xs text-slate-500">
                    {detailsComplete
                        ? 'All displayed prescription detail fields are populated.'
                        : `${missingDetails.length} prescription detail field(s) unavailable: ${missingDetails.join(', ')}.`}
                </p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {detailFields.map(({ key, label }) => (
                    editing ? (
                        <ReviewInput
                            key={key}
                            label={label}
                            value={medicine.prescriptionDetails[key]}
                            onChange={(value) => onDetailChange(key, value)}
                        />
                    ) : (
                        <DetailItem
                            key={key}
                            label={label}
                            value={medicine.prescriptionDetails[key]}
                        />
                    )
                ))}
            </div>

            {medicine.sourceText && (
                <div className="mt-4 rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-500">
                        Original text detected by AI
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                        {medicine.sourceText}
                    </p>
                </div>
            )}

            {needsVerification && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <Info size={16} className="mt-0.5 shrink-0 text-amber-700" />
                    <p className="text-xs leading-5 text-amber-800">
                        {hasReadableIdentity
                            ? 'The medicine name was readable, but some prescription details are missing or uncertain. Confirm the complete instructions with your prescribing doctor or pharmacist.'
                            : 'The medicine identity could not be reliably established. Do not rely on this medicine name or its extracted details. Confirm the original prescription with your prescribing doctor or pharmacist.'}
                    </p>
                </div>
            )}

            {medicine.medicineInformation.generalUses.length > 0 && (
                <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-700">
                        General uses
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
                        {medicine.medicineInformation.generalUses.map((item, i) => (
                            <li key={i}>{item}</li>
                        ))}
                    </ul>
                </div>
            )}

            {medicine.medicineInformation.commonSideEffects.length > 0 && (
                <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-700">
                        Common side effects
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
                        {medicine.medicineInformation.commonSideEffects.map((item, i) => (
                            <li key={i}>{item}</li>
                        ))}
                    </ul>
                </div>
            )}
        </Card>
    )
}

function ReviewInput({
    label,
    value,
    onChange,
}: {
    label: string
    value: string | null
    onChange: (value: string) => void
}) {
    return (
        <label className="block min-w-0 text-xs font-medium text-slate-600">
            {label}
            <input
                className={inputClass}
                value={value || ''}
                placeholder={`Enter ${label.toLowerCase()}`}
                onChange={(event) => onChange(event.target.value)}
            />
        </label>
    )
}

function ReviewTextarea({
    label,
    value,
    onChange,
}: {
    label: string
    value: string
    onChange: (value: string) => void
}) {
    return (
        <label className="mt-4 block text-xs font-medium text-slate-600">
            {label}
            <textarea
                className={`${inputClass} min-h-28 resize-y`}
                value={value}
                placeholder="Enter each instruction on a separate line"
                onChange={(event) => onChange(event.target.value)}
            />
        </label>
    )
}

function MetadataItem({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode
    label: string
    value: string | null
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 text-slate-400">{icon}</div>

            <div className="min-w-0">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 break-words text-sm font-medium text-slate-800">
                    {value || 'Not detected'}
                </p>
            </div>
        </div>
    )
}

function DetailItem({
    label,
    value,
}: {
    label: string
    value: string | null
}) {
    return (
        <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-medium text-slate-800">
                {value || 'Not detected'}
            </p>
        </div>
    )
}

export default PrescriptionReader
