// Import necessary modules and functions
const { getUserInfoBySessionId } = require("../models/database");

const updateSessionExpiration = (sid, expirationTime) => {
  return new Promise((resolve, reject) => {
    const updateSessionSql =
      "UPDATE sessions SET expirationTime = ? WHERE sid = ?";
    db.run(updateSessionSql, [expirationTime, sid], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Middleware to track user activity and update session expiration
const sessionUpdateMiddleware = async (req, res, next) => {
  if (req.cookies === undefined) {
    return next();
  }
  const sid = req.cookies["sid"];

  if (!sid) {
    return next(); // No session, continue without updating
  }

  try {
    // Get user info from the session
    const user = await getUserInfoBySessionId(sid);

    if (!user) {
      // Session not found, continue without updating
      return next();
    }

    // Update session expiration
    const currentTime = Date.now();
    const expirationTime = user.expirationTime; // Get expiration time from database
    const expirationThreshold = 2 * 60 * 60 * 1000; // Two hours threshold

    if (expirationTime - currentTime < expirationThreshold) {
      // If session expiration is within threshold, update it
      const newExpirationTime = currentTime + expirationThreshold;
      await updateSessionExpiration(sid, newExpirationTime);
    }
    // console.log("Comment=> session wa updated.")
    next(); // Continue to the next middleware

  } catch (error) {

    next(); // Continue to the next middleware

  }

 
};

module.exports = sessionUpdateMiddleware;
