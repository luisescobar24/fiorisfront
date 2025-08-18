import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import Modal from "react-modal";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignIn from "./paginas/signin";
// Lazy load heavier route components to enable code-splitting and reduce unused JS on initial load
const PaginaPrincipal = lazy(() => import("./paginas/paginaprincipal"));
const Perfil = lazy(() => import("./paginas/perfil"));
const Productos = lazy(() => import("./paginas/productos"));
const PedidosBarra = lazy(() => import("./paginas/pedidosbarra"));
const PedidosPlancha = lazy(() => import("./paginas/pedidosplancha"));
const PedidosMozo = lazy(() => import("./paginas/pedidosmozo"));

Modal.setAppElement("#root");
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div style={{padding:20}}>Cargando...</div>}>
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/paginaprincipal" element={<PaginaPrincipal />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/barravisual" element={<PedidosBarra />} />
          <Route path="/planchavisual" element={<PedidosPlancha />} />
          <Route path="/mozovisual" element={<PedidosMozo />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>
);
