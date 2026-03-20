🏥 MediConnect – AI-Powered Healthcare Consultation Platform

🚀 Overview

MediConnect is an AI-driven healthcare platform that transforms doctor-patient consultations into structured medical intelligence.

It records consultations, transcribes conversations, and generates AI-powered summaries to improve treatment continuity and decision-making.

---

🎥 Demo Video

👉 Watch the full demo here:
🔗 "Click to Watch Demo" (https://your-demo-video-link.com)

---

📸 Screenshots

🎥 Video Consultation Interface

"Video Consultation" (./screenshots/video-consultation.png)

---

🧠 AI Summary Generation

"AI Summary" (./screenshots/ai-summary.png)

---

📄 Generated Medical Summary

"Medical Summary" (./screenshots/summary-output.png)

---

📎 Prescription Upload

"Prescription Upload" (./screenshots/prescription.png)

---

🎯 Problem Statement

Healthcare consultations often lack structured documentation, leading to:

- Poor patient history tracking
- Repeated diagnosis efforts
- Miscommunication between visits

---

💡 Solution

MediConnect introduces a Consultation Intelligence Layer that:

- Captures consultation audio
- Converts speech to text
- Generates structured medical summaries
- Stores and retrieves patient history

---

✨ Key Features

🎥 Video Consultation

- Real-time doctor-patient interaction
- Integrated chat system

🎤 Audio Recording & Transcription

- Records consultation audio
- Converts speech to text using Whisper

🧠 AI Medical Summarization

- Extracts:
  - Chief Complaint
  - Symptoms
  - Diagnosis
  - Medications
  - Advice
  - Follow-up

📄 Consultation History

- Persistent medical records
- Easy retrieval for future visits

📎 Prescription Management

- Upload and share prescriptions
- Patient access to prescriptions

---

🏗️ Tech Stack

Frontend

- React (Vite)
- Tailwind CSS
- Axios
- Socket.IO

Backend

- Node.js
- Express.js
- MongoDB (Mongoose)

AI & APIs

- Groq API (LLaMA 3.1)
- Whisper (Speech-to-Text)

---

⚙️ Installation & Setup

1️⃣ Clone Repository

git clone https://github.com/your-username/mediconnect.git
cd mediconnect

---

2️⃣ Backend Setup

cd health-backend
npm install

Create ".env":

PORT=3000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
GROQ_API_KEY=your_groq_key

Run backend:

npm run dev

---

3️⃣ Frontend Setup

cd ../
npm install
npm run dev

Create ".env.local":

VITE_BACKEND_URL=http://localhost:3000

---

🔄 Workflow

Doctor-Patient Call
        ↓
Audio Recording
        ↓
Speech-to-Text (Whisper)
        ↓
AI Summarization (Groq LLaMA)
        ↓
Structured JSON Output
        ↓
Stored in Database
        ↓
Displayed in UI

---

📂 Project Structure

health-backend/
├── controllers/
├── models/
├── routes/
├── middleware/
├── uploads/
└── server.js

src/
├── components/
├── pages/
├── services/
├── context/
└── App.jsx

---

🔐 Authentication

- JWT-based authentication
- Role-based access (Doctor / Patient / Guardian)

---

🌍 SDG Alignment

SDG 3: Good Health and Well-being

Improves healthcare accessibility and continuity

SDG 9: Industry, Innovation and Infrastructure

Applies AI in healthcare

SDG 10: Reduced Inequalities

Supports remote consultations

---

🚀 Future Enhancements

- 📊 Patient timeline visualization
- ⚠️ AI-powered health alerts
- 🧾 Auto-generated prescriptions (PDF)
- 🧠 Real-time transcription
- 🤖 AI doctor assistant

---

🤝 Contributing

Pull requests are welcome. Feel free to fork and improve!

---

👨‍💻 Author

Built as part of an AI healthcare innovation project.
