import { Routes, Route, Navigate } from "react-router-dom";
import { AcousticProvider } from "./context/AcousticContext.jsx";
import Acoustic from "./pages/Acoustic.jsx";
import BrandPage from "./pages/BrandPage.jsx";
import ModelPage from "./pages/ModelPage.jsx";
import OptionsPage from "./pages/OptionsPage.jsx";

export default function App() {
  return (
    <AcousticProvider>
      <div style={{ padding: 12 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/acoustic" replace />} />
          <Route path="/acoustic" element={<Acoustic />} />
          <Route path="/acoustic/brand" element={<BrandPage />} />
          <Route path="/acoustic/model" element={<ModelPage />} />
          <Route path="/acoustic/options" element={<OptionsPage />} />
          <Route path="*" element={<Navigate to="/acoustic" replace />} />
        </Routes>
      </div>
    </AcousticProvider>
  );
}