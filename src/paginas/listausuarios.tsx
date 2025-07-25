import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../estilos/listausuarios.css';

interface Usuario {
  ID_Usuario: number;
  Nombre: string;
  Correo: string;
  Activo: boolean;
  rol?: {
    Nombre: string;
  };
}

const ListaUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuario, setUsuario] = useState<any>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/usuario`, { withCredentials: true });
        setUsuario(res.data);
      } catch (error) {
        setUsuario(null);
      } finally {
        setCargandoUsuario(false);
      }
    };
    fetchUsuario();
  }, []);

  useEffect(() => {
    if (!cargandoUsuario && !usuario) {
      navigate('/');
    }
  }, [usuario, cargandoUsuario, navigate]);

  const obtenerUsuarios = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/usuarios`);
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  };

  const cambiarEstadoUsuario = async (id: number, nuevoEstado: boolean) => {
    try {
      await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/usuarios/${id}`, { Activo: nuevoEstado });
      setUsuarios((prev) =>
        prev.map((u) => (u.ID_Usuario === id ? { ...u, Activo: nuevoEstado } : u))
      );
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
    }
  };

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  if (cargandoUsuario) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="lista-usuarios-container">
      <div className="lista-usuarios-titulo">Lista de Usuarios</div>
      <table className="usuarios-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.ID_Usuario}>
              <td>{usuario.ID_Usuario}</td>
              <td>{usuario.Nombre}</td>
              <td>{usuario.Correo}</td>
              <td>{usuario.rol?.Nombre ?? 'Sin rol'}</td>
              <td>
                <button
                  className="usuario-accion-btn"
                  onClick={() => cambiarEstadoUsuario(usuario.ID_Usuario, !usuario.Activo)}
                  style={{
                    background: usuario.Activo ? '#dc3545' : '#28a745',
                    color: '#fff'
                  }}
                >
                  {usuario.Activo ? 'Inhabilitar' : 'Habilitar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListaUsuarios;
