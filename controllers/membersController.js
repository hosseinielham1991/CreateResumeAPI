// controllers/memebrsController.js
const {db} = require('../models/database');
const { getImagePath,responseType, TYPE_RES,getOrginalNameOfCv} = require('../utils/utils')
const path = require('path');
const fs = require('fs');
module.exports = {
  getAllMembers: (req, res) => {
    const sql = 'SELECT * FROM members';
    db.all(sql, [], (err, rows) => {
      if (err) {
        responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:err.message});
        return;
      }
      responseType({res,status:200,type:TYPE_RES.SUCCESS,info:rows});
    });
  },
  addNewMember: (req, res) => {
    
    const { name, email } = req.body;
 
    const sql = `INSERT INTO members (name, email) VALUES (?, ?)`;

    db.run(sql, [name, email], function(err) {
      if (err) {
        responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:err.message});
        return;
      }
      responseType({res,status:201,type: TYPE_RES.SUCCESS,message:`A row has been inserted with rowid ${this.lastID}`});
    });
  },
  showExperienceImage: (req, res)=>{
    try {
      const experienceId = req.params.experienceId;

      // Now you would retrieve your member from the database or other data source
      // This is just a placeholder for whatever your retrieve logic is
      const sql = 'SELECT img FROM Experiences WHERE id = ?';
      db.get(sql, [experienceId], (err, row) => { // Pass experienceId as a parameter to fill the placeholder
        if (err) {
          return console.error(err.message);
        }

        let img = row?.img || '';
        getImagePath(img)
        .then(imagePath => {
          res.sendFile( imagePath, function(err){
            if (err) {
              responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:'Error sending the file'});
            } 
          });
        })
        .catch(error => {
              responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:'Error sending the file'});
        });
  
      });


    } catch (error) {
      responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:'Server error'});
    }
  }, 
  showDetailsImage: (req, res)=>{
    try {
      const componentId = req.params.detailsId;
      // Now you would retrieve your member from the database or other data source
      // This is just a placeholder for whatever your retrieve logic is
      const sql = 'SELECT img FROM experience_details WHERE id = ?';
      db.get(sql, [componentId], (err, row) => { // Pass memberId as a parameter to fill the placeholder
        if (err) {
          return console.error(err.message);
        }
     
        let img = row?.img || '';
        getImagePath(img)
        .then(imagePath => {
          res.sendFile( imagePath, function(err){
            if (err) {
              responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:'Error sending the file'});
            } 
          });
        })
        .catch(error => {
              responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:'Error sending the file'});
        });
    
      });


  } catch (error) {
    responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:'Server error'});
  }
  },
  showProfileImage: (req, res)=>{
    try {
      const memberId = req.params.memberId;

      // Now you would retrieve your member from the database or other data source
      // This is just a placeholder for whatever your retrieve logic is
      const sql = 'SELECT img FROM members WHERE id = ?';
      db.get(sql, [memberId], (err, row) => { // Pass memberId as a parameter to fill the placeholder
        if (err) {
          return console.error(err.message);
        }

        if (row) {
          let img = row?.img || '';
          getImagePath(img,'profile_image.jpg')
          .then(imagePath => {
            res.sendFile( imagePath, function(err){
              if (err) {
                responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:'Error sending the file'});
              } 
            });
          });
         
         // callback({ member: row }); // Member found, return it
        } else {
          responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message: 'NOT FOUND' });
          //callback({ message: "Member not found" }); // No member found, return message
        }
    
      });


  } catch (error) {
    responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:'Server error'});
  }
  },
  downloadCv:async (req, res) => {
    
    try {
      const memberId = req.params.memberId;
      
      // Assume you have a function to get the original file name by user ID
      const originalFileName = await getOrginalNameOfCv(memberId);
  
      if (originalFileName) {
        const extname = path.extname(originalFileName);
        const cvDirectory = path.join(__dirname, '..', 'cv');
        const filePath = path.join(cvDirectory, `${memberId}${extname}`);
        
        // Check if the file exists
        if (fs.existsSync(filePath)) {

          res.setHeader('Content-Disposition', `attachment; filename="${originalFileName}"`);
          res.setHeader('Content-Type', 'application/pdf');
          // Send the file to the user for download
          res.download(filePath, originalFileName, (err) => {
            if (err) {
              console.error("Error downloading the file:", err);
              responseType({res,status:500,type:TYPE_RES.ERROR,message:"Error downloading the file."});
            }
          });
        } else {
          responseType({res,status:500,type:TYPE_RES.ERROR,message:"File not found."});
        }
      } else {
        responseType({res,status:500,type:TYPE_RES.ERROR,message:"No file associated with this user."});
      }
    } catch (error) {
      console.error("Error in download route:", error);
      responseType({res,status:500,type:TYPE_RES.ERROR,message:"Internal server error."});

    }
  },
  getMemberDetails: (req, res) => {
    try {
      const memberId = req.params.memberId;
  
      // First, get the member details
      const memberSql = `SELECT m.*, COUNT(e.memberid) AS experience_count
      FROM members m
      LEFT JOIN experiences e ON m.id = e.memberid
      WHERE m.id = ?;`;
      db.get(memberSql, [memberId], (err, member) => {
        if (err) {
          console.error(err.message);
          return responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:'Server error'});
        }
  
        if (!member) {
          return responseType({res,status:404,type: TYPE_RES.SERVER_ERROR,message: "Member not found" });
        }
        responseType({res,status:200,type:TYPE_RES.SUCCESS,info:member});
      });
  
    } catch (error) {
      console.error(error.message);
      responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:'Server error'});
    }
  },
  getmemberidByPath: (req,res)=>{
    try {
      const path = req.params.path;
  
      // First, get the member details
      const memberSql = `SELECT * FROM members WHERE path = ?`;
      db.get(memberSql, [path], (err, member) => {
        if (err) {
          console.error(err.message);
          return responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:'Server error'});
        }
  
        if (!member) {
          return responseType({res,status:404,type: TYPE_RES.SERVER_ERROR,message: "Member not found" });
        }
        responseType({res,status:200,type:TYPE_RES.SUCCESS,info:{id:member.id}});
      });
  
    } catch (error) {
      console.error(error.message);
      responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:'Server error'});
    }
  },
  getListOfExperience: (req, res) => {
    try {
      const memberId = req.params.memberId;
      const listExperiences = `
  SELECT
      experiences.id as 'key', 
      experiences.*,
      COUNT(experience_details.experienceid) as detailsCount
  FROM 
      experiences
  LEFT JOIN 
      experience_details ON experience_details.experienceid = experiences.id
  WHERE 
      experiences.memberid = ?
  GROUP BY 
      experiences.id
  ORDER BY 
      CASE 
          WHEN experiences.datecreate IS NOT NULL AND experiences.datecreate <> '' THEN 0 -- Prioritize non-null and non-empty datecreate
          ELSE 1 -- Then handle null or empty datecreate
      END,
      CASE 
          WHEN experiences.datecreate IS NOT NULL AND experiences.datecreate <> '' THEN experiences.datecreate
          ELSE NULL
      END ASC, -- Sort by datecreate if it's not null or empty
      experiences.id DESC; -- Then sort by id for rows with null or empty datecreate
  
    `;
      db.all(listExperiences, [memberId], (err, rows) => {
        if (err) {
          console.error(err.message);
          return responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:'Server error'});
        }
        responseType({res,status:200,type:TYPE_RES.SUCCESS,info:rows});

      });

    } catch (error) {
      console.error(error.message);
      responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:'Server error'});
    }
  },
  getListOfExperienceDetails: (req, res) => {
    try {
      const experienceId = req.params.experienceId;

      const listExperiences = `SELECT  experience_details.id as 'key',* FROM experience_details WHERE experienceid = ? ORDER BY position DESC;`;
      db.all(listExperiences, [experienceId], (err, rows) => {
        if (err) {
          console.error(err.message);
          return responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:'Server error'});
        }
        responseType({res,status:200,type: TYPE_RES.SUCCESS,info:rows});
          
     

      });

    } catch (error) {
      console.error(error.message);
      responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:'Server error'});
    }
  },
  getMembersByRange: (req, res) => {

    try {
      // Use query parameters with fallback defaults
      const from = parseInt(req.query.from, 10) || 0;
      const count = parseInt(req.query.count, 10) || 10;
  

      // Database calls should be done with the SQLite methods you're using elsewhere, such as `db.all()`
      db.all(
        `SELECT
            m.id,
            m.name,
            m.family,
            m.job_position AS title
         FROM
            members m
         ORDER BY
            m.id
         LIMIT ? OFFSET ?`, [count, from], (err, listResult) => {
          if (err) {
            console.error(err.message);
            return responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:'Server error'});
          }
  
          // Now, make the second query for the total number of members
          db.get(`SELECT COUNT(*) AS total FROM members`, [], (err, totalResult) => {
            if (err) {
              console.error(err.message);
              responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:'Server error'});
            }
            
            // If no errors, process the results and send the response
            const total = totalResult.total; // Notice 'total' field, adjust if your SQL driver returns this differently
          
            return responseType({res,status:200,type: TYPE_RES.SUCCESS,info:{
              total,
              from: from + count,
              list: listResult
            }});

          });
        }
      );
  
    } catch (error) {
      console.error(error.message);
      responseType({res,status:500,type: TYPE_RES.SERVER_ERROR,message:'Server error'});
    }
  }
  
};
