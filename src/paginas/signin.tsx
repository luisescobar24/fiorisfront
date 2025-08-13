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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!correo.trim() || !password.trim()) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${backendUrl}/login`,
        { correo, contrasena: password },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;

      if (!data.activo) {
        setError(
          "Tu cuenta no está activa. Revisa tu correo o contacta al administrador."
        );
        return;
      }

      navigate("/paginaprincipal");
    } catch (error: unknown) {
      console.error("Error en login:", error);
      let mensaje = "No se pudo iniciar sesión. Intenta más tarde.";
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        mensaje = error.response.data.message;
      }
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sign-in-container">
      <h1>Iniciar Sesión</h1>

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

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
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
