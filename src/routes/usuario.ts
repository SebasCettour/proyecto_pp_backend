import express, { Request, Response } from "express";
import { pool as db } from "../models/db.js";
import bcrypt from "bcrypt";

const router = express.Router();

// ✅ INTERFACE PARA EL ERROR DE MYSQL
interface MySQLError extends Error {
  code?: string;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
}

//Alta Empleado
router.post("/auth/register", async (req, res) => {
  console.log("📝 Datos recibidos:", req.body);

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
    password,
    rolId,
  } = req.body;

  // ✅ SEPARAR NOMBRE Y APELLIDO CORRECTAMENTE
  const nombreCompleto = username || "";
  const partesNombre = nombreCompleto.trim().split(" ");
  const nombre = partesNombre[0] || ""; // Primer palabra = NOMBRE
  const apellido = partesNombre.slice(1).join(" ") || ""; // Resto = APELLIDO

  console.log("📝 Separación correcta:");
  console.log("  - Nombre completo:", nombreCompleto);
  console.log("  - Nombre:", nombre);
  console.log("  - Apellido:", apellido);

  // ✅ VALIDACIONES MEJORADAS
  if (!username || !email || !password || !numeroDocumento || !rolId) {
    console.log("❌ Faltan campos obligatorios");
    return res.status(400).json({
      error: "Faltan campos obligatorios",
      received: req.body,
    });
  }

  // ✅ SQL CORRECTO - RESPETA EL ORDEN DE LA TABLA
  const sqlEmpleado = `
    INSERT INTO Empleado (
      Nombre, Apellido, Area, Cargo, Correo_Electronico, Domicilio, Estado_Civil,
      Fecha_Desde, Fecha_Nacimiento, Legajo, Telefono, Tipo_Documento, Numero_Documento
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const sqlUsuario = `
    INSERT INTO Usuarios (
      Nombre_Usuario, Correo_Electronico, Contrasenia, Id_Rol, Numero_Documento
    ) VALUES (?, ?, ?, ?, ?)
  `;

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    console.log("🔄 Insertando en Empleado...");

    // ✅ DATOS EN EL ORDEN CORRECTO: NOMBRE PRIMERO, APELLIDO SEGUNDO
    const empleadoData = [
      nombre,           // ✅ NOMBRE (primer campo)
      apellido,         // ✅ APELLIDO (segundo campo)
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
    ];

    console.log("📊 Datos en orden correcto:");
    console.log("  1. Nombre:", nombre);
    console.log("  2. Apellido:", apellido);
    console.log("  3. Area:", area);
    console.log("  4. Cargo:", cargo);
    console.log("📊 Array completo:", empleadoData);
    
    await connection.query(sqlEmpleado, empleadoData);
    console.log("✅ Empleado insertado exitosamente");

    console.log("🔄 Insertando en Usuarios...");

    // Insertar en Usuarios
    const usuarioData = [username, email, password, rolId, numeroDocumento];

    console.log("📊 Datos Usuario:", [username, email, "***", rolId, numeroDocumento]);
    await connection.query(sqlUsuario, usuarioData);
    console.log("✅ Usuario insertado exitosamente");

    await connection.commit();
    console.log("✅ Usuario creado exitosamente");

    res.status(201).json({ message: "Usuario creado correctamente" });
  } catch (err: unknown) {
    if (connection) {
      await connection.rollback();
    }

    const error = err as MySQLError;
    console.error("❌ Error detallado:", error);

    // ✅ MANEJO DE ERRORES ESPECÍFICOS
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "El número de documento o email ya existe en el sistema",
      });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ error: "El rol seleccionado no existe" });
    }

    if (error.code === "ER_BAD_NULL_ERROR") {
      return res.status(400).json({
        error: "Faltan campos obligatorios en la base de datos",
      });
    }

    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
      code: error.code,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// ✅ CORREGIR BÚSQUEDA POR DNI
router.get("/usuario-dni/:dni", async (req, res) => {
  const { dni } = req.params;
  try {
    const [rows]: any = await db.query(
      "SELECT * FROM `ProyectoPP`.`Empleado` WHERE Numero_Documento = ?",
      [dni]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(rows[0]);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Error al buscar usuario:", error);
    res.status(500).json({ error: "Error al buscar usuario" });
  }
});

// ✅ CORREGIR ELIMINACIÓN POR DNI CON LOGS DETALLADOS
router.delete(
  "/eliminar-usuario-dni/:dni",
  async (req: Request, res: Response) => {
    const { dni } = req.params;
    
    console.log("🗑️ INICIO - Eliminación de usuario");
    console.log("📝 DNI recibido:", dni);
    console.log("📝 Tipo de DNI:", typeof dni);

    // ✅ VALIDACIÓN BÁSICA
    if (!dni || dni.trim() === "") {
      console.log("❌ DNI inválido o vacío");
      return res.status(400).json({ error: "DNI requerido" });
    }

    let connection;
    try {
      console.log("🔌 Obteniendo conexión a la base de datos...");
      connection = await db.getConnection();
      await connection.beginTransaction();
      console.log("✅ Transacción iniciada");

      // ✅ VERIFICAR SI EL USUARIO EXISTE PRIMERO
      console.log("🔍 Verificando si el usuario existe...");
      const [checkEmpleado]: any = await connection.query(
        "SELECT Id_Empleado, Nombre, Apellido FROM Empleado WHERE Numero_Documento = ?",
        [dni]
      );
      
      console.log("📊 Resultado búsqueda empleado:", checkEmpleado);
      
      if (checkEmpleado.length === 0) {
        await connection.rollback();
        console.log("❌ Empleado no encontrado");
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      console.log("✅ Usuario encontrado:", {
        id: checkEmpleado[0].Id_Empleado,
        nombre: checkEmpleado[0].Nombre,
        apellido: checkEmpleado[0].Apellido
      });

      // ✅ ELIMINAR DE USUARIOS PRIMERO (por la foreign key)
      console.log("🗑️ Eliminando de tabla Usuarios...");
      const [resultUsuarios]: any = await connection.query(
        "DELETE FROM Usuarios WHERE Numero_Documento = ?",
        [dni]
      );
      console.log("📊 Filas eliminadas de Usuarios:", resultUsuarios.affectedRows);

      // ✅ ELIMINAR DE EMPLEADO
      console.log("🗑️ Eliminando de tabla Empleado...");
      const [resultEmpleado]: any = await connection.query(
        "DELETE FROM Empleado WHERE Numero_Documento = ?",
        [dni]
      );
      console.log("📊 Filas eliminadas de Empleado:", resultEmpleado.affectedRows);

      // ✅ VERIFICAR QUE AL MENOS SE ELIMINÓ DE EMPLEADO
      if (resultEmpleado.affectedRows === 0) {
        await connection.rollback();
        console.log("❌ No se pudo eliminar el empleado");
        return res.status(404).json({ error: "No se pudo eliminar el usuario" });
      }

      await connection.commit();
      console.log("✅ Usuario eliminado exitosamente");
      console.log("📊 Resumen:");
      console.log("  - Usuarios eliminados:", resultUsuarios.affectedRows);
      console.log("  - Empleados eliminados:", resultEmpleado.affectedRows);

      res.status(204).send();

    } catch (err: unknown) {
      console.log("❌ ERROR en eliminación:");
      console.log("❌ Error completo:", err);
      
      if (connection) {
        try {
          await connection.rollback();
          console.log("✅ Rollback completado");
        } catch (rollbackErr) {
          console.log("❌ Error en rollback:", rollbackErr);
        }
      }

      const error = err as MySQLError;
      console.error("❌ Error detallado:");
      console.error("  - message:", error.message);
      console.error("  - code:", error.code);
      console.error("  - errno:", error.errno);

      // ✅ MANEJO DE ERRORES ESPECÍFICOS
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({ 
          error: "No se puede eliminar: el usuario tiene registros asociados" 
        });
      }

      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({ 
          error: "Error de referencia en la base de datos" 
        });
      }

      res.status(500).json({ 
        error: "Error interno del servidor",
        details: error.message,
        code: error.code
      });

    } finally {
      if (connection) {
        console.log("🔄 Liberando conexión...");
        connection.release();
        console.log("✅ Conexión liberada");
      }
    }
  }
);

// ✅ CORREGIR EDICIÓN POR DNI
router.put("/editar-usuario-dni/:dni", async (req: Request, res: Response) => {
  const { dni } = req.params;
  const {
    Nombre,
    Apellido,
    Area,
    Cargo,
    Correo_Electronico,
    Domicilio,
    Estado_Civil,
    Fecha_Desde,
    Fecha_Nacimiento,
    Legajo,
    Telefono,
    Tipo_Documento,
    Numero_Documento,
  } = req.body;

  try {
    // ✅ ACTUALIZAR CON NOMBRES CORRECTOS
    const [result]: any = await db.query(
      `UPDATE Empleado SET
        Nombre = ?,
        Apellido = ?,
        Area = ?,
        Cargo = ?,
        Correo_Electronico = ?,
        Domicilio = ?,
        Estado_Civil = ?,
        Fecha_Desde = ?,
        Fecha_Nacimiento = ?,
        Legajo = ?,
        Telefono = ?,
        Tipo_Documento = ?,
        Numero_Documento = ?
      WHERE Numero_Documento = ?`,
      [
        Nombre,
        Apellido,
        Area,
        Cargo,
        Correo_Electronico,
        Domicilio,
        Estado_Civil,
        Fecha_Desde,
        Fecha_Nacimiento,
        Legajo,
        Telefono,
        Tipo_Documento,
        Numero_Documento,
        dni,
      ]
    );

    // Actualizar en Usuarios (si existe)
    await db.query(
      `UPDATE Usuarios SET
        Nombre_Usuario = ?,
        Correo_Electronico = ?,
        Numero_Documento = ?
      WHERE Numero_Documento = ?`,
      [`${Nombre} ${Apellido}`, Correo_Electronico, Numero_Documento, dni]
    );

    res.json({ message: "Usuario actualizado correctamente" });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

// Cambiar contraseña (requiere: username, oldPassword, newPassword)
router.post("/auth/cambiar-password", async (req: Request, res: Response) => {
  const { username, oldPassword, newPassword } = req.body;

  if (!username || !oldPassword || !newPassword) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    // Buscar usuario
    const [rows]: any = await db.query(
      "SELECT Contrasenia FROM Usuarios WHERE Nombre_Usuario = ?",
      [username]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const hashActual = rows[0].Contrasenia;

    // Verificar contraseña actual
    const esValida = await bcrypt.compare(oldPassword, hashActual);
    if (!esValida && oldPassword !== hashActual) {
      return res.status(401).json({ error: "Contraseña actual incorrecta" });
    }

    // Hashear nueva contraseña
    const hashNueva = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await db.query(
      "UPDATE Usuarios SET Contrasenia = ? WHERE Nombre_Usuario = ?",
      [hashNueva, username]
    );

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("Error al cambiar contraseña:", err);
    res.status(500).json({ error: "Error al cambiar la contraseña" });
  }
});

export default router;