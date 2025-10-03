import { useEffect, useState } from "react";
import { logout } from "../services/authService";

export default function UserMenu() {
	const [open, setOpen] = useState(false);
	const [user, setUser] = useState(null);

	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			setUser(JSON.parse(storedUser));
		}
	}, []);

	const handleLogout = async () => {
		await logout();
		localStorage.removeItem("user");
		window.location.href = "/";
	};

	return (
		<div>
			{user ? (
				<div style={{ position: "relative", display: "inline-block" }}>
					<button
						class="buton"
						onClick={() => setOpen(!open)}
						style={{ cursor: "pointer" }}
					>
						{user.username} ⌄
					</button>

					{open && (
						<div
							style={{
								position: "absolute",
								top: "100%",
								right: 0,
								background: "#000000bb",
								border: "1px solid #ccc",
								padding: "10px",
								zIndex: 1000,
							}}
						>
							<p
								href="/login"
								onClick={handleLogout}
								style={{ width: "max-content" }}
							>
								Cerrar sesión
							</p>
						</div>
					)}
				</div>
			) : (
				<a href="/login" class="buton">
					Iniciar Sesion
				</a>
			)}
		</div>
	);
}
