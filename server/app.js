const dotenv = require('dotenv').config({path: '.env'});
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes.js');
app.use('/api/auth', authRoutes);

const dataRoutes = require('./routes/dataRoutes.js');
app.use('/api', dataRoutes);

app.listen(3001, () => console.log('Servidor en puerto 3001'));