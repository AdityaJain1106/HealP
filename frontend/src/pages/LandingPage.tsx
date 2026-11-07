
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  FileHeart,
  BrainCircuit,
  Pill,
  FileText,
  MapPin,
  Activity,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  LockKeyhole,
  Clock3,
  Users,
  Sparkles,
  ChevronRight,
  HeartHandshake,
  ClipboardList,
  ScanLine,
  Mail,
  Send,
  MessageSquare,
} from 'lucide-react'
import { ROUTES } from '../routes/routePaths'

const features = [
  {
    icon: FileHeart,
    title: 'Digital Health Vault',
    description:
      'Keep your medical history, diagnoses, allergies and health records organized in one accessible place.',
    color: 'blue',
  },
  {
    icon: ScanLine,
    title: 'AI Prescription Reader',
    description:
      'Upload prescription images and get AI-assisted extraction of medicine names and written instructions.',
    color: 'violet',
  },
  {
    icon: BrainCircuit,
    title: 'AI Medical Summary',
    description:
      'Understand your recorded medical history through structured, easy-to-read health summaries.',
    color: 'emerald',
  },
  {
    icon: Pill,
    title: 'Medicine Assistant',
    description:
      'Explore educational information about medicine uses, precautions and common side effects.',
    color: 'amber',
  },
  {
    icon: FileText,
    title: 'Medical Reports',
    description:
      'Store, organize and access your prescriptions, blood reports, scans and other medical documents.',
    color: 'rose',
  },
  {
    icon: MapPin,
    title: 'Nearby Healthcare',
    description:
      'Discover nearby hospitals, pharmacies, blood banks and diagnostic centres.',
    color: 'cyan',
  },
]

const steps = [
  {
    number: '01',
    title: 'Create your account',
    description: 'Sign up securely and set up your personal health profile.',
  },
  {
    number: '02',
    title: 'Build your health vault',
    description: 'Upload reports, prescriptions and important medical records.',
  },
  {
    number: '03',
    title: 'Understand your health',
    description: 'Use AI-assisted tools to organize and understand your health information.',
  },
]

const colorStyles: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600',
  violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-600',
  emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600',
  amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-500',
  rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600',
  cyan: 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600',
}

