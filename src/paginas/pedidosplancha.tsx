import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import "../estilos/pedidosplancha.css";

const socket = io(import.meta.env.VITE_BACKEND_URL, {
  transports: ["websocket"],
});

interface Pedido {
  ID_Pedido: number;
  Fecha_hora: string;
  ID_Estado: number;
  mesa?: {
    Numero_mesa: number;
    salon?: {
      Nombre: string;
    };
  };
  detalles: {
    ID_Detalle: number;
    Cantidad: number;
    Comentario?: string;
    producto: {
      Nombre: string;
      area?: { Nombre: string };
    };
  }[];
}

const PedidosPlancha = () => {
  const [detallesPlancha, setDetallesPlancha] = useState<any[]>([]);
  const [, setServidos] = useState<{ [idDetalle: number]: number }>({});
  const navigate = useNavigate();

  const fetchPedidos = useCallback(async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/pedidos/plancha`,
        { withCredentials: true }
      );

      const pedidosFiltrados = res.data.filter(
        (pedido: Pedido) => pedido.ID_Estado === 1
      );

      const detalles = pedidosFiltrados.flatMap((pedido: Pedido) =>
        pedido.detalles
          .filter((detalle) => detalle.producto.area?.Nombre === "Plancha")
          .flatMap((detalle) =>
            Array.from({ length: detalle.Cantidad }).map((_, unidadIdx) => ({
              ...detalle,
              ID_Pedido: pedido.ID_Pedido,
              Fecha_hora: pedido.Fecha_hora,
              Mesa: pedido.mesa?.Numero_mesa || "Sin mesa",
              Salon: pedido.mesa?.salon?.Nombre || "Sin salón", // <--- AGREGA ESTA LÍNEA
              Comentario:
                detalle.Comentario?.split(";")[unidadIdx]?.trim() ||
                detalle.Comentario ||
                "Sin comentario",
            }))
          )
      );

      setDetallesPlancha(detalles);
      setServidos({});
    } catch (error) {
      console.error("Error al obtener pedidos de plancha:", error);
    }
  }, []);

  useEffect(() => {
    fetchPedidos();

    socket.on("connect", () => {
      console.log("Conectado al servidor WebSocket");
    });

    socket.on("nuevo-pedido", () => {
      fetchPedidos();
    });

    return () => {
      socket.off("nuevo-pedido");
    };
  }, [fetchPedidos]);

  const marcarComoServido = async (idDetalle: number) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/detalles/${idDetalle}/estado`,
        { estado: 2 },
        { withCredentials: true }
      );
      setDetallesPlancha((prev) =>
        prev.filter((d) => d.ID_Detalle !== idDetalle)
      );
    } catch (error) {
      alert("No se pudo actualizar el estado");
    }
  };

  const handleServirUnidad = (detalle: any, idx: number) => {
    setDetallesPlancha((prev) => {
      const copia = [...prev];
      copia.splice(idx, 1);
      return copia;
    });

    setServidos((prev) => {
      const nuevo = {
        ...prev,
        [detalle.ID_Detalle]: (prev[detalle.ID_Detalle] || 0) + 1,
      };
      const totalUnidades = detallesPlancha.filter(
        (d) => d.ID_Detalle === detalle.ID_Detalle
      ).length;
      if (nuevo[detalle.ID_Detalle] === totalUnidades) {
        marcarComoServido(detalle.ID_Detalle);
      }
      return nuevo;
    });
  };

  return (
    <div>
      <div className="barra-header">
        <button onClick={() => navigate("/perfil")} className="btn-ir-perfil">
          Ir a Perfil
        </button>
        <h2>Productos de Plancha Activos</h2>
      </div>
      <div className="pedidos-grid">
        {detallesPlancha
          .sort(
            (a, b) =>
              new Date(a.Fecha_hora).getTime() -
              new Date(b.Fecha_hora).getTime()
          )
          .map((detalle, idx) => (
            <div key={detalle.ID_Detalle + "-" + idx} className="pedido">
              <h3>{detalle.producto.Nombre}</h3>
              <p>
                <strong>Mesa:</strong> {detalle.Mesa}
              </p>
              <p>
                <strong>Salón:</strong> {detalle.Salon}
              </p>
              <p>
                <strong>Fecha:</strong>{" "}
                {new Date(detalle.Fecha_hora).toLocaleString()}
              </p>
              <p>
                <strong>Comentario:</strong>{" "}
                {detalle.Comentario || "Sin comentario"}
              </p>
              <button
                style={{ marginTop: 8 }}
                onClick={() => handleServirUnidad(detalle, idx)}
              >
                Servido
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};

export default PedidosPlancha;
