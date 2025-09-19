import express from "express";
import { pool as db } from "../models/db.js";

const router = express.Router();

router.post('/auth/register', async (req, res) => {
  const {
    username,
    area,
    cargo,
    email,
    domicilio,
    estadoCivil,
    fechaContrato,
    fechaNacimiento,
    legajo,
    telefono,
    tipoDocumento,
    numeroDocumento
  } = req.body;

  const sql = `
    INSERT INTO Empleado (
      Apellido_Nombre, Area, Cargo, Correo_Electronico, Domicilio, Estado_Civil,
      Fecha_Desde, Fecha_Nacimiento, Legajo, Telefono, Tipo_Documento, Numero_Documento
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    await db.query(sql, [
      username,
      area,
      cargo,
      email,
      domicilio,
      estadoCivil,
      fechaContrato,
      fechaNacimiento,
      legajo,
      telefono,
      tipoDocumento,
      numeroDocumento
    ]);
    res.status(201).json({ message: "Usuario creado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

export default router;