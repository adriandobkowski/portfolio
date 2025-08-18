import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "../index.scss";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import Main from "./components/page";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Main />
  </StrictMode>
);
