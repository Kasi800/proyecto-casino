import { useState } from 'react';
import { register } from '../services/authService.js';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await register(form);
    alert('Registrado correctamente');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Usuario" onChange={e => setForm({ ...form, username: e.target.value })} />
      <input placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} />
      <input type="password" placeholder="Contraseña" onChange={e => setForm({ ...form, password: e.target.value })} />
      <button>Registrarse</button>
    </form>
  );
}
