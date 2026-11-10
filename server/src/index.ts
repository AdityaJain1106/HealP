
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import doctorAccessRoutes from './routes/doctorAccessRoutes.js'
import medicalSummaryRoutes from './routes/medicalSummaryRoutes.js'
import testRoutes from './routes/testRoutes.js'
import documentsRoutes from './routes/documentsRoutes.js'
import geminiRoutes from './routes/geminiRoutes.js'
import prescriptionRoutes from './routes/prescriptionRoutes.js'
import medicineAssistantRoutes from './routes/medicineAssistantRoutes.js'
import aiChatRoutes from './routes/aiChatRoutes.js'
import symptomCheckerRoutes from './routes/symptomCheckerRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import patientAccessRoutes from './routes/patientAccessRoutes.js'
import doctorPrescriptionRoutes from './routes/doctorPrescriptionRoutes.js'
import patientPrescriptionRoutes from './routes/patientPrescriptionRoutes.js'
import doctorPrescriptionInboxRoutes from './routes/doctorPrescriptionInboxRoutes.js'
import doctorProfileRoutes from './routes/doctorProfileRoutes.js'
import patientAppointmentRoutes from './routes/patientAppointmentRoutes.js'
import doctorAppointmentRoutes from './routes/doctorAppointmentRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 5000

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json())

// Public contact form
app.use('/api/contact', contactRoutes)

// AI routes
app.use('/api/symptom-checker', symptomCheckerRoutes)
app.use('/api/ai-chat', aiChatRoutes)
app.use('/api/medicine-assistant', medicineAssistantRoutes)
app.use('/api/medical-summary', medicalSummaryRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'HealP backend is running!',
  })
})

// Other routes
app.use('/api/test', testRoutes)
app.use('/api/documents', documentsRoutes)
app.use('/api/gemini', geminiRoutes)
app.use('/api/prescriptions', prescriptionRoutes)

// Patient routes
app.use('/api/patient', patientAccessRoutes)
app.use('/api/patient', patientPrescriptionRoutes)
app.use('/api/patient', patientAppointmentRoutes)

// Doctor routes
app.use('/api/doctor', doctorAccessRoutes)
app.use('/api/doctor', doctorPrescriptionRoutes)
app.use('/api/doctor', doctorPrescriptionInboxRoutes)
app.use('/api/doctor', doctorAppointmentRoutes)
app.use('/api/doctor', doctorProfileRoutes)

// Admin routes
app.use('/api/admin', adminRoutes)

app.listen(PORT, () => {
  console.log(`HealP server running on port ${PORT}`)
})
