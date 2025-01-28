#  CreateResumeAPI - Backend

**Version**: 1.0.0  
**Description**: The backend service for the Resume Builder Pro platform, providing API endpoints for user registration, login, resume management, and more. The backend uses Express.js for routing, Sequelize for ORM, and SQLite for database management.

You can view the live platform at:  
**[cvisionary.ir](https://cvisionary.ir/)**

---

## Technologies Used

- **Node.js**: JavaScript runtime for building the server-side logic.
- **Express.js**: Web framework for routing and managing API endpoints.
- **Sequelize**: ORM for interacting with the SQLite database.
- **SQLite**: Lightweight database for storing user data and resumes.
- **bcrypt**: For hashing passwords and securing sensitive data.
- **jsonwebtoken (JWT)**: For authentication and authorization.
- **dotenv**: For managing environment variables.
- **cors**: To handle cross-origin requests.
- **multer**: Middleware for handling file uploads (such as images).
- **nodemailer**: For sending email notifications.
- **uuid**: For generating unique identifiers.

---

## Setup Instructions

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/resumebuilderpro.git
   cd resumebuilderpro
