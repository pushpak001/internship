const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const app = express();
const PORT = 10000;

app.use(cors());
app.use(express.json());

// ✅ AWS S3 Configuration (SDK v3)
const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "AKIAWWQXB2BFBPPO3K7E",
    secretAccessKey: "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"
  }
});
const bucketName = "resumes-4574";

// ✅ MySQL Database Connection (AWS RDS)
const db = mysql.createConnection({
  host: "database-2.clysk00aa7p8.ap-south-1.rds.amazonaws.com",
  user: "admin",
  password: "Pushpak-1437",
  database: "interndb"
});

db.connect(err => {
  if (err) console.error("DB Connection Error:", err);
  else console.log("✅ Connected to MySQL RDS!");
});

// ✅ Multer Setup for File Uploads
const upload = multer({ dest: 'uploads/' });

// ✅ API to Upload Resume & Save Data
app.post('/apply', upload.single('resume'), async (req, res) => {
  const { fullName, email, mobile, transactionId, dob } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ success: false, message: "Resume file is required" });

  const fileStream = fs.readFileSync(file.path);
  const fileName = `resumes/${Date.now()}_${file.originalname}`;

  const uploadParams = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileStream,
    ContentType: file.mimetype
  };

  try {
    // ✅ Upload file to S3
    await s3.send(new PutObjectCommand(uploadParams));
    const fileUrl = `https://${bucketName}.s3.ap-south-1.amazonaws.com/${fileName}`;
    fs.unlinkSync(file.path);

    // ✅ Save details in MySQL RDS
    const sql = "INSERT INTO applications (full_name, email, mobile, transaction_id, dob, resume_url) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [fullName, email, mobile, transactionId, dob, fileUrl], (err, result) => {
      if (err) {
        console.error("DB Insert Error:", err);
        return res.status(500).json({ success: false, error: "Database Insert Failed" });
      }
      res.json({ success: true, message: "Application submitted successfully!", resumeUrl: fileUrl });
    });

  } catch (err) {
    console.error("S3 Upload Error:", err);
    res.status(500).json({ success: false, error: "Resume Upload Failed" });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
