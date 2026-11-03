
import { useRef, useState } from 'react'
import {
  Upload,
  Sparkles,
  FolderPlus,
  FileImage,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'

import {
  analyzePrescription,
  type PrescriptionAnalysisResult,
} from '../../services/prescriptionService'

import {
  uploadMedicalDocument,
} from '../../services/documentService'

type UploadMode = 'ai' | 'record'

interface PrescriptionUploadDialogProps {
  onClose: () => void
  onSuccess: (mode: UploadMode, result?: PrescriptionAnalysisResult) => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024

function PrescriptionUploadDialog({
  onClose,
  onSuccess,
}: PrescriptionUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<UploadMode | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileSelection = (selectedFile?: File) => {
    if (!selectedFile) return

    setError('')

    const allowedTypes =
      mode === 'ai'
        ? ['image/jpeg', 'image/png']
        : ['application/pdf', 'image/jpeg', 'image/png']

    if (!allowedTypes.includes(selectedFile.type)) {
      setError(
        mode === 'ai'
          ? 'AI analysis supports JPEG and PNG prescription images only.'
          : 'Please select a PDF, JPEG or PNG document.'
      )
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('The file must be smaller than 10 MB.')
      return
    }

    setFile(selectedFile)
  }

  const handleUpload = async () => {
    if (!mode || !file) {
      setError('Please select a file first.')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (mode === 'ai') {
        const result = await analyzePrescription(file)

        onSuccess('ai', result)
        return
      }

      await uploadMedicalDocument(file, {
        category: 'prescription',
      })

      onSuccess('record')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to upload the prescription. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (loading) return

    setMode(null)
    setFile(null)
    setError('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prescription-upload-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2
              id="prescription-upload-title"
              className="text-xl font-bold text-slate-900"
            >
              Upload Prescription
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add a prescription to your HealP health vault.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close upload dialog"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-6">

          {/* MODE SELECTION */}

          {!mode ? (
            <>
              <p className="text-sm font-medium text-slate-700">
                How would you like to process your prescription?
              </p>

              <button
                type="button"
                onClick={() => setMode('ai')}
                className="group flex w-full items-start gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:border-primary-400 hover:bg-primary-50/40"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <Sparkles size={23} />
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 group-hover:text-primary-700">
                    Analyze with AI
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Extract medicine names, prescription instructions
                    and other readable details. Review the AI results
                    before relying on them.
                  </p>

                  <p className="mt-2 text-xs font-medium text-primary-600">
                    JPEG and PNG images only
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('record')}
                className="group flex w-full items-start gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:border-emerald-400 hover:bg-emerald-50/40"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FolderPlus size={23} />
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 group-hover:text-emerald-700">
                    Save to Medical Records Only
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Store your original prescription securely in
                    Reports & Documents without AI processing.
                  </p>

                  <p className="mt-2 text-xs font-medium text-emerald-600">
                    PDF, JPEG and PNG supported
                  </p>
                </div>
              </button>
            </>
          ) : (
            <>
              {/* SELECTED MODE */}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {mode === 'ai' ? (
                    <Sparkles size={19} className="text-primary-600" />
                  ) : (
                    <FolderPlus size={19} className="text-emerald-600" />
                  )}

                  <span className="text-sm font-semibold text-slate-800">
                    {mode === 'ai'
                      ? 'AI Prescription Analysis'
                      : 'Medical Record Upload'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-primary-600 disabled:opacity-50"
                >
                  <ArrowLeft size={14} />
                  Change option
                </button>
              </div>

              {/* FILE INPUT */}

              <input
                ref={fileInputRef}
                type="file"
                accept={
                  mode === 'ai'
                    ? 'image/jpeg,image/png'
                    : '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'
                }
                className="hidden"
                onChange={(event) =>
                  handleFileSelection(event.target.files?.[0])
                }
              />

              {!file ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center transition hover:border-primary-400 hover:bg-primary-50/30"
                >
                  <Upload size={28} className="text-primary-600" />

                  <span className="mt-3 text-sm font-semibold text-slate-800">
                    Choose prescription file
                  </span>

                  <span className="mt-1 text-xs text-slate-500">
                    Maximum file size: 10 MB
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  {file.type === 'application/pdf' ? (
                    <FileText size={25} className="shrink-0 text-red-500" />
                  ) : (
                    <FileImage size={25} className="shrink-0 text-primary-600" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    disabled={loading}
                    aria-label="Remove selected file"
                    className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-red-500 disabled:opacity-50"
                  >
                    <X size={17} />
                  </button>
                </div>
              )}

              {mode === 'ai' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  AI-generated prescription details may be incomplete
                  or incorrect. Always verify medicines and instructions
                  with your doctor or pharmacist.
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => void handleUpload()}
                disabled={!file || loading}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  mode === 'ai'
                    ? 'bg-primary-600 hover:bg-primary-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {mode === 'ai' ? 'Analyzing...' : 'Uploading...'}
                  </>
                ) : (
                  <>
                    {mode === 'ai' ? (
                      <Sparkles size={18} />
                    ) : (
                      <Upload size={18} />
                    )}

                    {mode === 'ai'
                      ? 'Upload and Analyze'
                      : 'Save to Medical Records'}
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* FOOTER */}

        <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 text-xs text-slate-500">
          <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
          Your prescription is stored in your private medical records.
        </div>
      </div>
    </div>
  )
}

export default PrescriptionUploadDialog
