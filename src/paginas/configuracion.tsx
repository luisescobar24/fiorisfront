import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // ← Agrega esto
import { FaEnvelope, FaUserShield, FaKey, FaUser, FaEdit } from 'react-icons/fa';
import ModalCambiarCorreo from '../modales/modalcambiarcorreo';
import ModalRecuperar from '../modales/modalrecuperar';
import '../estilos/configuracion.css';

const Configuracion: React.FC = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [usuario, setUsuario] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalCorreo, setModalCorreo] = useState(false);
  const [modalClave, setModalClave] = useState(false);
  const [cargandoUsuario, setCargandoUsuario] = useState(true); // ← Nuevo estado
  const navigate = useNavigate(); // ← Nuevo hook

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        // 1. Intenta con cookie
        const res = await axios.get(`${backendUrl}/perfil`, { withCredentials: true });
        setUsuario(res.data);
      } catch (error) {
        // 2. Si falla, intenta con token en localStorage
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const res = await axios.get(`${backendUrl}/perfil`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setUsuario(res.data);
            return;
          } catch (err) {
            // Si también falla, usuario no autenticado
          }
        }
        setUsuario(null);
        setError('Error al cargar el usuario. Verifica si estás logueado.');
      } finally {
        setCargandoUsuario(false);
      }
    };
    fetchUsuario();
  }, [backendUrl]);

  useEffect(() => {
    if (!cargandoUsuario && !usuario) {
      navigate('/');
    }
  }, [usuario, cargandoUsuario, navigate]);

  return (
    <div className="configuracion-container">
      <h2>⚙️ Configuración de Usuario</h2>

      {error ? (
        <p className="error">{error}</p>
      ) : usuario ? (
        <div className="datos-usuario">
          <div className="dato-item">
            <label className="dato-label"><FaUser className="icono" /> Nombre:</label>
            <div className="dato-valor">{usuario.Nombre}</div>
          </div>

          <div className="dato-item">
            <label className="dato-label"><FaEnvelope className="icono" /> Correo:</label>
            <div className="dato-valor-con-boton">
              <span>{usuario.Correo}</span>
              <button className="boton-editar" onClick={() => setModalCorreo(true)}>
                <FaEdit className="icono-boton" /> Editar correo
              </button>
            </div>
          </div>

          <div className="dato-item">
            <label className="dato-label"><FaKey className="icono" /> Contraseña:</label>
            <div className="dato-valor-con-boton">
              <span>********</span>
              <button className="boton-editar" onClick={() => setModalClave(true)}>
                <FaEdit className="icono-boton" /> Cambiar contraseña
              </button>
            </div>
          </div>

          <div className="dato-item">
            <label className="dato-label"><FaUserShield className="icono" /> Rol:</label>
            <div className="dato-valor rol-valor">
              {usuario.rol?.Nombre}
            </div>
          </div>
        </div>
      ) : (
        <p>Cargando usuario...</p>
      )}

      <ModalCambiarCorreo isOpen={modalCorreo} onClose={() => setModalCorreo(false)} />
      <ModalRecuperar isOpen={modalClave} onClose={() => setModalClave(false)} />
    </div>
  );
};

export default Configuracion;
