const express = require('express');
const router = express.Router();
const memebrsController = require('../controllers/membersController');

router.get('/', memebrsController.getAllMembers);
router.post('/add', memebrsController.addNewMember);

// The '/getmembers' route is different enough that it should still work at this spot:
router.get('/getmembers', memebrsController.getMembersByRange); 

// Image routes
router.get('/img/:memberId', memebrsController.showProfileImage);

// Experience routes
router.get('/experience/:memberId', memebrsController.getListOfExperience);
router.get('/experience/img/:experienceId', memebrsController.showExperienceImage);
router.get('/experience/details/:experienceId', memebrsController.getListOfExperienceDetails);
router.get('/experience/details/img/:detailsId', memebrsController.showDetailsImage);
router.get('/getPath/:path', memebrsController.getmemberidByPath);
// The ':memberId' parameter will match anything, so it should go last to prevent it from catching routes that should be handled by other handlers.
router.get('/:memberId', memebrsController.getMemberDetails);
router.get('/downloadCv/:memberId', memebrsController.downloadCv);
module.exports = router;

