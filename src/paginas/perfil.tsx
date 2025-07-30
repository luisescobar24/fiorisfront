import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Configuracion from "../paginas/configuracion";
import Productos from "../paginas/productos";
import Estadisticas from "./estadisticas";
import ListaUsuarios from "../paginas/listausuarios";
import ListaSalones from "../paginas/listasalones";
import ListaMesas from "../paginas/listamesas";
import ListaCategorias from "../paginas/listacategorias";
import ListaAreas from "../paginas/lista_areas";
import Pagina86 from "../paginas/pagina86";
import "../estilos/perfil.css";

interface Usuario {
  Nombre: string;
  rol: { Nombre: string };
  email?: string;
  id?: number;
}

type VistaActual =
  | "configuracion"
  | "productos"
  | "pagina86"
  | "estadisticas"
  | "usuarios"
  | "salones"
  | "mesas"
  | "categorias"
  | "areas";

interface Boton {
  nombre: string;
  valor: VistaActual;
  icono: string;
  descripcion?: string;
  restringido?: boolean;
}

const LoadingSpinner: React.FC = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p className="loading-text">Cargando tu perfil...</p>
  </div>
);

const UserAvatar: React.FC<{ nombre: string }> = ({ nombre }) => {
  const inicial = nombre?.charAt(0)?.toUpperCase() || "U";
  return (
    <div className="user-avatar" aria-label={`Avatar de ${nombre}`}>
      {inicial}
    </div>
  );
};

const NavButton: React.FC<{
  boton: Boton;
  activo: boolean;
  onClick: () => void;
  disabled?: boolean;
}> = ({ boton, activo, onClick, disabled = false }) => (
  <button
    onClick={onClick}
    className={`nav-button ${activo ? "activo" : ""} ${disabled ? "disabled" : ""}`}
    disabled={disabled}
    aria-current={activo ? "page" : undefined}
    title={boton.descripcion || boton.nombre}
    role="menuitem"
  >
    <span className="icon" role="img" aria-label={boton.nombre}>
      {boton.icono}
    </span>
    <span className="button-text">{boton.nombre}</span>
  </button>
);

