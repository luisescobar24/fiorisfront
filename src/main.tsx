import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Modal from "react-modal";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignIn from "./paginas/signin";
import PaginaPrincipal from "./paginas/paginaprincipal";
import Perfil from "./paginas/perfil";
import Productos from "./paginas/productos";
import PedidosBarra from "./paginas/pedidosbarra";
import PedidosPlancha from "./paginas/pedidosplancha";
import PedidosMozo from "./paginas/pedidosmozo";

Modal.setAppElement("#root");
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/paginaprincipal" element={<PaginaPrincipal />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/barravisual" element={<PedidosBarra />} />
        <Route path="/planchavisual" element={<PedidosPlancha />} />
        <Route path="/mozovisual" element={<PedidosMozo />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
