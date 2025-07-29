import React, { useState } from "react";
import "../estilos/modal.css";
import "../estilos/modalcambiarcorreo.css";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const ModalCambiarCorreo: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [correoActual, setCorreoActual] = useState("");
  const [codigoActual, setCodigoActual] = useState("");
  const [correoNuevo, setCorreoNuevo] = useState("");
  const [codigoNuevo, setCodigoNuevo] = useState("");

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      onClose();
      resetSteps();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const resetSteps = () => {
    setStep(1);
    setCorreoActual("");
    setCodigoActual("");
    setCorreoNuevo("");
    setCodigoNuevo("");
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {step === 1 && (
          <>
            <h2>Correo actual</h2>
            <input
              type="email"
              placeholder="Tu correo actual"
              value={correoActual}
              onChange={(e) => setCorreoActual(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={onClose}>Cancelar</button>
              <button onClick={handleNext}>Siguiente</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Verifica tu correo actual</h2>
            <input
              type="text"
              placeholder="Código de verificación"
              value={codigoActual}
              onChange={(e) => setCodigoActual(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={handleBack}>Atrás</button>
              <button onClick={handleNext}>Siguiente</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Nuevo correo</h2>
            <input
              type="email"
              placeholder="Nuevo correo"
              value={correoNuevo}
              onChange={(e) => setCorreoNuevo(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={handleBack}>Atrás</button>
              <button onClick={handleNext}>Siguiente</button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2>Verifica tu nuevo correo</h2>
            <input
              type="text"
              placeholder="Código de verificación"
              value={codigoNuevo}
              onChange={(e) => setCodigoNuevo(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={handleBack}>Atrás</button>
              <button onClick={handleNext}>Siguiente</button>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h2>Correo actualizado con éxito</h2>
            <p>
              Tu correo fue cambiado correctamente a:{" "}
              <strong>{correoNuevo}</strong>
            </p>
            <div className="modal-buttons">
              <button onClick={onClose}>Cerrar</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ModalCambiarCorreo;