const Perfil: React.FC = () => {
  const [vistaActual, setVistaActual] = useState<VistaActual>("configuracion");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const botonesBase: Boton[] = [
    {
      nombre: "Configuración",
      valor: "configuracion",
      icono: "⚙️",
      descripcion: "Ajusta tu perfil y preferencias",
    },
  ];

  const botonesAdmin: Boton[] = [
    {
      nombre: "Productos",
      valor: "productos",
      icono: "📦",
      descripcion: "Administra el catálogo de productos",
      restringido: true,
    },
    {
      nombre: "Estadísticas Generales",
      valor: "estadisticas",
      icono: "📊",
      descripcion: "Consulta reportes y análisis",
      restringido: true,
    },
    {
      nombre: "Salones",
      valor: "salones",
      icono: "🏢",
      descripcion: "Gestiona los salones del restaurante",
      restringido: true,
    },
    {
      nombre: "Mesas",
      valor: "mesas",
      icono: "🪑",
      descripcion: "Organiza la distribución de mesas",
      restringido: true,
    },
    {
      nombre: "Categorías",
      valor: "categorias",
      icono: "📂",
      descripcion: "Administra las categorías de productos",
      restringido: true,
    },
    {
      nombre: "Áreas",
      valor: "areas",
      icono: "🗺️",
      descripcion: "Configura las áreas de trabajo",
      restringido: true,
    },
    {
      nombre: "Usuarios",
      valor: "usuarios",
      icono: "👥",
      descripcion: "Gestiona los usuarios del sistema",
      restringido: true,
    },
    {
      nombre: "Página 86",
      valor: "pagina86",
      icono: "📄",
      descripcion: "Accede a la página especial",
      restringido: true,
    },
  ];

  const botonesNavegacion = [
    {
      nombre: "Inicio",
      ruta: "/paginaprincipal",
      icono: "🏠",
      className: "volver-principal destacado",
      descripcion: "Volver a la página principal",
    },
    {
      nombre: "Barra",
      ruta: "/barravisual",
      icono: "🍹",
      className: "ver-barra-btn",
      descripcion: "Vista de la barra",
    },
    {
      nombre: "Plancha",
      ruta: "/planchavisual",
      icono: "🍳",
      className: "ver-plancha-btn",
      descripcion: "Vista de la plancha",
    },
    {
      nombre: "Mozo",
      ruta: "/mozovisual",
      icono: "🧑‍🍳",
      className: "ver-mozo-btn",
      descripcion: "Vista de mozo",
    },
  ];

  const botonesDisponibles = useMemo(() => {
    const botones = [...botonesBase];
    if (usuario?.rol?.Nombre === "ADMIN") {
      botones.push(...botonesAdmin);
    }
    return botones;
  }, [usuario?.rol?.Nombre]);

  const fetchUsuario = useCallback(async () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    try {
      setCargandoUsuario(true);
      setError(null);
      const res = await axios.get(`${backendUrl}/usuario`, {
        withCredentials: true,
        timeout: 10000,
      });
      setUsuario(res.data);
    } catch (error) {
      console.error("Error al cargar usuario:", error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
        } else if (error.code === "ECONNABORTED") {
          setError("Tiempo de espera agotado. Verifica tu conexión.");
        } else {
          setError("Error al conectar con el servidor.");
        }
      } else {
        setError("Ocurrió un error inesperado.");
      }
      setUsuario(null);
    } finally {
      setCargandoUsuario(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuario();
  }, [fetchUsuario]);

  useEffect(() => {
    if (!cargandoUsuario && !usuario && !error) {
      navigate("/");
    }
  }, [usuario, cargandoUsuario, navigate, error]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey) {
        e.preventDefault();
        switch (e.key.toLowerCase()) {
          case "1":
            setVistaActual("configuracion");
            break;
          case "2":
            if (usuario?.rol?.Nombre === "ADMIN") {
              setVistaActual("productos");
            }
            break;
          case "3":
            if (usuario?.rol?.Nombre === "ADMIN") {
              setVistaActual("estadisticas");
            }
            break;
          case "m":
            setMenuAbierto(!menuAbierto);
            break;
          case "h":
            navigate("/paginaprincipal");
            break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [usuario, menuAbierto, navigate]);

  const handleVistaChange = useCallback((vista: VistaActual) => {
    setVistaActual(vista);
    setMenuAbierto(true);
    const contenido = document.querySelector(".perfil-contenido");
    if (contenido) {
      contenido.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handleNavegacion = useCallback(
    (ruta: string) => {
      navigate(ruta);
      setMenuAbierto(true);
    },
    [navigate]
  );

  const toggleMenu = useCallback(() => {
    setMenuAbierto((prev) => !prev);
  }, []);

  const renderContenido = useCallback(() => {
    if (vistaActual !== "configuracion" && usuario?.rol?.Nombre !== "ADMIN") {
      return (
        <div className="error-container">
          <div className="error-icon">🔒</div>
          <h3>Acceso Denegado</h3>
          <p>No tienes permisos para acceder a esta sección.</p>
          <button
            onClick={() => setVistaActual("configuracion")}
            className="retry-button"
          >
            Volver a Configuración
          </button>
        </div>
      );
    }

    const componentes: { [key in VistaActual]: React.ReactNode } = {
      configuracion: <Configuracion />,
      productos: <Productos />,
      estadisticas: <Estadisticas />,
      usuarios: <ListaUsuarios />,
      salones: <ListaSalones />,
      mesas: <ListaMesas />,
      categorias: <ListaCategorias />,
      areas: <ListaAreas />,
      pagina86: <Pagina86 />,
    };

    return componentes[vistaActual] || <div>Contenido no disponible</div>;
  }, [vistaActual, usuario?.rol?.Nombre]);

  if (cargandoUsuario) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Error</h3>
        <p>{error}</p>
        <button
          onClick={() => navigate("/", { replace: true })}
          className="retry-button"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="error-container">
        <div className="error-icon">👤</div>
        <h3>Sesión no encontrada</h3>
        <p>Inicia sesión para continuar.</p>
        <button onClick={() => navigate("/")} className="retry-button">
          Ir al Login
        </button>
      </div>
    );
  }

  return (
    <div className="perfil-container">
      <aside
        className={`perfil-sidebar ${menuAbierto ? "abierto" : "cerrado"}`}
        role="navigation"
        aria-label="Menú de navegación principal"
      >
        <button
          className="hamburger-btn"
          onClick={toggleMenu}
          aria-expanded={menuAbierto}
          aria-controls="sidebar-content"
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
        >
          <span className="menu-text">Menú</span>
          <span className="hamburger-icon">{menuAbierto ? "✕" : "☰"}</span>
        </button>

        <div id="sidebar-content" className="sidebar-content" role="menu">
          <div className="sidebar-header">
            <UserAvatar nombre={usuario.Nombre} />
            <div className="user-info">
              <h3>{usuario.Nombre}</h3>
              <p>{usuario.rol.Nombre}</p>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Navegación Rápida</div>
            {botonesNavegacion.map((btn) => (
              <button
                key={btn.ruta}
                onClick={() => handleNavegacion(btn.ruta)}
                className={btn.className}
                title={btn.descripcion}
                role="menuitem"
              >
                <span className="icon" role="img" aria-label={btn.nombre}>
                  {btn.icono}
                </span>
                <span className="button-text">{btn.nombre}</span>
              </button>
            ))}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Administración</div>
            {botonesDisponibles.map((btn) => (
              <NavButton
                key={btn.valor}
                boton={btn}
                activo={vistaActual === btn.valor}
                onClick={() => handleVistaChange(btn.valor)}
                disabled={btn.restringido && usuario.rol.Nombre !== "ADMIN"}
              />
            ))}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Atajos de Teclado</div>
            <div className="keyboard-shortcuts">
              <small>
                <strong>Alt + M:</strong> Menú
                <br />
                <strong>Alt + H:</strong> Inicio
                <br />
                <strong>Alt + 1-3:</strong> Vistas
              </small>
            </div>
          </div>
        </div>
      </aside>

      <main
        className="perfil-contenido"
        role="main"
        aria-label="Contenido principal"
      >
        <nav className="breadcrumb" aria-label="Ruta de navegación">
          <span>Perfil</span>
          <span className="separator">›</span>
          <span className="current">
            {botonesDisponibles.find((b) => b.valor === vistaActual)?.nombre || "Sección"}
          </span>
        </nav>

        <div className="content-wrapper">{renderContenido()}</div>
      </main>

      {menuAbierto && (
        <div
          className="mobile-overlay"
          onClick={() => setMenuAbierto(false)}
          role="button"
          tabIndex={0}
          aria-label="Cerrar menú"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setMenuAbierto(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default Perfil;