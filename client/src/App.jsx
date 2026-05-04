import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ApplicationList from './components/ApplicationList';
import ApplicationDetail from './components/ApplicationDetail';
import ApplicationForm from './components/ApplicationForm';

export default function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Resume Builder</Link>
        <Link to="/">All Applications</Link>
        <Link to="/new">+ New</Link>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<ApplicationList />} />
          <Route path="/new" element={<ApplicationForm />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/applications/:id/edit" element={<ApplicationForm />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
