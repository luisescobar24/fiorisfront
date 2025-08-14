import "../estilos/paginaprincipal.css";
import { User, X } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import {useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

type Producto = {
  ID_Producto: number;
  Nombre: string;
  Precio: number;
  ID_Categoria: number;
  ID_Area: number;
  Activo: boolean;
};

type Categoria = {
  ID_Categoria: number;
  Nombre: string;
};

type ItemCarrito = {
  id: number;
  producto: Producto;
  cantidad: number;
  comentarios: string[];
};

type Mesa = {
  ID_Mesa: number;
  Numero_mesa: number;
  salon?: { Nombre: string };
};

type Salon = { ID_Salon: number; Nombre: string };

const socket = io(import.meta.env.VITE_BACKEND_URL, {
  transports: ["websocket", "polling"],
});

const PaginaPrincipal = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [salones, setSalones] = useState<Salon[]>([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<number>();
  const [salonSeleccionado, setSalonSeleccionado] = useState<number>();
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<
    number | null
  >(null);
  const [busqueda, setBusqueda] = useState("");
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [usuario, setUsuario] = useState<{
    ID_Usuario: number;
    Nombre: string;
  } | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const onConnect = () => {
      if (isMounted) {
        console.log("✅ Conectado al servidor WebSocket");
      }
    };

    socket.on("connect", onConnect);

    const fetchData = async () => {
      try {
        const [resProd, resCat] = await Promise.all([
          axios.get(`${backendUrl}/productos`, { withCredentials: true }),
          axios.get(`${backendUrl}/categorias`, { withCredentials: true }),
        ]);

        if (isMounted) {
          setProductos(resProd.data);
          setCategorias(resCat.data);
        }
      } catch (error) {
        console.error("❌ Error al cargar productos o categorías:", error);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      socket.off("connect", onConnect);
    };
  }, [backendUrl]);

  useEffect(() => {
    const fetchLocales = async () => {
      try {
        const [resMesas, resSalones] = await Promise.all([
          axios.get(`${backendUrl}/mesas`),
          axios.get(`${backendUrl}/salones`),
        ]);
        setMesas(resMesas.data);
        setSalones(resSalones.data);
        setSalonSeleccionado(resSalones.data[0]?.ID_Salon);
        setMesaSeleccionada(resMesas.data[0]?.ID_Mesa);
      } catch (err) {
        console.error("❌ No se pudo cargar mesas o salones:", err);
      }
    };
    fetchLocales();
  }, [backendUrl]);

  useEffect(() => {
    const fetchUsuario = async () => {
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
  }, [backendUrl]);

  useEffect(() => {
    if (!cargandoUsuario && !usuario) {
      navigate("/");
    }
  }, [usuario, cargandoUsuario, navigate]);

  useEffect(() => {
    socket.on("producto-actualizado", (productoActualizado: Producto) => {
      setProductos((prev) =>
        prev.map((p) =>
          p.ID_Producto === productoActualizado.ID_Producto
            ? { ...p, Activo: productoActualizado.Activo }
            : p
        )
      );
      setCarrito((prev) =>
        prev.filter((item) => {
          const producto = productos.find((p) => p.ID_Producto === item.id);
          return producto ? producto.Activo : true;
        })
      );
      alert(
        `Producto ${productoActualizado.Nombre} ${
          productoActualizado.Activo ? "habilitado" : "deshabilitado"
        }`
      );
    });
    return () => {
      socket.off("producto-actualizado");
    };
  }, [productos]);

  const agregarProducto = useCallback(
    (ID_Producto: number) => {
      const productoBase = productos.find((p) => p.ID_Producto === ID_Producto);
      if (!productoBase || !productoBase.Activo) return;

      setCarrito((prevCarrito) => {
        const itemExistente = prevCarrito.find(
          (item) => item.id === ID_Producto
        );
        if (itemExistente) {
          return prevCarrito.map((item) =>
            item.id === ID_Producto
              ? { ...item, cantidad: item.cantidad + 1 }
              : item
          );
        } else {
          const nuevoItem: ItemCarrito = {
            id: productoBase.ID_Producto,
            producto: productoBase,
            cantidad: 1,
            comentarios: [],
          };
          return [...prevCarrito, nuevoItem];
        }
      });
    },
    [productos]
  );

  const quitarUnidad = (ID_Producto: number) => {
    const existente = carrito.find(
      (item) => item.producto.ID_Producto === ID_Producto
    );
    if (!existente) return;

    if (existente.cantidad > 1) {
      setCarrito(
        carrito.map((item) =>
          item.producto.ID_Producto === ID_Producto
            ? { ...item, cantidad: item.cantidad - 1 }
            : item
        )
      );
    } else {
      setCarrito(
        carrito.filter((item) => item.producto.ID_Producto !== ID_Producto)
      );
    }
  };

  const actualizarComentario = (
    id: number,
    index: number,
    comentario: string
  ) => {
    setCarrito(
      carrito.map((item) => {
        if (item.id === id) {
          const nuevosComentarios = [...item.comentarios];
          nuevosComentarios[index] = comentario;
          return { ...item, comentarios: nuevosComentarios };
        }
        return item;
      })
    );
  };

  const añadirComentario = (id: number) => {
    setCarrito((carrito) =>
      carrito.map((item) => {
        if (item.id === id) {
          if (item.comentarios.length < item.cantidad) {
            return { ...item, comentarios: [...item.comentarios, ""] };
          } else {
            alert(
              "No puedes añadir más comentarios que la cantidad de productos."
            );
          }
        }
        return item;
      })
    );
  };

  const quitarProducto = (id: number) => {
    setCarrito(carrito.filter((item) => item.id !== id));
  };

  useEffect(() => {
    sessionStorage.setItem("carrito", JSON.stringify(carrito));
  }, [carrito]);

  useEffect(() => {
    const carritoGuardado = sessionStorage.getItem("carrito");
    if (carritoGuardado) {
      try {
        const datos = JSON.parse(carritoGuardado);
        if (Array.isArray(datos)) {
          setCarrito(
            datos.map((item: ItemCarrito) => {
              const productoCompleto = productos.find(
                (p) => p.ID_Producto === (item.producto?.ID_Producto ?? item.id)
              );
              return {
                ...item,
                producto: productoCompleto || item.producto,
                comentarios: Array.isArray(item.comentarios)
                  ? item.comentarios
                  : [],
              };
            }).filter((item) => item.producto?.Activo !== false)
          );
        } else {
          setCarrito([]);
        }
      } catch {
        setCarrito([]);
      }
    }
  }, [productos]);

  const mesa = mesas.find(m => m.ID_Mesa === mesaSeleccionada);

const confirmarPedido = async () => {
  if (carrito.length === 0 || enviandoPedido) return;
  setEnviandoPedido(true);
  const pedidoParaEnviar = {
    Fecha_hora: new Date().toISOString(),
    ID_Estado: 1,
    ID_Mesa: mesaSeleccionada,
    Mesa: mesa?.Numero_mesa,
    Salon: mesa?.salon?.Nombre,
    ID_Usuario: usuario?.ID_Usuario,
    Usuario: usuario?.Nombre,
    detalles: carrito.flatMap((item) =>
      Array.from({ length: item.cantidad }).map((_, idx) => ({
        Cantidad: 1,
        Comentario: (item.comentarios[idx] ?? "").trim(),
        ID_Estado: 1,
        ID_Producto: item.producto.ID_Producto,
      }))
    ),
  };

  try {
    // 1. Crear pedido en BD
    await axios.post(`${backendUrl}/pedidos`, pedidoParaEnviar, {
      withCredentials: true,
    });

    // 2. Enviar pedido a impresora
    await axios.post(`${backendUrl}/imprimir-pedido`, pedidoParaEnviar, {
      withCredentials: true,
    });
    // Apenas recibes respuesta, muestra el alert y limpia el carrito
    alert("✅ Pedido enviado con éxito e impreso. Se imprimira en breve.");
    setCarrito([]);
    setCarritoAbierto(false);
    sessionStorage.removeItem("carrito");
  } catch (error) {
    console.error("❌ Error al enviar pedido:", error);
    alert("Error al enviar pedido o imprimir");
  } finally {
    setEnviandoPedido(false);
  }
};


  const cancelarPedido = () => {
    setCarrito([]);
    setCarritoAbierto(false);
    sessionStorage.removeItem("carrito");
  };

  const obtenerCantidad = (ID_Producto: number) => {
    const encontrado = carrito.find(
      (item) => item.producto.ID_Producto === ID_Producto
    );
    return encontrado ? encontrado.cantidad : 0;
  };

  const productosFiltrados = productos.filter((prod) => {
    const coincideCategoria =
      categoriaSeleccionada === null ||
      prod.ID_Categoria === categoriaSeleccionada;
    const coincideBusqueda = prod.Nombre.toLowerCase().includes(
      busqueda.toLowerCase()
    );
    return coincideCategoria && coincideBusqueda;
  });

  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  const CarritoContenido = () => {
    const [comentariosTemp, setComentariosTemp] = useState<{
      [key: string]: string;
    }>({});

    const handleComentarioChange = (
      itemId: number,
      index: number,
      value: string
    ) => {
      setComentariosTemp((prev) => ({
        ...prev,
        [`${itemId}-${index}`]: value,
      }));
    };

    const handleComentarioBlur = (itemId: number, index: number) => {
      const value = comentariosTemp[`${itemId}-${index}`] ?? "";
      actualizarComentario(itemId, index, value);
    };

    return (
      <>
        {carrito.length === 0 ? (
          <div className="carrito-vacio">
            <p>Tu carrito está vacío</p>
          </div>
        ) : (
          <>
            {carrito.map((item) => (
              <div key={item.id} className="seleccionado-item">
                <div className="item-header">
                  <strong className="nombre-producto">
                    {item.producto.Nombre}
                  </strong>
                  <button
                    onClick={() => quitarProducto(item.id)}
                    className="eliminar-item-btn"
                    title="Eliminar producto del carrito"
                  >
                    X
                  </button>
                </div>
                <div className="cantidad-controls">
                  <button
                    onClick={() => quitarUnidad(item.producto.ID_Producto)}
                    disabled={!item.producto.Activo}
                  >
                    -
                  </button>
                  <span>{item.cantidad}</span>
                  <button
                    onClick={() => agregarProducto(item.producto.ID_Producto)}
                    disabled={!item.producto.Activo}
                  >
                    +
                  </button>
                </div>
                <div className="comentarios-producto">
                  <strong>Comentarios:</strong>
                  <ul>
                    {item.comentarios.map((coment, idx) => (
                      <li key={idx}>
                        <input
                          type="text"
                          value={comentariosTemp[`${item.id}-${idx}`] ?? coment}
                          onChange={(e) =>
                            handleComentarioChange(item.id, idx, e.target.value)
                          }
                          onBlur={() => handleComentarioBlur(item.id, idx)}
                          className="comentario-input"
                          placeholder="Agregar comentario..."
                          disabled={!item.producto.Activo}
                        />
                        <button
                          className="eliminar-comentario-btn"
                          onClick={() => {
                            const nuevosComentarios = item.comentarios.filter(
                              (_, i) => i !== idx
                            );
                            setCarrito(
                              carrito.map((it) =>
                                it.id === item.id
                                  ? { ...it, comentarios: nuevosComentarios }
                                  : it
                              )
                            );
                          }}
                          title="Eliminar comentario"
                          disabled={!item.producto.Activo}
                        >
                          🗑️
                        </button>
                      </li>
                    ))}
                  </ul>
                  {item.comentarios.length < item.cantidad && item.producto.Activo && (
                    <button
                      className="anadir-comentario-btn"
                      onClick={() => añadirComentario(item.id)}
                    >
                      + Añadir comentario
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </>
    );
  };

  useEffect(() => {
    if (carritoAbierto) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("body-no-scroll");
    } else {
      document.body.style.overflow = "";
      document.body.classList.remove("body-no-scroll");
    }
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("body-no-scroll");
    };
  }, [carritoAbierto]);

  if (cargandoUsuario) {
    return <div className="cargando">Cargando...</div>;
  }

  return (
    <div className="pagina-container">
      <header className="header">
        <div className="barra-busqueda">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <button className="icono-usuario" onClick={() => navigate("/perfil")}>
          <User size={24} />
        </button>
      </header>

      <div className="categorias-carrusel">
        <div
          className={`categoria-item ${
            categoriaSeleccionada === null ? "activa" : ""
          }`}
          onClick={() => setCategoriaSeleccionada(null)}
        >
          Todas
        </div>
        {categorias.map((cat) => (
          <div
            key={cat.ID_Categoria}
            className={`categoria-item ${
              categoriaSeleccionada === cat.ID_Categoria ? "activa" : ""
            }`}
            onClick={() => setCategoriaSeleccionada(cat.ID_Categoria)}
          >
            {cat.Nombre}
          </div>
        ))}
      </div>

      <div className="contenido">
        <div className="productos">
          {productosFiltrados.map((producto) => {
            const itemEnCarrito = carrito.find(
              (item) => item.producto.ID_Producto === producto.ID_Producto
            );
            return (
              <div
                key={producto.ID_Producto}
                className={`producto ${!producto.Activo ? "producto-deshabilitado" : ""}`}
              >
                <p className="nombre-producto">{producto.Nombre}</p>
                <p>S/ {Number(producto.Precio).toFixed(2)}</p>
                <div className="cantidad-controls">
                  <button
                    type="button"
                    onClick={() => quitarUnidad(producto.ID_Producto)}
                    disabled={obtenerCantidad(producto.ID_Producto) === 0 || !producto.Activo}
                  >
                    –
                  </button>
                  <span>{obtenerCantidad(producto.ID_Producto)}</span>
                  <button
                    type="button"
                    onClick={() => agregarProducto(producto.ID_Producto)}
                    disabled={!producto.Activo}
                  >
                    +
                  </button>
                </div>
                {itemEnCarrito && (
                  <div className="comentarios-producto">
                    <strong>Comentarios:</strong>
                    <ul>
                      {itemEnCarrito.comentarios.map((coment, idx) => (
                        <li key={idx}>
                          <input
                            type="text"
                            value={coment}
                            onChange={(e) =>
                              actualizarComentario(
                                itemEnCarrito.id,
                                idx,
                                e.target.value
                              )
                            }
                            className="comentario-input"
                            placeholder="Agregar comentario..."
                            disabled={!itemEnCarrito.producto.Activo}
                          />
                          <button
                            className="eliminar-comentario-btn"
                            onClick={() => {
                              const nuevosComentarios =
                                itemEnCarrito.comentarios.filter(
                                  (_, i) => i !== idx
                                );
                              setCarrito(
                                carrito.map((item) =>
                                  item.id === itemEnCarrito.id
                                    ? {
                                        ...item,
                                        comentarios: nuevosComentarios,
                                      }
                                    : item
                                )
                              );
                            }}
                            title="Eliminar comentario"
                            disabled={!itemEnCarrito.producto.Activo}
                          >
                            🗑️
                          </button>
                        </li>
                      ))}
                    </ul>
                    {itemEnCarrito.comentarios.length <
                      itemEnCarrito.cantidad &&
                      itemEnCarrito.producto.Activo && (
                      <button
                        className="anadir-comentario-btn"
                        onClick={() => añadirComentario(itemEnCarrito.id)}
                      >
                        + Añadir comentario
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="carrito-flotante">
        <button
          className="carrito-toggle"
          onClick={() => setCarritoAbierto(true)}
        >
          <span className="carrito-label">Carrito</span>
          {totalItems > 0 && (
            <span className="carrito-badge">{totalItems}</span>
          )}
        </button>
      </div>

      <div
        className={`carrito-overlay ${carritoAbierto ? "activo" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setCarritoAbierto(false);
          }
        }}
      >
        <div className="carrito-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Carrito ({totalItems} items)</h3>
            <button
              className="cerrar-modal"
              onClick={() => setCarritoAbierto(false)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="modal-contenido">
            <CarritoContenido />
          </div>
          <div className="modal-footer">
            <div className="seleccion">
              <label>Salón:</label>
              <select
                value={salonSeleccionado || ""}
                onChange={(e) => {
                  const nuevoSalon = Number(e.target.value);
                  setSalonSeleccionado(nuevoSalon);
                  setMesaSeleccionada(undefined);
                }}
              >
                <option value="">Seleccione un salón</option>
                {salones.map((salon) => (
                  <option key={salon.ID_Salon} value={salon.ID_Salon}>
                    {salon.Nombre}
                  </option>
                ))}
              </select>
              <label>Mesa:</label>
              <select
                value={mesaSeleccionada || ""}
                onChange={(e) => setMesaSeleccionada(Number(e.target.value))}
                disabled={!salonSeleccionado}
              >
                <option value="">Seleccione una mesa</option>
                {mesas
                  .filter(
                    (mesa) =>
                      mesa.salon?.Nombre ===
                      salones.find((s) => s.ID_Salon === salonSeleccionado)
                        ?.Nombre
                  )
                  .map((mesa) => (
                    <option key={mesa.ID_Mesa} value={mesa.ID_Mesa}>
                      Mesa {mesa.Numero_mesa}
                    </option>
                  ))}
              </select>
            </div>
            <div className="botones-pedido">
              <button
                className="confirmar"
                onClick={confirmarPedido}
                disabled={carrito.length === 0 || enviandoPedido}
              >
                {enviandoPedido ? "Enviando..." : "Confirmar Pedido"}
              </button>
              <button className="cancelar" onClick={cancelarPedido}>
                Cancelar Pedido
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaginaPrincipal;