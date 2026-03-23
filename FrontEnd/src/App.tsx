import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import UploadProgressIndicator from './components/UploadProgressIndicator';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { UploadProvider } from './contexts/UploadContext';
import About from './pages/About';
import CourseDetail from './pages/CourseDetail';
import Courses from './pages/Courses';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Login from './pages/Login';
import Payment from './pages/Payment';
import PaymentCancel from './pages/PaymentCancel';
import PaymentHistory from './pages/PaymentHistory';
import PaymentSuccess from './pages/PaymentSuccess';
import Portal from './pages/Portal';
import Register from './pages/Register';
import TestInstructions from './pages/TestInstructions';
import TestQuestion from './pages/TestQuestion';
import TestResults from './pages/TestResults';
import AdminDashboard from './pages/admin/AdminDashboard';
import CategoryManagement from './pages/admin/CategoryManagement';
import AdminCourseDetail from './pages/admin/CourseDetail';
import CourseManagement from './pages/admin/CourseManagement';
import CreateCourse from './pages/admin/CreateCourse';
import EditCourse from './pages/admin/EditCourse';
import PaymentManagement from './pages/admin/PaymentManagement';
import QuestionManagement from './pages/admin/QuestionManagement';
import UserManagement from './pages/admin/UserManagement';
// Practice pages
import PracticeAnswerShortQuestion from './pages/practice/PracticeAnswerShortQuestion';
import PracticeDescribeImage from './pages/practice/PracticeDescribeImage';
import PracticeFillInTheBlanksDragDrop from './pages/practice/PracticeFillInTheBlanksDragDrop';
import PracticeReTellLecture from './pages/practice/PracticeReTellLecture';
import PracticeReadAloud from './pages/practice/PracticeReadAloud';
import PracticeReadingFillInTheBlanks from './pages/practice/PracticeReadingFillInTheBlanks';
import PracticeRepeatSentence from './pages/practice/PracticeRepeatSentence';
import PracticeRespondToASituation from './pages/practice/PracticeRespondToASituation';
import PracticeSummarizeGroupDiscussion from './pages/practice/PracticeSummarizeGroupDiscussion';
import PracticeSummarizeWrittenText from './pages/practice/PracticeSummarizeWrittenText';
import PracticeWriteEssay from './pages/practice/PracticeWriteEssay';
import PracticeReOrderParagraphs from './pages/practice/PracticeReOrderParagraphs';

