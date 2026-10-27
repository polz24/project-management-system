/**
 * Entry point of the application. This is where the application is mounted to the DOM.
 * It uses the `createRoot` method from React to render the application.
 */
import React from "react"
import { createRoot } from "react-dom/client"

import App from "./App"

const container = document.getElementById("root") as HTMLElement
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
