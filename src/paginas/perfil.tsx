import React, { useState, useEffect } from "react";
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

const Perfil: React.FC = () => {
  const [vistaActual, setVistaActual] = useState<
    | "configuracion"
    | "productos"
    | "pagina86"
    | "estadisticas"
    | "usuarios"
    | "salones"
    | "mesas"
    | "categorias"
    | "areas"
  >("configuracion");
  const [usuario, setUsuario] = useState<{
    Nombre: string;
    rol: { Nombre: string };
  } | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsuario = async () => {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      try {
        const res = await axios.get(`${backendUrl}/usuario`, {
          withCredentials: true,
        });
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
      navigate("/");
    }
  }, [usuario, cargandoUsuario, navigate]);

  const botones = [{ nombre: "Configuración", valor: "configuracion" }];

  if (usuario?.rol?.Nombre === "ADMIN") {
    botones.push(
      { nombre: "Productos", valor: "productos" },
      { nombre: "Estadísticas", valor: "estadisticas" },
      { nombre: "Lista de Salones", valor: "salones" },
      { nombre: "Lista de Mesas", valor: "mesas" },
      { nombre: "Lista de Categorías", valor: "categorias" },
      { nombre: "Lista de Áreas", valor: "areas" },
      { nombre: "Lista de usuarios", valor: "usuarios" },
      { nombre: "Página 86", valor: "pagina86" }
    );
  }

  if (cargandoUsuario) {
    return <div>Cargando...</div>;
  }

  const renderContenido = () => {
    if (vistaActual !== "configuracion" && usuario?.rol?.Nombre !== "ADMIN") {
      return <div>No tienes permiso para ver esta sección.</div>;
    }
    switch (vistaActual) {
      case "configuracion":
        return <Configuracion />;
      case "productos":
        return <Productos />;
      case "estadisticas":
        return <Estadisticas />;
      case "usuarios":
        return <ListaUsuarios />;
      case "salones":
        return <ListaSalones />;
      case "mesas":
        return <ListaMesas />;
      case "categorias":
        return <ListaCategorias />;
      case "areas":
        return <ListaAreas />;
      case "pagina86":
        return <Pagina86 />;
      default:
        return null;
    }
  };

  return (
    <div className="perfil-container">
      <aside className={`perfil-sidebar ${menuAbierto ? "abierto" : ""}`}>
        <button
          className="hamburger-btn"
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          ☰
        </button>
        <div className="sidebar-content">
          <button
            onClick={() => {
              navigate("/paginaprincipal");
              setMenuAbierto(false);
            }}
            className="volver-principal destacado"
          >
            🏠 Volver a principal
          </button>
          <button
            onClick={() => {
              navigate("/barravisual");
              setMenuAbierto(false);
            }}
            className="ver-barra-btn"
          >
            🍹 Ver Barra
          </button>
          <button
            onClick={() => {
              navigate("/planchavisual");
              setMenuAbierto(false);
            }}
            className="ver-plancha-btn"
          >
            🍳 Ver Plancha
          </button>
          <button
            onClick={() => {
              navigate("/mozovisual");
              setMenuAbierto(false);
            }}
            className="ver-mozo-btn"
          >
            🧑‍🍳 Ver Mozo
          </button>
          {botones.map((btn) => (
            <button
              key={btn.valor}
              onClick={() => {
                setVistaActual(btn.valor as typeof vistaActual);
                setMenuAbierto(false);
              }}
              className={vistaActual === btn.valor ? "activo" : ""}
            >
              {btn.nombre}
            </button>
          ))}
        </div>
      </aside>
      <main className="perfil-contenido">{renderContenido()}</main>
    </div>
  );
};

export default Perfil;