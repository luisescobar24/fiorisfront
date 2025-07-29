import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import "../estilos/pedidosbarra.css";

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

const PedidosBarra = () => {
  const [detallesBarra, setDetallesBarra] = useState<any[]>([]);
  const [, setServidos] = useState<{ [idDetalle: number]: number }>({});
  const navigate = useNavigate();

  // Extrae la función para poder reutilizarla
  const fetchPedidos = useCallback(async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/pedidos/barra`,
        { withCredentials: true }
      );

      const pedidosFiltrados = res.data.filter(
        (pedido: Pedido) => pedido.ID_Estado === 1
      );

      const detalles = pedidosFiltrados.flatMap((pedido: Pedido) =>
        pedido.detalles
          .filter((detalle) => detalle.producto.area?.Nombre === "Barra")
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

      setDetallesBarra(detalles);
      setServidos({}); // Reinicia el conteo al recargar
    } catch (error) {
      console.error("Error al obtener pedidos de barra:", error);
    }
  }, []);

  useEffect(() => {
    fetchPedidos();

    socket.on("connect", () => {
      console.log("Conectado al servidor WebSocket");
    });

    socket.on("nuevo-pedido", () => {
      fetchPedidos(); // Refresca la lista cuando llega un nuevo pedido
    });

    return () => {
      socket.off("nuevo-pedido");
    };
  }, [fetchPedidos]);

  // Cambiar estado de un detalle a 2 en la base de datos
  const marcarComoServido = async (idDetalle: number) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/detalles/${idDetalle}/estado`,
        { estado: 2 },
        { withCredentials: true }
      );
      // Elimina todas las unidades de ese detalle del frontend
      setDetallesBarra((prev) =>
        prev.filter((d) => d.ID_Detalle !== idDetalle)
      );
    } catch (error) {
      alert("No se pudo actualizar el estado");
    }
  };

  // Cuando se marca una unidad como servida
  const handleServirUnidad = (detalle: any, idx: number) => {
    setDetallesBarra((prev) => {
      const copia = [...prev];
      copia.splice(idx, 1);
      return copia;
    });

    setServidos((prev) => {
      const nuevo = {
        ...prev,
        [detalle.ID_Detalle]: (prev[detalle.ID_Detalle] || 0) + 1,
      };
      // Si ya se sirvieron todas las unidades, actualiza en la base de datos
      const totalUnidades = detallesBarra.filter(
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
        <h2>Productos de Barra Activos</h2>
      </div>
      <div className="pedidos-grid">
        {detallesBarra
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

export default PedidosBarra;
