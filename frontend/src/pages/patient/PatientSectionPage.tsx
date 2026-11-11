
import { usePageTitle } from '../../hooks/usePageTitle'
import { HeartPulse } from 'lucide-react'

import Badge from '../../components/common/Badge'
import PageContainer from '../../components/common/PageContainer'

import AIChatAssistant from '../../components/patient/AIChatAssistant'
import PrescriptionReader from '../../components/patient/PrescriptionReader'
import MedicalSummary from '../../components/patient/MedicalSummary'
import MedicineAssistant from '../../components/patient/MedicineAssistant'
import SymptomChecker from '../../components/patient/SymptomChecker'

import PatientProfilePage from './PatientProfilePage'
import PatientHealthPage from './PatientHealthPage'
import PatientReportsPage from './PatientReportsPage'

import NearbyHealthcareDiscovery from '../../components/patient/NearbyHealthcareDiscovery'

export type PatientSection =
  | 'health'
  | 'ai'
  | 'ai-summary'
  | 'ai-chat'
  | 'ai-medicine'
  | 'ai-symptoms'
  | 'ai-prescriptions'
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
  const sectionTitles: Record<PatientSection, string> = {
    health: 'My Health',
    ai: 'AI Health Assistant',
    'ai-summary': 'AI Medical Summary',
    'ai-chat': 'AI Chat Assistant',
    'ai-medicine': 'Medicine Assistant',
    'ai-symptoms': 'Symptom Checker',
    'ai-prescriptions': 'Prescription Reader',
    reports: 'Reports & Documents',
    profile: 'My Profile',
    hospitals: 'Nearby Hospitals',
    pharmacies: 'Nearby Pharmacies',
    bloodBanks: 'Nearby Blood Banks',
    diagnostics: 'Diagnostic Centers',
  }
  usePageTitle(sectionTitles[section] ?? 'Patient Portal')

  // Patient profile
  if (section === 'profile') {
    return <PatientProfilePage />
  }

  // Medical history
  if (section === 'health') {
    return <PatientHealthPage />
  }

  // Reports and documents
  if (section === 'reports') {
    return <PatientReportsPage />
  }

  // AI Medical Summary
  if (section === 'ai-summary') {
    return (
      <PageContainer size="full">
        <div className="mt-6">
          <MedicalSummary />
        </div>
      </PageContainer>
    )
  }

  // AI Chat Assistant
  if (section === 'ai-chat') {
    return (
      <PageContainer size="full">
        <div className="mt-6">
          <AIChatAssistant />
        </div>
      </PageContainer>
    )
  }

  // AI Medicine Assistant
  if (section === 'ai-medicine') {
    return (
      <PageContainer size="full">
        <div className="mt-6">
          <MedicineAssistant />
        </div>
      </PageContainer>
    )
  }

  // AI Symptom Checker
  if (section === 'ai-symptoms') {
    return (
      <PageContainer size="full">
        <div className="mt-6">
          <SymptomChecker />
        </div>
      </PageContainer>
    )
  }

  // AI Prescription Reader
  if (section === 'ai-prescriptions') {
    return (
      <PageContainer size="full">
        <div className="mt-6">
          <PrescriptionReader />
        </div>
      </PageContainer>
    )
  }

  // Legacy AI route: show Medical Summary instead of the old combined page.
  if (section === 'ai') {
    return (
      <PageContainer size="full">
        <div className="mt-6">
          <MedicalSummary />
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
