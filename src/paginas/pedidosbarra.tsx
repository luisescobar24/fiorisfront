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

interface DetalleBarra {
  ID_Detalle: number;
  ID_Pedido: number;
  Fecha_hora: string;
  Mesa: string | number;
  Salon: string;
  Comentario: string;
  producto: { Nombre: string };
}

const PedidosBarra: React.FC = () => {
  const [detallesBarra, setDetallesBarra] = useState<DetalleBarra[]>([]);
  const [, setServidos] = useState<{ [idDetalle: number]: number }>({});
  const navigate = useNavigate();

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
              ID_Detalle: detalle.ID_Detalle,
              ID_Pedido: pedido.ID_Pedido,
              Fecha_hora: pedido.Fecha_hora,
              Mesa: pedido.mesa?.Numero_mesa || "Sin mesa",
              Salon: pedido.mesa?.salon?.Nombre || "Sin salón",
              Comentario:
                detalle.Comentario?.split(";")[unidadIdx]?.trim() ||
                detalle.Comentario ||
                "Sin comentario",
              producto: { Nombre: detalle.producto.Nombre },
            }))
          )
      );

      setDetallesBarra(detalles);
      setServidos({});
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
      fetchPedidos();
    });

    // Escuchar producto-servido para refrescar en tiempo real
    socket.on("producto-servido", () => {
      fetchPedidos();
    });

    return () => {
      socket.off("nuevo-pedido");
      socket.off("producto-servido");
      socket.off("connect");
    };
  }, [fetchPedidos]);

  const marcarComoServido = async (idDetalle: number) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/detalles/${idDetalle}/estado`,
        { estado: 2 },
        { withCredentials: true }
      );
      setDetallesBarra((prev) =>
        prev.filter((d) => d.ID_Detalle !== idDetalle)
      );
    } catch (error) {
      alert("No se pudo actualizar el estado");
    }
  };

  const handleServirUnidad = (detalle: DetalleBarra, idx: number) => {
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
      const totalUnidades = detallesBarra.filter(
        (d) => d.ID_Detalle === detalle.ID_Detalle
      ).length;
      if (nuevo[detalle.ID_Detalle] === totalUnidades) {
        marcarComoServido(detalle.ID_Detalle);
      }
      return nuevo;
    });
  };

  const getTimerColor = (remainingSeconds: number) => {
    const remainingMinutes = Math.floor(remainingSeconds / 60);
    if (remainingSeconds <= 0) return "timer-red-intense";
    if (remainingMinutes <= 2) return "timer-red";
    if (remainingMinutes <= 5) return "timer-orange";
    if (remainingMinutes <= 10) return "timer-yellow";
    return "timer-green";
  };

  const Timer = ({ fechaHora }: { fechaHora: string }) => {
    const initialTime = 15 * 60; // 15 minutes in seconds
    const [timeLeft, setTimeLeft] = useState(initialTime);

    useEffect(() => {
      const startTime = new Date(fechaHora).getTime();
      const endTime = startTime + initialTime * 1000;

      const updateTimer = () => {
        const now = new Date().getTime();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeLeft(remaining);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }, [fechaHora]);

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
      const secs = (seconds % 60).toString().padStart(2, "0");
      return `${mins}:${secs}`;
    };

    const progress = (timeLeft / initialTime) * 100;
    const timerClass = getTimerColor(timeLeft);

    return (
      <div className={`timer-container ${timerClass}`}>
        <svg viewBox="0 0 36 36">
          <circle className="timer-circle-bg" cx="18" cy="18" r="16" />
          <circle
            className={`timer-circle-progress ${timerClass}`}
            cx="18"
            cy="18"
            r="16"
            strokeDasharray="100.53"
            strokeDashoffset={100.53 * (1 - progress / 100)}
            transform="rotate(-90 18 18)"
          />
        </svg>
        <span>{timeLeft <= 0 ? "Tiempo agotado" : formatTime(timeLeft)}</span>
      </div>
    );
  };

  return (
    <div className="pedidos-container">
      <div className="barra-header">
        <button onClick={() => navigate("/perfil")} className="btn-ir-perfil">
          Ir a Perfil
        </button>
        <h2>Productos de Barra Activos</h2>
      </div>
      <div className="pedidos-grid">
        {detallesBarra.length === 0 ? (
          <div className="pedido-vacio">
            <span>No hay pedidos activos</span>
          </div>
        ) : (
          detallesBarra
            .sort(
              (a, b) =>
                new Date(a.Fecha_hora).getTime() -
                new Date(b.Fecha_hora).getTime()
            )
            .map((detalle, idx) => (
              <div
                key={`${detalle.ID_Detalle}-${idx}`}
                className={`pedido ${getTimerColor(
                  Math.max(
                    0,
                    Math.floor(
                      (new Date(detalle.Fecha_hora).getTime() +
                        15 * 60 * 1000 -
                        new Date().getTime()) /
                        1000
                    )
                  )
                )}`}
              >
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
                <Timer fechaHora={detalle.Fecha_hora} />
                <p>
                  <strong>Comentario:</strong> {detalle.Comentario}
                </p>
                <button
                  className="btn-servido"
                  onClick={() => handleServirUnidad(detalle, idx)}
                >
                  Servido
                </button>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default PedidosBarra;