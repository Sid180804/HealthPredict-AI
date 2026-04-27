import React from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import App from "./App";
import "./i18n";
import "./index.css";
import "./styles/design-tokens.css";
import "./styles/healthpredict.css";

import axios from "axios";

// Render Cold Start Retry Logic: Retry failed requests (5xx) after 3 seconds
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest._retry && error.response && error.response.status >= 500) {
      originalRequest._retry = true;
      console.warn("API Error 500+ detected. Retrying in 3 seconds to handle cold start...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      return axios(originalRequest);
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
