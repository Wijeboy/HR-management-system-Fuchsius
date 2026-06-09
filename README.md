# HR Management System

A modern role-based Human Resource Management System built with **React**, **Node.js**, **Express**, **Prisma**, and **MongoDB**.
The system supports employee management, attendance tracking, leave management, payroll, recruitment, performance management, notifications, and profile picture management.

---

## Project Overview

This HRMS is designed for organizations to manage employees, HR workflows, and administrative tasks from a centralized dashboard. It includes different access levels for Admin, HR, Manager, and Employee users.

The system includes a modern frontend interface and a REST API backend connected to MongoDB using Prisma ORM.

---

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* React Router
* Axios
* Material Symbols Icons

### Backend

* Node.js
* Express.js
* Prisma ORM
* MongoDB
* Multer
* JWT Authentication

### Storage

* MongoDB for database records
* Local server storage for uploaded files
* Profile images stored in:

```txt
Backend/uploads/profiles
```

---

## Main Features

### Authentication

* Role-based login
* JWT authentication
* Protected routes
* Current user session handling
* Logout support

### User Roles

The system supports four main roles:

```txt
Admin
HR
Manager
Employee
```

Each role has different access permissions and dashboard options.

---

## Role-Based Access

### Admin

* View dashboard
* Manage employees
* View attendance reports
* Manage leave requests
* Access payroll
* Access recruitment
* Access performance management
* Access reports and settings

### HR

* Manage employees
* Manage leave requests
* Manage payroll
* Manage recruitment
* View attendance and reports

### Manager

* View dashboard
* View attendance reports
* Review performance-related data
* Access reporting features

### Employee

* View personal dashboard
* Mark attendance
* Apply for leave
* View leave requests
* View payslips
* View profile
* Update profile picture

---

## Modules

### 1. Dashboard

The dashboard provides a summary of HRMS activities, including key statistics and quick actions.

### 2. Employee Management

Admin and HR users can manage employee records.

Features include:

* View all employees
* Add employees
* Edit employee details
* View employee details
* Delete employees
* Reset employee passwords
* Activate or deactivate users
* View employee profile images

### 3. Profile Management

Users can manage their profile details and profile picture.

Features include:

* Update name
* Update email
* Update department
* Update phone number
* Update location
* Upload profile picture
* Replace profile picture
* Delete profile picture

When a user uploads a new profile picture, the old image file is automatically deleted from the server upload folder.

Supported image formats:

```txt
JPG
PNG
WEBP
```

Maximum upload size:

```txt
2MB
```

### 4. Attendance Management

Employees can mark attendance, and authorized users can view attendance reports.

Features include:

* Check in
* Check out
* Calculate total working hours
* View daily attendance report
* View employee attendance status
* Display employee profile pictures in attendance reports

### 5. Leave Management

Employees can submit leave requests, and HR/Admin users can approve or reject them.

Features include:

* Apply for leave
* Upload supporting documents
* View leave history
* Approve leave
* Reject leave
* Add HR comments
* View leave status
* Display employee profile pictures in leave approval records

### 6. Payroll Management

Payroll module supports employee salary and payslip-related workflows.

Features include:

* View payroll records
* View payslips
* Download payslip details
* Track salary payments

### 7. Recruitment Management

Recruitment module helps manage job openings and applicants.

Features include:

* Manage jobs
* View applicants
* Track recruitment records

### 8. Performance Management

Performance module helps track employee goals and reviews.

Features include:

* Performance goals
* Performance reviews
* Ratings and recommendations

### 9. Notifications

The system includes notifications for important HR actions, such as leave request updates.

---

## Profile Picture Feature

The project includes full profile picture management.

### Backend Profile Picture Flow

Profile image upload uses Multer.

Main backend files:

```txt
Backend/src/middleware/upload.js
Backend/src/modules/auth/auth.service.js
Backend/src/modules/auth/auth.controller.js
Backend/src/modules/auth/auth.routes.js
```

Profile images are stored in:

```txt
Backend/uploads/profiles
```

When a user updates the profile picture:

1. New image is uploaded.
2. New image path is saved in MongoDB.
3. Old image is deleted from the uploads folder.

When a user deletes the profile picture:

1. Image file is removed from the uploads folder.
2. `profileImage` field is cleared from MongoDB.

### Frontend Profile Picture Flow

Main frontend files:

```txt
Frontend/src/pages/Settings/Profile.jsx
Frontend/src/components/UserAvatar.jsx
Frontend/src/services/authService.js
Frontend/src/services/api.js
```

