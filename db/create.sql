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
  credits DECIMAL(10, 2) DEFAULT 1000.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de amigos
CREATE TABLE friends (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_requester INT NOT NULL,
    id_receiver INT NOT NULL,

    status ENUM('pending', 'accepted', 'blocked') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (id_requester) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (id_receiver) REFERENCES users(id) ON DELETE RESTRICT,

    -- Columnas generadas para garantizar unicidad bidireccional
    id_user_a INT GENERATED ALWAYS AS (LEAST(id_requester, id_receiver)) STORED,
    id_user_b INT GENERATED ALWAYS AS (GREATEST(id_requester, id_receiver)) STORED,
    
    UNIQUE KEY uq_friends (id_user_a, id_user_b),
    CHECK (id_requester != id_receiver)
);

-- Crear tabla de transacciones
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Crear tabla para almacenar el estado de cada partida
CREATE TABLE games (
    game_id INT AUTO_INCREMENT PRIMARY KEY,
    game_type VARCHAR(50) NOT NULL,
    game_state JSON NOT NULL,
    turn_of_user_id INT NULL,
    status ENUM('active', 'finished', 'canceled') NOT NULL DEFAULT 'active',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (turn_of_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Crear tabla para vincular jugadores a las partidas
CREATE TABLE game_players (
    game_id INT NOT NULL,
    user_id INT NOT NULL,
    player_state JSON NOT NULL, -- JSON con las cartas del jugador, su apuesta, etc.
    PRIMARY KEY (game_id, user_id),
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_games_type ON games(game_type);