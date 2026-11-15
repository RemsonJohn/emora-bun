import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { SellerRegistration } from "./routes/auth/SellerRegistration.tsx";
import "./App.css";

const isRegistration = window.location.pathname === "/register";
const inviteToken = isRegistration
  ? new URLSearchParams(window.location.search).get("token") || ""
  : "";
if (isRegistration) window.history.replaceState(null, "", "/register");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isRegistration ? (
      <SellerRegistration
        token={inviteToken}
        onExit={() => window.location.assign("/")}
      />
    ) : (
      <App />
    )}
  </StrictMode>,
);
