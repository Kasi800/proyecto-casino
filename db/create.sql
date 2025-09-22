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
  credits INT DEFAULT 1000
);

-- Crear tabla de transacciones
CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  amount INT,
  type ENUM('win', 'loss', 'deposit'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);