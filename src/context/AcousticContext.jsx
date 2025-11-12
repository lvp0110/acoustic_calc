import { createContext, useContext } from "react";
import { useAcousticEngine } from "../hooks/useAcousticEngine.js";

const AcousticCtx = createContext(null);

export const AcousticProvider = ({ children }) => {
  const engine = useAcousticEngine();
  return <AcousticCtx.Provider value={engine}>{children}</AcousticCtx.Provider>;
};

export const useAcoustic = () => {
  const ctx = useContext(AcousticCtx);
  if (!ctx) throw new Error("useAcoustic must be used inside AcousticProvider");
  return ctx;
};
