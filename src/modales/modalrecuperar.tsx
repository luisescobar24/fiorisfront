// ModalRecuperar.tsx
import React, { useState } from "react";
import Modal from "./modal";
import "../estilos/modalrecuperar.css";

const ModalRecuperar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nuevaClave, setNuevaClave] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleSolicitarCodigo = async () => {
    try {
      const res = await fetch(`${backendUrl}/solicitar-codigo-contrasena`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data.error || "Error al solicitar código");
        return; // 👈 no avanza si hubo error
      }

      setMensaje(data.mensaje || "Código enviado");
      setStep(2); // 👈 solo avanza si todo salió bien
    } catch (err) {
      console.error(err);
      setMensaje("Error de conexión con el servidor");
    }
  };

  const handleValidarCodigo = async () => {
    try {
      const res = await fetch(`${backendUrl}/verificar-codigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: email, codigo }),
      });

      if (!res.ok) throw new Error("Código inválido");
      const data = await res.json();
      setMensaje(data.mensaje || "Código validado");
      setStep(3);
    } catch (err) {
      console.error(err);
      setMensaje("Código incorrecto");
    }
  };

  const handleActualizarClave = async () => {
    if (nuevaClave !== confirmarClave) {
      setMensaje("Las contraseñas no coinciden");
      return;
    }
    try {
      const res = await fetch(`${backendUrl}/recuperar-contrasena`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: email,
          nuevaClave: nuevaClave,
          codigo: codigo, // 👈 ESTO FALTABA
        }),
      });

      if (!res.ok) throw new Error("Error al actualizar clave");
      const data = await res.json();
      setMensaje(data.mensaje || "Contraseña actualizada");
      onClose();
    } catch (err) {
      console.error(err);
      setMensaje("Error al actualizar contraseña");
    }
  };

  const handleBack = () => setStep((prev) => prev - 1);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="contenedor-modal-recuperar">
        <button className="btn-cerrar" onClick={onClose}>
          X
        </button>
        {mensaje && <p style={{ color: "red" }}>{mensaje}</p>}

        {step === 1 && (
          <div>
            <h2>Recuperar Contraseña</h2>
            <input
              type="email"
              placeholder="Correo registrado"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn-modal" onClick={handleSolicitarCodigo}>
              Enviar código
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2>Verifica tu correo</h2>
            <input
              type="text"
              placeholder="Código de verificación"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
            <button className="btn-modal" onClick={handleBack}>
              Atrás
            </button>
            <button className="btn-modal" onClick={handleValidarCodigo}>
              Validar código
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2>Crear nueva contraseña</h2>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={nuevaClave}
              onChange={(e) => setNuevaClave(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmarClave}
              onChange={(e) => setConfirmarClave(e.target.value)}
            />
            <button className="btn-modal" onClick={handleBack}>
              Atrás
            </button>
            <button className="btn-modal" onClick={handleActualizarClave}>
              Guardar contraseña
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ModalRecuperar;
