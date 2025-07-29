import React, { useEffect, useState } from "react";
import axios from "axios";
import "../estilos/lista_areas.css"; // Ajusta la ruta si tu carpeta de estilos es diferente

interface Area {
  ID_Area: number;
  Nombre: string;
  Descripcion?: string;
}

const ListaAreas: React.FC = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [areas, setAreas] = useState<Area[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{ Nombre: string }>({ Nombre: "" });
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    fetchAreas();
  }, [backendUrl]);

  const fetchAreas = async () => {
    setCargando(true);
    try {
      const res = await axios.get(`${backendUrl}/areas`);
      setAreas(res.data);
    } catch (error) {
      setAreas([]);
    } finally {
      setCargando(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta área?")) return;
    try {
      await axios.delete(`${backendUrl}/areas/${id}`);
      fetchAreas();
    } catch (error) {
      alert("Error al eliminar área");
    }
  };

  const handleEdit = (area: Area) => {
    setEditId(area.ID_Area);
    setFormData({ Nombre: area.Nombre });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditId(null);
    setFormData({ Nombre: "" });
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`${backendUrl}/areas/${editId}`, formData);
      } else {
        await axios.post(`${backendUrl}/areas`, formData);
      }
      setShowForm(false);
      fetchAreas();
    } catch (error) {
      alert("Error al guardar área");
    }
  };

  if (cargando)
    return <div className="lista-areas-container">Cargando áreas...</div>;

  return (
    <div className="lista-areas-container">
      <h2>Lista de Áreas</h2>
      <button onClick={handleAdd}>Agregar Área</button>
      {showForm && (
        <form onSubmit={handleFormSubmit} style={{ margin: "1em 0" }}>
          <input
            type="text"
            placeholder="Nombre"
            value={formData.Nombre}
            onChange={(e) => setFormData({ Nombre: e.target.value })}
            required
          />
          <button type="submit">
            {editId ? "Guardar Cambios" : "Agregar"}
          </button>
          <button type="button" onClick={() => setShowForm(false)}>
            Cancelar
          </button>
        </form>
      )}
      <table className="areas-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {areas.map((area) => (
            <tr key={area.ID_Area}>
              <td>{area.ID_Area}</td>
              <td>{area.Nombre}</td>
              <td>
                <button onClick={() => handleEdit(area)}>Editar</button>
                <button onClick={() => handleDelete(area.ID_Area)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListaAreas;
