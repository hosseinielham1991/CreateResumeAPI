// Middlewares/authMiddleware.js
const {getUserInfoBySessionId } = require('../models/database');
const { responseType, TYPE_RES} = require('../utils/utils')
const path = require('path');
// ... (rest of the imports)
const authMiddleware = (req, res, next) => {

    const sid = req.cookies['sid'];
    if (!sid) {
      return responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message: 'Not authenticated' });
    }
    getUserInfoBySessionId(sid)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => {
  
      responseType({res,status:401,type: TYPE_RES.SERVER_ERROR,message: 'User not found' });
      
      
    });
};

module.exports = authMiddleware;
