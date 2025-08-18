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

type Rol = "ADMIN" | "USER" | string;

interface Boton {
  nombre: string;
  valor: VistaActual;
  icono: string;
  descripcion?: string;
  rolesPermitidos: Rol[];
}

const LoadingSpinner: React.FC = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p className="loading-text">Cargando tu perfil...</p>
  </div>
);



const NavButton: React.FC<{
  boton: Boton;
  activo: boolean;
  onClick: () => void;
  disabled: boolean;
}> = ({ boton, activo, onClick, disabled }) => (
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
  useEffect(() => {
    const previousTitle = document.title;
    const previousIcon = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    const prevHref = previousIcon?.href || null;
    document.title = 'Perfil - Fioris';
    if (previousIcon) {
      previousIcon.href = '/fioris.jpg';
    } else {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = '/fioris.jpg';
      document.head.appendChild(link);
    }
    return () => {
      document.title = previousTitle;
      if (previousIcon && prevHref) previousIcon.href = prevHref;
    };
  }, []);
  const [vistaActual, setVistaActual] = useState<VistaActual>("configuracion");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const botones: Boton[] = [
    {
      nombre: "Configuración",
      valor: "configuracion",
      icono: "⚙️",
      descripcion: "Ajusta tu perfil y preferencias",
      rolesPermitidos: ["ADMIN", "USER"],
    },
    {
      nombre: "Página 86",
      valor: "pagina86",
      icono: "📄",
      descripcion: "Accede a la página especial",
      rolesPermitidos: ["ADMIN", "USER"],
    },
    {
      nombre: "Productos",
      valor: "productos",
      icono: "📦",
      descripcion: "Administra el catálogo de productos",
      rolesPermitidos: ["ADMIN"],
    },
    {
      nombre: "Estadísticas Generales",
      valor: "estadisticas",
      icono: "📊",
      descripcion: "Consulta reportes y análisis",
      rolesPermitidos: ["ADMIN"],
    },
    {
      nombre: "Salones",
      valor: "salones",
      icono: "🏢",
      descripcion: "Gestiona los salones del restaurante",
      rolesPermitidos: ["ADMIN"],
    },
    {
      nombre: "Mesas",
      valor: "mesas",
      icono: "🪑",
      descripcion: "Organiza la distribución de mesas",
      rolesPermitidos: ["ADMIN"],
    },
    {
      nombre: "Categorías",
      valor: "categorias",
      icono: "📂",
      descripcion: "Administra las categorías de productos",
      rolesPermitidos: ["ADMIN"],
    },
    {
      nombre: "Áreas",
      valor: "areas",
      icono: "🗺️",
      descripcion: "Configura las áreas de trabajo",
      rolesPermitidos: ["ADMIN"],
    },
    {
      nombre: "Usuarios",
      valor: "usuarios",
      icono: "👥",
      descripcion: "Gestiona los usuarios del sistema",
      rolesPermitidos: ["ADMIN"],
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
    const rolUsuario = usuario?.rol?.Nombre as Rol;
    return botones.filter((boton) =>
      boton.rolesPermitidos.includes(rolUsuario)
    );
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
          navigate("/");
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
  }, [navigate]);

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
            if (botonesDisponibles.some((b) => b.valor === "productos")) {
              setVistaActual("productos");
            }
            break;
          case "3":
            if (botonesDisponibles.some((b) => b.valor === "estadisticas")) {
              setVistaActual("estadisticas");
            }
            break;
          case "m":
            setMenuAbierto((prev) => !prev);
            break;
          case "h":
            navigate("/paginaprincipal");
            break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [botonesDisponibles, navigate]);

  const handleVistaChange = useCallback((vista: VistaActual) => {
    const boton = botones.find((b) => b.valor === vista);
    const rolUsuario = usuario?.rol?.Nombre as Rol;
    if (!boton || !boton.rolesPermitidos.includes(rolUsuario)) {
      return;
    }

    setVistaActual(vista);
    setMenuAbierto(false);
    const contenido = document.querySelector(".perfil-contenido");
    if (contenido) {
      contenido.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [usuario?.rol?.Nombre, botones]);

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
  }, [vistaActual]);

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
      <header className="perfil-header">
        <button
          className="menu-button"
          onClick={toggleMenu}
          aria-expanded={menuAbierto}
          aria-controls="menu-dropdown"
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
        >
          <span className="menu-text">Menú</span>
          <span className="menu-icon">{menuAbierto ? "✕" : "☰"}</span>
        </button>

        {menuAbierto && (
          <>
            <div 
              className="menu-dropdown"
              id="menu-dropdown"
              role="menu"
            >
              <div className="menu-header">
                <div className="user-info">
                  <h3>{usuario.Nombre}</h3>
                  <p>{usuario.rol.Nombre}</p>
                </div>
              </div>

              <div className="menu-section">
                <div className="menu-section-title">Navegación Rápida</div>
                {botonesNavegacion.map((btn) => (
                  <button
                    key={btn.ruta}
                    onClick={() => {
                      handleNavegacion(btn.ruta);
                      setMenuAbierto(false);
                    }}
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

              <div className="menu-section">
                <div className="menu-section-title">Herramientas</div>
                {botonesDisponibles.map((btn) => (
                  <NavButton
                    key={btn.valor}
                    boton={btn}
                    activo={vistaActual === btn.valor}
                    onClick={() => {
                      handleVistaChange(btn.valor);
                      setMenuAbierto(false);
                    }}
                    disabled={false}
                  />
                ))}
              </div>

              <div className="menu-section">
                <div className="menu-section-title">Atajos de Teclado</div>
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
            <div 
              className="menu-overlay"
              onClick={() => setMenuAbierto(false)}
              role="presentation"
            />
          </>
        )}
      </header>

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
    </div>
  );
};

export default Perfil;