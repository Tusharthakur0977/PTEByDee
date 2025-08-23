import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
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
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import PaymentHistory from './pages/PaymentHistory';
import Portal from './pages/Portal';
import Register from './pages/Register';
import TestInstructions from './pages/TestInstructions';
import TestQuestion from './pages/TestQuestion';
import TestResults from './pages/TestResults';
import AdminDashboard from './pages/admin/AdminDashboard';
import CourseManagement from './pages/admin/CourseManagement';
import CreateCourse from './pages/admin/CreateCourse';
import AdminCourseDetail from './pages/admin/CourseDetail';
import EditCourse from './pages/admin/EditCourse';
import UserManagement from './pages/admin/UserManagement';
import CategoryManagement from './pages/admin/CategoryManagement';

// Initialize Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
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
