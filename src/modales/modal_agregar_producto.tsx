import React, { useState } from "react";
import "../estilos/modal_agregar_producto.css";

interface Categoria {
  ID_Categoria: number;
  Nombre: string;
}

interface Area {
  ID_Area: number;
  Nombre: string;
}

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  idCategoria: number;
  idArea: number;
}

interface AgregarProductoProps {
  isOpen: boolean;
  onClose: () => void;
  onAgregar: (producto: Omit<Producto, "id">) => void;
  categorias: Categoria[];
  areas: Area[];
  onRefresh?: () => void;
}

export const AgregarProducto: React.FC<AgregarProductoProps> = ({
  isOpen,
  onClose,
  onAgregar,
  categorias,
  areas,
}) => {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState<number | "">("");
  const [idCategoria, setIdCategoria] = useState<number | "">("");
  const [idArea, setIdArea] = useState<number | "">("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      nombre.trim() === "" ||
      precio === "" ||
      idCategoria === "" ||
      idArea === ""
    ) {
      alert("Por favor completa todos los campos.");
      return;
    }

    const nuevoProducto = {
      nombre: nombre.trim(),
      precio: Number(precio),
      idCategoria: Number(idCategoria),
      idArea: Number(idArea),
    };

    onAgregar(nuevoProducto);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setNombre("");
    setPrecio("");
    setIdCategoria("");
    setIdArea("");
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Agregar Producto</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del producto"
            className="modal-input"
            required
          />

          <input
            type="number"
            value={precio}
            onChange={(e) =>
              setPrecio(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="Precio"
            className="modal-input"
            min="0"
            step="0.01" // ← Permite decimales
            required
          />

          <select
            value={idCategoria}
            onChange={(e) =>
              setIdCategoria(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
            className="modal-input"
            required
          >
            <option value="">Selecciona una categoría</option>
            {categorias.map((cat) => (
              <option key={cat.ID_Categoria} value={cat.ID_Categoria}>
                {cat.Nombre}
              </option>
            ))}
          </select>

          <select
            value={idArea}
            onChange={(e) =>
              setIdArea(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="modal-input"
            required
          >
            <option value="">Selecciona un área</option>
            {areas.map((area) => (
              <option key={area.ID_Area} value={area.ID_Area}>
                {area.Nombre}
              </option>
            ))}
          </select>

          <div className="modal-actions">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="btn-cancelar"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-guardar">
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgregarProducto;
