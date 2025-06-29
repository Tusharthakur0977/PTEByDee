import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import About from './pages/About';
import CourseDetail from './pages/CourseDetail';
import Courses from './pages/Courses';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

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
                <Route
                  path='/login'
                  element={<Login />}
                />
                <Route
                  path='/register'
                  element={<Register />}
                />
                <Route
                  path='/dashboard'
                  element={<Dashboard />}
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
