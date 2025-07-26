// src/componentes/Perfil.tsx
import React, { useState } from 'react';
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
  const navigate = useNavigate();

  const botones = [
    { nombre: 'Configuración', valor: 'configuracion' },
    { nombre: 'Gestión de Productos (86)', valor: 'pagina86' },
    // Puedes agregar más botones aquí si lo deseas
  ];

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
