import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "../index.scss";
import Main from "./components/page";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Main />
  </StrictMode>
);
