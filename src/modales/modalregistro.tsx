import { useState, useEffect, useRef } from "react";
import "../estilos/modalregistro.css";

interface ModalRegistroProps {
  onClose: () => void;
}

type Errors = Partial<{
  nombre: string;
  contrasena: string;
  confirmar: string;
  correo: string;
  codigo: string;
}>;

export default function ModalRegistro({ onClose }: ModalRegistroProps) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [step, setStep] = useState(1);
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  // Foco al abrir modal en primer input
  useEffect(() => {
    const firstInput = modalRef.current?.querySelector("input");
    firstInput?.focus();
  }, []);

  

  // Validaciones básicas
  const validateStep = () => {
    const newErrors: Errors = {};
    if (step === 1) {
      if (!nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
      if (!contrasena) newErrors.contrasena = "La contraseña es obligatoria";
      else if (contrasena.length < 6)
        newErrors.contrasena = "La contraseña debe tener al menos 6 caracteres";
      if (confirmar !== contrasena)
        newErrors.confirmar = "Las contraseñas no coinciden";
    }
    if (step === 2) {
      if (!correo) newErrors.correo = "El correo es obligatorio";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
        newErrors.correo = "El correo no es válido";
    }
    if (step === 3) {
      if (!codigo) newErrors.codigo = "El código es obligatorio";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    setMessage(null);
    if (!validateStep()) return;

    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setLoading(true);
      try {
        const response = await fetch(
          `${backendUrl}/solicitar-codigo-registro`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo }),
          }
        );
        const data = await response.json();
        if (response.ok) {
          setMessage("Código enviado a tu correo.");
          setStep(3);
        } else {
          setErrors({ correo: data.error || "Error al enviar código" });
        }
      } catch {
        setErrors({ correo: "Error de conexión con el servidor" });
      } finally {
        setLoading(false);
      }
    } else if (step === 3) {
      setLoading(true);
      try {
        const verifyRes = await fetch(`${backendUrl}/verificar-codigo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo, codigo }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) {
          setErrors({ codigo: verifyData.error || "Código incorrecto" });
          setLoading(false);
          return;
        }

        // Registro definitivo
        const registroRes = await fetch(`${backendUrl}/registro`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo, contrasena, nombre }),
        });
        const registroData = await registroRes.json();
        if (registroRes.ok) {
          setMessage("Cuenta registrada con éxito");
          setTimeout(() => onClose(), 1500);
        } else {
          setErrors({ codigo: registroData.error || "Error al registrar" });
        }
      } catch {
        setErrors({ codigo: "Error de conexión con el servidor" });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    setMessage(null);
    setErrors({});
    if (step > 1) setStep(step - 1);
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={modalRef}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        className="modal-contenido"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={modalRef}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div className="modal-header">
          <h2 id="modal-title">Registro de Cuenta</h2>
          <button
            className="btn-cerrar"
            onClick={onClose}
            aria-label="Cerrar modal"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="barra-progreso" aria-label="Progreso de registro">
          <div className={`paso ${step >= 1 ? "activo" : ""}`}>1</div>
          <div className={`paso ${step >= 2 ? "activo" : ""}`}>2</div>
          <div className={`paso ${step >= 3 ? "activo" : ""}`}>3</div>
        </div>

        {message && <p className="mensaje-exito">{message}</p>}

        {step === 1 && (
          <>
            <label htmlFor="nombre">Nombre de usuario:</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              aria-invalid={!!errors.nombre}
              aria-describedby="error-nombre"
              disabled={loading}
            />
            {errors.nombre && (
              <p className="error" id="error-nombre">
                {errors.nombre}
              </p>
            )}

            <label htmlFor="contrasena">Contraseña:</label>
            <input
              id="contrasena"
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              aria-invalid={!!errors.contrasena}
              aria-describedby="error-contrasena"
              disabled={loading}
            />
            {errors.contrasena && (
              <p className="error" id="error-contrasena">
                {errors.contrasena}
              </p>
            )}

            <label htmlFor="confirmar">Confirmar contraseña:</label>
            <input
              id="confirmar"
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              aria-invalid={!!errors.confirmar}
              aria-describedby="error-confirmar"
              disabled={loading}
            />
            {errors.confirmar && (
              <p className="error" id="error-confirmar">
                {errors.confirmar}
              </p>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <label htmlFor="correo">Correo electrónico:</label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              aria-invalid={!!errors.correo}
              aria-describedby="error-correo"
              disabled={loading}
            />
            {errors.correo && (
              <p className="error" id="error-correo">
                {errors.correo}
              </p>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <label htmlFor="codigo">
              Ingresa el código enviado a tu correo:
            </label>
            <input
              id="codigo"
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              aria-invalid={!!errors.codigo}
              aria-describedby="error-codigo"
              disabled={loading}
            />
            {errors.codigo && (
              <p className="error" id="error-codigo">
                {errors.codigo}
              </p>
            )}
          </>
        )}

        <div className="botones">
          <button onClick={handleBack} disabled={step === 1 || loading}>
            Anterior
          </button>
          <button onClick={handleNext} disabled={loading}>
            {loading
              ? "Cargando..."
              : step === 3
              ? "Finalizar Registro"
              : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}
