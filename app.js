const dotenv = require('dotenv').config({path: '.env'});
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./server/routes/authRoutes.js');
app.use('/api/auth', authRoutes);

app.listen(3001, () => console.log('Servidor en puerto 3001'));