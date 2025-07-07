import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import About from './pages/About';
import CourseDetail from './pages/CourseDetail';
import Courses from './pages/Courses';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Login from './pages/Login';
import Portal from './pages/Portal';
import Register from './pages/Register';
import TestInstructions from './pages/TestInstructions';
import TestQuestion from './pages/TestQuestion';
import TestResults from './pages/TestResults';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
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
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
