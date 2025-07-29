import React, { useEffect, useState } from "react";
import axios from "axios";
import "../estilos/lista_mesas.css"; // Ajusta la ruta si tu carpeta de estilos es diferente

interface Mesa {
  ID_Mesa: number;
  Numero_mesa: number;
  ID_Salon?: number;
  salon?: { Nombre: string };
}

interface Salon {
  ID_Salon: number;
  Nombre: string;
}

const ListaMesas: React.FC = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [salones, setSalones] = useState<Salon[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{
    Numero_mesa: number | "";
    ID_Salon: number | "";
  }>({
    Numero_mesa: "",
    ID_Salon: "",
  });
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    fetchMesas();
    fetchSalones();
  }, [backendUrl]);

  const fetchMesas = async () => {
    setCargando(true);
    try {
      const res = await axios.get(`${backendUrl}/mesas`);
      setMesas(res.data);
    } catch (error) {
      setMesas([]);
    } finally {
      setCargando(false);
    }
  };

  const fetchSalones = async () => {
    try {
      const res = await axios.get(`${backendUrl}/salones`);
      setSalones(res.data);
    } catch (error) {
      setSalones([]);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta mesa?")) return;
    try {
      await axios.delete(`${backendUrl}/mesas/${id}`);
      fetchMesas();
    } catch (error) {
      alert("Error al eliminar mesa");
    }
  };

  const handleEdit = (mesa: Mesa) => {
    setEditId(mesa.ID_Mesa);
    setFormData({
      Numero_mesa: mesa.Numero_mesa,
      ID_Salon: mesa.ID_Salon || "",
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditId(null);
    setFormData({ Numero_mesa: "", ID_Salon: "" });
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.Numero_mesa || !formData.ID_Salon) {
        alert("Debes ingresar el número de mesa y seleccionar un salón");
        return;
      }
      if (editId) {
        await axios.put(`${backendUrl}/mesas/${editId}`, {
          numero_mesa: formData.Numero_mesa,
          ID_Salon: formData.ID_Salon,
        });
      } else {
        await axios.post(`${backendUrl}/mesas`, {
          numero_mesa: formData.Numero_mesa,
          ID_Salon: formData.ID_Salon,
        });
      }
      setShowForm(false);
      fetchMesas();
    } catch (error) {
      alert("Error al guardar mesa");
    }
  };

  if (cargando)
    return <div className="lista-mesas-container">Cargando mesas...</div>;

  return (
    <div className="lista-mesas-container">
      <h2>Lista de Mesas</h2>
      <button onClick={handleAdd}>Agregar Mesa</button>
      {showForm && (
        <form onSubmit={handleFormSubmit} style={{ margin: "1em 0" }}>
          <input
            type="text"
            placeholder="Número de Mesa (puede tener decimales)"
            value={formData.Numero_mesa}
            onChange={(e) =>
              setFormData({
                ...formData,
                Numero_mesa: parseFloat(e.target.value) || "",
              })
            }
            required
          />
          <select
            value={formData.ID_Salon}
            onChange={(e) =>
              setFormData({ ...formData, ID_Salon: Number(e.target.value) })
            }
            required
          >
            <option value="">Selecciona un salón</option>
            {salones.map((salon) => (
              <option key={salon.ID_Salon} value={salon.ID_Salon}>
                {salon.Nombre}
              </option>
            ))}
          </select>
          <button type="submit">
            {editId ? "Guardar Cambios" : "Agregar"}
          </button>
          <button type="button" onClick={() => setShowForm(false)}>
            Cancelar
          </button>
        </form>
      )}
      <table className="mesas-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Número de Mesa</th>
            <th>Salón</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {mesas.map((mesa) => (
            <tr key={mesa.ID_Mesa}>
              <td>{mesa.ID_Mesa}</td>
              <td>{mesa.Numero_mesa}</td>
              <td>{mesa.salon?.Nombre || mesa.ID_Salon || "-"}</td>
              <td>
                <button onClick={() => handleEdit(mesa)}>Editar</button>
                <button onClick={() => handleDelete(mesa.ID_Mesa)}>
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

export default ListaMesas;
