import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import '../estilos/modal_editar_producto.css'

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  id_categoria: number;
  id_area: number;
}

interface Categoria {
  ID_Categoria: number;
  Nombre: string;
}

interface Area {
  ID_Area: number;
  Nombre: string;
}

interface EditarProductoProps {
  isOpen: boolean;
  onClose: () => void;
  onEditar: (producto: {
    id: number;
    nombre: string;
    precio: number;
    idCategoria: number;
    idArea: number;
  }) => void;
  producto: Producto | null;
  categorias: Categoria[];
  areas: Area[];
}

const EditarProducto: React.FC<EditarProductoProps> = ({
  isOpen,
  onClose,
  onEditar,
  producto,
  categorias,
  areas,
}) => {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState<number>(0);
  const [idCategoria, setIdCategoria] = useState<number>(0);
  const [idArea, setIdArea] = useState<number>(0);

  // ✅ Previene errores si producto es null
  useEffect(() => {
    if (producto) {
      setNombre(producto.nombre);
      setPrecio(producto.precio);
      setIdCategoria(producto.id_categoria);
      setIdArea(producto.id_area);
    }
  }, [producto]);

  const handleEditar = () => {
    if (!nombre || precio <= 0 || !idCategoria || !idArea) {
      alert('Por favor, completa todos los campos correctamente.');
      return;
    }

    onEditar({
      id: producto!.id,
      nombre,
      precio,
      idCategoria,
      idArea,
    });

    onClose();
  };



  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Editar Producto"
      className="modal-contenido"         // 👈 debe coincidir con tu CSS
      overlayClassName="modal-overlay"    // 👈 debe coincidir con tu CSS
    >
      <h2>Editar Producto</h2>
      <form>
        <label>Nombre:</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <label>Precio:</label>
        <input
          type="number"
          value={precio}
          onChange={(e) => setPrecio(Number(e.target.value))}
        />

        <label>Categoría:</label>
        <select
          value={idCategoria}
          onChange={(e) => setIdCategoria(Number(e.target.value))}
        >
          <option value={0}>Selecciona una categoría</option>
          {categorias.map((cat) => (
            <option key={cat.ID_Categoria} value={cat.ID_Categoria}>{cat.Nombre}</option>
          ))}
        </select>

        <label>Área:</label>
        <select
          value={idArea}
          onChange={(e) => setIdArea(Number(e.target.value))}
        >
          <option value={0}>Selecciona un área</option>
          {areas.map((area) => (
            <option key={area.ID_Area} value={area.ID_Area}>{area.Nombre}</option>
          ))}
        </select>

        <div className="botones">
  <button type="button" className="btn-guardar" onClick={handleEditar}>
    Guardar Cambios
  </button>
  <button type="button" className="btn-cancelar" onClick={onClose}>
    Cancelar
  </button>
</div>

      </form>
    </Modal>
  );
};

export default EditarProducto;
