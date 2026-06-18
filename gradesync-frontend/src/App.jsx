import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ComparePage from './pages/ComparePage';
import HistoryPage from './pages/HistoryPage';
import TemplatesPage from './pages/TemplatesPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
      </Routes>
    </BrowserRouter>
  );
}
