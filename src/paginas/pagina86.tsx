import React, { useEffect, useState } from "react";
import '../estilos/pagina86.css';

interface Producto {
  ID_Producto: number;
  Nombre: string;
  Precio: number;
  Activo: boolean;
  Categoria?: string;
}

const Pagina86: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    fetch(`${backendUrl}/productos`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setProductos(data))
      .catch((err) => console.error(err));
  }, [backendUrl]);

  const handleToggleActivo = async (id: number, activo: boolean) => {
    await fetch(`${backendUrl}/productos/${id}/estado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ activo: !activo }),
    });
    setProductos((prev) =>
      prev.map((p) =>
        p.ID_Producto === id ? { ...p, Activo: !activo } : p
      )
    );
  };

  const productosFiltrados = productos.filter((p) =>
    p.Nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="pagina86-container">
      <h2 className="pagina86-titulo">Gestión de Productos</h2>
      <input
        type="text"
        placeholder="Buscar producto..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="pagina86-busqueda"
      />
      <table className="pagina86-tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Categoría</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {productosFiltrados.map((prod) => (
            <tr
              key={prod.ID_Producto}
              className={prod.Activo ? "" : "producto-inactivo"}
            >
              <td>{prod.Nombre}</td>
              <td>S/ {prod.Precio}</td>
              <td>{prod.Categoria || "-"}</td>
              <td>
                <span className={prod.Activo ? "pagina86-estado-activo" : "pagina86-estado-inactivo"}>
                  {prod.Activo ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td>
                <button
                  onClick={() => handleToggleActivo(prod.ID_Producto, prod.Activo)}
                  className={`pagina86-btn ${prod.Activo ? "inactivo" : "activo"}`}
                >
                  {prod.Activo ? "Desactivar" : "Activar"}
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