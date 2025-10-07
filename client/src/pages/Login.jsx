import { useState } from "react";
import { login } from "../services/authService.js";

export default function Login() {
	const [form, setForm] = useState({ email: "", password: "" });

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const res = await login(form);
			const user = res.data.user;

			localStorage.setItem("user", JSON.stringify(user));
			alert("Login correcto ✅");
			window.location.href = "/";
		} catch (err) {
			alert("Error en login ❌");
		}
	};

	return (
		<div>
			<h1>Iniciar sesión</h1>
			<form onSubmit={handleSubmit}>
				<input
					style={{ color: "black" }}
					type="email"
					placeholder="Email"
					onChange={(e) => setForm({ ...form, email: e.target.value })}
				/>
				<input
					style={{ color: "black" }}
					type="password"
					placeholder="Contraseña"
					onChange={(e) => setForm({ ...form, password: e.target.value })}
				/>
				<button style={{ color: "black" }}>Iniciar sesion</button>
			</form>
			<a href="/register">¿No tienes cuenta?</a>
		</div>
	);
}
