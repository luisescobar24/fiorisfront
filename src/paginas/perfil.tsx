// src/componentes/Perfil.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ← Agrega esta línea
import axios from 'axios';
import Configuracion from '../paginas/configuracion';
import Productos from '../paginas/productos';
import Estadisticas from './estadisticas';
import ListaUsuarios from '../paginas/listausuarios'; // Ajusta la ruta si es necesario
import ListaSalones from '../paginas/listasalones'; // Ajusta la ruta si es necesario
import ListaMesas from '../paginas/listamesas'; // Ajusta la ruta si es necesario
import ListaCategorias from '../paginas/listacategorias'; // Ajusta la ruta si es necesario
import ListaAreas from '../paginas/lista_areas'; // Ajusta la ruta si es necesario
import '../estilos/perfil.css';

const Perfil: React.FC = () => {
  const [vistaActual, setVistaActual] = useState<
    'configuracion' | 'productos' | 'estadisticas' | 'usuarios' | 'salones' | 'mesas' | 'categorias' | 'areas'
  >('configuracion');
  const [usuario, setUsuario] = useState<{ Nombre: string; rol: { Nombre: string } } | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);
  const navigate = useNavigate(); // ← Agrega esta línea

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/perfil`, { withCredentials: true });
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

  const botones = [
    { nombre: 'Configuración', valor: 'configuracion' },
  ];

  // Solo para admin
  if (usuario?.rol?.Nombre === 'ADMIN') {
    botones.push(
      { nombre: 'Productos', valor: 'productos' },
      { nombre: 'Estadísticas', valor: 'estadisticas' },
      { nombre: 'Lista de Salones', valor: 'salones' },
      { nombre: 'Lista de Mesas', valor: 'mesas' },
      { nombre: 'Lista de Categorías', valor: 'categorias' },
      { nombre: 'Lista de Áreas', valor: 'areas' },
      { nombre: 'Lista de usuarios', valor: 'usuarios' }
    );
  }

  if (cargandoUsuario) {
    return <div>Cargando...</div>;
  }

  const renderContenido = () => {
    // Si no es admin, solo puede ver configuración
    if (vistaActual !== 'configuracion' && usuario?.rol?.Nombre !== 'ADMIN') {
      return <div>No tienes permiso para ver esta sección.</div>;
    }
    switch (vistaActual) {
      case 'configuracion':
        return <Configuracion />;
      case 'productos':
        return <Productos />;
      case 'estadisticas':
        return <Estadisticas />;
      case 'usuarios':
        return <ListaUsuarios />;
      case 'salones':
        return <ListaSalones />;
      case 'mesas':
        return <ListaMesas />;
      case 'categorias':
        return <ListaCategorias />;
      case 'areas':
        return <ListaAreas />;
      default:
        return null;
    }
  };

  return (
    <div className="perfil-container">
      <aside className="perfil-sidebar">
        <button
          onClick={() => navigate('/paginaprincipal')}
          className="volver-principal destacado"
        >
          🏠 Volver a principal
        </button>
        <button
          onClick={() => navigate('/barravisual')}
          className="ver-barra-btn"
          style={{ background: '#1976d2', color: '#fff', marginBottom: 10 }}
        >
          🍹 Ver Barra
        </button>
        <button
          onClick={() => navigate('/planchavisual')}
          className="ver-plancha-btn"
          style={{ background: '#388e3c', color: '#fff', marginBottom: 10 }}
        >
          🍳 Ver Plancha
        </button>
        <button
          onClick={() => navigate('/mozovisual')}
          className="ver-mozo-btn"
          style={{ background: '#ffb300', color: '#fff', marginBottom: 10 }}
        >
          🧑‍🍳 Ver Mozo
        </button>
        {botones.map((btn) => (
          <button
            key={btn.valor}
            onClick={() => setVistaActual(btn.valor as typeof vistaActual)}
            className={vistaActual === btn.valor ? 'activo' : ''}
          >
            {btn.nombre}
          </button>
        ))}
      </aside>

      <main className="perfil-contenido">
        {renderContenido()}
      </main>
    </div>
  );
};

export default Perfil;
