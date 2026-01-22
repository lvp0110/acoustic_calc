import { AcousticProvider } from "./context/AcousticContext.jsx";
import Acoustic from "./pages/Acoustic.jsx";

export default function App() {
  return (
    <AcousticProvider>
      <div style={{ padding: 12 }}>
        <Acoustic />
      </div>
    </AcousticProvider>
  );
}