
# 🏥 HealP – AI-Powered Digital Health Record & Medical Assistant

<p align="center">
  <strong>Your Health, Digitally Connected.</strong>
  <br />
  An intelligent healthcare ecosystem connecting patients, doctors, and AI.
</p>

---

## 📌 About HealP

**HealP** is an AI-powered digital healthcare platform designed to simplify medical record management and improve collaboration between patients and healthcare professionals.

Traditional healthcare systems often suffer from fragmented medical records, paper-based prescriptions, inefficient communication, and difficulties understanding medical information.

HealP addresses these challenges by bringing digital health records, AI-powered medical assistance, secure document management, and doctor-patient collaboration together in one unified platform.

With the integration of Google's Gemini AI, HealP transforms complex medical information into understandable insights, helping patients better understand their health records and enabling doctors to access organized patient histories.

## ✨ Key Features

### 👤 Patient Portal

- **Personalized Dashboard:** Centralized overview of personal health information.
- **Digital Health Records:** Maintain and organize medical history in one place.
- **Medical Timeline:** Access previous consultations, diagnoses, medicines, and treatments.
- **Document Management:** Upload, view, download, share, and manage medical reports.
- **Health Profile:** Manage personal details, blood group, allergies, medical conditions, and emergency information.
- **Nearby Healthcare Services:** Discover nearby hospitals, pharmacies, blood banks, clinics, and diagnostic centers.
- **PDF Export:** Generate downloadable medical history records.

### 👨‍⚕️ Doctor Portal

- **Doctor Dashboard:** Dedicated workspace for healthcare professionals.
- **Patient Search:** Find patients and access authorized medical information.
- **Patient Medical History:** Review patient profiles, consultations, and uploaded documents.
- **Consultation Management:** Maintain diagnoses, prescriptions, notes, and follow-up information.
- **Medical Record Updates:** Keep patient records updated through doctor interactions.
- **AI-Assisted Insights:** Access AI-generated summaries to understand patient histories efficiently.

### 🤖 AI Health Assistant

HealP integrates Google's Gemini AI to provide five intelligent healthcare assistance features.

| Feature | Description |
|---|---|
| AI Prescription Reader | Interprets prescription images and extracts medicine details, dosage, schedules, and warnings. |
| AI Medical Summary | Generates simplified summaries of medical history, diseases, treatments, and recent consultations. |
| Medicine Assistant | Explains medicine uses, side effects, precautions, food interactions, and other relevant information. |
| AI Chat Assistant | Provides conversational assistance regarding medical reports, prescriptions, medicines, and general healthcare. |
| Symptom Checker | Analyzes entered symptoms and provides possible conditions, preventive measures, and doctor recommendations. |

**AI Processing Workflow:**

1. User uploads a prescription or medical document.
2. OCR and AI processing extract relevant information.
3. Gemini analyzes the extracted medical information.
4. Structured medical insights are generated.
5. Results are displayed through the HealP interface.

### 🗺️ Nearby Healthcare Discovery

- Interactive maps using Leaflet and OpenStreetMap.
- Nearby healthcare facility discovery using the Overpass API.
- Browser-based geolocation.
- Search for hospitals, pharmacies, blood banks, and diagnostic centers.
- Distance-based facility sorting.
- Directions to healthcare facilities.

### 🔐 Security & Authentication

- Firebase Authentication.
- Email and password authentication.
- Google authentication.
- Role-based access for patients and doctors.
- Firebase Admin SDK for backend authentication and authorization.
- Patient-controlled doctor authorization workflow.
- Secure cloud-based medical document management.

---

## 🛠️ Technology Stack

### Frontend
- React.js
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- Express.js
- TypeScript

### Database & Authentication
- Firebase Authentication
- Firebase Firestore
- Firebase Admin SDK
- Firebase Storage

### Artificial Intelligence
- Google Gemini API
- Gemini 3.1 Flash-Lite
- AI-powered medical interpretation
- Structured JSON-based AI responses

### Maps & Location
- Leaflet
- React-Leaflet
- OpenStreetMap
- Overpass API
- Browser Geolocation API

### Other Technologies
- jsPDF
- REST APIs
- Git & GitHub

---

## 🏗️ System Architecture

HealP follows a client-server architecture with Firebase-powered cloud services.

```text
                 ┌──────────────────────┐
                 │    HealP Web App     │
                 │   React + TypeScript │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │ Firebase Auth        │
                 │ User Authentication  │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │ Node.js + Express    │
                 │ Backend API          │
                 └──────────┬───────────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
      ┌──────▼─────┐ ┌──────▼──────┐ ┌────▼────────┐
      │ Firestore  │ │   Firebase  │ │ Gemini AI   │
      │ Database   │ │   Storage   │ │ Services    │
      └────────────┘ └─────────────┘ └─────────────┘
                            │
                 ┌──────────▼───────────┐
                 │ Patient & Doctor     │
                 │ Healthcare Services  │
                 └──────────────────────┘
```

---

## 🔄 How HealP Works

### Patient Workflow

1. Register or log in securely.
2. Complete the personal and medical profile.
3. Upload prescriptions and medical reports.
4. Use AI to interpret prescriptions and understand medical information.
5. Maintain a centralized medical history.
6. Share authorized medical records with doctors.
7. Download medical history whenever required.

### Doctor Workflow

1. Register or log in through the doctor portal.
2. Search for patients.
3. Obtain patient authorization to access medical records.
4. Review medical history and AI-generated summaries.
5. Add consultations, diagnoses, and prescriptions.
6. Update patient records.

---

## 🔮 Future Enhancements

HealP is designed with scalability and future healthcare integrations in mind.

Potential enhancements include:

- ABHA ID and ABDM integration.
- DigiLocker integration for medical documents.
- Wearable device integration.
- Advanced drug interaction detection.
- Predictive health analytics.
- QR-based emergency health cards.
- Hospital and diagnostic laboratory integrations.
- Advanced personalized healthcare recommendations.

---

## ⚠️ Medical Disclaimer

HealP is an AI-assisted healthcare information and medical record management platform.

AI-generated outputs are intended for informational and educational purposes only. They should not replace professional medical diagnosis, prescriptions, or treatment.

Always consult a qualified healthcare professional before making medical decisions.

---

## 👨‍💻 Developed By

**Aditya Jain**

B.Tech Student | Full-Stack Developer | AI Enthusiast

HealP was developed to explore how Artificial Intelligence, cloud technologies, and modern web development can improve healthcare accessibility and patient-doctor collaboration.

---

## ⭐ Support

If you find HealP interesting, consider giving this repository a ⭐ on GitHub!

**HealP – Making Healthcare Smarter, Simpler, and More Connected.**
