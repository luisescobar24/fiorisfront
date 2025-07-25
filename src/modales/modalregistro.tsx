import { useState } from 'react';
import '../estilos/modalregistro.css';

interface ModalRegistroProps {
  onClose: () => void;
}

export default function ModalRegistro({ onClose }: ModalRegistroProps) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [step, setStep] = useState(1);
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');

  const handleNext = async () => {
    if (step === 1) {
      if (!nombre || !contrasena || !confirmar) {
        alert('Completa todos los campos');
        return;
      }

      if (contrasena !== confirmar) {
        alert('Las contraseñas no coinciden');
        return;
      }

      setStep(2);
    }

    else if (step === 2 && correo) {
      try {
        const response = await fetch(`${backendUrl}/solicitar-codigo-registro`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo }),
        });

        const data = await response.json();

        if (response.ok) {
          alert('Código enviado a tu correo');
          setStep(3);
        } else {
          alert(`Error al enviar código: ${data.error}`);
        }
      } catch (err) {
        console.error('Error al enviar código:', err);
        alert('Error al conectar con el servidor');
      }
    }

    else if (step === 3 && codigo) {
      try {
        const response = await fetch(`${backendUrl}/verificar-codigo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo, codigo }),
        });

        const data = await response.json();

        if (response.ok) {
          // Registro definitivo
          const registroRes = await fetch(`${backendUrl}/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, contrasena, nombre }),
          });

          const registroData = await registroRes.json();

          if (registroRes.ok) {
            alert('Cuenta registrada con éxito');
            onClose();
          } else {
            alert(`Error al registrar: ${registroData.error}`);
          }
        } else {
          alert(`Código incorrecto: ${data.error}`);
        }
      } catch (err) {
        console.error('Error en verificación:', err);
        alert('Error al conectar con el servidor');
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-contenido">
        <button className="btn-cerrar" onClick={onClose}>×</button>
        <h2>Registro de Cuenta</h2>

        {step === 1 && (
          <>
            <label>Nombre de usuario:</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />

            <label>Contraseña:</label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />

            <label>Confirmar contraseña:</label>
            <input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
            />
          </>
        )}

        {step === 2 && (
          <>
            <label>Correo electrónico:</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </>
        )}

        {step === 3 && (
          <>
            <label>Ingresa el código enviado a tu correo:</label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </>
        )}

        <button onClick={handleNext}>
          {step === 3 ? 'Finalizar Registro' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
}
