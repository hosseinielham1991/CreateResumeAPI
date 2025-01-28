const sqlite3 = require('sqlite3').verbose();
const schedule = require('node-schedule');

const DB_PATH = './resumebuilderpro.sqlite';
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to the database in cleanupService.js:', err.message);
  } else {
    console.log('Connected to cleanupService');
    // Schedule cleanup job only after successful connection
    scheduleCleanupJob();
  }
});

function scheduleCleanupJob() {
  const cleanupJob = schedule.scheduleJob('11 18 * * *', () => {
    // Run cleanup at 7:00 PM every day
    const now = new Date();
    Date.now() + 2 * 60 * 1000

    db.run(`DELETE FROM sessions WHERE expirationTime < ?`, [now], function (err) {
      if (err) {
        console.error('Error executing cleanup query:', err.message);
        return;
      }
      console.log('Deleted expired sessions');
    });
console.log(Date.now() - ( 10 * 60 * 1000))
    db.run(`DELETE FROM confirmation_code 
    WHERE  expirationTime < ? `, [Date.now() - ( 10 * 60 * 1000)], function (err) {
      if (err) {
        console.error('Error executing cleanup query:', err.message);
        return;
      }
      console.log('Deleted expired code');
    });


  });

}
