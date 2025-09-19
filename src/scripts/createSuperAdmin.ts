import { pool } from "../models/db.js";
import { hashPassword } from "../auth.js";

const createSuperadmin = async () => {
  const username = "superadmin";
  const password = "supersecret123";
  const email = "superadmin@admin.com";
  const hashedPassword = hashPassword(password);
  const roleId = 1;

  try {
    // Verificar si ya existe el superadmin
    const [existing] = await pool.query(
      "SELECT * FROM User WHERE Nombre_Usuario = ?",
      [username]
    );

    if ((existing as any).length > 0) {
      console.log("Superadmin ya existe");
    } else {
      await pool.query(
        "INSERT INTO User (Nombre_Usuario, Correo_Electronico, Contrasenia, Id_Rol) VALUES (?, ?, ?, ?)",
        [username, email, hashedPassword, roleId]
      );
      console.log("✅ Superadmin creado con éxito");
    }
  } catch (err) {
    console.error(err);
  }
};

// Ejecutar el script
createSuperadmin();