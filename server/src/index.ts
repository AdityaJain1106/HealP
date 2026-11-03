
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import medicalSummaryRoutes from './routes/medicalSummaryRoutes.js'
import testRoutes from './routes/testRoutes.js'
import documentsRoutes from './routes/documentsRoutes.js'
import geminiRoutes from './routes/geminiRoutes.js'
import prescriptionRoutes from './routes/prescriptionRoutes.js'
import medicineAssistantRoutes from './routes/medicineAssistantRoutes.js'
import aiChatRoutes from './routes/aiChatRoutes.js'
import symptomCheckerRoutes from './routes/symptomCheckerRoutes.js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 5000

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json())
app.use('/api/symptom-checker', symptomCheckerRoutes)
app.use('/api/ai-chat', aiChatRoutes)
app.use('/api/medicine-assistant', medicineAssistantRoutes)
app.use('/api/medical-summary', medicalSummaryRoutes)
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'HealP backend is running!',
  })
})

app.use('/api/test', testRoutes)
app.use('/api/documents', documentsRoutes)
app.use('/api/gemini', geminiRoutes)
app.use('/api/prescriptions', prescriptionRoutes)

app.listen(PORT, () => {
  console.log(`HealP server running on port ${PORT}`)
})
