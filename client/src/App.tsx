import { RouterProvider } from "react-router-dom";
import { ToastProvider } from "./components/ui";
import { Routes } from "./routes/Routes";

const App = () => {
  return (
    <>
      <RouterProvider router={Routes} />
      <ToastProvider />
    </>
  );
};

export default App;
