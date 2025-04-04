const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// S3 Configuration
const s3 = new AWS.S3({
  accessKeyId: 'AKIAWWQXB2BFBPPO3K7E', // Replace with your access key
  secretAccessKey: '2MrUiRmg30dm6x8A8EnvXxMVR1/I5pbKr/M+tx8w', // Replace with your secret
  region: 'ap-south-1'
});

// Multer Setup
const upload = multer({ dest: 'uploads/' });

// MySQL RDS Config
const db = mysql.createConnection({
  host: 'database-2.clysk00aa7p8.ap-south-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Pushpak-1437',
  database: 'interndb'
});

// Test DB connection
db.connect(err => {
  if (err) console.error('DB Connection Error:', err);
  else console.log('Connected to MySQL RDS!');
});

// === ROUTES ===

// Upload file to S3
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const fileContent = fs.readFileSync(file.path);
  const s3Params = {
    Bucket: 'resumes-4574', // Replace with your S3 bucket name
    Key: `resumes/${Date.now()}_${file.originalname}`,
    Body: fileContent,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };

  s3.upload(s3Params, (err, data) => {
    fs.unlinkSync(file.path); // delete local file after upload
    if (err) {
      console.error('S3 Upload Error:', err);
      return res.status(500).json({ success: false, error: 'Upload failed' });
    }
    res.json({ success: true, url: data.Location });
  });
});

// Save form data to MySQL
app.post('/save', (req, res) => {
  const { fullName, mobile, email, transactionId, dob, resumeUrl } = req.body;

  const sql = `INSERT INTO applicants (full_name, mobile, email, transaction_id, dob, resume_url)
               VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(sql, [fullName, mobile, email, transactionId, dob, resumeUrl], (err, result) => {
    if (err) {
      console.error('DB Insert Error:', err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
