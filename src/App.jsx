import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AcousticProvider } from "./context/AcousticContext.jsx";
import Acoustic from "./pages/Acoustic.jsx";
import BrandPage from "./pages/BrandPage.jsx";
import ModelPage from "./pages/ModelPage.jsx";
import OptionsPage from "./pages/OptionsPage.jsx";

// Компонент для редиректа с сохранением query параметров
function RedirectWithParams({ to }) {
  const location = useLocation();
  return <Navigate to={to + location.search} replace />;
}

export default function App() {
  return (
    <AcousticProvider>
      <div style={{ padding: 12 }}>
        <Routes>
          <Route path="/" element={<RedirectWithParams to="/acoustic" />} />
          <Route path="/acoustic" element={<Acoustic />} />
          <Route path="/acoustic/brand" element={<BrandPage />} />
          <Route path="/acoustic/model" element={<ModelPage />} />
          <Route path="/acoustic/options" element={<OptionsPage />} />
          <Route path="*" element={<RedirectWithParams to="/acoustic" />} />
        </Routes>
      </div>
    </AcousticProvider>
  );
}