-- Crear database
CREATE DATABASE casino_db;

-- Usar esa  base de datos
USE casino_db;

-- Crear tabla de usuarios
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  credits INT DEFAULT 1000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de transacciones
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Crear tabla para almacenar el estado de cada partida
CREATE TABLE games (
    game_id INT AUTO_INCREMENT PRIMARY KEY,
    game_type VARCHAR(50) NOT NULL,
    game_state TEXT NOT NULL,
    turn_of_user_id INT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (turn_of_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Crear tabla para vincular jugadores a las partidas
CREATE TABLE game_players (
    game_id INT NOT NULL,
    user_id INT NOT NULL,
    player_state TEXT NOT NULL, -- JSON con las cartas del jugador, su apuesta, etc.
    PRIMARY KEY (game_id, user_id),
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);