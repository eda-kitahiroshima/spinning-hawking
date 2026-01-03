import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import SubmitApp from './pages/SubmitApp';
import EditApp from './pages/EditApp';
import CreateApp from './pages/CreateApp';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EditAppMultiFile from './pages/EditAppMultiFile';
import API_BASE_URL from './config';

function App() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (token && username) {
      setUser({ username, id: localStorage.getItem('userId') });
    } else {
      let anonId = localStorage.getItem('anonId');
      if (!anonId) {
        anonId = 'anon_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('anonId', anonId);
      }
      if (!token) {
        localStorage.setItem('userId', anonId);
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser({ username: userData.username, id: userData.userId });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    const anonId = localStorage.getItem('anonId');
    localStorage.setItem('userId', anonId || 'anon_temp');
    setUser(null);
  };

  return (
    <Router>
      <div className="App">
        <Header user={user} onLogout={handleLogout} />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/submit" element={<ProtectedRoute><SubmitApp /></ProtectedRoute>} />
            <Route path="/create-app" element={<ProtectedRoute><CreateApp /></ProtectedRoute>} />
            <Route path="/edit/:id" element={<ProtectedRoute><EditApp /></ProtectedRoute>} />
            <Route path="/edit-multifile/:id" element={<ProtectedRoute><EditAppMultiFile /></ProtectedRoute>} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          </Routes>
        </main>

        <footer style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', marginTop: '4rem' }}>
          <p>&copy; {new Date().getFullYear()} DevStudio. All rights reserved.</p>
          <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.5rem' }}>API: {API_BASE_URL}</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
