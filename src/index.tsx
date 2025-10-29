import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { Desktop } from "./screens/Desktop";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <Desktop />
    <Analytics />
  </StrictMode>,
);
