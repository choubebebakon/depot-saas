import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import TarifsPage from './pages/TarifsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/tarifs" element={<TarifsPage />} />
        <Route path="/" element={<TarifsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
