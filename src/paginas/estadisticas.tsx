// src/componentes/estadisticas.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Estadisticas: React.FC = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [stats, setStats] = useState<{ totalPedidos: number; totalProductosVendidos: number } | null>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        // 1. Intenta con cookies
        const resCookie = await axios.get(`${backendUrl}/usuario`, { withCredentials: true });
        setUsuario(resCookie.data);
        setCargandoUsuario(false);
        return;
      } catch (error) {
        // Si falla, intenta con localStorage
      }

      const token = localStorage.getItem('token');
      if (token) {
        try {
          const resToken = await axios.get(`${backendUrl}/usuario`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUsuario(resToken.data);
        } catch (error) {
          setUsuario(null);
        }
      } else {
        setUsuario(null);
      }
      setCargandoUsuario(false);
    };
    fetchUsuario();
  }, [backendUrl]);

  useEffect(() => {
    if (!cargandoUsuario && !usuario) {
      navigate('/');
    }
  }, [usuario, cargandoUsuario, navigate]);

  useEffect(() => {
    if (usuario) {
      axios.get(`${backendUrl}/estadisticas/pedidos`)
        .then(res => setStats(res.data))
        .catch(err => console.error('Error al obtener estadísticas:', err));
    }
  }, [backendUrl, usuario]);

  if (cargandoUsuario) {
    return <p>Cargando estadísticas...</p>;
  }

  return (
    <div>
      <h2>Estadísticas Generales</h2>
      {stats ? (
        <ul>
          <li>Total de Pedidos: {stats.totalPedidos}</li>
          <li>Total de Productos Vendidos: {stats.totalProductosVendidos}</li>
        </ul>
      ) : (
        <p>Cargando estadísticas...</p>
      )}
    </div>
  );
};

export default Estadisticas;
