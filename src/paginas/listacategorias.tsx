import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../estilos/listacategorias.css'; // Asegúrate que la ruta sea correcta

interface Categoria {
  ID_Categoria: number;
  Nombre: string;
}

const ListaCategorias: React.FC = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{ Nombre: string }>({ Nombre: '' });
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    fetchCategorias();
  }, [backendUrl]);

  const fetchCategorias = async () => {
    setCargando(true);
    try {
      const res = await axios.get(`${backendUrl}/categorias`);
      setCategorias(res.data);
    } catch (error) {
      setCategorias([]);
    } finally {
      setCargando(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta categoría?')) return;
    try {
      await axios.delete(`${backendUrl}/categorias/${id}`);
      fetchCategorias();
    } catch (error) {
      alert('Error al eliminar categoría');
    }
  };

  const handleEdit = (cat: Categoria) => {
    setEditId(cat.ID_Categoria);
    setFormData({ Nombre: cat.Nombre });
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
        await axios.put(`${backendUrl}/categorias/${editId}`, formData);
      } else {
        await axios.post(`${backendUrl}/categorias`, formData);
      }
      setShowForm(false);
      fetchCategorias();
    } catch (error) {
      alert('Error al guardar categoría');
    }
  };

  if (cargando) return <div className="lista-categorias-container">Cargando categorías...</div>;

  return (
    <div className="lista-categorias-container">
      <h2>Lista de Categorías</h2>
      <button onClick={handleAdd}>Agregar Categoría</button>
      {showForm && (
        <form onSubmit={handleFormSubmit} style={{ margin: '1em 0' }}>
          <input
            type="text"
            placeholder="Nombre"
            value={formData.Nombre}
            onChange={e => setFormData({ Nombre: e.target.value })}
            required
          />
          <button type="submit">{editId ? 'Guardar Cambios' : 'Agregar'}</button>
          <button type="button" onClick={() => setShowForm(false)}>
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
                <button onClick={() => handleEdit(cat)}>Editar</button>
                <button onClick={() => handleDelete(cat.ID_Categoria)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListaCategorias;