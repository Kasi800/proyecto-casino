import { useState } from 'react';
import { login } from '../services/authService.js';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(form);
    localStorage.setItem('token', res.data.token);
    alert('Sesión iniciada');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} />
      <input type="password" placeholder="Contraseña" onChange={e => setForm({ ...form, password: e.target.value })} />
      <button>Entrar</button>
    </form>
  );
}