const nodemailer = require('nodemailer');

// Create a transporter object using SMTP transport
let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'cvisionarymanager@gmail.com', // your Gmail email address
        pass: 'bogi fiad npta naho' // your Gmail password
    },
    connectionTimeout: 20000 //
});

// Function to send verification code email
function sendVerificationCode(email, code, callback) {

    // Email content
    let mailOptions = {
        from: {
            name: 'Web Wizard',
            address: 'cvisionarymanager@gmail.com'
        },
        to: email,
        subject: 'Verification Code for Registration',
        text: `Your verification code is: ${code}`
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error occurred:', error);
            // Pass the error to the callback function
            callback(error);
        } else {
            console.log('Email sent:', info.response);
            // Call the callback function without error
            callback(null);
        }
    });
}

module.exports = {
    sendVerificationCode
};
