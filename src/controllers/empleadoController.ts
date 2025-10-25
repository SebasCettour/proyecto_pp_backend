import { Request, Response } from 'express';
import { pool } from '../models/db.js';

export const buscarEmpleadoPorDni = async (req: Request, res: Response) => {
  try {
    const { dni } = req.params;
    
    // Consulta SQL específica que solicitas
    const [rows] = await pool.execute(
      'SELECT nombre, apellido, dni, cuil, categoria, fechaIngreso, legajo, id FROM Empleado WHERE dni = ?',
      [dni]
    );
    
    const empleados = rows as any[];
    
    if (empleados.length === 0) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }
    
    // Retornar el primer empleado encontrado
    const empleado = empleados[0];
    
    res.json({
      id: empleado.id,
      dni: empleado.dni,
      nombre: empleado.nombre,
      apellido: empleado.apellido,
      cuil: empleado.cuil,
      categoria: empleado.categoria,
      fechaIngreso: empleado.fechaIngreso,
      legajo: empleado.legajo
    });
    
  } catch (error) {
    console.error('Error al buscar empleado:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

// Exportar otros controladores si los tienes
export const obtenerEmpleados = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Empleado');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};