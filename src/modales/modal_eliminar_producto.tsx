import React from "react";
import "../estilos/modal_eliminar_producto.css";

interface EliminarProductoProps {
  isOpen: boolean;
  onClose: () => void;
  onEliminar: () => void;
  producto: { nombre: string }; // <--- aquí recibes el producto
}

export const EliminarProducto: React.FC<EliminarProductoProps> = ({
  isOpen,
  onClose,
  onEliminar,
  producto,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-eliminar">
        <h2 className="modal-titulo">Eliminar Producto</h2>
        <p className="modal-texto">
          ¿Estás seguro de que deseas eliminar{" "}
          <strong>{producto.nombre}</strong>?
        </p>
        <div className="modal-botones">
          <button onClick={onClose} className="btn-cancelar">
            Cancelar
          </button>
          <button onClick={onEliminar} className="btn-eliminar">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EliminarProducto;
