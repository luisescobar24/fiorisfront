import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ModalRegistro from "../modales/modalregistro";
import ModalRecuperar from "../modales/modalrecuperar";
import "../estilos/signin.css";
import axios from "axios";

export default function SignIn() {
  const [modalAbierto, setModalAbierto] = useState<
    "registro" | "recuperar" | null
  >(null);
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const backendUrl = "https://fiorisback.onrender.com";
  console.log("URL del backend:", backendUrl);
  const navigate = useNavigate();

  // Bloquea el scroll cuando un modal está abierto
  useEffect(() => {
    if (modalAbierto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalAbierto]);

  // Permite cerrar el modal con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalAbierto) setModalAbierto(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalAbierto]);

  const handleLogin = async () => {
    // Validación básica
    if (!correo.trim() || !password.trim()) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/login`,
        {
          correo,
          contrasena: password,
        },
        {
          withCredentials: true, // Muy importante para que se guarde la cookie httpOnly
        }
      );

      const data = response.data;

      // Validación de cuenta activa
      if (!data.activo) {
        alert(
          "Tu cuenta no está activa. Revisa tu correo o contacta al administrador."
        );
        return;
      }

      // Login exitoso
      navigate("/paginaprincipal");
    } catch (error: unknown) {
      console.error("Error en login:", error);

      // Manejo de errores más detallado
      let mensaje = "No se pudo iniciar sesión. Verifica tus datos o intenta más tarde.";
      if (axios.isAxiosError(error) && error.response?.data?.mensaje) {
        mensaje = error.response.data.mensaje;
      }
      alert(mensaje);
    }
  };

  return (
    <div className="sign-in-container">
      <h1>Iniciar Sesión</h1>

      <div className="input-group">
        <input
          type="email"
          placeholder="Ingresa tu correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
      </div>

      <div className="input-group">
        <input
          type="password"
          placeholder="Ingresa tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button onClick={handleLogin}>Entrar</button>

      <p>
        ¿No tienes cuenta?{" "}
        <button
          onClick={() => setModalAbierto("registro")}
          disabled={modalAbierto !== null}
        >
          Crear una
        </button>
      </p>
      <p>
        ¿Olvidaste tu contraseña?{" "}
        <button
          onClick={() => setModalAbierto("recuperar")}
          disabled={modalAbierto !== null}
        >
          Recupérala aquí
        </button>
      </p>

      {modalAbierto === "registro" && (
        <ModalRegistro onClose={() => setModalAbierto(null)} />
      )}
      {modalAbierto === "recuperar" && (
        <ModalRecuperar
          isOpen={modalAbierto === "recuperar"}
          onClose={() => setModalAbierto(null)}
        />
      )}
    </div>
  );
}
