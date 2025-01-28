// models/database.js
const { db } = require("../models/database");

const { promisify } = require("util");
const fs = require("fs").promises;
const path = require("path");
const Jimp = require("jimp");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const uploadImageFile = async ({ req, res, customStorage }) => {
  try {
    const imageFile = req.file;
    if (typeof imageFile == "undefined") {
      throw new Error("Invalid input");
    }

    const newFileNamePromise = new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION;");

        db.run(
          "INSERT INTO file_uploads (filename) VALUES (?)",
          [imageFile.originalname],
          function (err) {
            if (err) {
              db.run("ROLLBACK;");
              console.error(err);
              reject(err);
            } else {
              db.run("COMMIT;");
              const imageId = this.lastID;
              const newFileName = `${imageId}.jpg`;
              db.run(
                "DELETE FROM file_uploads WHERE id = ?",
                [imageId],
                function (err) {
                  if (err) {
                    console.error("Error ", err.message);
                  } else {
                    console.log("successfully");
                  }
                }
              );

              // Extract the crop parameters from the request body or query string
              // Adjust this line according to where you have this data in your request
              const { x, y, width, height } = req.body;

              // Convert string values to numbers assuming they come as percentages
              const xPercent = parseFloat(x);
              const yPercent = parseFloat(y);
              const widthPercent = parseFloat(width);
              const heightPercent = parseFloat(height);

              const outputPath = path.join(
                __dirname,
                "..",
                "uploads",
                newFileName
              );

              // Calculate pixel values using the provided percentages
              let xPx = Math.round((imageFile.width * xPercent) / 100);
              let yPx = Math.round((imageFile.height * yPercent) / 100);
              let widthPx = Math.round((imageFile.width * widthPercent) / 100);
              let heightPx = Math.round(
                (imageFile.height * heightPercent) / 100
              );

              // Perform the cropping and save the cropped image using jimp
              Jimp.read(imageFile.path)
                .then((image) => {
                  return image
                    .crop(xPx, yPx, widthPx, heightPx)
                    .writeAsync(outputPath);
                })
                .then(() => {
                  customStorage.onFileUploadComplete(req.file);
                  resolve(newFileName); // Resolve with the new file name
                })
                .catch((error) => {
                  reject(error);
                });
            }
          }
        );
      });
    });

    const newFileName = await newFileNamePromise;
    return newFileName;
  } catch (error) {
    console.error("delete file");
    //responseType({ res, status: 500, type: TYPE_RES.SERVER_ERROR, message: 'Server error during image processing' });
  }
};

const getUniqName = async ({ req, res }) => {
  try {
    const file = req.file;
    if (typeof file == "undefined") {
      console.log("no file");
      return "";
    }

    const newFileNamePromise = new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION;");

        db.run(
          "INSERT INTO file_uploads (filename) VALUES (?)",
          [file.originalname],
          function (err) {
            if (err) {
              db.run("ROLLBACK;");
              console.error(err);
              reject(err);
            } else {
              db.run("COMMIT;");
              const imageId = this.lastID;
              const newFileName = `${imageId}.jpg`;
              db.run(
                "DELETE FROM file_uploads WHERE id = ?",
                [imageId],
                function (err) {
                  if (err) {
                    console.error("Error ", err.message);
                  } else {
                    console.log("successfully");
                  }
                }
              );

              resolve(newFileName);
            }
          }
        );
      });
    });

    const newFileName = await newFileNamePromise;
    return newFileName;
  } catch (error) {
    console.error("delete file");
    //responseType({ res, status: 500, type: TYPE_RES.SERVER_ERROR, message: 'Server error during image processing' });
  }
};

const TYPE_RES = {
  NOT_FOUND: 1,
  ERROR: 2,
  SUCCESS: 3,
  SERVER_ERROR: 4,
};

function responseType({ status, res, type, message, info }) {
  let result = { info: info };

  switch (type) {
    case 1: {
      result = { ...{ error: 1, message: message ?? "not found" }, ...result };
      break;
    }
    case 2: {
      result = { ...{ error: 1, message: message ?? "error!" }, ...result };
      break;
    }
    case 3: {
      result = { ...{ success: 1, message: message ?? "success" }, ...result };
      break;
    }
    case 4: {
      result = {
        ...{ error: 4, message: message ?? "server error" },
        ...result,
      };
      break;
    }
  }

  res.status(status).json(result);
}

async function getImagePath(filename, default_image = "default_image.jpg") {
  if (filename === null || filename === "") {
    return path.join(__dirname, "..", "public", default_image);
  }

  const imagePath = path.join(__dirname, "..", "uploads", filename);

  try {
    // Check if the file exists asynchronously

    await fs.access(imagePath, fs.constants.F_OK);

    return imagePath; // File exists, return its path
  } catch (error) {
    return path.join(__dirname, "..", "public", default_image);
  }
}

const checkUniqueFieldValue = (table_name, field_name, value, message) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT COUNT(*) AS count FROM ${table_name} WHERE ${field_name} = ?`;
    db.get(query, [value], (err, results) => {
      if (err) {
        resolve({ status: false, message });
      } else {
        const not_exist = results.count == 0;
        resolve({
          status: not_exist,
          message: not_exist == false ? message : "",
        }); //count == 0(true) means there are not any emails with this title
      }
    });
  });
};

// Promisify database methods
const dbGetAsync = promisify(db.get).bind(db);

// Function to hash a password:
const hashPassword = async (plainTextPassword) => {
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(saltRounds);
    // Hash password with salt
    const hash = await bcrypt.hash(plainTextPassword, salt);
    return hash;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw error;
  }
};

const getOrginalNameOfCv = (memberid) => {
  return new Promise((resolve, reject) => {
    const sql_userinfo = `
      SELECT cv FROM members
      WHERE id = ?
    `;

    db.get(sql_userinfo, [memberid], (error, result) => {
      if (error) {
        reject(error);
      } else if (result) {
        resolve(result.cv);
      } else {
        reject(new Error("User not found"));
      }
    });
  });
};

const getNextAvailablePosition = ({ table_name,column_key,value_key }) => {
  return new Promise((resolve, reject) => {
    const sql_userinfo = `
      SELECT position FROM ${table_name} WHERE ${column_key}=? ORDER BY position DESC LIMIT 1
    `;

    db.get(sql_userinfo, [value_key], (error, result) => {
      if (error) {
        resolve(0)
      } else if (result) {
        resolve(result.position)
      } else {
        resolve(0)
      }
    });
  });

  let position = 1;
  db.each(``, (err, row) => {
    if (!err && row) {
      position = row.position + 1;
    }
  });
  return position;
};

// Export both the db object  function
module.exports = {
  getImagePath,
  responseType,
  TYPE_RES,
  uploadImageFile,
  checkUniqueFieldValue,
  dbGetAsync,
  hashPassword,
  getUniqName,
  getOrginalNameOfCv,
  getNextAvailablePosition
};
