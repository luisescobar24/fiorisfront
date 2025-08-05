import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import AgregarProducto from "../modales/modal_agregar_producto";
import EditarProducto from "../modales/modal_editar_producto";
import EliminarProducto from "../modales/modal_eliminar_producto";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../estilos/productos.css";
import { useNavigate } from "react-router-dom";

const Productos: React.FC = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  const [productos, setProductos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState<string>("");

  const [modalAgregar, setModalAgregar] = useState(false);
  const [productoEditar, setProductoEditar] = useState<any | null>(null);
  const [productoEliminar, setProductoEliminar] = useState<any | null>(null);
  const [usuario, setUsuario] = useState<{
    ID_Usuario: number;
    Nombre: string;
  } | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);

  const fetchData = async () => {
    try {
      const resProductos = await axios.get(`${backendUrl}/productos`);
      const resCategorias = await axios.get(`${backendUrl}/categorias`);
      const resAreas = await axios.get(`${backendUrl}/areas`);

      setProductos(resProductos.data); // ✅ sin transformar
      setCategorias(resCategorias.data);
      setAreas(resAreas.data);
    } catch (err) {
      toast.error("Error al cargar los datos");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAgregarProducto = async (producto: Omit<any, "id">) => {
    try {
      await axios.post(`${backendUrl}/agregar-productos`, producto);
      toast.success("Producto agregado correctamente");
      await fetchData();
      setModalAgregar(false);
    } catch (err) {
      toast.error("Error al agregar producto");
      console.error(err);
    }
  };

  const handleEditarProducto = async (productoEditado: any) => {
    try {
      await axios.put(`${backendUrl}/productos/${productoEditado.id}`, {
        nombre: productoEditado.nombre,
        precio: productoEditado.precio,
        idCategoria: productoEditado.idCategoria,
        idArea: productoEditado.idArea,
      });
      toast.success("Producto editado correctamente");
      await fetchData();
      setProductoEditar(null);
    } catch (err) {
      toast.error("Error al editar producto");
      console.error(err);
    }
  };

  const handleEliminarProducto = async (id: number) => {
    try {
      await axios.delete(`${backendUrl}/productos/${id}`);
      toast.success("Producto eliminado correctamente");
      await fetchData();
      setProductoEliminar(null);
    } catch (err) {
      toast.error("Error al eliminar producto");
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const res = await axios.get(`${backendUrl}/usuario`, {
          withCredentials: true,
        });
        setUsuario(res.data);
      } catch (error) {
        setUsuario(null);
      } finally {
        setCargandoUsuario(false);
      }
    };
    fetchUsuario();
  }, [backendUrl]);

  useEffect(() => {
    if (!cargandoUsuario && !usuario) {
      navigate("/");
    }
  }, [usuario, cargandoUsuario, navigate]);

  if (cargandoUsuario) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="productos-container">
      <h2>Lista de Productos</h2>
      <div className="productos-barra-busqueda">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-busqueda"
        />
        <button className="btn-agregar" onClick={() => setModalAgregar(true)}>
          <FaPlus /> Agregar Producto
        </button>
      </div>

      <table className="productos-tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Categoría</th>
            <th>Área</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos
            .filter((prod) =>
              prod.Nombre.toLowerCase().includes(busqueda.toLowerCase())
            )
            .map((prod) => (
              <tr key={prod.ID_Producto}>
                <td>{prod.Nombre}</td>
                <td>S/ {prod.Precio}</td>
                <td>{prod.categoria?.Nombre || "Sin categoría"}</td>
                <td>{prod.area?.Nombre || "Sin área"}</td>
                <td>
                  <button
                    className="btn-editar"
                    onClick={() => setProductoEditar(prod)}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="btn-eliminar"
                    onClick={() => setProductoEliminar(prod)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {modalAgregar && (
        <AgregarProducto
          isOpen={modalAgregar}
          onClose={() => setModalAgregar(false)}
          onAgregar={handleAgregarProducto}
          categorias={categorias}
          areas={areas}
        />
      )}

      {productoEditar && (
        <EditarProducto
          isOpen={!!productoEditar}
          onClose={() => setProductoEditar(null)}
          onEditar={handleEditarProducto}
          producto={{
            id: productoEditar.ID_Producto,
            nombre: productoEditar.Nombre,
            precio: parseFloat(productoEditar.Precio),
            id_categoria: productoEditar.ID_Categoria,
            id_area: productoEditar.ID_Area,
          }}
          categorias={categorias}
          areas={areas}
        />
      )}

      {productoEliminar && (
        <EliminarProducto
          isOpen={!!productoEliminar}
          onClose={() => setProductoEliminar(null)}
          onEliminar={() =>
            handleEliminarProducto(productoEliminar.ID_Producto)
          }
          producto={productoEliminar}
        />
      )}
    </div>
  );
};

export default Productos;
