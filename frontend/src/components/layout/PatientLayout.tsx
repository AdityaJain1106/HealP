
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import PatientSidebar from './PatientSidebar'
import PatientTopbar from './PatientTopbar'

function PatientLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const openMobileMenu = () => {
    setMobileMenuOpen(true)
  }

  // Close drawer whenever the user presses Escape.
  useEffect(() => {
    if (!mobileMenuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMobileMenu()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileMenuOpen])

  // Prevent background scrolling while mobile navigation is open.
  useEffect(() => {
    if (!mobileMenuOpen) return

    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileMenuOpen])

  return (
    <div className="relative isolate min-h-screen bg-background">

      {/* FIXED DESKTOP SIDEBAR */}

      <PatientSidebar />

      {/* MOBILE NAVIGATION DRAWER */}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[9999] lg:hidden">

          {/* BACKDROP */}

          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMobileMenu}
            className="absolute inset-0 z-0 bg-slate-950/40 backdrop-blur-[2px]"
          />

          {/* DRAWER */}

          <div
            className="absolute inset-y-0 left-0 z-10 animate-in slide-in-from-left duration-200"
            role="dialog"
            aria-modal="true"
            aria-label="Patient navigation menu"
          >
            <PatientSidebar
              mobile
              onClose={closeMobileMenu}
            />
          </div>

        </div>
      )}

      {/* MAIN APPLICATION AREA */}

      <div className="relative z-0 min-w-0 lg:ml-64">

        <PatientTopbar
          patientName="Patient"
          onMenuClick={openMobileMenu}
        />

        <main className="relative z-0 min-w-0">
          <Outlet />
        </main>

      </div>
    </div>
  )
}

export default PatientLayout
