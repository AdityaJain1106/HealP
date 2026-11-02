
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
import NearbyHealthcareDiscovery from '../../components/patient/NearbyHealthcareDiscovery'

type PatientSection =
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

const sectionConfig = {
  health: {
    title: 'My Health',
    description: 'Your complete digital medical history and health timeline.',
    icon: Activity,
    badge: 'Health Records',
    message: 'Your medical timeline will appear here.',
    detail:
      'Consultations, diagnoses, surgeries, allergies and vaccination history.',
  },

  ai: {
    title: 'AI Health Assistant',
    description: 'AI-powered assistance for understanding your health information.',
    icon: Bot,
    badge: 'AI Assistant',
    message: 'Your AI health tools will appear here.',
    detail:
      'Prescription reader, medical summaries, medicine assistant and health chat.',
  },

  reports: {
    title: 'Reports & Documents',
    description: 'Manage your prescriptions and medical documents.',
    icon: FileText,
    badge: 'Medical Documents',
    message: 'Your uploaded documents will appear here.',
    detail:
      'Blood reports, prescriptions, MRI, CT scans, X-rays and medical certificates.',
  },

  profile: {
    title: 'My Profile',
    description: 'Manage your personal and medical information.',
    icon: UserRound,
    badge: 'Health Profile',
    message: 'Your personal health profile will appear here.',
    detail:
      'Personal details, blood group, allergies, emergency contacts and insurance information.',
  },

  hospitals: {
    title: 'Find Hospitals',
    description: 'Explore hospitals and healthcare facilities.',
    icon: Hospital,
    badge: 'Hospital Discovery',
    message: 'Discover hospitals around you.',
    detail:
      'Find hospitals, explore healthcare facilities and access important hospital information.',
  },

  pharmacies: {
    title: 'Find Pharmacies',
    description: 'Locate pharmacies for your medication needs.',
    icon: Pill,
    badge: 'Pharmacy Discovery',
    message: 'Discover pharmacies around you.',
    detail:
      'Explore nearby pharmacies and find places where you can access medicines and healthcare essentials.',
  },

  bloodBanks: {
    title: 'Find Blood Banks',
    description: 'Discover blood banks and donation centers.',
    icon: Droplets,
    badge: 'Blood Bank Discovery',
    message: 'Find blood banks and donation centers.',
    detail:
      'Explore blood banks, discover donation centers and access important blood donation information.',
  },

  diagnostics: {
    title: 'Diagnostic Centers',
    description: 'Find laboratories and medical testing facilities.',
    icon: FlaskConical,
    badge: 'Diagnostic Discovery',
    message: 'Discover diagnostic centers around you.',
    detail:
      'Explore diagnostic laboratories and testing facilities for blood tests, scans and other medical investigations.',
  },
} satisfies Record<
  PatientSection,
  {
    title: string
    description: string
    icon: typeof Activity
    badge: string
    message: string
    detail: string
  }
>

const serviceCategories = [
  'hospitals',
  'pharmacies',
  'bloodBanks',
  'diagnostics',
] as const

function PatientSectionPage({
  section,
}: PatientSectionPageProps) {
  const config = sectionConfig[section]
  const Icon = config.icon

  const isService = (
    serviceCategories as readonly string[]
  ).includes(section)

  return (
    <PageContainer size="full">
      <div className="mb-8">
        <Badge variant="success" dot>
          {config.badge}
        </Badge>

        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          {config.title}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {config.description}
        </p>
      </div>

      {isService ? (
        <NearbyHealthcareDiscovery
          category={section as (
            typeof serviceCategories
          )[number]}
        />
      ) : (
        <Card padding="lg" className="max-w-3xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            <Icon size={28} />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-slate-900">
            {config.message}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {config.detail}
          </p>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <HeartPulse size={18} className="text-primary-600" />
              HealP Healthcare Workspace
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              This section is being developed. Your actual healthcare
              information will be connected after the database and
              authentication layers are implemented.
            </p>
          </div>
        </Card>
      )}
    </PageContainer>
  )
}

export default PatientSectionPage
