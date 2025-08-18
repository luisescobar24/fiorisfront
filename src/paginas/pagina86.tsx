import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import "../estilos/pagina86.css";

interface Producto {
  ID_Producto: number;
  Nombre: string;
  Activo: boolean;
}

const socket = io(import.meta.env.VITE_BACKEND_URL, {
  transports: ["websocket", "polling"],
});

const Pagina86: React.FC = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [query, setQuery] = useState<string>("");

  const fetchProductos = async () => {
    setCargando(true);
    try {
      const res = await axios.get(`${backendUrl}/productos`);
      setProductos(res.data);
    } catch (err) {
      setProductos([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const onConnect = () => console.log("Conectado al servidor WebSocket");
    socket.on("connect", onConnect);

    fetchProductos();

    return () => {
      socket.off("connect", onConnect);
    };
  }, []);

  const toggleProducto = async (id: number, activo: boolean) => {
    try {
      await axios.put(
        `${backendUrl}/productos/${id}/estado`,
        { activo: !activo },
        { withCredentials: true }
      );
      setProductos((prev) =>
        prev.map((p) => (p.ID_Producto === id ? { ...p, Activo: !activo } : p))
      );
    } catch (err) {
      alert("No se pudo actualizar el estado del producto");
    }
  };

  if (cargando) return <div>Cargando productos...</div>;

  const productosFiltrados = productos.filter((p) =>
    p.Nombre.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="pagina86-container">
      <h2>Gestión rápida de productos</h2>

      <div className="search-bar">
        <input
          type="search"
          placeholder="Buscar producto..."
          aria-label="Buscar producto"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className="btn-clear" onClick={() => setQuery("")}>Limpiar</button>
        )}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Producto</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {productosFiltrados.map((prod) => (
            <tr key={prod.ID_Producto}>
              <td>{prod.Nombre}</td>
              <td>
                {prod.Activo ? (
                  <span style={{ color: "green" }}>Habilitado</span>
                ) : (
                  <span style={{ color: "red" }}>Deshabilitado</span>
                )}
              </td>
              <td>
                <button
                  onClick={() => toggleProducto(prod.ID_Producto, prod.Activo)}
                  style={{
                    background: prod.Activo ? "#e53935" : "#43a047",
                    color: "#fff",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  {prod.Activo ? "Deshabilitar" : "Habilitar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Pagina86;