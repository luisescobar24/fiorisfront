import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalRegistro from '../modales/modalregistro';
import ModalRecuperar from '../modales/modalrecuperar';
import '../estilos/signin.css';
import axios from 'axios';

export default function SignIn() {
  const [modalAbierto, setModalAbierto] = useState<'registro' | 'recuperar' | null>(null);
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const backendUrl =  'https://fiorisback.onrender.com';
  console.log('URL del backend:', backendUrl);
  const navigate = useNavigate();

  // Bloquea el scroll cuando un modal está abierto
  useEffect(() => {
    if (modalAbierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalAbierto]);

  // Permite cerrar el modal con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalAbierto) setModalAbierto(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalAbierto]);

  const guardarCookie = async () => {
    try {
      const response = await axios.post(
        `${backendUrl}/guardar-cookie`,
        { nombre: 'LuisEscobar' },
        { withCredentials: true }
      );
      console.log(response.data);
    } catch (error) {
      console.error('Error al guardar la cookie:', error);
    }
  };

  const handleLogin = async () => {
    if (!correo || !password) {
      alert('Por favor, completa todos los campos');
      return;
    }
    try {
      const response = await fetch(`${backendUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena: password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.mensaje || 'Error al iniciar sesión');
        return;
      }

      // Verifica si el usuario está activo
      if (!data.activo) {
        alert('Tu cuenta no está activa. Por favor, verifica tu correo o contacta al administrador.');
        return;
      }

      await guardarCookie(); // Llama a la función para guardar la cookie

      navigate('/paginaprincipal');
    } catch (error) {
      console.error('Error en login:', error);
      alert('Error al conectar con el servidor. Inténtalo más tarde.');
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
        ¿No tienes cuenta?{' '}
        <button
          onClick={() => setModalAbierto('registro')}
          disabled={modalAbierto !== null}
        >
          Crear una
        </button>
      </p>
      <p>
        ¿Olvidaste tu contraseña?{' '}
        <button
          onClick={() => setModalAbierto('recuperar')}
          disabled={modalAbierto !== null}
        >
          Recupérala aquí
        </button>
      </p>

      {modalAbierto === 'registro' && (
        <ModalRegistro onClose={() => setModalAbierto(null)} />
      )}
      {modalAbierto === 'recuperar' && (
        <ModalRecuperar
          isOpen={modalAbierto === 'recuperar'}
          onClose={() => setModalAbierto(null)}
        />
      )}
    </div>
  );
}
