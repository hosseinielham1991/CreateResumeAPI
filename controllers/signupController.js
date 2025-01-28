// controllers/memebrsController.js
const {db,addfield,deleteField} = require('../models/database');
const { responseType, TYPE_RES,  checkUniqueFieldValue,dbGetAsync,hashPassword} = require('../utils/utils');

const {sendVerificationCode} = require('../email')
const path = require('path');
const uuid = require('uuid');

function generateUniqueCode() {
  return Math.floor(100000 + Math.random() * 900000);
}

const checkvalidate = async ({req,email, code,username})=>{

  let validate_code =  false,
  validate_username =  false;

  if(code){
    const now = new Date();
    const check_sended_code_sql = `SELECT * FROM confirmation_code 
    WHERE email = ? AND
    code = ? AND
    expirationTime > ? `;
    const confirm = await dbGetAsync(check_sended_code_sql, [email,code,now]);

    if(confirm){
      validate_code=  true;
      db.run(` UPDATE confirmation_code
      SET status=true
      WHERE code = ? `,[code],
      function(err) {
          if (err) {
              console.error('Error updating confirmation_code:', err.message);
          } else {
              console.log('Confirmation code updated successfully');
          }
      });
    }
  }

  if(username){
    validate_username =  await checkUniqueFieldValue('users','username',username,'This username has already been used.')
  }

  let validate = {
      email: await checkUniqueFieldValue('members','email',email,'Already registered with this email.'),
      code:validate_code,
      username:validate_username
  }
 
  return validate ;
}

module.exports = {
  checkingForgotpassword:  async (req, res) => {
    const { email, code,  password ,step} = req.body;

    if(step === "check_email"){
      const checkemail =  await checkUniqueFieldValue('members','email',email,'Already registered with this email.');
      
      responseType({ res, status: 200, type: TYPE_RES.SUCCESS, message: '' ,info:{email:!checkemail.status}});
      return;
    }
    if(step==="send_code"){
      const now = new Date();
      const check_sended_code_sql = `SELECT * FROM confirmation_code 
      WHERE email = ? AND
      code = ? AND
      expirationTime > ? `;
      const confirm = await dbGetAsync(check_sended_code_sql, [email,code,now]);
  
      if(confirm){
        db.run(` UPDATE confirmation_code
        SET status=true
        WHERE code = ? `,[code],
        function(err) {
            if (err) {
                console.error('Error updating confirmation_code:', err.message);
            } else {
                console.log('Confirmation code updated successfully');
            }
        });
      }
      responseType({ res, status: 200, type: TYPE_RES.SUCCESS, message: '' ,info:{code:confirm}});
      return;
    }

    if(step==="get_pass"){
      const check_sended_code_sql = await dbGetAsync(`SELECT * FROM confirmation_code 
      WHERE email = ? AND
      code = ? AND
      status == TRUE `, [email, code]);

      if (check_sended_code_sql) {
        const hashedPassword = await hashPassword(password);
        const sqlUpdate = `UPDATE users
        SET password = ?
        WHERE memberid IN (SELECT id FROM members WHERE email = ?);`;

        db.run(sqlUpdate, [hashedPassword, email], (updateErr) => {
            if (updateErr) {
                // Handle SQL error
                responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:'An error occurred: ' + updateErr.message})

          
            } else {
              responseType({res,status:200,type: TYPE_RES.SUCCESS,message:'done'});
            }
        });

      }else{
        responseType({ res, status: 200, type: TYPE_RES.SUCCESS, info: {code:false} });
      }
      return;
    }
    

    responseType({ res, status: 200, type: TYPE_RES.SUCCESS, message: 'nothing' });

  },
  checkingSignup: async (req, res) => {
    const { email, code, username, add, name, family, password } = req.body;

    let validate = await checkvalidate({ req, email, code, username });

    if (add === true && validate.username.status && validate.email.status) {
        const check_sended_code_sql = await dbGetAsync(`SELECT * FROM confirmation_code 
            WHERE email = ? AND
            code = ? AND
            status == TRUE `, [email, code]);

        if (check_sended_code_sql) {
            try {
                db.serialize(() => {
                    db.run('BEGIN TRANSACTION');

                    // Insert into members table
                    db.run(`
                        INSERT INTO members (email, name, family) VALUES (?, ?, ?)
                    `, [email, name, family], async function (err) {
                        if (err) {
                            db.run('ROLLBACK');
                            responseType({ res, status: 200, type: TYPE_RES.ERROR, message: 'error' });
                            return;
                        }

                        // Get the last inserted ID
                        const memberID = this.lastID;

                        // Hash password
                        const hashedPassword = await hashPassword(password);

                        // Insert into users table
                        db.run(`INSERT INTO users (username, password, memberid) VALUES (?, ?, ?)`,
                            [username, hashedPassword, memberID], (err) => {
                                if (err) {
                                    db.run('ROLLBACK');
                                    responseType({ res, status: 200, type: TYPE_RES.ERROR, message: 'error' });
                                    return;
                                }

                                // Commit the transaction
                                db.run('COMMIT', (err) => {
                                    if (err) {
                                        responseType({ res, status: 200, type: TYPE_RES.ERROR, message: 'error' });
                                    }
                                    responseType({ res, status: 200, type: TYPE_RES.SUCCESS, message: 'Done' });
                                });
                            });
                    });
                });

            } catch (err) {
                responseType({ res, status: 200, type: TYPE_RES.SERVER_ERROR });
            }
        } else {
            validate.username = { status: false, message: 'The code sent to this email is not valid. Please try again.' }
            responseType({ res, status: 200, type: TYPE_RES.SUCCESS, info: validate });
        }
    } else {
        responseType({ res, status: 200, type: TYPE_RES.SUCCESS, info: validate });
    }
}
,
  sendCodeRegister: async (req, res) => {
    const { email } = req.body;
    const now = new Date();

    const check_sended_code_sql = `SELECT * FROM confirmation_code 
    WHERE email = ? AND
    expirationTime > ? `;

    try {
        const have_sended = await dbGetAsync(check_sended_code_sql, [email, now]);
        if (have_sended) {
            const timeFromDB = new Date(have_sended.expirationTime);
            const differenceInMilliseconds = timeFromDB.getTime() - now.getTime();
            const differenceInMinutes = Math.floor(differenceInMilliseconds / (1000 * 60));
            return responseType({ res, status: 200, type: TYPE_RES.ERROR, message: `We have sent a code for you. To repeat the request, you should wait for ${differenceInMinutes+1} minutes.` });
        }

        await deleteField({table_name:'confirmation_code', condition:'WHERE email = ?',values: [email]});

        let code = generateUniqueCode();
        let codeExists = await checkUniqueFieldValue('confirmation_code', 'code', code, '');
        while (!codeExists.status) {
            code = generateUniqueCode();
            codeExists = await checkUniqueFieldValue('confirmation_code', 'code', code, '');
        }

        
        // Send email
        sendVerificationCode(email, code, async (error, info) => {
            if (error) {
                console.log(error)
                // If error occurs during email sending, return the error as a response
                return responseType({ res, status: 200, type: TYPE_RES.ERROR, message: 'Failed to send verification code via email.' });
            }
            await addfield({ table_name: 'confirmation_code', field: { code, expirationTime: Date.now() + 2 * 60 * 1000, email } });
            responseType({ res, status: 200, type: TYPE_RES.SUCCESS, message: 'Code has been sent.' });
        });
    } catch (error) {
        console.error('Error occurred:', error);
        responseType({ res, status: 200, type: TYPE_RES.ERROR, message: 'Internal server error.' });
    }
}

  
}