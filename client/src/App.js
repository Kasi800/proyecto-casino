import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ProtectedRoute from "./components/protectedRoute";
import Blackjack from "./pages/Blackjack";
import { useEffect } from "react";
import { getProtected } from "./services/authService";

function App() {
	useEffect(() => {
		getProtected().catch(() => {
			localStorage.removeItem("user");
		});
	}, []);
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />
				<Route
					path="/blackjack"
					element={
						<ProtectedRoute>
							<Blackjack />
						</ProtectedRoute>
					}
				/>
				<Route path="/" element={<Home />} />

				<Route path="*" element={<Login />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
