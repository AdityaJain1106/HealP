
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Upload,
  FileText,
  FileImage,
  Trash2,
  Search,
  Plus,
  X,
  Loader2,
  Eye,
  CalendarDays,
  Building2,
  UserRound,
  FileCheck2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

import {
  uploadMedicalDocument,
  getMedicalDocuments,
  getDocumentDownloadUrl,
  deleteMedicalDocument,
} from '../../services/documentService'

import type {
  MedicalDocument,
  DocumentCategory,
} from '../../services/documentService'
import { usePageTitle } from '../../hooks/usePageTitle'

const categories: { value: DocumentCategory; label: string }[] = [
  { value: 'prescription', label: 'Prescriptions' },
  { value: 'blood_report', label: 'Blood Reports' },
  { value: 'mri', label: 'MRI Scans' },
  { value: 'ct_scan', label: 'CT Scans' },
  { value: 'x_ray', label: 'X-Rays' },
  { value: 'ecg', label: 'ECG Reports' },
  { value: 'medical_certificate', label: 'Medical Certificates' },
  { value: 'other', label: 'Other Documents' },
]

const MAX_FILE_SIZE = 10 * 1024 * 1024

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDate(date?: string) {
  if (!date) return 'Date not specified'

  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getCategoryLabel(category: DocumentCategory) {
  return categories.find((item) => item.value === category)?.label ?? 'Other'
}

function PatientReportsPage() {
  usePageTitle('Reports & Documents')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [documents, setDocuments] = useState<MedicalDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const [showUploadForm, setShowUploadForm] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [category, setCategory] = useState<DocumentCategory>('other')
  const [hospital, setHospital] = useState('')
  const [doctor, setDoctor] = useState('')
  const [documentDate, setDocumentDate] = useState('')
  const [dragging, setDragging] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const result = await getMedicalDocuments()
      setDocuments(result)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load your documents.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDocuments()
  }, [loadDocuments])

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        document.category === selectedCategory

      const searchText = search.toLowerCase()

      const matchesSearch =
        document.originalName.toLowerCase().includes(searchText) ||
        document.hospital?.toLowerCase().includes(searchText) ||
        document.doctor?.toLowerCase().includes(searchText) ||
        getCategoryLabel(document.category).toLowerCase().includes(searchText)

      return matchesCategory && matchesSearch
    })
  }, [documents, search, selectedCategory])

  function resetUploadForm() {
    setSelectedFile(null)
    setCategory('other')
    setHospital('')
    setDoctor('')
    setDocumentDate('')
    setShowUploadForm(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function validateFile(file: File): boolean {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
    ]

    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF, JPEG and PNG files are supported.')
      return false
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File size cannot exceed 10 MB.')
      return false
    }

    setError('')
    setSelectedFile(file)
    return true
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedFile) {
      setError('Please select a document first.')
      return
    }

    try {
      setUploading(true)
      setError('')
      setSuccess('')

      await uploadMedicalDocument(selectedFile, {
        category,
        hospital: hospital.trim() || undefined,
        doctor: doctor.trim() || undefined,
        documentDate: documentDate || undefined,
      })

      resetUploadForm()
      await loadDocuments()

      setSuccess('Your medical document was uploaded successfully.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Document upload failed. Please try again.'
      )
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(document: MedicalDocument) {
    try {
      setDownloadingId(document.id)
      setError('')

      const url = await getDocumentDownloadUrl(document.id)

      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to open this document.'
      )
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleDelete(document: MedicalDocument) {
    const confirmed = window.confirm(
      `Permanently delete "${document.originalName}"? This cannot be undone.`
    )

    if (!confirmed) return

    try {
      setDeletingId(document.id)
      setError('')
      setSuccess('')

      await deleteMedicalDocument(document.id)

      setDocuments((previous) =>
        previous.filter((item) => item.id !== document.id)
      )

      setSuccess('Document deleted successfully.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete this document.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  const totalSize = documents.reduce(
    (total, document) => total + document.fileSize,
    0
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 pb-10 pt-6">
      {/* Notifications */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <p className="flex-1">{error}</p>
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <FileCheck2 size={18} />
          <p className="flex-1">{success}</p>
          <button
            type="button"
            onClick={() => setSuccess('')}
            aria-label="Dismiss success"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Overview cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <FileText size={21} />
            </div>
            <span className="text-xs font-medium text-slate-400">All records</span>
          </div>
          <p className="mt-4 text-2xl font-bold text-slate-900">
            {documents.length}
          </p>
          <p className="mt-1 text-sm text-slate-500">Total documents</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <FileCheck2 size={21} />
            </div>
            <span className="text-xs font-medium text-slate-400">Available</span>
          </div>
          <p className="mt-4 text-2xl font-bold text-slate-900">
            {documents.filter((item) => item.category === 'prescription').length}
          </p>
          <p className="mt-1 text-sm text-slate-500">Prescriptions</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <Upload size={21} />
            </div>
            <span className="text-xs font-medium text-slate-400">Storage used</span>
          </div>
          <p className="mt-4 text-2xl font-bold text-slate-900">
            {formatFileSize(totalSize)}
          </p>
          <p className="mt-1 text-sm text-slate-500">Across your documents</p>
        </div>
      </div>

      {/* Upload form */}
      {showUploadForm && (
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Upload Medical Document
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Add a new document to your digital health vault.
              </p>
            </div>

            <button
              type="button"
              onClick={resetUploadForm}
              disabled={uploading}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Close upload form"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleUpload} className="space-y-5">
            {/* File selection */}
            <div
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragging(false)

                const file = event.dataTransfer.files[0]
                if (file) validateFile(file)
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-7 text-center transition ${
                dragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) validateFile(file)
                }}
              />

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Upload size={23} />
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-800">
                Drag and drop your file here, or{' '}
                <span className="text-blue-600">browse</span>
              </p>

              <p className="mt-2 text-xs text-slate-500">
                PDF, JPG or PNG · Maximum file size 10 MB
              </p>

              {selectedFile && (
                <div className="mx-auto mt-4 flex max-w-md items-center gap-3 rounded-xl border border-blue-100 bg-white p-3 text-left">
                  <FileText className="shrink-0 text-blue-600" size={22} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setSelectedFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                    aria-label="Remove selected file"
                  >
                    <X size={17} />
                  </button>
                </div>
              )}
            </div>

            {/* Metadata fields */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Document Category *
                </label>
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as DocumentCategory)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  {categories.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Document Date
                </label>
                <input
                  type="date"
                  value={documentDate}
                  onChange={(event) => setDocumentDate(event.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Hospital / Clinic
                </label>
                <input
                  value={hospital}
                  onChange={(event) => setHospital(event.target.value)}
                  placeholder="Enter hospital name"
                  maxLength={150}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Doctor Name
                </label>
                <input
                  value={doctor}
                  onChange={(event) => setDoctor(event.target.value)}
                  placeholder="Enter doctor's name"
                  maxLength={150}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
              <button
                type="button"
                onClick={resetUploadForm}
                disabled={uploading}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={17} />
                    Upload Document
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search documents, hospitals or doctors..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 sm:min-w-48"
            >
              <option value="all">All Categories</option>
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void loadDocuments()}
              disabled={loading}
              className="rounded-xl border border-slate-200 p-3 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              title="Refresh documents"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Document list */}
      <div>
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Your Documents
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredDocuments.length} document
              {filteredDocuments.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setError('')
              setSuccess('')
              setShowUploadForm(true)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Upload Document
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
            <Loader2 size={30} className="animate-spin text-blue-600" />
            <p className="mt-4 text-sm text-slate-500">
              Loading your medical documents...
            </p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FileText size={30} />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-slate-900">
              {documents.length === 0
                ? 'Your health vault is empty'
                : 'No matching documents'}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {documents.length === 0
                ? 'Upload your first prescription, medical report or scan to keep your health records organized.'
                : 'Try changing your search or selecting a different category.'}
            </p>

            {documents.length === 0 && (
              <button
                type="button"
                onClick={() => setShowUploadForm(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={17} />
                Upload First Document
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    {document.mimeType === 'application/pdf' ? (
                      <FileText size={24} />
                    ) : (
                      <FileImage size={24} />
                    )}
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {getCategoryLabel(document.category)}
                  </span>
                </div>

                <h3
                  className="mt-4 truncate text-base font-semibold text-slate-900"
                  title={document.originalName}
                >
                  {document.originalName}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  {formatFileSize(document.fileSize)} ·{' '}
                  {document.mimeType === 'application/pdf' ? 'PDF' : 'Image'}
                </p>

                <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CalendarDays size={15} className="shrink-0" />
                    <span>
                      Document date: {formatDate(document.documentDate)}
                    </span>
                  </div>

                  {document.hospital && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Building2 size={15} className="shrink-0" />
                      <span className="truncate">{document.hospital}</span>
                    </div>
                  )}

                  {document.doctor && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <UserRound size={15} className="shrink-0" />
                      <span className="truncate">{document.doctor}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Upload size={14} />
                    Uploaded {formatDate(document.uploadedAt)}
                  </div>
                </div>

                <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => void handleDownload(document)}
                    disabled={downloadingId === document.id}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                  >
                    {downloadingId === document.id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Eye size={15} />
                    )}
                    View / Download
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleDelete(document)}
                    disabled={deletingId === document.id}
                    className="rounded-lg border border-red-100 px-3 py-2.5 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                    title="Delete document"
                    aria-label={`Delete ${document.originalName}`}
                  >
                    {deletingId === document.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security note */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
        <FileCheck2 size={20} className="mt-0.5 shrink-0 text-blue-600" />
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Your documents are stored privately
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            HealP uses authenticated access and temporary download links
            for your medical documents. Never share your login credentials
            or temporary document links with others.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PatientReportsPage