The reusable `UserAvatar` component is used to show profile pictures across the system. If no profile picture exists, it shows user initials.

Used in:

```txt
Header
Sidebar
Employee List
Employee Details
Attendance Reports
Leave Approval
Profile Page
```

---

## Project Folder Structure

```txt
HR-management-system-Fuchsius-shanuka
│
├── Backend
│   ├── prisma
│   │   └── schema.prisma
│   │
│   ├── src
│   │   ├── config
│   │   │   └── env.js
│   │   │
│   │   ├── lib
│   │   │   └── prisma.js
│   │   │
│   │   ├── middleware
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   ├── notFound.js
│   │   │   └── upload.js
│   │   │
│   │   ├── modules
│   │   │   ├── auth
│   │   │   ├── users
│   │   │   ├── attendance
│   │   │   ├── leave
│   │   │   ├── payroll
│   │   │   ├── recruitment
│   │   │   ├── performance
│   │   │   └── notifications
│   │   │
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── uploads
│   │   └── profiles
│   │
│   ├── package.json
│   └── .env
│
├── Frontend
│   ├── src
│   │   ├── components
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── UserAvatar.jsx
│   │   │
│   │   ├── context
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── pages
│   │   │   ├── Attendance
│   │   │   ├── Employees
│   │   │   ├── Leave
│   │   │   ├── Payroll
│   │   │   ├── Recruitment
│   │   │   ├── Performance
│   │   │   └── Settings
│   │   │
│   │   ├── services
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   └── userService.js
│   │   │
│   │   └── utils
│   │       └── roleAccess.js
│   │
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## Environment Variables

### Backend `.env`

Create a `.env` file inside the `Backend` folder.

```env
PORT=5050
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000,http://localhost:5173
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

Example local/Atlas MongoDB connection:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/hrms
```

---

### Frontend `.env`

Create a `.env` file inside the `Frontend` folder.

```env
VITE_API_URL=http://localhost:5050/api
VITE_BACKEND_URL=http://localhost:5050
VITE_APP_NAME=HR Management System
```

---

## Installation Guide

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd HR-management-system-Fuchsius-shanuka
```

---

## Backend Setup

Go to the backend folder:

