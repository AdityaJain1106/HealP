
import {
  HeartPulse,
} from 'lucide-react'

import Badge from '../../components/common/Badge'
import PageContainer from '../../components/common/PageContainer'

import PrescriptionReader from '../../components/patient/PrescriptionReader'
import MedicalSummary from '../../components/patient/MedicalSummary'
import PatientProfilePage from './PatientProfilePage'
import PatientHealthPage from './PatientHealthPage'
import PatientReportsPage from './PatientReportsPage'

import NearbyHealthcareDiscovery from '../../components/patient/NearbyHealthcareDiscovery'

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

const healthcareSectionConfig = {
  hospitals: {
    title: 'Nearby Hospitals',
    description: 'Find nearby hospitals and healthcare facilities.',
  },
  pharmacies: {
    title: 'Nearby Pharmacies',
    description: 'Locate pharmacies for your medication needs.',
  },
  bloodBanks: {
    title: 'Nearby Blood Banks',
    description: 'Discover blood banks and donation centers.',
  },
  diagnostics: {
    title: 'Diagnostic Centers',
    description: 'Find laboratories and testing facilities.',
  },
}

function PatientSectionPage({ section }: PatientSectionPageProps) {
  if (section === 'profile') {
    return <PatientProfilePage />
  }

  if (section === 'health') {
    return <PatientHealthPage />
  }

  if (section === 'reports') {
    return <PatientReportsPage />
  }

  // AI Health Assistant
  if (section === 'ai') {
    return (
      <PageContainer size="full">
        <div className="mb-8">
          <Badge variant="success" dot>
            AI Assistant
          </Badge>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            AI Health Assistant
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Understand your health records and prescriptions with AI assistance.
          </p>
        </div>

        <div className="space-y-8">
          <MedicalSummary />

          <div>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                AI Prescription Reader
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Extract and review information from your prescription images.
              </p>
            </div>

            <PrescriptionReader />
          </div>
        </div>
      </PageContainer>
    )
  }

  // Nearby healthcare services
  const isHealthcareService =
    section === 'hospitals' ||
    section === 'pharmacies' ||
    section === 'bloodBanks' ||
    section === 'diagnostics'

  if (isHealthcareService) {
    const config = healthcareSectionConfig[section]

    return (
      <PageContainer size="full">
        <div className="mb-8">
          <Badge variant="success" dot>
            Healthcare Services
          </Badge>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            {config.title}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {config.description}
          </p>
        </div>

        <div className="mb-5 flex items-center gap-2 text-sm text-slate-500">
          <HeartPulse size={18} className="text-primary-600" />
          HealP Healthcare Discovery
        </div>

        <NearbyHealthcareDiscovery category={section} />
      </PageContainer>
    )
  }

  return null
}

export default PatientSectionPage
