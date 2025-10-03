import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getProtected } from "../services/authService";

export default function ProtectedRoute({ children }) {
	const [auth, setAuth] = useState(null);

	useEffect(() => {
		getProtected()
			.then(() => setAuth(true))
			.catch(() => setAuth(false));
	}, []);

	if (auth === null) return <div>Cargando...</div>;
	if (auth === false) return <Navigate to="/login" replace />;
	return children;
}