```bash
cd Backend
```

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
npx prisma generate
```

Push schema to MongoDB:

```bash
npx prisma db push
```

Start backend server:

```bash
npm run dev
```

Backend should run on:

```txt
http://localhost:5050
```

Health check endpoint:

```txt
http://localhost:5050/api/health
```

---

## Frontend Setup

Open another terminal and go to the frontend folder:

```bash
cd Frontend
```

Install dependencies:

```bash
npm install
```

Start frontend:

```bash
npm run dev
```

Frontend should run on:

```txt
http://localhost:3000
```

or:

```txt
http://localhost:5173
```

depending on the Vite configuration.

---

## Demo Login Accounts

The system includes default demo users.

### Admin

```txt
Email: admin@company.com
Password: admin
Role: admin
```

### HR

```txt
Email: hr@company.com
Password: hr
Role: hr
```

### Manager

```txt
Email: manager@company.com
Password: manager
Role: manager
```

### Employee

```txt
Email: employee@company.com
Password: employee
Role: employee
```

---

## Important Commands

### Backend

```bash
npm run dev
```

```bash
npx prisma generate
```

```bash
npx prisma db push
```

```bash
npm install multer
```

### Frontend

```bash
npm run dev
```

```bash
npm install
```

---

## API Base URL

Frontend API requests are handled through Axios.

API base URL:

```txt
http://localhost:5050/api
```

Profile image URLs are served from:

```txt
http://localhost:5050/uploads/profiles
```

---

## Static File Serving

The backend must serve uploaded files using:

```js
app.use("/uploads", express.static("uploads"));
```

This allows profile images to be shown in the frontend.

---

## Profile Image API Endpoints

### Upload or Replace Profile Picture

```txt
PUT /api/auth/profile/photo
```

Request type:

```txt
multipart/form-data
```

Field name:

```txt
profileImage
```

### Delete Profile Picture

```txt
DELETE /api/auth/profile/photo
```

### Get Current User

```txt
GET /api/auth/me
```

---

## Changed Files for Profile Picture Feature

### Backend

```txt
Backend/prisma/schema.prisma
Backend/src/middleware/upload.js
Backend/src/modules/auth/auth.service.js
Backend/src/modules/auth/auth.controller.js
Backend/src/modules/auth/auth.routes.js
Backend/src/modules/auth/systemUsers.js
Backend/src/modules/users/users.service.js
Backend/src/modules/attendance/attendance.service.js
Backend/src/modules/leave/leave.service.js
```

### Frontend

```txt
Frontend/src/services/api.js
Frontend/src/services/authService.js
Frontend/src/components/UserAvatar.jsx
Frontend/src/components/Header.jsx
Frontend/src/components/Sidebar.jsx
Frontend/src/pages/Settings/Profile.jsx
Frontend/src/pages/Employees/EmployeeList.jsx
Frontend/src/pages/Employees/EmployeeDetails.jsx
Frontend/src/pages/Attendance/AttendanceReports.jsx
Frontend/src/pages/Leave/HRLeaveApproval.jsx
```

---

## Testing Checklist

### Authentication

* Login as Admin
* Login as HR
* Login as Manager
* Login as Employee
* Logout successfully

### Profile Picture

* Upload profile picture
* Preview selected image
* Save profile picture
* Replace profile picture
* Confirm old file is deleted from uploads folder
* Delete profile picture
* Confirm database field is cleared
* Refresh page and verify image state remains correct

### Avatar Display

Check profile picture display in:

```txt
Profile page
Header
Sidebar
Employee List
Employee Details
Attendance Reports
Leave Approval
```

### Employee Management

* View employee list
* Add employee
* Edit employee
* View employee details
* Reset password
* Toggle active/inactive status
* Delete employee

### Attendance

* Check in
* Check out
* View attendance reports
* Confirm employee avatar appears

### Leave

* Apply leave
* Upload supporting document
* Approve leave
* Reject leave
* Confirm employee avatar appears in approval table

---

## Common Issues and Fixes

### Prisma Client Did Not Initialize

Run:

```bash
npx prisma generate
```

Then restart backend:

```bash
npm run dev
```

---

### Profile Image Upload Says “Profile Image Is Required”

Check that `Frontend/src/services/api.js` does not force JSON for `FormData`.

Correct logic:

```js
if (config.data instanceof FormData) {
  delete config.headers['Content-Type'];
} else {
  config.headers['Content-Type'] = 'application/json';
}
```

Also confirm frontend sends:

```js
formData.append('profileImage', selectedImage);
```

and backend route uses:

```js
uploadProfileImage.single("profileImage")
```

---

### Profile Image Uploads But Does Not Show

Check frontend `.env`:

```env
VITE_BACKEND_URL=http://localhost:5050
```

Check backend static serving:

```js
app.use("/uploads", express.static("uploads"));
```

Then open image URL directly in browser:

```txt
http://localhost:5050/uploads/profiles/image-name.jpg
```

---

### Prisma P2034 Write Conflict

If the backend crashes with a Prisma write conflict, stop duplicate Node processes:

```bash
taskkill /F /IM node.exe
```

Then restart backend:

```bash
npm run dev
```

The seed logic should retry write conflicts safely.

---

### Port Already In Use

Find process using port 5050:

```bash
netstat -ano | findstr :5050
```

Kill the process:

```bash
taskkill /PID <PID_NUMBER> /F
```

Start backend again:

```bash
npm run dev
```

---

## Git Commit Suggestions

### Profile Picture Upload

```bash
git commit -m "feat: add profile picture upload and delete"
```

### Reusable Avatar Component

```bash
git commit -m "feat: add reusable user avatar component"
```

### Display Avatars Across HRMS

```bash
git commit -m "feat: display profile pictures across HRMS pages"
```

### Prisma Seed Retry Fix

```bash
git commit -m "fix: retry system user seeding on Prisma write conflicts"
```

---

## Future Improvements

* Add password hashing using bcrypt
* Add stronger backend role authorization
* Add image compression before upload
* Move uploads from local storage to Cloudinary or AWS S3
* Add audit logs for HR actions
* Add advanced employee search and pagination
* Add email notifications
* Add PDF payslip generation
* Add dashboard analytics charts
* Add mobile sidebar drawer
* Add dark mode support

---

## Project Status

Current status:

```txt
Profile picture upload/update/delete completed
Reusable avatar component added
Profile pictures shown across major HRMS pages
Employee management functional
Attendance and leave modules connected with profile images
```

---

## Author

Developed by Shanuka Jayakodi.

GitHub:

```txt
@shanukajayakodi56
```

Email:

```txt
shanukajayakodi56@gmail.com
```
