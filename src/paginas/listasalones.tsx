import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../estilos/listasalones.css'; // Asegúrate que la ruta sea correcta

interface Salon {
  ID_Salon: number;
  Nombre: string;
  Descripcion?: string;
}

const ListaSalones: React.FC = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [salones, setSalones] = useState<Salon[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{ Nombre: string }>({ Nombre: '' });
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    fetchSalones();
  }, [backendUrl]);

  const fetchSalones = async () => {
    setCargando(true);
    try {
      const res = await axios.get(`${backendUrl}/salones`);
      setSalones(res.data);
    } catch (error) {
      setSalones([]);
    } finally {
      setCargando(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este salón?')) return;
    try {
      await axios.delete(`${backendUrl}/salones/${id}`);
      fetchSalones();
    } catch (error) {
      alert('Error al eliminar salón');
    }
  };

  const handleEdit = (salon: Salon) => {
    setEditId(salon.ID_Salon);
    setFormData({ Nombre: salon.Nombre });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditId(null);
    setFormData({ Nombre: '' });
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`${backendUrl}/salones/${editId}`, formData);
      } else {
        await axios.post(`${backendUrl}/salones`, formData);
      }
      setShowForm(false);
      fetchSalones();
    } catch (error) {
      alert('Error al guardar salón');
    }
  };

  if (cargando) return <div className="lista-salones-container">Cargando salones...</div>;

  return (
    <div className="lista-salones-container">
      <h2>Lista de Salones</h2>
      <button onClick={handleAdd}>Agregar Salón</button>
      {showForm && (
        <form onSubmit={handleFormSubmit} style={{ margin: '1em 0' }}>
          <input
            type="text"
            placeholder="Nombre"
            value={formData.Nombre}
            onChange={(e) => setFormData({ Nombre: e.target.value })}
            required
          />
          <button type="submit">{editId ? 'Guardar Cambios' : 'Agregar'}</button>
          <button type="button" onClick={() => setShowForm(false)}>
            Cancelar
          </button>
        </form>
      )}
      <table className="salones-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {salones.map((salon) => (
            <tr key={salon.ID_Salon}>
              <td>{salon.ID_Salon}</td>
              <td>{salon.Nombre}</td>
              <td>
                <button onClick={() => handleEdit(salon)}>Editar</button>
                <button onClick={() => handleDelete(salon.ID_Salon)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListaSalones;