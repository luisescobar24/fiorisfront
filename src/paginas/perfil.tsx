// src/componentes/Perfil.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ← Agrega esta línea
import Configuracion from '../paginas/configuracion';
import Productos from '../paginas/productos';
import Estadisticas from './estadisticas';
import ListaUsuarios from '../paginas/listausuarios'; // Ajusta la ruta si es necesario
import ListaSalones from '../paginas/listasalones'; // Ajusta la ruta si es necesario
import ListaMesas from '../paginas/listamesas'; // Ajusta la ruta si es necesario
import ListaCategorias from '../paginas/listacategorias'; // Ajusta la ruta si es necesario
import ListaAreas from '../paginas/lista_areas'; // Ajusta la ruta si es necesario
import '../estilos/perfil.css';
import Pagina86 from './pagina86'; // Ajusta la ruta si es necesario

const Perfil: React.FC = () => {
  const [vistaActual, setVistaActual] = useState<
    'configuracion' | 'productos' | 'estadisticas' | 'usuarios' | 'salones' | 'mesas' | 'categorias' | 'areas' | 'pagina86'
  >('configuracion');
  const [usuario, setUsuario] = useState<any>(null); // Nuevo estado para el usuario
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        // 1. Intenta con cookies
        const resCookie = await fetch(`${import.meta.env.VITE_BACKEND_URL}/usuario`, {
          credentials: 'include',
        });
        if (resCookie.ok) {
          const data = await resCookie.json();
          setUsuario(data);
          localStorage.setItem('usuario', JSON.stringify(data)); // Opcional: guarda en localStorage
          return;
        }
      } catch (e) {
        // Ignora error, intenta con localStorage
      }

      // 2. Si falla, intenta con localStorage
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const resToken = await fetch(`${import.meta.env.VITE_BACKEND_URL}/usuario`, {
            headers: { Authorization: `Bzearer ${token}` },
          });
          if (resToken.ok) {
            const data = await resToken.json();
            setUsuario(data);
            localStorage.setItem('usuario', JSON.stringify(data));
            return;
          }
        } catch (e) {
          // Si falla, usuario sigue null
        }
      }
      setUsuario(null);
    };

    fetchUsuario();
  }, []);

  const botones = [
    { nombre: 'Configuración', valor: 'configuracion' },
    { nombre: 'Gestión de Productos (86)', valor: 'pagina86' },
    { nombre: 'Usuarios', valor: 'usuarios', admin: true },
    { nombre: 'Estadísticas', valor: 'estadisticas', admin: true },
    { nombre: 'Salones', valor: 'salones', admin: true },
    { nombre: 'Mesas', valor: 'mesas', admin: true },
    { nombre: 'Categorías', valor: 'categorias', admin: true },
    { nombre: 'Áreas', valor: 'areas', admin: true },
  ];

  const esAdmin = usuario?.rol?.Nombre === 'ADMIN';

  const renderContenido = () => {
    switch (vistaActual) {
      case 'configuracion':
        return <Configuracion />;
      case 'productos':
        return <Productos />;
      case 'pagina86':
        return <Pagina86 />;
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
        {/* Estos botones los ven todos */}
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
        {/* Botones condicionales */}
        {botones.map((btn) => {
          if (!esAdmin && btn.admin) return null;
          return (
            <button
              key={btn.valor}
              onClick={() => setVistaActual(btn.valor as typeof vistaActual)}
              className={vistaActual === btn.valor ? 'activo' : ''}
            >
              {btn.nombre}
            </button>
          );
        })}
      </aside>
      <main className="perfil-contenido">
        {renderContenido()}
      </main>
    </div>
  );
};

export default Perfil;
