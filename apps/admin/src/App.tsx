import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
// import Editor from './pages/Editor'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      {/* <Route path="/editor/:pageId" element={<Editor />} /> */}
    </Routes>
  )
}

export default App
