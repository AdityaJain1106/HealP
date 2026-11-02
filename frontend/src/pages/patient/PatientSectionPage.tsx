import {
  Activity,
  Bot,
  FileText,
  UserRound,
  HeartPulse,
  Hospital,
  Pill,
  Droplets,
  FlaskConical,
} from 'lucide-react'

import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import PageContainer from '../../components/common/PageContainer'
import PatientProfilePage from './PatientProfilePage'

export type PatientSection =
  | 'health'
  | 'ai'
  | 'reports'
  | 'profile'
  | 'hospitals'
  | 'pharmacies'
  | 'bloodBanks'
  | 'diagnostics'

interface PatientSectionPageProps {
  section: PatientSection
}

const sectionConfig: Record<
  PatientSection,
  {
    title: string
    description: string
    icon: typeof Activity
    badge: string
    message: string
    detail: string
  }
> = {
  health: {
    title: 'My Health',
    description: 'Your complete digital medical history and health timeline.',
    icon: HeartPulse,
    badge: 'Health Records',
    message: 'Your medical timeline will appear here.',
    detail: 'Consultations, diagnoses, surgeries, allergies and vaccination history.',
  },
  ai: {
    title: 'AI Health Assistant',
    description: 'AI-powered assistance for understanding your health information.',
    icon: Bot,
    badge: 'AI Assistant',
    message: 'Your AI health tools will appear here.',
    detail: 'Prescription reader, medical summaries, medicine assistant and health chat.',
  },
  reports: {
    title: 'Reports & Documents',
    description: 'Manage your prescriptions and medical documents.',
    icon: FileText,
    badge: 'Medical Documents',
    message: 'Your uploaded documents will appear here.',
    detail: 'Blood reports, prescriptions, MRI, CT scans, X-rays and medical certificates.',
  },
  profile: {
    title: 'My Profile',
    description: 'Manage your personal and medical information.',
    icon: UserRound,
    badge: 'Health Profile',
    message: 'Your personal health profile will appear here.',
    detail: 'Personal details, blood group, allergies, emergency contacts and insurance information.',
  },
  hospitals: {
    title: 'Nearby Hospitals',
    description: 'Find nearby hospitals and healthcare facilities.',
    icon: Hospital,
    badge: 'Healthcare Services',
    message: 'Nearby hospitals',
    detail: 'Explore nearby hospitals using the healthcare discovery map on your dashboard.',
  },
  pharmacies: {
    title: 'Nearby Pharmacies',
    description: 'Locate pharmacies for your medication needs.',
    icon: Pill,
    badge: 'Healthcare Services',
    message: 'Nearby pharmacies',
    detail: 'Explore nearby pharmacies using the healthcare discovery map on your dashboard.',
  },
  bloodBanks: {
    title: 'Nearby Blood Banks',
    description: 'Discover blood banks and donation centers.',
    icon: Droplets,
    badge: 'Healthcare Services',
    message: 'Nearby blood banks',
    detail: 'Explore nearby blood banks using the healthcare discovery map on your dashboard.',
  },
  diagnostics: {
    title: 'Diagnostic Centers',
    description: 'Find laboratories and testing facilities.',
    icon: FlaskConical,
    badge: 'Healthcare Services',
    message: 'Nearby diagnostic centers',
    detail: 'Explore nearby diagnostic centers using the healthcare discovery map on your dashboard.',
  },
}

function PatientSectionPage({ section }: PatientSectionPageProps) {
  if (section === 'profile') {
    return <PatientProfilePage />
  }

  const config = sectionConfig[section]
  const Icon = config.icon
  const isHealthcareService =
    section === 'hospitals' ||
    section === 'pharmacies' ||
    section === 'bloodBanks' ||
    section === 'diagnostics'

  return (
    <PageContainer size="full">
      <div className="mb-8">
        <Badge variant="success" dot>{config.badge}</Badge>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">{config.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{config.description}</p>
      </div>

      <Card padding="lg" className="max-w-3xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
          <Icon size={28} />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-slate-900">{config.message}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{config.detail}</p>

        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <HeartPulse size={18} className="text-primary-600" />
            HealP Healthcare Workspace
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {isHealthcareService
              ? 'Healthcare discovery is available from the Nearby Healthcare Discovery section on your patient dashboard.'
              : 'This section is being developed. Your healthcare information will be connected as its features are implemented.'}
          </p>
        </div>
      </Card>
    </PageContainer>
  )
}

export default PatientSectionPage
