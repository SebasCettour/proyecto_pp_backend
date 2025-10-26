import { Request, Response } from 'express';
import { pool } from '../models/db.js';

interface MySQLError extends Error {
  code?: string;
  errno?: number;
}

// Crear un familiar
export const crearFamiliar = async (req: Request, res: Response) => {
  const {
    idEmpleado,
    nombreFamiliar,
    parentesco,
    fechaNacimientoFamiliar,
    tipoDocumentoFamiliar,
    numeroDocumentoFamiliar
  } = req.body;

  try {
    // Verificar que el empleado existe
    const [empleadoExists]: any = await pool.query(
      'SELECT Id_Empleado FROM Empleado WHERE Id_Empleado = ?',
      [idEmpleado]
    );

    if (empleadoExists.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Verificar que no exista un familiar con el mismo documento
    const [documentoExists]: any = await pool.query(
      'SELECT Id_Familiar FROM Familiares WHERE Numero_Documento = ?',
      [numeroDocumentoFamiliar]
    );

    if (documentoExists.length > 0) {
      return res.status(409).json({ 
        error: 'Ya existe un familiar registrado con este número de documento' 
      });
    }

    // Insertar el familiar
    const [result]: any = await pool.query(
      `INSERT INTO Familiares (
        Id_Empleado, Nombre, Parentesco, Fecha_Nacimiento, 
        Tipo_Documento, Numero_Documento
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        idEmpleado,
        nombreFamiliar,
        parentesco,
        fechaNacimientoFamiliar,
        tipoDocumentoFamiliar,
        numeroDocumentoFamiliar
      ]
    );

    res.status(201).json({
      message: 'Familiar creado exitosamente',
      familiarId: result.insertId
    });

  } catch (err: unknown) {
    const error = err as MySQLError;
    console.error('Error al crear familiar:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'El número de documento del familiar ya está registrado' 
      });
    }

    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// Obtener familiares de un empleado por DNI
export const obtenerFamiliaresPorDNI = async (req: Request, res: Response) => {
  const { dni } = req.params;

  try {
    // Primero buscar el empleado por DNI
    const [empleado]: any = await pool.query(
      'SELECT Id_Empleado FROM Empleado WHERE Numero_Documento = ?',
      [dni]
    );

    if (empleado.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    const idEmpleado = empleado[0].Id_Empleado;

    // Obtener familiares del empleado
    const [familiares]: any = await pool.query(
      `SELECT 
        Id_Familiar as id,
        Nombre as nombreFamiliar,
        Parentesco as parentesco,
        Fecha_Nacimiento as fechaNacimientoFamiliar,
        Tipo_Documento as tipoDocumentoFamiliar,
        Numero_Documento as numeroDocumentoFamiliar
      FROM Familiares 
      WHERE Id_Empleado = ?
      ORDER BY Fecha_Registro DESC`,
      [idEmpleado]
    );

    res.json(familiares);

  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error al obtener familiares:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// Obtener familiares de un empleado
export const obtenerFamiliaresPorEmpleado = async (req: Request, res: Response) => {
  const { idEmpleado } = req.params;

  try {
    const [familiares]: any = await pool.query(
      `SELECT 
        Id_Familiar as id,
        Nombre as nombreFamiliar,
        Parentesco as parentesco,
        Fecha_Nacimiento as fechaNacimientoFamiliar,
        Tipo_Documento as tipoDocumentoFamiliar,
        Numero_Documento as numeroDocumentoFamiliar
      FROM Familiares 
      WHERE Id_Empleado = ?
      ORDER BY Fecha_Registro DESC`,
      [idEmpleado]
    );

    res.json(familiares);

  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error al obtener familiares:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// Actualizar un familiar
export const actualizarFamiliar = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    nombreFamiliar,
    parentesco,
    fechaNacimientoFamiliar,
    tipoDocumentoFamiliar,
    numeroDocumentoFamiliar
  } = req.body;

  try {
    const [result]: any = await pool.query(
      `UPDATE Familiares SET
        Nombre = ?,
        Parentesco = ?,
        Fecha_Nacimiento = ?,
        Tipo_Documento = ?,
        Numero_Documento = ?
      WHERE Id_Familiar = ?`,
      [
        nombreFamiliar,
        parentesco,
        fechaNacimientoFamiliar,
        tipoDocumentoFamiliar,
        numeroDocumentoFamiliar,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Familiar no encontrado' });
    }

    res.json({ message: 'Familiar actualizado exitosamente' });

  } catch (err: unknown) {
    const error = err as MySQLError;
    console.error('Error al actualizar familiar:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'El número de documento del familiar ya está registrado' 
      });
    }

    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// Eliminar un familiar
export const eliminarFamiliar = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const [result]: any = await pool.query(
      'DELETE FROM Familiares WHERE Id_Familiar = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Familiar no encontrado' });
    }

    res.status(204).send();

  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error al eliminar familiar:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};

// Crear múltiples familiares (para el registro completo)
export const crearFamiliares = async (req: Request, res: Response) => {
  const { idEmpleado, familiares } = req.body;

  if (!familiares || familiares.length === 0) {
    return res.status(400).json({ error: 'No se proporcionaron familiares' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const familiaresCreados = [];

    for (const familiar of familiares) {
      // Verificar que no exista documento duplicado
      const [documentoExists]: any = await connection.query(
        'SELECT Id_Familiar FROM Familiares WHERE Numero_Documento = ?',
        [familiar.numeroDocumentoFamiliar]
      );

      if (documentoExists.length > 0) {
        await connection.rollback();
        return res.status(409).json({ 
          error: `El documento ${familiar.numeroDocumentoFamiliar} ya está registrado para otro familiar` 
        });
      }

      // Insertar familiar
      const [result]: any = await connection.query(
        `INSERT INTO Familiares (
          Id_Empleado, Nombre, Parentesco, Fecha_Nacimiento, 
          Tipo_Documento, Numero_Documento
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          idEmpleado,
          familiar.nombreFamiliar,
          familiar.parentesco,
          familiar.fechaNacimientoFamiliar,
          familiar.tipoDocumentoFamiliar,
          familiar.numeroDocumentoFamiliar
        ]
      );

      familiaresCreados.push({
        id: result.insertId,
        ...familiar
      });
    }

    await connection.commit();

    res.status(201).json({
      message: `${familiaresCreados.length} familiares creados exitosamente`,
      familiares: familiaresCreados
    });

  } catch (err: unknown) {
    if (connection) {
      await connection.rollback();
    }

    const error = err as MySQLError;
    console.error('Error al crear familiares:', error);

    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
};