// Initialize Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UploadProvider>
          <Elements stripe={stripePromise}>
            <Router>
              <div className='min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300'>
                <Navbar />
                <main>
                  <ScrollToTop />
                  <Routes>
                    <Route
                      path='/'
                      element={<Home />}
                    />
                    <Route
                      path='/courses'
                      element={<Courses />}
                    />
                    <Route
                      path='/courses/:id'
                      element={<CourseDetail />}
                    />
                    <Route
                      path='/about'
                      element={<About />}
                    />

                    {/* Auth routes - redirect to dashboard if already logged in */}
                    <Route
                      path='/login'
                      element={
                        <ProtectedRoute requireAuth={false}>
                          <Login />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/register'
                      element={
                        <ProtectedRoute requireAuth={false}>
                          <Register />
                        </ProtectedRoute>
                      }
                    />

                    {/* Payment routes - require authentication */}
                    <Route
                      path='/payment/:courseId'
                      element={
                        <ProtectedRoute>
                          <Payment />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/payment/success'
                      element={
                        <ProtectedRoute>
                          <PaymentSuccess />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/payment/cancel'
                      element={
                        <ProtectedRoute>
                          <PaymentCancel />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/payment/history'
                      element={
                        <ProtectedRoute>
                          <PaymentHistory />
                        </ProtectedRoute>
                      }
                    />

                    {/* Protected routes - require authentication */}
                    <Route
                      path='/dashboard'
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Portal routes - require authentication */}
                    <Route
                      path='/portal'
                      element={
                        <ProtectedRoute>
                          <Portal />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/portal/test/:testId/instructions'
                      element={
                        <ProtectedRoute>
                          <TestInstructions />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/portal/test/:testId/question/:questionNumber'
                      element={
                        <ProtectedRoute>
                          <TestQuestion />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/portal/test/:testId/results'
                      element={
                        <ProtectedRoute>
                          <TestResults />
                        </ProtectedRoute>
                      }
                    />

                    {/* Practice routes - require authentication */}
                    {/* SPEAKING */}
                    <Route
                      path='/practice/answer-short-question'
                      element={
                        <ProtectedRoute>
                          <PracticeAnswerShortQuestion />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/practice/describe-image'
                      element={
                        <ProtectedRoute>
                          <PracticeDescribeImage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/practice/read-aloud'
                      element={
                        <ProtectedRoute>
                          <PracticeReadAloud />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/practice/repeat-sentence'
                      element={
                        <ProtectedRoute>
                          <PracticeRepeatSentence />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/practice/respond-to-a-situation'
                      element={
                        <ProtectedRoute>
                          <PracticeRespondToASituation />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/practice/re-tell-lecture'
                      element={
                        <ProtectedRoute>
                          <PracticeReTellLecture />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/practice/summarize-group-discussion'
                      element={
                        <ProtectedRoute>
                          <PracticeSummarizeGroupDiscussion />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path='/practice/summarize-written-text'
                      element={
                        <ProtectedRoute>
                          <PracticeSummarizeWrittenText />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/practice/write-essay'
                      element={
                        <ProtectedRoute>
                          <PracticeWriteEssay />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/practice/fill-in-the-blanks-drag-and-drop'
                      element={
                        <ProtectedRoute>
                          <PracticeFillInTheBlanksDragDrop />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/practice/reading-fill-in-the-blanks'
                      element={
                        <ProtectedRoute>
                          <PracticeReadingFillInTheBlanks />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/practice/re-order-paragraphs'
                      element={
                        <ProtectedRoute>
                          <PracticeReOrderParagraphs />
                        </ProtectedRoute>
                      }
                    />
                    {/*
                    <Route
                      path='/practice/multiple-choice-multiple-answers-reading'
                      element={
                        <ProtectedRoute>
                          <PracticeMultipleChoiceMultipleAnswersReading />
                        </ProtectedRoute>
                      }
                      />


                    <Route
                      path='/practice/multiple-choice-single-answer-reading'
                      element={
                        <ProtectedRoute>
                          <PracticeMultipleChoiceSingleAnswer />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/practice/summarize-spoken-text'
                      element={
                        <ProtectedRoute>
                          <PracticeSummarizeSpokenText />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/practice/multiple-choice-multiple-answers-listening'
                      element={
                        <ProtectedRoute>
                          <PracticeMultipleChoiceMultipleAnswersListening />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/practice/listening-fill-in-the-blanks'
                      element={
                        <ProtectedRoute>
                          <PracticeListeningFillInTheBlanks />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/practice/highlight-correct-summary'
                      element={
                        <ProtectedRoute>
                          <PracticeHighlightCorrectSummary />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/practice/multiple-choice-single-answer-listening'
                      element={
                        <ProtectedRoute>
                          <PracticeMultipleChoiceSingleAnswerListening />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/practice/select-missing-word'
                      element={
                        <ProtectedRoute>
                          <PracticeSelectMissingWord />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/practice/highlight-incorrect-words'
                      element={
                        <ProtectedRoute>
                          <PracticeHighlightIncorrectWords />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/practice/write-from-dictation'
                      element={
                        <ProtectedRoute>
                          <PracticeWriteFromDictation />
                        </ProtectedRoute>
                      }
                    /> */}

                    {/* Admin routes - require authentication and admin role */}
                    <Route
                      path='/admin'
                      element={
                        <ProtectedRoute>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/admin/courses'
                      element={
                        <ProtectedRoute>
                          <CourseManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/admin/courses/create'
                      element={
                        <ProtectedRoute>
                          <CreateCourse />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/admin/courses/:id'
                      element={
                        <ProtectedRoute>
                          <AdminCourseDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/admin/courses/:id/edit'
                      element={
                        <ProtectedRoute>
                          <EditCourse />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/admin/users'
                      element={
                        <ProtectedRoute>
                          <UserManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/admin/categories'
                      element={
                        <ProtectedRoute>
                          <CategoryManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/admin/payments'
                      element={
                        <ProtectedRoute>
                          <PaymentManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path='/admin/questions'
                      element={
                        <ProtectedRoute>
                          <QuestionManagement />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </main>
                <Footer />
                <UploadProgressIndicator />
              </div>
            </Router>
          </Elements>
        </UploadProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
