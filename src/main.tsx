import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupPwaAutoRecovery } from "@/lib/pwaRecovery";

setupPwaAutoRecovery({ enabled: import.meta.env.PROD });

createRoot(document.getElementById("root")!).render(<App />);

