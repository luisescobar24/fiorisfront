import React, { useEffect, useState } from "react";
import axios from "axios";
import "../estilos/listacategorias.css";

interface Categoria {
  ID_Categoria: number;
  Nombre: string;
}

const ListaCategorias: React.FC = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{ Nombre: string }>({ Nombre: "" });
  const [editId, setEditId] = useState<number | null>(null);

  const [loadingForm, setLoadingForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchCategorias();
  }, [backendUrl]);

  useEffect(() => {
    if (deleteId !== null) {
      // Scroll suave a top cuando se abre el modal
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
      // Bloquear scroll de fondo
      document.body.style.overflow = "hidden";
    } else {
      // Desbloquear scroll
      document.body.style.overflow = "";
    }
    // Limpieza al desmontar o cambiar deleteId
    return () => {
      document.body.style.overflow = "";
    };
  }, [deleteId]);

  const fetchCategorias = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await axios.get(`${backendUrl}/categorias`);
      setCategorias(res.data);
    } catch (error) {
      setError("Error al cargar categorías");
      setCategorias([]);
    } finally {
      setCargando(false);
    }
  };

  const validarNombre = (nombre: string) => {
    const n = nombre.trim();
    return n.length > 0 && n.length <= 50;
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    setError(null);
    try {
      await axios.delete(`${backendUrl}/categorias/${deleteId}`);
      setSuccess("Categoría eliminada correctamente");
      setDeleteId(null);
      fetchCategorias();
    } catch (error) {
      setError("Error al eliminar categoría");
    }
  };

  const handleEdit = (cat: Categoria) => {
    setEditId(cat.ID_Categoria);
    setFormData({ Nombre: cat.Nombre });
    setError(null);
    setSuccess(null);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditId(null);
    setFormData({ Nombre: "" });
    setError(null);
    setSuccess(null);
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validarNombre(formData.Nombre)) {
      setError("El nombre es obligatorio y debe tener máximo 50 caracteres.");
      return;
    }

    setLoadingForm(true);
    try {
      if (editId) {
        await axios.put(`${backendUrl}/categorias/${editId}`, formData);
        setSuccess("Categoría editada correctamente");
      } else {
        await axios.post(`${backendUrl}/categorias`, formData);
        setSuccess("Categoría agregada correctamente");
      }
      setShowForm(false);
      fetchCategorias();
    } catch (error) {
      setError("Error al guardar categoría");
    } finally {
      setLoadingForm(false);
    }
  };

  if (cargando)
    return (
      <div className="lista-categorias-container">Cargando categorías...</div>
    );

  return (
    <div className="lista-categorias-container">
      <h2>Lista de Categorías</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <button onClick={handleAdd} disabled={loadingForm || showForm}>
        Agregar Categoría
      </button>

      {showForm && (
        <form onSubmit={handleFormSubmit} style={{ margin: "1em 0" }}>
          <input
            type="text"
            placeholder="Nombre"
            value={formData.Nombre}
            onChange={(e) => setFormData({ Nombre: e.target.value })}
            maxLength={50}
            autoFocus
            disabled={loadingForm}
            required
          />
          <button type="submit" disabled={loadingForm}>
            {loadingForm
              ? editId
                ? "Guardando..."
                : "Agregando..."
              : editId
              ? "Guardar Cambios"
              : "Agregar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setError(null);
              setSuccess(null);
            }}
            disabled={loadingForm}
          >
            Cancelar
          </button>
        </form>
      )}

      <table className="categorias-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categorias.map((cat) => (
            <tr key={cat.ID_Categoria}>
              <td>{cat.ID_Categoria}</td>
              <td>{cat.Nombre}</td>
              <td>
                <button
                  onClick={() => handleEdit(cat)}
                  disabled={loadingForm || showForm}
                  aria-label={`Editar categoría ${cat.Nombre}`}
                >
                  Editar
                </button>
                <button
                  onClick={() => setDeleteId(cat.ID_Categoria)}
                  disabled={loadingForm || showForm}
                  aria-label={`Eliminar categoría ${cat.Nombre}`}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal simple para confirmar eliminación */}
      {deleteId !== null && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <p>¿Seguro que deseas eliminar esta categoría?</p>
            <button onClick={handleDelete}>Sí, eliminar</button>
            <button onClick={() => setDeleteId(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaCategorias;
