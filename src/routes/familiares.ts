import express from 'express';
import {
  crearFamiliar,
  obtenerFamiliaresPorEmpleado,
  obtenerFamiliaresPorDNI,
  actualizarFamiliar,
  eliminarFamiliar,
  crearFamiliares
} from '../controllers/familiarController.js';

const router = express.Router();

// Rutas para familiares
router.post('/crear', crearFamiliar);
router.post('/crear-multiples', crearFamiliares);
router.get('/empleado/:idEmpleado', obtenerFamiliaresPorEmpleado);
router.get('/empleado-dni/:dni', obtenerFamiliaresPorDNI);
router.put('/:id', actualizarFamiliar);
router.delete('/:id', eliminarFamiliar);

export default router;