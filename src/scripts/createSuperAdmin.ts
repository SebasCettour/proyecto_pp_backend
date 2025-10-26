import { pool } from "../models/db.js";
import { hashPassword } from "../auth.js";

const createSuperadmin = async () => {
<<<<<<< HEAD
  const username = "Superadmin";
=======
  const username = "superadmin";
>>>>>>> 2f4f7136325fe2774051c444ab86791c6b87f505
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
<<<<<<< HEAD
      console.log("✅ Superadmin ya existe en la base de datos");
      console.log(`👤 Usuario: ${username}`);
      console.log(`📧 Email: ${email}`);
=======
      console.log("Superadmin ya existe");
>>>>>>> 2f4f7136325fe2774051c444ab86791c6b87f505
    } else {
      await pool.query(
        "INSERT INTO User (Nombre_Usuario, Correo_Electronico, Contrasenia, Id_Rol) VALUES (?, ?, ?, ?)",
        [username, email, hashedPassword, roleId]
      );
      console.log("✅ Superadmin creado con éxito");
<<<<<<< HEAD
      console.log(`👤 Usuario: ${username}`);
      console.log(`🔑 Contraseña: ${password}`);
      console.log(`📧 Email: ${email}`);
      console.log(`👨‍💼 Rol ID: ${roleId}`);
    }
  } catch (err) {
    console.error("❌ Error al crear superadmin:", err);
  } finally {
    // Cerrar la conexión
    process.exit(0);
=======
    }
  } catch (err) {
    console.error(err);
>>>>>>> 2f4f7136325fe2774051c444ab86791c6b87f505
  }
};

// Ejecutar el script
createSuperadmin();