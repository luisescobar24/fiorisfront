import React, { useState } from "react";
import { io } from "socket.io-client";
import "../estilos/modal_detalle_pedido.css";

interface Producto {
  id: number; // ID_Detalle (used for eliminar)
  productoId?: number; // ID_Producto from backend
  nombre: string;
  comentario?: string;
  cantidad?: number;
}

interface Props {
  mesa: string;
  salon: string;
  open: boolean;
  onEliminarProducto: (id: number) => void;
  onPreCuenta: () => void;
  onCancelar: () => void;
  onGuardarCambios: (clienteData: any) => Promise<void>;
}

interface ClienteData {
  tipoDoc: string;
  documento: string;
  nombre: string;
  mesa: string;
  salon: string;
}

const ModalDetallePedido: React.FC<Props> = ({
  mesa,
  salon,
  open,
  onEliminarProducto,
  onPreCuenta,
  onCancelar,
  onGuardarCambios
}) => {
  const [tipoDoc, setTipoDoc] = useState<"dni" | "ruc">("dni");
  const [numero, setNumero] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [productosError, setProductosError] = useState<string | null>(null);
  const [guardandoCliente, setGuardandoCliente] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState<ClienteData | null>(null);


  React.useEffect(() => {
    if (!open) return;
    async function fetchProductos() {
      setLoadingProductos(true);
      setProductosError(null);
      if (!mesa) {
        setProductos([]);
        setLoadingProductos(false);
        return;
      }
      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/pedidos/por-mesa?numero=${mesa}&salon=${encodeURIComponent(salon)}`;
        const res = await fetch(url, { credentials: "include" });
        const data = await res.json();
        if (!res.ok || !data || !data.detalles) {
          setProductosError(data?.error || "Error al obtener productos");
          setProductos([]);
          } else {
          const productosMapeados = data.detalles.map((d: any) => ({
            id: d.ID_Detalle,
            productoId: d.ID_Producto,
            nombre: d.producto?.Nombre || "Producto desconocido",
            comentario: d.Comentario || "",
            cantidad: d.Cantidad ?? 1,
          }));
          setProductos(productosMapeados);
        }
      } catch {
        setProductosError("Error de conexión");
        setProductos([]);
      } finally {
        setLoadingProductos(false);
      }
    }
    fetchProductos();
  }, [mesa, open]);

  const handleBuscar = async () => {
    if (!numero.trim()) return;
    setBuscando(true);
    setError(null);
    setNombreCliente("");
    setClienteEncontrado(null);

    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/clientes/buscar?tipoDoc=${tipoDoc.toUpperCase()}&documento=${numero}`;
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      
      if (!res.ok || !data || (!data.Nombre && !data.nombre)) {
        setError(data?.error || "No se encontró cliente");
        return;
      }

      const nombreObtenido = data.Nombre || data.nombre || "";
      setNombreCliente(nombreObtenido);
      
      setClienteEncontrado({
        tipoDoc: tipoDoc.toUpperCase(),
        documento: numero,
        nombre: nombreObtenido,
        mesa,
        salon
      });
    } catch {
      setError("No se encontró cliente");
    } finally {
      setBuscando(false);
    }
  };

  const handleGuardarCambios = async () => {
    if (!clienteEncontrado) {
      await onGuardarCambios({});
      return;
    }

    setGuardandoCliente(true);
    setError(null);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/clientes/capturar`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Cache-Control": "no-cache"
          },
          credentials: "include",
          body: JSON.stringify(clienteEncontrado),
        }
      );

      if (!resp.ok) {
        const error = await resp.json();
        throw new Error(error.message || "Error al capturar cliente");
      }

      await onGuardarCambios(clienteEncontrado);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : "Error al guardar los cambios";
      setError(mensaje);
    } finally {
      setGuardandoCliente(false);
    }
  };
  
  React.useEffect(() => {
    if (!open) return;

    async function cargarClienteRegistrado() {
      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/pedidos/por-mesa?numero=${mesa}&salon=${encodeURIComponent(salon)}`;
        const res = await fetch(url, { credentials: "include" });
        const data = await res.json();

        if (!res.ok || !data) return;

        if (data.cliente) {
          setTipoDoc(data.cliente.TipoDoc?.toLowerCase() === "ruc" ? "ruc" : "dni");
          setNumero(data.cliente.Documento || "");
          setNombreCliente(data.cliente.Nombre || "");
          setClienteEncontrado({
            tipoDoc: data.cliente.TipoDoc || "",
            documento: data.cliente.Documento || "",
            nombre: data.cliente.Nombre || "",
            mesa,
            salon
          });
        } else {
          setTipoDoc("dni");
          setNumero("");
          setNombreCliente("");
          setClienteEncontrado(null);
        }
      } catch {}
    }

    cargarClienteRegistrado();
  }, [open, mesa, salon]);

  return (
    <div className="modal-detalle-overlay">
      <div className="modal-detalle">
        <div className="modal-detalle-content">
          <div className="modal-detalle-left">
            <h3>Detalle del Pedido</h3>
            <ul>
              {loadingProductos ? (
                <li>Cargando productos...</li>
              ) : productosError ? (
                <li className="error-message">{productosError}</li>
              ) : productos.length === 0 ? (
                <li>No hay productos en este pedido.</li>
              ) : (
                productos.map((p) => (
                  <li key={p.id} className="modal-detalle-producto">
                    <div>
                      <span className="producto-nombre">{p.nombre}</span>
                      <span className="producto-comentario">
                        {p.comentario ? ` - ${p.comentario}` : ""}
                      </span>
                    </div>
                        <button
                          className="btn-eliminar"
                          onClick={() => onEliminarProducto(p.id)}
                        >
                          🗑️
                        </button>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="modal-detalle-right">
            <div className="tipo-doc">
              <label>
                <input
                  type="radio"
                  name="tipoDoc"
                  checked={tipoDoc === "dni"}
                  onChange={() => setTipoDoc("dni")}
                />
                DNI
              </label>
              <label>
                <input
                  type="radio"
                  name="tipoDoc"
                  checked={tipoDoc === "ruc"}
                  onChange={() => setTipoDoc("ruc")}
                />
                RUC
              </label>
            </div>
            <div className="buscar-cliente">
              <input
                type="text"
                placeholder={`Ingrese ${tipoDoc.toUpperCase()}`}
                value={numero}
                onChange={(e) => {
                  const val = e.target.value;
                  const maxLength = tipoDoc === "dni" ? 8 : 11;
                  if (/^\d*$/.test(val) && val.length <= maxLength) setNumero(val);
                }}
              />
              <button
                className="btn-buscar"
                onClick={handleBuscar}
                disabled={buscando || !numero}
              >
                {buscando ? "Buscando..." : "Buscar"}
              </button>
            </div>
            <div className="nombre-cliente">
              <label>Nombre: </label>
              <span>{nombreCliente || "—"}</span>
            </div>
            {error && <div className="error-message">{error}</div>}
            <button
              className="btn-precuenta"
              onClick={() => {
                try {
                  // Reutilizar socket si ya existe en window para evitar múltiples conexiones
                  const anyWin = window as any;
                  const socket = anyWin.__SOCKET__ ?? io(import.meta.env.VITE_BACKEND_URL, { transports: ["websocket"] });
                  anyWin.__SOCKET__ = socket;

                  // Agrupar productos por productoId sumando cantidades
                  const productosGrouped: Record<number, { ID_Producto: number; Cantidad: number; Comentario?: string }>
                    = {};
                  for (const p of productos) {
                    const pid = Number(p.productoId ?? p.id);
                    if (!pid) continue;
                    const qty = Number(p.cantidad ?? 1);
                    const comentario = p.comentario ?? "";
                    if (!productosGrouped[pid]) {
                      productosGrouped[pid] = { ID_Producto: pid, Cantidad: qty, Comentario: comentario };
                    } else {
                      productosGrouped[pid].Cantidad += qty;
                      if (!productosGrouped[pid].Comentario && comentario) productosGrouped[pid].Comentario = comentario;
                    }
                  }

                  const productosArray = Object.values(productosGrouped);

                  // Do not send the cliente nombre as 'usuario' (mozo). Leave usuario out so
                  // the printer won't print the client name under MOZO.
                  socket.emit("imprimir-precuenta", { 
                    mesa, 
                    salon, 
                    productos: productosArray,
                    cliente: clienteEncontrado ? {
                      tipoDoc: clienteEncontrado.tipoDoc,
                      documento: clienteEncontrado.documento,
                      nombre: clienteEncontrado.nombre
                    } : undefined
                  });
                } catch (err) {
                  console.error("Error emitiendo imprimir-precuenta:", err);
                }
                onPreCuenta();
              }}
            >
              Pre-Cuenta
            </button>
          </div>
        </div>
        <div className="modal-actions">
          <button 
            className="btn-cancelar"
            onClick={onCancelar}
          >
            Cancelar
          </button>
          <button
            className="btn-guardar"
            onClick={handleGuardarCambios}
            disabled={guardandoCliente}
          >
            {guardandoCliente ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ModalDetallePedido;
  