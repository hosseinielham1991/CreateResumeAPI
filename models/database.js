const sqlite3 = require("sqlite3").verbose();
const DB_PATH = "./resumebuilderpro.sqlite";
const fs = require("fs").promises;
const path = require("path");
const Jimp = require("jimp");

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to " + DB_PATH);
  }
});

const unlinkFile = (filePath, callback) => {
  // Add your custom logic here, if needed

  // Perform the actual unlinking
  fs.unlink(filePath, (err) => {
    if (err) {
      // Handle unlinking error
      console.error(`Error unlinking file ${filePath}:`, err);
    } else {
      // Call the callback function or perform additional actions after unlinking
      console.log(`File ${filePath} has been unlinked`);
      if (callback) {
        callback();
      }
    }
  });
};

const getUserInfoBySessionId = (sid) => {
  return new Promise((resolve, reject) => {
    const now = new Date().getTime();
    const sql_userinfo = `
      SELECT * FROM sessions s
      JOIN users u ON s.userid = u.id
      JOIN members m ON u.memberid = m.id
      WHERE s.sid = ? AND
      expirationTime > ?
    `;

    db.get(sql_userinfo, [sid, now], (error, user) => {
      if (error) {
        reject(error);
      } else if (user) {
        resolve({
          username: user.username,
          name: user.name,
          family: user.family,
          id: user.id,
        });
      } else {
        reject(new Error("User not found"));
      }
    });
  });
};

const getUserInfoById = (memberid, all_info = false) => {
  return new Promise((resolve, reject) => {
    const sql_userinfo = `
      SELECT m.*,u.username FROM users u 
      JOIN members m ON u.memberid = m.id
      WHERE m.id = ?
    `;

    db.get(sql_userinfo, [memberid], (error, user) => {
      if (error) {
        reject(error);
      } else if (user) {
        resolve({ user: user });
      } else {
        reject(new Error("User not found"));
      }
    });
  });
};

const updatefield = async ({
  return_error = false,
  id,
  table_name,
  field,
  is_image = 0,
  check_access = ";",
}) => {
  // Extract the fields that you want to update from the request body

  try {
    let str_fields;
    let values = Object.entries(field).map(([key, value]) => {
      return value;
    });

    if (id !== "0") {
      str_fields = Object.entries(field)
        .map(([key, value]) => `${key} = ? `)
        .join(", ");
    } else {
      str_fields = Object.entries(field)
        .map(([key, value]) => key)
        .join(", ");
    }

    if (id !== "0") values.push(id);

    if (is_image) {
      const getImagePromise = () => {
        return new Promise((resolve, reject) => {
          const sql_get_image =
            `SELECT ${is_image} FROM ${table_name} WHERE id = ? ` +
            check_access +
            ";";
          db.get(sql_get_image, [id], function (err, row) {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          });
        });
      };

      // Wait for the result of the getImagePromise
      const row = await getImagePromise();

      if (row) {
        is_image = row[is_image];
      }
    }

    // SQL query for updating the member info. You need to replace the table column names with your actual database schema column names.
    let sql;
    if (id !== "0") {
      sql = `
      UPDATE ${table_name} 
      SET ${str_fields} 
      WHERE id = ? ${check_access};`;
    } else {
      sql = `INSERT INTO ${table_name} 
      (${str_fields}) VALUES (${Array(values.length).fill("?").join(",")})`;
    }

    if (is_image != 0 && is_image != null) {
      const path_of_old_file = path.join(__dirname, "..", "uploads", is_image);

      fs.stat(path_of_old_file)
        .then(() => {
          // File exists, proceed with deletion
          return unlinkFile(path_of_old_file);
        })
        .then(() => {
          console.log("File deleted successfully:", is_image);
        })
        .catch((err) => {
          if (err.code === "ENOENT") {
            console.log("File does not exist:", is_image);
          } else {
            console.error("Error deleting file:", err);
          }
        });
    }

    return new Promise((resolve, reject) => {
      // Execute the SQL query with the parameters received from the form. This assumes that the user's 'id' refers to the primary key in your members table.
      db.run(sql, values, function (err) {
        if (err) {
          if (return_error) resolve(err);
          else resolve(false);
        }
        if (this.changes === 0) {
          // If no rows were updated, then the member with the provided ID was not found.
          //responseType({res,status:404,type: TYPE_RES.SERVER_ERROR,message:"not found"});
          resolve(true);
        } else {
          // Send back success response
          //responseType({res,status:200,type: TYPE_RES.SUCCESS,message:`${message} ${id}`});
          resolve(true);
        }
      });
    });
  } catch (error) {
    return false;
  }
};

async function deleteField({ table_name, condition, values }) {
  const sql = `DELETE FROM ${table_name} ${condition}`;

  return new Promise((resolve, reject) => {
    db.run(sql, values, function (err) {
      if (err) {
        resolve(false); // Reject with error if there's an error
      } else {
        resolve(true); // Resolve with last inserted row ID
      }
    });
  });
}

const addfield = async ({ table_name, field }) => {
  // Extract the fields that you want to update from the request body
  const str_fields = Object.keys(field).join(", ");
  const placeholders = Object.keys(field).fill("?").join(", ");

  const values = Object.values(field);

  const sql = `INSERT INTO ${table_name} (${str_fields}) VALUES (${placeholders})`;

  return new Promise((resolve, reject) => {
    db.run(sql, values, function (err) {
      if (err) {
        reject(err); // Reject with error if there's an error
      } else {
        resolve(this.lastID); // Resolve with last inserted row ID
      }
    });
  });
};

// Export both the db object and getUserInfoBySessionId function
module.exports = {
  db,
  getUserInfoBySessionId,
  getUserInfoById,
  updatefield,
  addfield,
  deleteField,
  unlinkFile,
};
