const {
  db,
  getUserInfoById,
  updatefield,
  addfield,
  unlinkFile,
} = require("../models/database");
const {
  getImagePath,
  responseType,
  TYPE_RES,
  uploadImageFile,
  hashPassword,
  getUniqName,
  getOrginalNameOfCv,
  getNextAvailablePosition,
} = require("../utils/utils");
const path = require("path");
const fs = require("fs");

module.exports = {
  addNewMember: (req, res) => {
    const { name, email } = req.body;
    const sql = `INSERT INTO members (name, email) VALUES (?, ?)`;

    db.run(sql, [name, email], function (err) {
      if (err) {
        responseType({ res, status: 500, type: TYPE_RES.SERVER_ERROR });
        return;
      }
      responseType({
        res,
        status: 201,
        type: TYPE_RES.SUCCESS,
        message: `A row has been inserted with rowid ${this.lastID}`,
      });
    });
  },
  getInfo: (req, res) => {
    getUserInfoById(req.user.id)
      .then((user) => {
        responseType({ res, status: 200, type: TYPE_RES.SUCCESS, info: user });
      })
      .catch((err) => {
        // Handle errors like 404 for user not found or 500 for server errors
        console.log(err);
        responseType({
          res,
          status: 500,
          type: TYPE_RES.SERVER_ERROR,
          message: err.message,
        });
      });
  },
  updatemember: async (req, res) => {
    const {
      name,
      family,
      age,
      gender,
      linkedin,
      github,
      specialties,
      job_position,
      city,
      country,
      path,
      alias_experiences,
      alias_skill,
    } = req.body;

    let fieldsToUpdate = {
      alias_experiences,
      alias_skill,
      name,
      family,
      age,
      gender,
      email,
      linkedin,
      github,
      specialties,
      job_position,
      city,
      country,
    };

    let exist_path = false;

    const sql = "SELECT * FROM members WHERE id != ? and path = ?";

    try {
      const row = await new Promise((resolve, reject) => {
        db.get(sql, [req.user.id, path], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (row) {
        exist_path = true;
      }
    } catch (err) {
      responseType({
        res,
        status: 500,
        type: TYPE_RES.SERVER_ERROR,
        message: "An error occurred: " + err.message,
      });
      return;
    }

    if (!exist_path) {
      fieldsToUpdate["path"] = path;
      if (
        await updatefield({
          res,
          id: req.user.id,
          table_name: "members",
          field: fieldsToUpdate,
          message: "update memeber",
        })
      ) {
        responseType({ res, status: 200, type: TYPE_RES.SUCCESS });
      } else {
        responseType({ res, status: 500, type: TYPE_RES.SERVER_ERROR });
      }
    } else {
      responseType({
        res,
        status: 500,
        type: TYPE_RES.SERVER_ERROR,
        info: { exist_path },
      });
    }
  },
  updateabout: async (req, res) => {
    const { about } = req.body;
    const fieldsToUpdate = { about };

    if (
      await updatefield({
        res,
        id: req.user.id,
        table_name: "members",
        field: fieldsToUpdate,
        message: "update about",
      })
    ) {
      responseType({ res, status: 200, type: TYPE_RES.SUCCESS });
    } else {
      responseType({ res, status: 500, type: TYPE_RES.SERVER_ERROR });
    }
  },
  updateskills: async (req, res) => {
    const { skills } = req.body;
    const fieldsToUpdate = { skills };

    if (
      await updatefield({
        res,
        id: req.user.id,
        table_name: "members",
        field: fieldsToUpdate,
        message: "update skills",
      })
    ) {
      responseType({ res, status: 200, type: TYPE_RES.SUCCESS });
    } else {
      responseType({ res, status: 500, type: TYPE_RES.SERVER_ERROR });
    }
  },
  updateProfileImage: async (req, res, customStorage) => {
    try {
      const file_name = await uploadImageFile({ req, res, customStorage });
      if (
        await updatefield({
          res,
          id: req.user.id,
          table_name: "members",
          field: { img: file_name },
          message: "update skills",
          is_image: "img",
        })
      ) {
        responseType({ res, status: 200, type: TYPE_RES.SUCCESS });
      } else {
        responseType({ res, status: 500, type: TYPE_RES.SERVER_ERROR });
      }
    } catch (error) {
      // Handle the error from uploadImageFile
      console.error("Error in uploadImageFile:", error);
      responseType({
        res,
        status: 500,
        type: TYPE_RES.SERVER_ERROR,
        message: error.message,
      });
      // You can add additional error handling or response logic here if needed
    }
  },
  uploadCv: async (req, res) => {
    try {
      const cvDirectory = path.join(__dirname, "..", "cv");

      // console.log(req.body.delete)
      // if(req.body.delete){

      //}else
      if (req.file) {
        const file_name = req.file.originalname; // e.g., "document.pdf"
        const extname = path.extname(file_name); // Get the file extension, e.g., ".pdf"

        const outputPath = path.join(cvDirectory, `${req.user.id}${extname}`);

        // Ensure the "cv" directory exists; create it if it doesn't
        if (!fs.existsSync(cvDirectory)) {
          fs.mkdirSync(cvDirectory, { recursive: true }); // Create directory recursively if it doesn't exist
        }

        // Check if req.file.path is defined before renaming
        if (typeof req.file.path === "string") {
          // Move the uploaded file to the desired output path
          fs.renameSync(req.file.path, outputPath);
        } else {
          responseType({
            res,
            status: 500,
            type: TYPE_RES.SERVER_ERROR,
            message: "Uploaded file path is not valid",
          });
        }
        if (
          await updatefield({
            res,
            id: req.user.id,
            table_name: "members",
            field: { cv: file_name },
            message: "update cv",
          })
        ) {
          responseType({
            res,
            status: 200,
            type: TYPE_RES.SUCCESS,
            message: "CV uploaded successfully",
            info: { name: file_name, id: req.user.id },
          });
        } else {
          responseType({
            res,
            status: 500,
            type: TYPE_RES.SERVER_ERROR,
            message: "Uploaded file path is not valid",
          });
        }
      } else {
        const originalFileName = await getOrginalNameOfCv(req.user.id); // Function to retrieve the original file name by user ID
        if (originalFileName) {
          const extname = path.extname(originalFileName);
          const filePath = path.join(
            cvDirectory,
            `${req.body.delete}${extname}`
          );

          // Check if the file exists
          if (fs.existsSync(filePath)) {
            // Delete the file
            fs.unlinkSync(filePath);
            if (
              await updatefield({
                res,
                id: req.user.id,
                table_name: "members",
                field: { cv: "" },
                message: "update cv",
              })
            ) {
              responseType({
                res,
                status: 200,
                type: TYPE_RES.SUCCESS,
                message: "File deleted successfully",
                info: { delete: 1 },
              });
            } else {
              responseType({
                res,
                status: 200,
                type: TYPE_RES.ERROR,
                message: "Uploaded file path is not valid",
              });
            }
          } else {
            responseType({
              res,
              status: 200,
              type: TYPE_RES.ERROR,
              message: "File not found",
            });
          }
        } else {
          responseType({
            res,
            status: 200,
            type: TYPE_RES.ERROR,
            message: "No file associated with this user",
          });
        }
      }
    } catch (error) {
      console.error("Error in uploadCv:", error);
      responseType({
        res,
        status: 200,
        type: TYPE_RES.SERVER_ERROR,
        message: "nothing",
      });
    }
  },
  logout: (req, res) => {
    const sid = req.cookies["sid"];
    db.run("DELETE FROM sessions WHERE sid = ?", [sid], function (err) {
      if (err) {
        console.log(err);
      } else {
        res.clearCookie("sid");
        responseType({
          res,
          status: 200,
          type: TYPE_RES.SUCCESS,
          message: "logout",
        });
      }
    });
  },
  updatePassword: (req, res) => {
    const { username, password } = req.body;
    let value_of_username = username;

    if (!req.body.hasOwnProperty("username")) {
      value_of_username = req.user.username;
    }

    const sql = "SELECT * FROM users WHERE username = ?";
    db.get(sql, [value_of_username], async (err, row) => {
      if (err) {
        // Handle SQL error
        responseType({
          res,
          status: 500,
          type: TYPE_RES.SERVER_ERROR,
          message: "An error occurred: " + err.message,
        });
      } else if (row) {
        // User exists, update the password
        try {
          const hashedPassword = await hashPassword(password);
          const sqlUpdate = "UPDATE users SET password = ? WHERE username = ?";

          db.run(
            sqlUpdate,
            [hashedPassword, value_of_username],
            (updateErr) => {
              if (updateErr) {
                // Handle SQL error
                responseType({
                  res,
                  status: 500,
                  type: TYPE_RES.SERVER_ERROR,
                  message: "An error occurred: " + updateErr.message,
                });
              } else {
                responseType({
                  res,
                  status: 200,
                  type: TYPE_RES.SUCCESS,
                  message: "Password updated successfully.",
                });
              }
            }
          );
        } catch (hashError) {
          responseType({
            res,
            status: 500,
            type: TYPE_RES.SERVER_ERROR,
            message: "Failed to hash new password: " + hashError.message,
          });
        }
      } else {
        // No user found, create the user
        try {
          const hashedPassword = await hashPassword(password);
          const sqlInsert =
            "INSERT INTO users (username, password) VALUES (?, ?)";

          db.run(
            sqlInsert,
            [value_of_username, hashedPassword],
            (insertErr) => {
              if (insertErr) {
                // Handle SQL error
                responseType({
                  res,
                  status: 500,
                  type: TYPE_RES.SERVER_ERROR,
                  message: "An error occurred: " + insertErr.message,
                });
              } else {
                responseType({
                  res,
                  status: 201,
                  type: TYPE_RES.SUCCESS,
                  message: "User created successfully.",
                });
              }
            }
          );
        } catch (hashError) {
          responseType({
            res,
            status: 500,
            type: TYPE_RES.SERVER_ERROR,
            message: "Failed to hash new password: " + hashError.message,
          });
        }
      }
    });
  },
  checkhasDetails: async (req, res) => {
    const user = req.user;
    const experience_id = req.params.experienceId;
    try {
      message = "noaccess";

      if (result) message = "deleted";

      responseType({
        res,
        status: 200,
        type: TYPE_RES.SUCCESS,
        message: message,
      });
    } catch {
      responseType({
        res,
        status: 500,
        type: TYPE_RES.SERVER_ERROR,
        message: "Failed to hash new password: " + hashError.message,
      });
    }
  },
  deleteExperienceDetails: async (req, res) => {
    const user = req.user;
    const experience_dtails_id = req.params.experienceDetailsId;
    try {
      const sql = `DELETE FROM experience_details
                  WHERE id = ?
                  AND id IN (
                      SELECT experience_details.id
                      FROM experience_details
                      INNER JOIN experiences ON experience_details.experienceid = experiences.id
                      INNER JOIN members ON members.id = experiences.memberid
                      AND memberid = ${user.id}
          )`;

      // Delete details associated with the experience
      db.run(sql, [experience_dtails_id], (err) => {
        if (err) {
          responseType({
            res,
            status: 200,
            type: TYPE_RES.SUCCESS,
            message: "error",
          });
        } else {
          responseType({
            res,
            status: 200,
            type: TYPE_RES.SUCCESS,
            message: "deleted",
          });
        }
      });
    } catch (err) {
      responseType({ res, status: 200, type: TYPE_RES.SERVER_ERROR });
    }
  },
  multiDeleteExperienceDetails: async (req, res) => {
    const user = req.user;
    const idString = req.body.ids;

    // Split the string of IDs into an array
    const ids = idString.split(",").map((id) => parseInt(id.trim(), 10));

    const sql = `DELETE FROM experience_details
                    WHERE id IN (${ids.map(() => "?").join(",")})
                    AND id IN (
                        SELECT experience_details.id
                        FROM experience_details
                        INNER JOIN experiences ON experience_details.experienceid = experiences.id
                        INNER JOIN members ON members.id = experiences.memberid
                        AND memberid = ${user.id}
      )`;

    try {
      // Delete details associated with the experience
      db.run(sql, ids, (err) => {
        if (err) {
          responseType({
            res,
            status: 200,
            type: TYPE_RES.SUCCESS,
            message: "error",
          });
        } else {
          responseType({
            res,
            status: 200,
            type: TYPE_RES.SUCCESS,
            message: "deleted",
          });
        }
      });
    } catch (err) {
      responseType({ res, status: 200, type: TYPE_RES.SERVER_ERROR });
    }
  },
  deleteExperience: async (req, res) => {
    const user = req.user;
    const experience_id = req.params.experienceId;
    try {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // Delete details associated with the experience
        db.run(
          `
                    DELETE FROM experience_details
                    WHERE experienceid = ? 
                    AND id IN (
                        SELECT experience_details.id
                        FROM experience_details
                        INNER JOIN experiences ON experience_details.experienceid = experiences.id
                        WHERE experiences.id = ? AND experiences.memberid = ${user.id}
                    )
                `,
          [experience_id, experience_id],
          (err) => {
            if (err) {
              db.run("ROLLBACK");
              responseType({
                res,
                status: 200,
                type: TYPE_RES.SUCCESS,
                message: "error",
              });
              return;
            }

            // Delete the experience itself
            db.run(
              `DELETE FROM experiences WHERE id = ? AND memberid = ${user.id}`,
              [experience_id],
              (err) => {
                if (err) {
                  db.run("ROLLBACK");
                  responseType({
                    res,
                    status: 200,
                    type: TYPE_RES.SUCCESS,
                    message: "error",
                  });
                  return;
                }

                // Commit the transaction
                db.run("COMMIT", (err) => {
                  if (err) {
                    responseType({
                      res,
                      status: 200,
                      type: TYPE_RES.SUCCESS,
                      message: "error",
                    });
                  }
                  responseType({
                    res,
                    status: 200,
                    type: TYPE_RES.SUCCESS,
                    message: "deleted",
                  });
                });
              }
            );
          }
        );
      });
    } catch (err) {
      responseType({ res, status: 200, type: TYPE_RES.SERVER_ERROR });
    }
  },
  changeOrderOfExperienceId: (req, res) => {
    const user = req.user;
    const experience_id = req.params.experienceId;
    const { moveIndex, dropIndex } = req.body;
    db.serialize(() => {
      // Start a transaction
      db.run("BEGIN TRANSACTION");

      // Fetch the current positions
      db.all(
        `SELECT id, position FROM experience_details WHERE experienceId=${experience_id}  ORDER BY position`,
        [],
        (err, rows) => {
          if (err) throw err;

          const movedItem = rows[moveIndex];
          const itemToDropBefore = rows[dropIndex];

          // Update positions of rows affected by the move
          const stmt = db.prepare(
            "UPDATE experience_details SET position = ? WHERE id = ?"
          );
          let new_position = 0;
          if (moveIndex < dropIndex) {
            // Move item down in the list
            new_position = dropIndex;
            for (let i = (dropIndex - 1); i >= (moveIndex - 1); i--) {
              console.log(i)
              stmt.run(new_position, rows[i].id);
              new_position--;
            }
          } else {
            // Move item up in the list
            new_position = moveIndex;
            for (let i = moveIndex - 1; i < dropIndex -1; i--) {
              stmt.run(rows[i].position - 1, rows[i].id);
            }
          }

          // Update the moved item’s position
          stmt.run(dropIndex, movedItem.id);

          stmt.finalize(); // Finalize the statement
          db.run("COMMIT"); // Commit the transaction
          responseType({ res, status: 200, type: TYPE_RES.SUCCESS });
        }
      );
    });
  },
  editExperience: async (req, res) => {
    const user = req.user;
    const experience_id = req.params.experienceId;
    const { title, summary, link, datecreate, img } = req.body;
    if (
      await updatefield({
        res,
        id: experience_id,
        table_name: "experiences",
        check_access: " AND memberid=" + user.id,
        field: { title, summary, link, datecreate, img, memberid: user.id },
        message: "update experience",
      })
    ) {
      responseType({ res, status: 200, type: TYPE_RES.SUCCESS });
    } else {
      responseType({ res, status: 500, type: TYPE_RES.SERVER_ERROR });
    }
  },
  EditExperienceDetails: async (req, res) => {
    const user = req.user;
    const experienceDetailsId = req.params.experienceDetailsId;
    const { title, description, img, experienceid } = req.body;
    let position = 0;

    try {
      if (experienceDetailsId == "0") {
        position =
          (await getNextAvailablePosition({
            table_name: "experience_details",
            column_key: "experienceid",
            value_key: experienceid,
          })) + 1;
      }
    } catch (error) {
      console.log(error);
    }

    const fieldsToUpdate = { title, description, img, experienceid };

    if (experienceDetailsId == "0") {
      fieldsToUpdate.position = position;
    }

    if (
      await updatefield({
        res,
        id: experienceDetailsId,
        table_name: "experience_details",
        check_access: `AND experienceid IN (SELECT id FROM experiences WHERE id = experience_details.experienceid and memberid=${user.id})`,
        field: fieldsToUpdate,
        message: "update experience",
      })
    ) {
      responseType({ res, status: 200, type: TYPE_RES.SUCCESS });
    } else {
      responseType({ res, status: 500, type: TYPE_RES.SERVER_ERROR });
    }
  },
  infoOfExperience: (req, res) => {
    const user = req.user;
    const experience_id = req.params.experienceId;
    const sql = `SELECT * FROM experiences WHERE id=? AND memberid=?`;

    db.get(sql, [experience_id, user.id], async (err, row) => {
      if (err) {
        // Handle SQL error
        responseType({
          res,
          status: 500,
          type: TYPE_RES.SERVER_ERROR,
          message: "An error occurred: " + err.message,
        });
      } else if (row) {
        responseType({ res, status: 200, type: TYPE_RES.SUCCESS, info: row });
      }
    });
  },
  uploadImageTemp: async (req, res, customStorage) => {
    try {
      const file_name = await uploadImageFile({ req, res, customStorage });
      if (
        addfield({
          table_name: "image_temp",
          field: {
            img: file_name,
            createdate: Date.now(),
            memberid: req.user.id,
          },
        })
      ) {
        responseType({
          res,
          status: 200,
          type: TYPE_RES.SUCCESS,
          info: { img: file_name },
        });
      } else {
        responseType({ res, status: 500, type: TYPE_RES.SERVER_ERROR });
      }
    } catch (error) {
      // Handle the error from uploadImageFile
      console.error("Error in uploadImageFile:", error);
      responseType({
        res,
        status: 500,
        type: TYPE_RES.SERVER_ERROR,
        message: error.message,
      });
      // You can add additional error handling or response logic here if needed
    }
  },
  viewImageTemp: (req, res) => {
    try {
      const tempName = req.params.nameOfImage;

      // Now you would retrieve your member from the database or other data source
      // This is just a placeholder for whatever your retrieve logic is
      const sql = "SELECT img FROM image_temp WHERE img =? AND memberid = ? ";

      db.get(sql, [tempName, req.user.id], (err, row) => {
        // Pass experienceId as a parameter to fill the placeholder
        if (err) {
          return console.error(err.message);
        }

        if (row) {
          getImagePath(tempName)
            .then((imagePath) => {
              res.sendFile(imagePath, function (err) {
                if (err) {
                  responseType({
                    res,
                    status: 500,
                    type: TYPE_RES.SERVER_ERROR,
                    message: "Error sending the file",
                  });
                }
              });
            })
            .catch((error) => {
              responseType({
                res,
                status: 500,
                type: TYPE_RES.SERVER_ERROR,
                message: "Error sending the file",
              });
            });

          // callback({ member: row }); // Member found, return it
        } else {
          responseType({
            res,
            status: 500,
            type: TYPE_RES.SERVER_ERROR,
            message: "NOT FOUND",
          });
          //callback({ message: "Member not found" }); // No member found, return message
        }
      });
    } catch (error) {
      responseType({
        res,
        status: 500,
        type: TYPE_RES.SERVER_ERROR,
        message: "Server error",
      });
    }
  },
};
