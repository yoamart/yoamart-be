# **Express Backend Project**

This repository contains the backend code for an Express application running on port `5004`. It is designed to handle authentication, mailing, and other backend services with integrations for Mailtrap, Google reCAPTCHA, and Google OAuth.

---

## **Getting Started**

### **Prerequisites**
Make sure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

---

### **Installation Steps**

1. **Clone the Repository**  
   bash
   git clone github.com/yoamart/yoamart-be.git
   cd /yoamart-be
   

2. **Install Dependencies**  
   Run the following command to install the required Node.js modules:  
   bash
   npm install
   

3. **Set Up Environment Variables**  
   Create a `.env` file in the root directory and configure the following variables:  
   plaintext
   # Mailtrap Configuration
   MAILTRAP_USER=<your-mailtrap-username>
   MAILTRAP_PASS=<your-mailtrap-password>

   # Google reCAPTCHA
   RECAPTCHA_SITE_KEY=<your-recaptcha-site-key>
   RECAPTCHA_SECRET_KEY=<your-recaptcha-secret-key>

   # Google OAuth
   GOOGLE_CLIENT_ID=<your-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-google-client-secret>
   GOOGLE_REDIRECT_URI=<your-google-redirect-uri>

   # Server Configuration
   PORT=5004
   

4. **Run the Development Server**  
   Start the server with the following command:  
   bash
   npm run dev
   

   The server will be running at:  
   
   http://localhost:5004
   

---

## **Endpoints**

Here’s a brief overview of the key API endpoints:

| **Method** | **Endpoint**        | **Description**                   |
|------------|---------------------|-----------------------------------|
| `POST`     | `/auth/register`    | Registers a new user              |
| `POST`     | `/auth/login`       | Logs in an existing user          |
| `POST`     | `/auth/google`      | Handles Google OAuth authentication |


*(Add or update as per your actual routes.)*

---

## **Scripts**

Here are the npm scripts included in this project:

| **Script**    | **Command**         | **Description**                           |
|---------------|---------------------|-------------------------------------------|
| `start`       | `node index.js`     | Runs the app in production mode           |
| `dev`         | `nodemon index.js`  | Runs the app in development mode          |
| `test`        | `npm test`          | Runs the test suite (if applicable)       |

---

## **Built With**

- **[Express.js](https://expressjs.com/):** Fast, unopinionated, minimalist web framework for Node.js.
- **[Mailtrap](https://mailtrap.io/):** For safe email testing.
- **[Google reCAPTCHA](https://www.google.com/recaptcha/):** Protect your app from spam and abuse.
- **[Google OAuth](https://developers.google.com/identity):** For secure authentication.

---

## **License**

This project is licensed under the [MIT License](LICENSE).

---

## **Contact**

If you have any questions or need further assistance, feel free to reach out:  
**John Chinonso Edeh**  
**netojaycee@gmail.com**  
**github.com/netojaycee**

**Ajayi Favour**  
**ajayifavour81@gmail.com**  
**github.com/fevico**
  

