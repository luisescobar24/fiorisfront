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
import ModalDetallePedido from "../modales/modal_detalle_pedido";

interface Producto {
  id: string;
  productoId: number;
  ID_Detalle: number;
  nombre: string;
  estado: number;
  cantidad: number;
  detalleIds?: number[];
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

  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [detalleMesa, setDetalleMesa] = useState<{ mesa: string; salon: string } | null>(null);
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
            ([numero, pedidosArr]) => {
              const productosRaw = pedidosArr.flatMap((pedido: any) =>
                pedido.detalles.map((detalle: any, index: number) => ({
                  id: `${detalle.ID_Producto}-${detalle.ID_Estado}-${pedido.ID_Pedido}-${index}`,
                  productoId: detalle.ID_Producto,
                  ID_Detalle: detalle.ID_Detalle,
                  nombre: detalle.producto
                    ? detalle.producto.Nombre
                    : "Producto eliminado",
                  estado: detalle.ID_Estado,
                  // Use the real quantity from backend
                  cantidad: detalle.Cantidad ?? 1,
                  // detalleIds debe reflejar cada unidad pedida
                  detalleIds: Array(detalle.Cantidad ?? 1).fill(detalle.ID_Detalle),
                }))
              );
              const productos = agruparProductosCondicional(productosRaw);
              return {
                numero,
                productos,
                cliente: pedidosArr[0]?.cliente
                  ? {
                      nombre: pedidosArr[0].cliente.Nombre,
                      documento: pedidosArr[0].cliente.Documento,
                      tipoDoc: pedidosArr[0].cliente.TipoDoc,
                    }
                  : null,
              };
            }
          ),
        })
      );
      setPedidos(salones);
    } catch (error) {
      console.error("Error al obtener pedidos:", error);
    } finally {
      setLoading(false);
      primeraCarga.current = false;
    }
  }, []);

  function agruparProductosCondicional(productos: Producto[]): Producto[] {
    // Agrupar por productoId y por estado, sumando cantidades y concatenando detalleIds.
    const grupos: Record<
      number,
      Record<
        number,
        { nombre: string; cantidad: number; detalleIds: number[]; base?: Producto }
      >
    > = {};

    for (const p of productos) {
      const pid = p.productoId;
      const est = p.estado ?? 0;
      const cantidad = p.cantidad ?? 1;
      const ids = p.detalleIds ?? [p.ID_Detalle];
      const nombre = p.nombre.split(" x")[0];
      grupos[pid] ??= {};
      grupos[pid][est] ??= { nombre, cantidad: 0, detalleIds: [], base: p };
      grupos[pid][est].cantidad += cantidad;
      grupos[pid][est].detalleIds.push(...ids);
    }

    const resultado: Producto[] = [];
    for (const [pidStr, estados] of Object.entries(grupos)) {
      for (const [estStr, info] of Object.entries(estados)) {
        const estNum = Number(estStr);
        const base = info.base!;
        resultado.push({
          ...base,
          productoId: Number(pidStr),
          cantidad: info.cantidad,
          nombre: base.nombre.split(" x")[0],
          estado: estNum,
          id: `${pidStr}-${estNum}`,
          detalleIds: info.detalleIds,
          ID_Detalle: base.ID_Detalle,
        });
      }
    }

    return resultado;
  }

  // Actualiza estado de producto servido
  const updateProductoServido = useCallback(
    (salon: string, mesa: string, nuevoEstado: number, detalleId: number) => {
      setPedidos((prev) =>
        prev.map((s) =>
          s.salon !== salon
            ? s
            : {
                ...s,
                mesas: s.mesas.map((m) =>
                  m.numero !== mesa
                    ? m
                    : {
                        ...m,
                        productos: agruparProductosCondicional(
                          m.productos
                            .flatMap((p) => {
                              const contiene = (
                                p.detalleIds ?? [p.ID_Detalle]
                              ).includes(detalleId);
                              if (!contiene) return [p];
                              const ids = p.detalleIds ?? [p.ID_Detalle];
                              return ids.map((idDet) => ({
                                ...p,
                                id: `${p.productoId}-${p.estado}-${idDet}`,
                                ID_Detalle: idDet,
                                cantidad: 1,
                                nombre: p.nombre.split(" x")[0],
                                detalleIds: [idDet],
                              }));
                            })
                            .map((p) =>
                              p.ID_Detalle === detalleId
                                ? { ...p, estado: nuevoEstado }
                                : p
                            )
                        ),
                      }
                ),
              }
        )
      );
    },
    []
  );

  // WebSocket listeners
  useEffect(() => {
    fetchPedidos(true);
    socket.on("connect", () => {
      console.log("Conectado al servidor WebSocket");
    });
    socket.on("nuevo-pedido", () => {
      fetchPedidos();
    });
    socket.on(
      "producto-servido",
      (data: {
        salon: string;
        mesa: string;
        productoId: number;
        detalleId: number;
        estado: number;
      }) => {
        if (
          data.salon &&
          data.mesa &&
          data.detalleId !== undefined &&
          data.estado !== undefined
        ) {
          updateProductoServido(
            data.salon,
            data.mesa,
            data.estado,
            data.detalleId
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

  // Guardar o actualizar cliente

  // Eliminar producto desde el modal detalle y refrescar
  const handleEliminarProducto = async (idDetalle: number) => {
    if (window.confirm("¿Eliminar este producto?")) {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/detalles/${idDetalle}`,
          { method: "DELETE", credentials: "include" }
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "No se pudo eliminar el producto");
        await fetchPedidos();
      } catch (err) {
        alert("Error al eliminar el producto.");
      }
    }
  };

  // Memoize filtered orders
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
      <button
        className="btn-ir-perfil"
        onClick={() => navigate("/perfil")}
      >
        Ir a Perfil
      </button>
      <h2 className="pedidos-activos">Pedidos Activos</h2>
      </div>
      <div className="filtros-mozo">
      <label>
        Salón:
        <select
        value={salonFiltro}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          setSalonFiltro(e.target.value);
          setMesaFiltro("");
        }}
        >
        <option value="">Todos</option>
        {salonesUnicos.map((salon: string) => (
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
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMesaFiltro(e.target.value)}
        disabled={!salonFiltro}
        >
        <option value="">Todas</option>
        {mesasUnicas.map((mesa: string) => (
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
        pedidosFiltrados.map((salon: Salon) =>
          salon.mesas.map((mesa: Mesa) => (
            <div key={`${salon.salon}-${mesa.numero}`} className="mozo-mesa">
              <h3>
                Mesa {mesa.numero} - {salon.salon}
              </h3>
              <ul>
                {(() => {
                  const grupos: Record<
                    number,
                    {
                      nombre: string;
                      estados: Record<number, { cantidad: number; detalleIds: number[] }>;
                      total: number;
                    }
                  > = {};
                  for (const p of mesa.productos) {
                    const pid = p.productoId;
                    const est = p.estado ?? 0;
                    const nombre = p.nombre.split(" x")[0];
                    if (!grupos[pid]) {
                      grupos[pid] = { nombre, estados: {}, total: 0 };
                    }
                    grupos[pid].estados[est] = grupos[pid].estados[est] ?? { cantidad: 0, detalleIds: [] };
                    grupos[pid].estados[est].cantidad += p.cantidad ?? 1;
                    grupos[pid].estados[est].detalleIds.push(...(p.detalleIds ?? [p.ID_Detalle]));
                    grupos[pid].total += p.cantidad ?? 1;
                  }

                  return Object.entries(grupos).map(([pid, g]) => (
                    <li
                      key={pid}
                      style={{ color: (g.estados[2]?.cantidad ?? 0) === g.total ? "green" : "black" }}
                      className={(g.estados[2]?.cantidad ?? 0) === g.total ? "producto-servido" : ""}
                    >
                      {g.nombre} {g.total > 1 ? `x${g.total}` : ""}
                      <span style={{ marginLeft: 8 }}>
                        {Object.entries(g.estados).map(([estStr, info]) => {
                          const estNum = Number(estStr);
                          return (
                            <span
                              key={estStr}
                              className={`estado-badge estado-${estNum}`}
                              style={{
                                display: "inline-block",
                                marginLeft: 6,
                                padding: "2px 6px",
                                borderRadius: 12,
                                background: estNum === 2 ? "#d4f7dc" : "#eee",
                                color: estNum === 2 ? "#1b6b2f" : "#333",
                                fontSize: 12,
                              }}
                              title={`Estado ${estNum}: ${info.cantidad}`}
                            >
                              {info.cantidad}
                              {estNum === 2 ? " ✓" : ""}
                            </span>
                          );
                        })}
                      </span>
                    </li>
                  ));
                })()}
              </ul>
              <div className="mesa-botones">
                <button
                  className="btn-detalle-pedido"
                  onClick={() => {
                    setDetalleMesa({ mesa: mesa.numero, salon: salon.salon });
                    setModalDetalleOpen(true);
                  }}
                >
                  Detalle
                </button>
                <button
                  className="btn-eliminar-pedido"
                  onClick={async () => {
                    if (window.confirm("¿Seguro que deseas eliminar el pedido de esta mesa?")) {
                      try {
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
                        if (!res.ok) throw new Error(data.error || "No se pudo eliminar el pedido");
                        await fetchPedidos();
                        alert("Pedido(s) eliminado(s) correctamente.");
                      } catch (err) {
                        alert("Error al eliminar el pedido.");
                      }
                    }
                  }}
                >
                  Borrar Pedido
                </button>
              </div>
            </div>
          ))
        )
      )}
    </div>

    {/* Modal de Detalle */}
    {modalDetalleOpen && detalleMesa && (
      <ModalDetallePedido
        mesa={detalleMesa.mesa}
        salon={detalleMesa.salon}
        open={modalDetalleOpen}
        onEliminarProducto={handleEliminarProducto}
        onPreCuenta={() => {}}
        onCancelar={() => setModalDetalleOpen(false)}
        onGuardarCambios={async () => {
          setModalDetalleOpen(false);
          await fetchPedidos();
        }}
      />
    )}
  </div>
);
};

export default PedidosMozo;
