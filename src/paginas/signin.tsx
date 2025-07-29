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
  const navigate = useNavigate();

  const backendUrl = "https://fiorisback.onrender.com";

  useEffect(() => {
    document.body.style.overflow = modalAbierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalAbierto]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalAbierto(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ✅ NUEVO: Manejar el login dentro de un <form> con preventDefault
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // ← Esto evita que Safari dispare un GET automáticamente

    if (!correo.trim() || !password.trim()) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/login`,
        { correo, contrasena: password },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json", // ← FORZAR el tipo es clave para Safari
          },
        }
      );

      const data = response.data;

      if (!data.activo) {
        alert(
          "Tu cuenta no está activa. Revisa tu correo o contacta al administrador."
        );
        return;
      }

      navigate("/paginaprincipal");
    } catch (error: unknown) {
      console.error("Error en login:", error);
      let mensaje = "No se pudo iniciar sesión. Intenta más tarde.";
      if (axios.isAxiosError(error) && error.response?.data?.mensaje) {
        mensaje = error.response.data.mensaje;
      }
      alert(mensaje);
    }
  };

  return (
    <div className="sign-in-container">
      <h1>Iniciar Sesión</h1>

      {/* ✅ Cambiado a un <form> para compatibilidad y control */}
      <form onSubmit={handleLogin}>
        <div className="input-group">
          <input
            type="email"
            placeholder="Ingresa tu correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <input
            type="password"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit">Entrar</button>
      </form>

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
