import React from "react";

interface Producto {
  nombre: string;
  estado: number;
  habilitado?: boolean; // true = se puede pedir, false = inhabilitado
}

interface Mesa {
  numero: number;
  productos: Producto[];
  cliente?: any;
}

interface Salon {
  salon: string;
  mesas: Mesa[];
}

interface Props {
  salones: Salon[];
}

const Pagina86: React.FC<Props> = ({ salones }) => {
  return (
    <div className="mozo-pedidos-scroll">
      {salones.map((salon) => (
        <div key={salon.salon} style={{ marginBottom: 32 }}>
          <h2 className="titulo-salon">{salon.salon}</h2>
          {salon.mesas.map((mesa) => (
            <div key={mesa.numero} className="mozo-mesa">
              <h3>Mesa {mesa.numero}</h3>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {mesa.productos.map((prod, idx) => (
                  <li
                    key={idx}
                    className={
                      prod.habilitado === false
                        ? "producto-inhabilitado"
                        : prod.estado === 2
                        ? "producto-servido"
                        : ""
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 6,
                      color:
                        prod.habilitado === false
                          ? "#bdbdbd"
                          : prod.estado === 2
                          ? "#43e97b"
                          : "#333",
                      fontWeight: prod.estado === 2 ? 600 : 400,
                      opacity: prod.habilitado === false ? 0.5 : 1,
                      pointerEvents: prod.habilitado === false ? "none" : "auto",
                      cursor:
                        prod.habilitado === false ? "not-allowed" : "pointer",
                    }}
                  >
                    {prod.estado === 2 ? (
                      <span className="mozo-producto-check">✔️</span>
                    ) : (
                      <span style={{ width: 20, marginRight: 8 }} />
                    )}
                    {prod.nombre}
                    {prod.habilitado === false && (
                      <span style={{ color: "red", marginLeft: 8 }}>
                        (No disponible)
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {/* Aquí irían los botones de cliente si los necesitas */}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Pagina86;