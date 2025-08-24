import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Register AG Grid community modules once for the whole app
// (prevents error #272: "No AG Grid modules are registered")
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

console.log("Starting React application...");

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log("React app rendered");
