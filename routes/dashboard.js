const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const MyCustomStorage = require('./myCustomStorage'); // Assuming it's in the same directory
const customStorage = new MyCustomStorage({ destination: 'temps/' });
const ALLOW_FILES = /pdf|doc|msword|docx|jpg|jpeg|png|gif/;
const upload = multer({
  storage: customStorage,
  fileFilter: function (req, file, cb) {
    // Accept pdf, doc, docx, and image files
    const mimetype = ALLOW_FILES.test(file.mimetype);
    const extname = ALLOW_FILES.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only pdf, doc, docx, and image files are allowed!'));
    }
  }
});

const uploadCv = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'cv/');
    },
    filename: function (req, file, cb) {
      const extname = path.extname(file.originalname);
      cb(null, `file_${Date.now()}${extname}`);
    }
  }),
  fileFilter: function (req, file, cb) {
    // Accept PDF, DOC, DOCX
    const ALLOW_FILES = /pdf|doc|msword|docx/;
    const mimetype = ALLOW_FILES.test(file.mimetype);
    const extname = ALLOW_FILES.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only pdf, doc, docx files are allowed for CV!'));
    }
  }
});

const authMiddleware = require('../Middlewares/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

router.use(authMiddleware);

router.get('/dashboard', (req, res) => {
    // Example endpoint for dashboard after successful authentication
    const userInfo = req.user; // You have access to user info here thanks to authMiddleware
    res.render('dashboard', { title: 'Dashboard', userInfo });
});

router.post('/getinfo', dashboardController.getInfo);
router.post('/addmember', dashboardController.addNewMember);
router.post('/updateprofile', upload.none(), dashboardController.updatemember);
router.post('/updateabout', upload.none(), dashboardController.updateabout);
router.post('/updateskills', upload.none(), dashboardController.updateskills);
router.post('/logout', dashboardController.logout);
router.post('/changepassword', dashboardController.updatePassword);
router.get('/experience/delete/:experienceId', dashboardController.deleteExperience);
router.get('/experience/:experienceId', dashboardController.infoOfExperience);
router.post('/experience/details/delete', dashboardController.multiDeleteExperienceDetails);
router.get('/experience/details/delete/:experienceDetailsId', dashboardController.deleteExperienceDetails);
router.post('/updateExperience/:experienceId', upload.none(), dashboardController.editExperience);
router.post('/updateExperienceDetails/:experienceDetailsId', upload.none(), dashboardController.EditExperienceDetails);
router.get('/viewImageTemp/:nameOfImage', dashboardController.viewImageTemp);
router.post('/orderExperienceDetails/:experienceId', dashboardController.changeOrderOfExperienceId);
router.post('/updateProfileImage', upload.single('image'), (req, res) => {
  dashboardController.updateProfileImage(req, res, customStorage);
});
router.post('/uploadCv', uploadCv.single('file'), (req, res) => {
  dashboardController.uploadCv(req, res, customStorage);
});
router.post('/uploadImageTemp', upload.single('image'), (req, res) => {
  dashboardController.uploadImageTemp(req, res, customStorage);
});

module.exports = router;
