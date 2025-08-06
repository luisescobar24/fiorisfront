import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "../estilos/pedidosmozo.css";

interface Producto {
  id: number; // Added for unique identification
  productoId: number; // Added to match usage in code
  ID_Detalle: number; // Added to match usage in code
  nombre: string;
  estado: number;
  cantidad: number;
}

interface Mesa {
  numero: string;
  productos: Producto[];
  cliente?: { nombre: string; documento: string; tipoDoc: string } | null;
}

interface Salon {
  salon: string;
  mesas: Mesa[];
}

const socket = io(import.meta.env.VITE_BACKEND_URL, {
  transports: ["websocket"],
});

const PedidosMozo: React.FC = () => {
  const primeraCarga = useRef(true);
  const [pedidos, setPedidos] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [salonFiltro, setSalonFiltro] = useState<string>("");
  const [mesaFiltro, setMesaFiltro] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalClienteOpen, setModalClienteOpen] = useState(false);
  const [clienteData, setClienteData] = useState({
    tipoDoc: "DNI",
    documento: "",
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

  // Fetch initial orders from the backend
  const fetchPedidos = useCallback(async (forzarLoading = false) => {
    if (primeraCarga.current || forzarLoading) setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/pedidos/agrupados`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Error fetching pedidos");
      const data = await res.json();

      const salones: Salon[] = Object.entries(data).map(
        ([salon, mesasObj]) => ({
          salon,
          mesas: Object.entries(mesasObj as Record<string, any[]>).map(
            ([numero, pedidosArr]) => ({
              numero,
              productos: pedidosArr.flatMap((pedido: any) =>
                pedido.detalles.map((detalle: any, index: number) => ({
                  id: `${detalle.ID_Producto}-${pedido.ID_Pedido}-${index}`,
                  productoId: detalle.ID_Producto,
                  ID_Detalle: detalle.ID_Detalle,
                  nombre: detalle.producto ? detalle.producto.Nombre : "Producto eliminado",
                  estado: detalle.ID_Estado,
                  cantidad: 1,
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
    } catch (error) {
      console.error("Error al obtener pedidos:", error);
      setClienteError("Error al cargar los pedidos. Intenta de nuevo.");
    } finally {
      setLoading(false);
      primeraCarga.current = false; // Marcar que ya no es la primera carga
    }
  }, []);

  // Update product status locally without refetching
  const updateProductoServido = useCallback(
    (salon: string, mesa: string, productoId: number, estado: number) => {
      setPedidos((prevPedidos) =>
        prevPedidos.map((s) =>
          s.salon === salon
            ? {
                ...s,
                mesas: s.mesas.map((m) =>
                  m.numero === mesa
                    ? {
                        ...m,
                        productos: m.productos.map((p) =>
                          p.productoId === productoId ? { ...p, estado } : p
                        ),
                      }
                    : m
                ),
              }
            : s
        )
      );
    },
    []
  );

  // Set up WebSocket listeners
  useEffect(() => {
    fetchPedidos(true); // Solo la primera vez muestra loading

    socket.on("connect", () => {
      console.log("Conectado al servidor WebSocket");
    });

    socket.on("nuevo-pedido", () => {
      console.log("Nuevo pedido recibido, refetching...");
      fetchPedidos(); // No muestra loading
    });

    socket.on(
      "producto-servido",
      (data: {
        salon: string;
        mesa: string;
        detalleId: number;
        estado: number;
      }) => {
        console.log("Producto servido recibido:", data);
        if (
          data.salon &&
          data.mesa &&
          data.detalleId !== undefined &&
          data.estado !== undefined
        ) {
          setPedidos((prevPedidos) =>
            prevPedidos.map((s) =>
              s.salon === data.salon
                ? {
                    ...s,
                    mesas: s.mesas.map((m) =>
                      m.numero === data.mesa
                        ? {
                            ...m,
                            productos: m.productos.map((p) =>
                              p.ID_Detalle === data.detalleId
                                ? { ...p, estado: data.estado }
                                : p
                            ),
                          }
                        : m
                    ),
                  }
                : s
            )
          );
        } else {
          console.error("Datos incompletos en producto-servido:", data);
        }
      }
    );

    socket.on("producto-eliminado", ({ detalleId }) => {
      setPedidos((prevPedidos) =>
        prevPedidos.map((s) => ({
          ...s,
          mesas: s.mesas.map((m) => ({
            ...m,
            productos: m.productos.filter((p) => p.ID_Detalle !== detalleId),
          })),
        }))
      );
    });

    return () => {
      socket.off("connect");
      socket.off("nuevo-pedido");
      socket.off("producto-servido");
      socket.off("producto-eliminado");
    };
  }, [fetchPedidos, updateProductoServido]);

  // Save or update client data
  const guardarCliente = async () => {
    if (!mesaActual || !clienteData.documento) {
      setClienteError("Por favor, completa todos los campos requeridos.");
      return;
    }

    setGuardandoCliente(true);
    setClienteError(null);
    try {
      const pedidoRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/pedidos/por-mesa/${mesaActual}`,
        { credentials: "include" }
      );
      if (!pedidoRes.ok)
        throw new Error("No se encontró pedido activo para esta mesa.");
      const pedido = await pedidoRes.json();
      if (!pedido || !pedido.ID_Pedido) {
        throw new Error("No se encontró pedido activo para esta mesa.");
      }

      // Busca el salón de la mesa actual
      const mesaSalon = pedidos.find((salon) =>
        salon.mesas.some((m) => m.numero === mesaActual)
      );
      const salonNombre = mesaSalon?.salon ?? "";

      const resp = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/clientes/capturar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            tipoDoc: clienteData.tipoDoc,
            documento: clienteData.documento,
            pedidoId: pedido.ID_Pedido,
            mesa: mesaActual,
            salon: salonNombre, // <-- agrega esto
          }),
        }
      );

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || "Error al capturar el cliente.");
      }

      // Espera a que fetchPedidos termine antes de cerrar el modal
      await fetchPedidos();
      setModalOpen(false);
      setClienteData({ tipoDoc: "DNI", documento: "" });
      setMesaActual(null);
      alert("Cliente capturado y asociado correctamente.");
    } catch (err) {
      setClienteError(
        err instanceof Error
          ? err.message
          : "Error al conectar con el servidor."
      );
      console.error("Error al guardar cliente:", err);
    } finally {
      setGuardandoCliente(false);
    }
  };

  // Memoize filtered orders to optimize performance
  const pedidosFiltrados = useMemo(
    () =>
      pedidos
        .filter((s) => !salonFiltro || s.salon === salonFiltro)
        .map((s) => ({
          ...s,
          mesas: s.mesas.filter((m) => !mesaFiltro || m.numero === mesaFiltro),
        }))
        .filter((s) => s.mesas.length > 0),
    [pedidos, salonFiltro, mesaFiltro]
  );

  // Unique salons and mesas for filters
  const salonesUnicos = useMemo(() => pedidos.map((s) => s.salon), [pedidos]);
  const mesasUnicas = useMemo(
    () =>
      salonFiltro
        ? pedidos
            .find((s) => s.salon === salonFiltro)
            ?.mesas.map((m) => m.numero) || []
        : [],
    [pedidos, salonFiltro]
  );

  if (loading) return <div className="pedido-vacio">Cargando pedidos...</div>;

  return (
    <div className="pedidos-container">
      <div className="mozo-header">
        <button className="btn-ir-perfil" onClick={() => navigate("/perfil")}>
          Ir a Perfil
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
      <div className="pedidos-grid">
        {pedidosFiltrados.length === 0 ? (
          <div className="pedido-vacio">
            <span>No hay pedidos activos</span>
          </div>
        ) : (
          pedidosFiltrados.map((salon) =>
            salon.mesas.map((mesa) => (
              <div key={`${salon.salon}-${mesa.numero}`} className="mozo-mesa">
                <h3>
                  Mesa {mesa.numero} - {salon.salon}
                </h3>
                <ul>
                  {mesa.productos.map((prod) => (
                    <li
                      key={prod.id}
                      style={{ color: prod.estado === 2 ? "green" : "black" }}
                      className={prod.estado === 2 ? "producto-servido" : ""}
                    >
                      {prod.estado === 2 && (
                        <span className="mozo-producto-check">✔️</span>
                      )}
                      {prod.nombre}{" "}
                      {prod.cantidad > 1 ? `x${prod.cantidad}` : ""}
                      <button
                        className="btn-eliminar-producto"
                        style={{ marginLeft: 8, color: "#e74c3c" }}
                        onClick={async () => {
                          if (window.confirm("¿Eliminar este producto?")) {
                            try {
                              const res = await fetch(
                                `${import.meta.env.VITE_BACKEND_URL}/detalles/${
                                  prod.ID_Detalle
                                }`,
                                { method: "DELETE", credentials: "include" }
                              );
                              const data = await res.json();
                              if (!res.ok)
                                throw new Error(
                                  data.error ||
                                    "No se pudo eliminar el producto"
                                );
                              // El producto será eliminado automáticamente por el evento socket
                            } catch (err) {
                              alert("Error al eliminar el producto.");
                            }
                          }
                        }}
                      >
                        🗑️
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  className={`btn-anadir-cliente ${
                    mesa.cliente ? "actualizar" : "nuevo"
                  }`}
                  onClick={async () => {
                    setMesaActual(mesa.numero);
                    // Si hay cliente, muestra sus datos
                    if (mesa.cliente) {
                      setClienteData({
                        tipoDoc: mesa.cliente.tipoDoc,
                        documento: mesa.cliente.documento,
                      });
                    } else {
                      setClienteData({
                        tipoDoc: "DNI",
                        documento: "",
                      });
                    }
                    setClienteError(null);
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
                <button
                  className="btn-eliminar-pedido"
                  style={{
                    marginTop: "10px",
                    background: "#e74c3c",
                    color: "#fff",
                  }}
                  onClick={async () => {
                    if (
                      window.confirm(
                        "¿Seguro que deseas eliminar el pedido de esta mesa?"
                      )
                    ) {
                      try {
                        // Elimina todos los pedidos de la mesa y salón
                        const res = await fetch(
                          `${import.meta.env.VITE_BACKEND_URL}/pedidos`,
                          {
                            method: "DELETE",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              mesa: mesa.numero,
                              salon: salon.salon,
                            }),
                          }
                        );
                        const data = await res.json();
                        if (!res.ok)
                          throw new Error(
                            data.error || "No se pudo eliminar el pedido"
                          );
                        await fetchPedidos();
                        alert("Pedido(s) eliminado(s) correctamente.");
                      } catch (err) {
                        alert("Error al eliminar el pedido.");
                      }
                    }
                  }}
                >
                  Eliminar Pedido
                </button>
              </div>
            ))
          )
        )}
      </div>

      {modalOpen && (
        <div className="modal-bg">
          <div className="modal-cliente">
            <h3>
              {mesaActual && clienteData.documento ? "Actualizar" : "Añadir"}{" "}
              Cliente a Mesa {mesaActual}
            </h3>
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
                onChange={(e) => {
                  const input = e.target.value;
                  if (/^\d{0,11}$/.test(input)) {
                    setClienteData({ ...clienteData, documento: input });
                  }
                }}
                placeholder="Número de DNI o RUC"
              />
            </label>
            {clienteError && (
              <div className="error-message">{clienteError}</div>
            )}
            <div className="modal-cliente-btns">
              <button
                className="btn-guardar-cliente"
                onClick={guardarCliente}
                disabled={!clienteData.documento || guardandoCliente}
              >
                {guardandoCliente
                  ? "Guardando..."
                  : mesaActual && clienteData.documento
                  ? "Actualizar"
                  : "Añadir"}
              </button>
              <button
                className="btn-cancelar-cliente"
                onClick={() => {
                  setModalOpen(false);
                  setClienteData({ tipoDoc: "DNI", documento: "" });
                  setClienteError(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalClienteOpen && clienteActual && (
        <div className="modal-bg">
          <div className="modal-cliente">
            <h3>Cliente de la Mesa {mesaActual}</h3>
            <p>
              <strong>Tipo Doc:</strong> {clienteActual.tipoDoc}
            </p>
            <p>
              <strong>Documento:</strong> {clienteActual.documento}
            </p>
            <p>
              <strong>Nombre:</strong>{" "}
              {clienteActual.nombre || "No especificado"}
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
