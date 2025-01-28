// server.js

const express = require('express');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
const https = require('https');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const sessionUpdateMiddleware = require('./Middlewares/sessionUpdateMiddleware');

require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5000;

// Set trust proxy
app.set('trust proxy', 'loopback');


// Log requests and responses in middleware
app.use((req, res, next) => {
  // console.log('Request received:', req.method, req.originalUrl);
  res.on('finish', () => {
    // console.log('Response sent:', res.statusCode);
  });
  next();
});

const corsOptions = {
  origin: process.env.FRONTENDURL_URL,
  methods: '*',
  credentials: true,
  allowedHeaders: '*'
};

app.use(cors(corsOptions));

// Middleware to parse request body
app.use(express.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());

// Use session update middleware
app.use(sessionUpdateMiddleware);

// Import routes
const indexRoutes = require('./routes/index');
const memberRoutes = require('./routes/members');
const dashboardRoutes = require('./routes/dashboard');
const login = require('./routes/login');
const signup = require('./routes/signup');

// Rate limiting middleware
// const limiter = rateLimit({
//   windowMs:  60 * 1000, // 1 minutes
//   max: 100 // limit each IP to 100 requests per windowMs
// });

//  Apply rate limiter to all requests
// app.use(limiter);

// Use routes
app.use('/api/', indexRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/login', login);
app.use('/api/signup', signup);

// Load the certificate and private key
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDT3CKLu6es/Z3r
yCRtzutmjJfwfdsfwuKLwVDSZeBa+V/1OxbJpIwvGTEsMk8zcPpKw8dPMz6EJqAZ
zasuHl6nSGzW5F7Bpxx/aNUi58t0EgaG4scDBIfgM1M11hx2SU3OlnVUYPpApNiy
J7NfADvpHgvS/tO9huzKJNI+iABRqNG6wg6tVixWfeuDZ3SIO6aAlGdzCqvhWEjX
dMxJym0s/08CaPbxpLDPOQAc4Bv3fdBUgmTx988bXT45vjKTv1Tj7RXxmV5V4OSM
kziqWUlPm/wopHiB62h4suQWAm5FDClb9hruU0qUZIP+7gICrgAgS+Zl0Sl+bg0g
OhwYFAN/AgMBAAECggEAUnbFtZkyD5pabWvmjh10MGL6Q0Bh2g+MCfURxguklBSs
PrKk0JEthamrI7ZjcLUBn7dr7Y6XP24fdFvDTTzCACAnSU/z+DHZXFiMWb1ayo+3
napI54pMbz7bHUH9qycmU4rqGZFz51SjCll8rrZTG4638IWDGqsZoSdK9M8QPLgh
qYLCUh2Bk+NSZwqL/9CW+ix3jpXni4NrX/IArpyJa+lKUlCuoxrm8nGaj7w1DTe3
DSpDB+lRF/4JJrx44o5sCWWIrbitO8YmUEkLirwWI/D4M9EFRm4Ml0LR98od/Amz
F8YbdgslOfsW11gJymz3gXT4nzrD56GUPXYYWkTrbQKBgQDvLv/GVI15Ssx0upTT
3WUW9q4X0SXG/iFmzgKGWMyCMV5po3X19hlVbtB6d0vKZ98q0xFlRq/0V8NYEh/X
w755KYalocDDDq4KPIwJQ8mTi6LaDPAttl/dzMGR16YmsfpsrKd4tzQlWUP4pel7
hQsWPdBFqNVz7uKB4AQpBd7X0wKBgQDiwVgZUmNarKDOpX0FAikzLfXO/LIMTDX+
9eNycAI6UaP0V7+tiON+NM26048pmbpPxhS3K8lXngrG0j7bHaUOz353ySgK9qPY
qt2YSJqrhidOFfjF+d7gRrNdbVIUrtsNa6QVWIdYme8i7ePiNJIMt/Z8he9Mi6bI
Egd0/eSmJQKBgQDSKmgQ62bMd08kGnZ/m4AiJ2td/ibFrbPH06kgR5Kbq6mcBUe3
ciFcklyZ3403MwJDbOdSKESf3SYGkxZrztHlQPnRPEpWmuWOlRkvYuMSxJW6J7g7
Uo72I97KucSDJ8w2BZe6WLB3SPKS36ZDJOpTBsmlC+9TSUq6eA7vxPrEhQKBgEqh
nB9pcG3tl1esPAOj/G9t1xNzNB68DqGFyIBnwTP0nuPS5bF19noZYwT0kI/+msWa
ykKnVLNTvvRFSo7PqP3A6Tz/pgBFwROU2S4/5zhBBTq8HI78eJCUdIBxdKx+CHbY
UL79zj4pG/4BEhnnd5JcEfJWGra02AXNeUrWLaVJAoGBAM2SmxwElPAMvFtqeagp
1DtaHEgoo/gD/Mw1jtVqpuAAqZvW4oUF+WBuLRvJTPkqBOVxWlWIEAUK7hzBqpkt
fe9tsIlNHk0o7xqGMgA51SEuD8xe1vP2lh7UWCWqLwin/YooJ03osxLS0h20ZFix
D5nhEiPqSVR5sX/uIvn9xJR5
-----END PRIVATE KEY-----`;

const certificate = `-----BEGIN CERTIFICATE-----
MIIDETCCAfmgAwIBAgIUbpY61z+a1s15aszN9mVW87gmt/QwDQYJKoZIhvcNAQEL
BQAwGDEWMBQGA1UEAwwNY3Zpc2lvbmFyeS5pcjAeFw0yNDA1MDYyMDQ1NTVaFw0y
NTA1MDYyMDQ1NTVaMBgxFjAUBgNVBAMMDWN2aXNpb25hcnkuaXIwggEiMA0GCSqG
SIb3DQEBAQUAA4IBDwAwggEKAoIBAQDT3CKLu6es/Z3ryCRtzutmjJfwfdsfwuKL
wVDSZeBa+V/1OxbJpIwvGTEsMk8zcPpKw8dPMz6EJqAZzasuHl6nSGzW5F7Bpxx/
aNUi58t0EgaG4scDBIfgM1M11hx2SU3OlnVUYPpApNiyJ7NfADvpHgvS/tO9huzK
JNI+iABRqNG6wg6tVixWfeuDZ3SIO6aAlGdzCqvhWEjXdMxJym0s/08CaPbxpLDP
OQAc4Bv3fdBUgmTx988bXT45vjKTv1Tj7RXxmV5V4OSMkziqWUlPm/wopHiB62h4
suQWAm5FDClb9hruU0qUZIP+7gICrgAgS+Zl0Sl+bg0gOhwYFAN/AgMBAAGjUzBR
MB0GA1UdDgQWBBQ3RkP2A1nSGIe2fDDE1cKmM9qPCzAfBgNVHSMEGDAWgBQ3RkP2
A1nSGIe2fDDE1cKmM9qPCzAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUA
A4IBAQCglwS7OWbwRP8pXiGk5Yd7wUZCBDwqtrKrOiBDsR5lTGCTRbJpWJUFzVq4
597wyJKwaUsmUtXgnK/IWJn82k7nN+ApLa8u03sxHiSiHayKSnwa+2LeCbOy3CI5
plTJ8wXxTWU+0NuIOBIIt6VjobBuYM8LbuUl395IOJFMwYdofcfU4F/etbb3g5Wt
dmFLcjNEIkSNG7cYjdNEzIWpysUtfcvt1TqVKm+P4qQEZll0hAzM53zUNq66pctu
l/IVUULgK+5iFejnjYjtkTiU9I9mJnNJtskJbpSBXDrMpT9mD7aNXM+rwCfHhNG0
Pk9MWW8iQdqJrg4redZSWaiiY578
-----END CERTIFICATE-----`;

const credentials = { key: privateKey, cert: certificate };

// Start server
https.createServer(credentials, app).listen(PORT, () => {
  console.log(`Server running at https://localhost:${PORT}/`);
});

// Graceful shutdown logic
process.on('SIGINT', () => {
  // Close database connections, perform cleanup, etc
  process.exit(0);
});
