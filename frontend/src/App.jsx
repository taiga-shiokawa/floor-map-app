import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/layout/Layout";
import HomePage from "./pages/HomePage";
import "./css/common.css";
import { Analytics } from '@vercel/analytics/react';

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <HomePage />
        }
      ]
    }
  ]);

  return (
    <>
    <Analytics />
    <RouterProvider router={router} />
    </>
  )
}

export default App
