# PTE Course Platform (PTEByDee)

A comprehensive, full-stack online learning platform designed specifically for
the Pearson Test of English (PTE). This application provides a realistic
practice environment with real-time, AI-driven evaluation for over 20 different
PTE question types, seamless secure media streaming, and robust subscription
management.

🔗 **Live Website:** [https://www.ptebydee.com.au](https://www.ptebydee.com.au)

## 🚀 Tech Stack

**Frontend**

- **Framework:** React 18 with Vite
- **Language:** TypeScript
- **Routing:** React Router v6
- **Styling:** Tailwind CSS & Headless UI
- **Animations & Data Vis:** Framer Motion, Recharts
- **State Management:** React Context API & Custom Hooks

**Backend**

- **Runtime & Framework:** Node.js, Express.js 5
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Cloud Infrastructure:** AWS S3 (Storage) & AWS CloudFront (Secure signed
  URLs)
- **AI Integration:** OpenAI API (Whisper for Audio Transcription & LLMs for
  complex grading)
- **Payments:** Stripe API (with custom Webhook handling)
- **Security & Auth:** JWT, Bcrypt, Google Auth Library, Helmet, Express Rate
  Limiting

## ⭐ Spotlight Feature: AI-Powered Question Evaluation Engine

The crown jewel of this application is the **`questionEvaluationService`**, a
highly sophisticated grading engine that processes and evaluates 20 distinct
types of PTE questions (e.g., _Read Aloud, Repeat Sentence, Retell Lecture,
Write Essay_).

**Why it was difficult to build:** PTE scoring requires an extremely nuanced,
multi-dimensional assessment of spoken and written English. Grading a "Retell
Lecture" audio response involves evaluating not just _what_ was said, but _how_
it was said. Orchestrating speech-to-text, context analysis, grammar checking,
and deterministic scoring within a single API request—while keeping response
times low—was a significant architectural challenge.

**How it works under the hood:**

1. **Secure Media Retrieval:** The backend securely fetches the user's recorded
   audio via AWS CloudFront signed URLs to prevent unauthorized access.
2. **Speech-to-Text Pipeline:** The `audioTranscriptionService` downloads the
   temporary `.webm` files and processes them via OpenAI's Whisper API to
   extract text, exact word timings, and confidence scores.
3. **Heuristic + LLM Analysis:** The transcript (or written response) is
   evaluated against correct answers and complex grading rubrics. It assesses:
   - **Content:** Did the user capture the main points and keywords?
   - **Pronunciation & Fluency:** Evaluated via timing, hesitation markers, and
     speech cadence.
   - **Grammar & Vocabulary:** Analyzed using natural language processing.
4. **Deterministic Scoring:** The AI's qualitative feedback is converted into
   strict, deterministic PTE-standardized scores using complex algorithmic
   mapping.

## 🛠 Key Features

- **Secure Audio & Media Delivery:** Implemented AWS CloudFront Signed URLs to
  securely deliver practice materials, preventing unauthorized scraping or
  hotlinking.
- **Advanced Audio Processing:** Seamless handling of user audio recordings
  directly from the browser, converting and transcribing them on the backend via
  robust streaming techniques.
- **Interactive Practice Dashboard:** Dynamic dashboards built with Recharts for
  tracking student progress, visually breaking down scores across different PTE
  sections (Speaking, Writing, Reading, Listening).
- **Stripe Subscriptions & Payments:** Secure integration for course purchases
  and premium subscription tiers with automated webhook synchronization.
- **Google OAuth & JWT Security:** Multi-layered authentication system ensuring
  secure, persistent access to premium content and personalized data.

## 💡 Why This Project Stands Out

Building a platform that not only serves content but actively _evaluates_
unstructured human input (voice and free-text) requires engineering far beyond
standard CRUD operations. The sheer scale and complexity of integrating AI
transcription with strict programmatic grading rules demonstrate an advanced
understanding of asynchronous workflows, cloud storage security, and external
API orchestration. Overcoming challenges like real-time audio file manipulation,
secure CloudFront integration, and translating abstract AI analysis into
quantitative scoring proves a high level of full-stack architectural competence
and problem-solving ability.
