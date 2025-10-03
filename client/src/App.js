import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ProtectedRoute from "./components/protectedRoute";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />

				<Route path="/" element={<Home />} />

				<Route path="*" element={<Login />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
