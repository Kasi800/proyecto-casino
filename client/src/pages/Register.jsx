import { useState } from "react";
import { Navigate } from "react-router-dom";
import { register } from "../services/authService.js";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(form);
      alert("Registro correcto ✅");
      <Navigate to="/login" replace />;
    } catch (err) {
      alert("Error en registro ❌");
    }
  };

  return (
    <div>
      <h1>Registro</h1>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Usuario"
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Contraseña"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button>Registrarse</button>
      </form>
      <a href="/login">¿Ya tienes cuenta?</a>
    </div>
  );
}