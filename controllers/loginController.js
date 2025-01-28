// controllers/memebrsController.js
const {db,getUserInfoBySessionId} = require('../models/database');
const { responseType, TYPE_RES} = require('../utils/utils')
const path = require('path');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const authMiddleware = require('../Middlewares/authMiddleware');



// Function to check if an entered password matches the stored hash
const comparePassword = async (plainTextPassword, hash) => {
    try {
      // Compare provided password with the hash stored in the database
      return await bcrypt.compare(plainTextPassword, hash);
    } catch (error) {
      console.error('Error comparing password:', error);
      throw error;
    }
  };

function authenticateUser(username, password) {
    // Here you should implement your user authentication logic
    // For now, let's assume any username and password combination is correct
    return true;
  }



module.exports = {
  info:(req, res)=>{
    const sid = req.cookies['sid']; // assuming you have access to the cookies
    getUserInfoBySessionId(sid)
      .then(user => {
        responseType({res,status:200,type:TYPE_RES.SUCCESS,info:user});
      })
      .catch(err => {
        // Handle errors like 404 for user not found or 500 for server errors
        responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message: err.message});

      });
  },
  loginAndSetToken: (req, res) => {
        const { username, password } = req.body;

        const sql = 'SELECT * FROM users WHERE username = ?';
        db.get(sql, [username], async  (err, row) => { 
            if (err) {
                // Handle SQL error
                responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message: 'An error occurred: ' + err.message});
            } else if (row) {
                // User exists, update the password
                try {

                    const comparehash =  await comparePassword(password,row.password);

                    if (comparehash) {
                      // Generate a unique SID
                      const sid = uuid.v4();
      
                      // Store the SID in the sessions table along with user ID and expiration timestamp
                      const expirationTime = Date.now() + 2 * 60 * 60 * 1000; // Two hours
                      const insertSessionSql = 'INSERT INTO sessions (sid, userId, expirationTime) VALUES (?, ?, ?)';
                      db.run(insertSessionSql, [sid, row.id, expirationTime], (sessionErr) => {
                        if (sessionErr) {
                          responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message: 'Failed to create session: ' + sessionErr.message });
                        } else {
                          // Set the SID as a cookie in the response
                          res.cookie('sid', sid,  {
                            httpOnly: true,
                            expires: new Date(expirationTime),
                            secure: true,
                            //secure: process.env.NODE_ENV === 'production', // set to true if HTTPS, otherwise false
                            sameSite: 'None', // or 'Lax'/'Strict' based on your requirements
                            path: '/'                           });
                          getUserInfoBySessionId(sid)
                            .then(user => {
                              responseType({res,status:200,type:TYPE_RES.SUCCESS,info:user});
                            })
                            .catch(err => {
                              // Handle errors like 404 for user not found or 500 for server errors
                              responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message: err.message});
                            });

                         
                        }
                      });
                    } else {
                      responseType({res,status:200,type: TYPE_RES.ERROR, message: 'Password is wrong!!' });
                    }
                   

                } catch (hashError) {
                    responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message: 'Failed to hash new password: ' + hashError.message});
                }
            } else {
              responseType({res,status:200,type: TYPE_RES.SERVER_ERROR,message: 'Failed to login'})
            }
          })


  }
}