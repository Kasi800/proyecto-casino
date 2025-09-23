export default function Dashboard() {
  return (
    <div>
      <h2>Bienvenido al Dashboard 🎉</h2>
      <button
        onClick={() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }}
      >
        Cerrar sesión
      </button>
    </div>
  );
}