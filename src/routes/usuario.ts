import express, { Request, Response } from "express";
import { pool as db } from "../models/db.js";

const router = express.Router();

//Alta Empleado
router.post("/auth/register", async (req, res) => {
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
    numeroDocumento,
    password, // <-- asegúrate de recibir la contraseña
    rolId, // <-- y el rol si corresponde
  } = req.body;

  const sqlEmpleado = `
    INSERT INTO Empleado (
      Apellido_Nombre, Area, Cargo, Correo_Electronico, Domicilio, Estado_Civil,
      Fecha_Desde, Fecha_Nacimiento, Legajo, Telefono, Tipo_Documento, Numero_Documento
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const sqlUsuario = `
    INSERT INTO Usuarios (
      Nombre_Usuario, Correo_Electronico, Contrasenia, Id_Rol, Numero_Documento
    ) VALUES (?, ?, ?, ?, ?)
  `;

  const connection = await db.getConnection();
  await connection.beginTransaction();
  try {
    // Insertar en Empleado
    await connection.query(sqlEmpleado, [
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
      numeroDocumento,
    ]);
    // Insertar en Usuarios
    await connection.query(sqlUsuario, [
      username,
      email,
      password,
      rolId,
      numeroDocumento,
    ]);
    await connection.commit();
    res.status(201).json({ message: "Usuario creado correctamente" });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: "Error al crear usuario" });
  } finally {
    connection.release();
  }
});

// Buscar usuario por DNI
router.get("/usuario-dni/:dni", async (req, res) => {
  const { dni } = req.params;
  try {
    const [rows]: any = await db.query(
      "SELECT * FROM Empleado WHERE Numero_Documento = ?",
      [dni]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error al buscar usuario:", err);
    res.status(500).json({ error: "Error al buscar usuario" });
  }
});

// Eliminar usuario por DNI
router.delete(
  "/eliminar-usuario-dni/:dni",
  async (req: Request, res: Response) => {
    const { dni } = req.params;
    try {
      // Eliminar de Usuarios usando el DNI
      const [resultUsuarios]: any = await db.query(
        "DELETE FROM Usuarios WHERE Numero_Documento = ?",
        [dni]
      );
      // Eliminar de Empleado usando el DNI
      const [resultEmpleado]: any = await db.query(
        "DELETE FROM Empleado WHERE Numero_Documento = ?",
        [dni]
      );
      if (
        resultEmpleado.affectedRows === 0 &&
        resultUsuarios.affectedRows === 0
      ) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: "Error al eliminar usuario" });
    }
  }
);

export default router;
