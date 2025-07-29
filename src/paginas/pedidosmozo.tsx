import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "../estilos/pedidosmozo.css";

type Producto = {
  nombre: string;
  estado: number;
};

type Mesa = {
  numero: string;
  productos: Producto[];
  cliente?: { nombre: string; documento: string; tipoDoc: string } | null;
};

type Salon = {
  salon: string;
  mesas: Mesa[];
};

const socket = io(import.meta.env.VITE_BACKEND_URL, {
  transports: ["websocket"],
});

const PedidosMozo: React.FC = () => {
  const [pedidos, setPedidos] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [salonFiltro, setSalonFiltro] = useState<string>("");
  const [mesaFiltro, setMesaFiltro] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalClienteOpen, setModalClienteOpen] = useState(false);
  const [clienteData, setClienteData] = useState({
    tipoDoc: "DNI",
    documento: "",
    nombre: "",
  });
  const [clienteActual, setClienteActual] = useState<{
    nombre: string;
    documento: string;
    tipoDoc: string;
  } | null>(null);
  const [mesaActual, setMesaActual] = useState<string | null>(null);
  const [clienteError, setClienteError] = useState<string | null>(null);
  const [guardandoCliente, setGuardandoCliente] = useState(false);
  const navigate = useNavigate();

  // Función para cargar pedidos desde el backend
  const fetchPedidos = () => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/pedidos/agrupados`)
      .then((res) => res.json())
      .then((data) => {
        const salones: Salon[] = Object.entries(data).map(
          ([salon, mesasObj]) => ({
            salon,
            mesas: Object.entries(mesasObj as Record<string, any[]>).map(
              ([numero, pedidosArr]) => ({
                numero,
                productos: pedidosArr.flatMap((pedido: any) =>
                  pedido.detalles.map((detalle: any) => ({
                    nombre: detalle.producto.Nombre,
                    estado: detalle.ID_Estado,
                  }))
                ),
                cliente: pedidosArr[0]?.cliente
                  ? {
                      nombre: pedidosArr[0].cliente.Nombre,
                      documento: pedidosArr[0].cliente.Documento,
                      tipoDoc: pedidosArr[0].cliente.TipoDoc,
                    }
                  : null,
              })
            ),
          })
        );
        setPedidos(salones);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPedidos();

    socket.on("connect", () => {
      console.log("Conectado al servidor WebSocket");
    });

    socket.on("nuevo-pedido", () => {
      fetchPedidos();
    });

    return () => {
      socket.off("connect");
      socket.off("nuevo-pedido");
    };
  }, []);

  // Guardar cliente en backend
  const guardarCliente = async () => {
    setGuardandoCliente(true);
    setClienteError(null);
    try {
      const pedidoRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/pedidos/por-mesa/${mesaActual}`
      );
      const pedido = await pedidoRes.json();
      if (!pedido || !pedido.ID_Pedido) {
        setClienteError("No se encontró pedido activo para esta mesa.");
        setGuardandoCliente(false);
        return;
      }

      const resp = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/clientes/capturar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipoDoc: clienteData.tipoDoc,
            documento: clienteData.documento,
            pedidoId: pedido.ID_Pedido,
          }),
        }
      );

      // Verifica si la respuesta es JSON antes de parsear
      const contentType = resp.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setClienteError(
          "Respuesta inesperada del servidor. Verifica el backend."
        );
        setGuardandoCliente(false);
        return;
      }

      const data = await resp.json();
      if (!resp.ok) {
        setClienteError(data.error || "Error al capturar el cliente.");
        setGuardandoCliente(false);
        return;
      }

      setModalOpen(false);
      setClienteData({ tipoDoc: "DNI", documento: "", nombre: "" });
      setMesaActual(null);
      fetchPedidos();
      alert("Cliente capturado y asociado correctamente.");
    } catch (err) {
      setClienteError("Error al capturar el cliente.");
    } finally {
      setGuardandoCliente(false);
    }
  };

  if (loading) return <div>Cargando pedidos...</div>;

  // Obtener salones y mesas únicos para los filtros
  const salonesUnicos = pedidos.map((s) => s.salon);
  const mesasUnicas = salonFiltro
    ? pedidos
        .find((s) => s.salon === salonFiltro)
        ?.mesas.map((m) => m.numero) || []
    : [];

  // Filtrar pedidos según los filtros seleccionados
  const pedidosFiltrados = pedidos
    .filter((s) => !salonFiltro || s.salon === salonFiltro)
    .map((s) => ({
      ...s,
      mesas: s.mesas.filter((m) => !mesaFiltro || m.numero === mesaFiltro),
    }))
    .filter((s) => s.mesas.length > 0);

  return (
    <div style={{ padding: 0 }}>
      <div className="mozo-header">
        <button className="btn-ir-perfil" onClick={() => navigate("/perfil")}>
          Regresar a Perfil
        </button>
        <h2>Pedidos Activos</h2>
      </div>
      <div className="filtros-mozo">
        <label>
          Salón:
          <select
            value={salonFiltro}
            onChange={(e) => {
              setSalonFiltro(e.target.value);
              setMesaFiltro("");
            }}
          >
            <option value="">Todos</option>
            {salonesUnicos.map((salon) => (
              <option key={salon} value={salon}>
                {salon}
              </option>
            ))}
          </select>
        </label>
        <label>
          Mesa:
          <select
            value={mesaFiltro}
            onChange={(e) => setMesaFiltro(e.target.value)}
            disabled={!salonFiltro}
          >
            <option value="">Todas</option>
            {mesasUnicas.map((mesa) => (
              <option key={mesa} value={mesa}>
                {mesa}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mozo-pedidos-scroll">
        {pedidosFiltrados.map((salon) => (
          <div key={salon.salon} style={{ marginBottom: 32 }}>
            <h2 className="titulo-salon">{salon.salon}</h2>
            {salon.mesas.map((mesa) => (
              <div key={mesa.numero} className="mozo-mesa">
                <h3>Mesa {mesa.numero}</h3>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {mesa.productos.map((prod, idx) => (
                    <li
                      key={idx}
                      className={prod.estado === 2 ? "producto-servido" : ""}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 6,
                        color: prod.estado === 2 ? "#43e97b" : "#333",
                        fontWeight: prod.estado === 2 ? 600 : 400,
                      }}
                    >
                      {prod.estado === 2 ? (
                        <span className="mozo-producto-check">✔️</span>
                      ) : (
                        <span style={{ width: 20, marginRight: 8 }} />
                      )}
                      {prod.nombre}
                    </li>
                  ))}
                </ul>
                <button
                  className={`btn-anadir-cliente ${
                    mesa.cliente ? "actualizar" : "nuevo"
                  }`}
                  onClick={() => {
                    setMesaActual(mesa.numero);
                    setModalOpen(true);
                  }}
                >
                  {mesa.cliente ? "Actualizar Cliente" : "Añadir Cliente"}
                </button>
                {mesa.cliente && (
                  <button
                    className="btn-mostrar-cliente"
                    onClick={() => {
                      setClienteActual(mesa.cliente ?? null);
                      setModalClienteOpen(true);
                    }}
                  >
                    Mostrar Cliente
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* MODAL PARA AGREGAR CLIENTE */}
      {modalOpen && (
        <div className="modal-bg">
          <div className="modal-cliente">
            <h3>Añadir Cliente a Mesa {mesaActual}</h3>
            <label>
              Tipo de documento:
              <select
                value={clienteData.tipoDoc}
                onChange={(e) =>
                  setClienteData({ ...clienteData, tipoDoc: e.target.value })
                }
              >
                <option value="DNI">DNI</option>
                <option value="RUC">RUC</option>
              </select>
            </label>
            <label>
              Número:
              <input
                type="text"
                value={clienteData.documento}
                onChange={(e) =>
                  setClienteData({ ...clienteData, documento: e.target.value })
                }
                placeholder="Número de DNI o RUC"
              />
            </label>
            {clienteError && (
              <div style={{ color: "red", marginBottom: 8 }}>
                {clienteError}
              </div>
            )}
            <div className="modal-cliente-btns">
              <button
                className="btn-guardar-cliente"
                onClick={guardarCliente}
                disabled={!clienteData.documento || guardandoCliente}
              >
                {guardandoCliente ? "Guardando..." : "Guardar"}
              </button>
              <button
                className="btn-cancelar-cliente"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA MOSTRAR CLIENTE */}
      {modalClienteOpen && clienteActual && (
        <div className="modal-bg">
          <div className="modal-cliente">
            <h3>Cliente de la mesa</h3>
            <p>
              <strong>Tipo Doc:</strong> {clienteActual.tipoDoc}
            </p>
            <p>
              <strong>Documento:</strong> {clienteActual.documento}
            </p>
            <p>
              <strong>Nombre:</strong> {clienteActual.nombre}
            </p>
            <button
              className="btn-cancelar-cliente"
              onClick={() => setModalClienteOpen(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PedidosMozo;