function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [contactStatus, setContactStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const closeMobileMenu = () => setMobileMenuOpen(false)

  const handleContactSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (contactSubmitting) return

    const form = event.currentTarget
    const formData = new FormData(form)

    const payload = {
      name: String(formData.get('name') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      category: String(formData.get('category') ?? ''),
      message: String(formData.get('message') ?? '').trim(),
    }

    setContactSubmitting(true)
    setContactStatus(null)

    try {
      const apiBaseUrl = (
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
      ).replace(/\/+$/, '')

      const response = await fetch(`${apiBaseUrl}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message || 'Unable to send your message. Please try again.',
        )
      }

      form.reset()
      setContactStatus({
        type: 'success',
        message: result.message || 'Your message has been sent successfully!',
      })
    } catch (error) {
      console.error('Contact form submission error:', error)
      setContactStatus({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to send your message. Please try again later.',
      })
    } finally {
      setContactSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-white text-slate-900">
      {/* NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <HeartPulse size={25} />
            </div>
            <div>
              <span className="text-2xl font-extrabold tracking-tight">
                Heal<span className="text-blue-600">P</span>
              </span>
              <p className="-mt-1 text-[10px] font-medium tracking-widest text-slate-400">
                YOUR HEALTH COMPANION
              </p>
            </div>
          </a>

          <div className="hidden items-center gap-8 lg:flex">
            <a href="#home" className="text-sm font-medium text-slate-600 transition hover:text-blue-600">Home</a>
            <a href="#features" className="text-sm font-medium text-slate-600 transition hover:text-blue-600">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 transition hover:text-blue-600">How it works</a>
            <a href="#portals" className="text-sm font-medium text-slate-600 transition hover:text-blue-600">Portals</a>
            <a href="#about" className="text-sm font-medium text-slate-600 transition hover:text-blue-600">About</a>
            <a href="#contact" className="text-sm font-medium text-slate-600 transition hover:text-blue-600">Contact</a>
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to={ROUTES.LOGIN}
              className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Log in
            </Link>
            <Link
              to={ROUTES.LOGIN}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Get started <ArrowRight size={16} />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="border-t border-slate-100 bg-white px-5 py-5 shadow-xl lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-4">
              {[
                ['Home', '#home'],
                ['Features', '#features'],
                ['How it works', '#how-it-works'],
                ['Portals', '#portals'],
                ['About', '#about'],
                ['Contact', '#contact'],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  onClick={closeMobileMenu}
                  className="py-1 text-sm font-medium text-slate-600"
                >
                  {label}
                </a>
              ))}
              <Link
                to={ROUTES.LOGIN}
                onClick={closeMobileMenu}
                className="mt-2 rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white"
              >
                Get started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="home" className="relative overflow-hidden bg-[#F5F8FF]">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-[450px] w-[450px] rounded-full bg-emerald-100/50 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-2 lg:py-32">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm">
              <Sparkles size={15} />
              A smarter way to manage your health
            </div>

            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Your health journey.
              <span className="mt-2 block text-blue-600">
                All in one place.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Your medical records, prescriptions and health information,
              organized in one secure digital space — with intelligent
              tools to help you understand them better.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-7 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-1 hover:bg-blue-700"
              >
                Explore HealP <ArrowRight size={18} />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
              >
                Discover features <ChevronRight size={17} />
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-emerald-600" />
                Privacy-conscious design
              </span>
              <span className="flex items-center gap-2">
                <HeartPulse size={17} className="text-blue-600" />
                Patient-focused
              </span>
            </div>
          </div>

          {/* HERO VISUAL */}
          <div className="relative mx-auto w-full max-w-[510px]">
            <div className="absolute -inset-5 rounded-[40px] bg-gradient-to-br from-blue-200/60 to-emerald-100/60 blur-2xl" />

            <div className="relative rounded-[30px] border border-white bg-white p-5 shadow-2xl shadow-blue-900/10 sm:p-7">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Health overview
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    Your health space
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Activity size={25} />
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100">Digital Health Vault</p>
                    <h3 className="mt-2 text-2xl font-bold">One place.</h3>
                    <p className="mt-1 text-sm text-blue-100">
                      Your medical information, organized.
                    </p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                    <FileHeart size={30} />
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                    <BrainCircuit size={21} />
                  </div>
                  <p className="mt-4 text-sm font-bold text-slate-800">AI Health Tools</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Understand your health information</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <ClipboardList size={21} />
                  </div>
                  <p className="mt-4 text-sm font-bold text-slate-800">Medical Records</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Keep important documents together</p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600">
                  <ShieldCheck size={21} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Your health, organized</p>
                  <p className="mt-1 text-xs text-slate-500">Designed around your healthcare journey</p>
                </div>
                <CheckCircle2 className="ml-auto shrink-0 text-emerald-600" size={20} />
              </div>
            </div>

            <div className="absolute -left-7 top-20 hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Medical records</p>
                <p className="text-[11px] text-slate-400">In one place</p>
              </div>
            </div>

            <div className="absolute -right-5 bottom-20 hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <HeartHandshake size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Patient-first</p>
                <p className="text-[11px] text-slate-400">Healthcare experience</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-8 sm:px-8 md:grid-cols-4">
          {[
            [ShieldCheck, 'Privacy-conscious'],
            [FileHeart, 'Centralized records'],
            [BrainCircuit, 'AI-assisted tools'],
            [HeartHandshake, 'Patient-focused'],
          ].map(([Icon, label]) => {
            const ItemIcon = Icon as typeof ShieldCheck
            return (
              <div key={label as string} className="flex items-center justify-center gap-3 text-sm font-semibold text-slate-600">
                <ItemIcon size={21} className="text-blue-600" />
                {label as string}
              </div>
            )
          })}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-white px-5 py-24 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Everything connected
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Healthcare management, made simpler.
            </h2>
            <p className="mt-5 leading-7 text-slate-500">
              The tools you need to organize medical information and
              navigate your healthcare journey with greater clarity.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <article
                  key={feature.title}
                  className="group rounded-3xl border border-slate-100 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5"
                >
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition duration-300 group-hover:text-white ${colorStyles[feature.color]}`}>
                    <Icon size={27} />
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {feature.description}
                  </p>
                  <a
                    href="#portals"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600 transition group-hover:gap-3"
                  >
                    Explore HealP <ArrowRight size={16} />
                  </a>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-[#F6F8FC] px-5 py-24 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Simple by design
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Get started in three steps.
            </h2>
            <p className="mt-4 leading-7 text-slate-500">
              A simple way to bring your medical information together.
            </p>
          </div>

          <div className="relative mt-16 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.number} className="relative rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
                <span className="text-5xl font-black tracking-tight text-blue-100">
                  {step.number}
                </span>
                <h3 className="mt-6 text-xl font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {step.description}
                </p>
                {index !== 2 && (
                  <ArrowRight className="absolute -right-5 top-1/2 z-10 hidden -translate-y-1/2 text-blue-300 md:block" size={24} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PORTALS */}
      <section id="portals" className="bg-white px-5 py-24 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              One platform, two experiences
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Built for patients and doctors.
            </h2>
            <p className="mt-4 leading-7 text-slate-500">
              Dedicated experiences designed around different healthcare needs.
            </p>
          </div>

          <div className="mt-14 grid gap-7 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-blue-700 to-blue-500 p-8 text-white shadow-xl shadow-blue-900/10 sm:p-10">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border-[35px] border-white/10" />
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                  <HeartPulse size={30} />
                </div>
                <p className="mt-8 text-xs font-bold uppercase tracking-widest text-blue-100">
                  For individuals
                </p>
                <h3 className="mt-3 text-3xl font-extrabold">Patient Portal</h3>
                <p className="mt-4 max-w-md leading-7 text-blue-100">
                  Manage your health profile, maintain your medical history,
                  upload reports and explore AI-assisted health tools.
                </p>
                <ul className="mt-7 space-y-3 text-sm text-blue-50">
                  {['Personal health dashboard', 'Medical records and reports', 'AI-powered health tools'].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <CheckCircle2 size={17} /> {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to={ROUTES.LOGIN}
                  className="mt-9 inline-flex items-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-bold !text-blue-700 transition hover:bg-blue-50 hover:!text-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                >
                  Continue as Patient <ArrowRight size={17} />
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-emerald-700 to-emerald-500 p-8 text-white shadow-xl shadow-emerald-900/10 sm:p-10">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border-[35px] border-white/10" />
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                  <Stethoscope size={30} />
                </div>
                <p className="mt-8 text-xs font-bold uppercase tracking-widest text-emerald-100">
                  For healthcare professionals
                </p>
                <h3 className="mt-3 text-3xl font-extrabold">Doctor Portal</h3>
                <p className="mt-4 max-w-md leading-7 text-emerald-100">
                  Access authorized patient information, review medical
                  history and manage consultation records.
                </p>
                <ul className="mt-7 space-y-3 text-sm text-emerald-50">
                  {['Patient record access', 'Consultation management', 'Medical history summaries'].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <CheckCircle2 size={17} /> {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to={ROUTES.LOGIN}
                  className="mt-9 inline-flex items-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-bold !text-emerald-700 transition hover:bg-emerald-50 hover:!text-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                >
                  Continue as Doctor <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT / PRIVACY */}
      <section id="about" className="bg-[#F6F8FC] px-5 py-24 sm:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              The HealP approach
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              More clarity. Better organized healthcare.
            </h2>
            <p className="mt-5 leading-8 text-slate-600">
              Medical information can be scattered across hospitals,
              prescriptions and documents. HealP brings these records
              together and provides tools that help make them easier to
              access and understand.
            </p>
            <Link
              to={ROUTES.LOGIN}
              className="mt-8 inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700"
            >
              Get started with HealP <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [LockKeyhole, 'Privacy-conscious', 'Access controls designed to protect personal health information.'],
              [Clock3, 'Information at hand', 'Access your stored medical documents when you need them.'],
              [Users, 'Connected care', 'Patient and doctor experiences within one platform.'],
              [BrainCircuit, 'AI-assisted insights', 'Tools to help organize and explain health information.'],
            ].map(([Icon, title, description]) => {
              const ItemIcon = Icon as typeof ShieldCheck
              return (
                <div key={title as string} className="rounded-2xl border border-slate-100 bg-white p-6">
                  <ItemIcon className="text-blue-600" size={25} />
                  <h3 className="mt-4 font-bold text-slate-900">{title as string}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{description as string}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CONTACT US */}
      <section id="contact" className="scroll-mt-20 bg-white px-5 py-24 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Get in touch
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              We would love to hear from you.
            </h2>
            <p className="mt-5 leading-7 text-slate-500">
              Have a question, suggestion or feature idea? Send the HealP team a message.
              Your feedback helps us make the platform better.
            </p>
          </div>

          <div className="mt-14 grid gap-10 rounded-[30px] border border-slate-100 bg-[#F8FAFF] p-6 shadow-sm sm:p-10 lg:grid-cols-[0.85fr_1.15fr] lg:p-12">
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <MessageSquare size={27} />
                </div>
                <h3 className="mt-7 text-2xl font-bold text-slate-900">Let’s start a conversation.</h3>
                <p className="mt-4 leading-7 text-slate-500">
                  Whether you have feedback, need help or want to suggest a new feature,
                  we’re listening. Choose a topic and tell us what’s on your mind.
                </p>
              </div>
              <div className="mt-10 rounded-2xl border border-blue-100 bg-white p-5">
                <div className="flex items-center gap-3 text-blue-600">
                  <Mail size={20} />
                  <span className="text-sm font-bold">Email us</span>
                </div>
                <a href="mailto:aj149413@gmail.com" className="mt-2 inline-block break-all text-sm font-medium text-slate-700 hover:text-blue-600">
                  aj149413@gmail.com
                </a>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  The contact form opens your email application with your message prepared.
                </p>
              </div>
            </div>

            <form onSubmit={handleContactSubmit} className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Full name
                  <input name="name" type="text" required maxLength={80} placeholder="Your name" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Email address
                  <input name="email" type="email" required maxLength={254} placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
                </label>
              </div>
              <label className="mt-5 block text-sm font-semibold text-slate-700">
                What is this regarding?
                <select name="category" required defaultValue="" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100">
                  <option value="" disabled>Select a topic</option>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Suggestion">Suggestion</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label className="mt-5 block text-sm font-semibold text-slate-700">
                Your message
                <textarea name="message" required maxLength={2000} rows={5} placeholder="Tell us how we can help..." className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
              </label>
              {contactStatus && (
                <p
                  role="status"
                  aria-live="polite"
                  className={`mt-5 rounded-xl px-4 py-3 text-sm ${contactStatus.type === 'success'
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border border-red-200 bg-red-50 text-red-700'
                    }`}
                >
                  {contactStatus.message}
                </p>
              )}
              <button
                type="submit"
                disabled={contactSubmitting}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {contactSubmitting ? 'Sending...' : 'Send message'}
                <Send size={16} />
              </button>
              <p className="mt-4 text-xs leading-5 text-slate-400">
                Please do not include sensitive medical information in this contact form.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="border-y border-amber-100 bg-amber-50 px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-7xl gap-4">
          <ShieldCheck className="mt-1 shrink-0 text-amber-700" size={21} />
          <p className="text-xs leading-6 text-amber-900 sm:text-sm">
            <strong>Important health information:</strong> HealP's AI features
            provide educational assistance and help organize medical information.
            They are not a substitute for professional medical advice, diagnosis
            or treatment. Always consult a qualified healthcare professional
            for medical decisions. In an emergency, seek immediate medical care.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 px-5 pb-8 pt-16 text-white sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <a href="#home" className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
                  <HeartPulse size={24} />
                </div>
                <span className="text-2xl font-extrabold">
                  Heal<span className="text-blue-400">P</span>
                </span>
              </a>
              <p className="mt-5 max-w-xs text-sm leading-7 text-slate-400">
                Your centralized digital health record and intelligent
                healthcare companion.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck size={16} />
                Healthcare information, organized.
              </div>
            </div>

            <div>
              <h4 className="font-bold">Platform</h4>
              <div className="mt-5 flex flex-col gap-4 text-sm text-slate-400">
                <a href="#features" className="transition hover:text-white">Features</a>
                <a href="#how-it-works" className="transition hover:text-white">How it works</a>
                <a href="#portals" className="transition hover:text-white">Patient Portal</a>
                <a href="#portals" className="transition hover:text-white">Doctor Portal</a>
              </div>
            </div>

            <div>
              <h4 className="font-bold">Explore</h4>
              <div className="mt-5 flex flex-col gap-4 text-sm text-slate-400">
                <a href="#about" className="transition hover:text-white">About HealP</a>
                <a href="#features" className="transition hover:text-white">AI Health Assistant</a>
                <a href="#features" className="transition hover:text-white">Medical Records</a>
                <a href="#features" className="transition hover:text-white">Healthcare Discovery</a>
              </div>
            </div>

            <div>
              <h4 className="font-bold">Account & information</h4>
              <div className="mt-5 flex flex-col gap-4 text-sm text-slate-400">
                <Link to={ROUTES.LOGIN} className="transition hover:text-white">Log in / Sign up</Link>
                <a href="https://drive.google.com/file/d/1uuZD0CpmK_j6x0cjYvSN5opEeNB0_9j7/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">Privacy Policy</a>
                <a href="https://drive.google.com/file/d/11psmXFb81UzNsUUXpcWuffwyzcMJaGNn/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">Terms & Conditions</a>
                <a href="#contact" className="transition hover:text-white">Contact Us</a>
              </div>
            </div>
          </div>

          <div className="mt-9 border-t border-white/10 pt-7">
            <p className="max-w-3xl text-xs leading-6 text-slate-500">
              HealP provides tools to organize health information and educational AI assistance.
              It is not a substitute for professional medical advice, diagnosis or treatment.
            </p>
          </div>

          <div className="mt-2 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-7 text-xs text-slate-500 sm:flex-row">
            <p>© {new Date().getFullYear()} HealP. All rights reserved.</p>
            <p>Built to make healthcare information easier to manage.</p>
            <a href="#home" className="font-semibold text-slate-300 transition hover:text-white">
              Back to top ↑
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}

export default LandingPage
