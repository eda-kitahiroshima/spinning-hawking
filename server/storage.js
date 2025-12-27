const multer = require('multer');
const path = require('path');
const fs = require('fs');

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';

let uploadMiddleware;

if (STORAGE_TYPE === 's3') {
    // S3 Mode (Requires @aws-sdk/client-s3 and multer-s3)
    try {
        const { S3Client } = require('@aws-sdk/client-s3');
        const multerS3 = require('multer-s3');

        const s3 = new S3Client({
            region: process.env.AWS_REGION || 'auto',
            endpoint: process.env.AWS_ENDPOINT, // For R2/others
            forcePathStyle: true, // Required for R2 to avoid subdomain issues
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });

        uploadMiddleware = multer({
            storage: multerS3({
                s3: s3,
                bucket: process.env.AWS_BUCKET_NAME,
                contentType: multerS3.AUTO_CONTENT_TYPE,
                metadata: function (req, file, cb) {
                    cb(null, { fieldName: file.fieldname });
                },
                key: function (req, file, cb) {
                    cb(null, Date.now().toString() + '-' + file.originalname);
                }
            })
        });
        console.log("Storage initialized: S3/Object Storage");
    } catch (e) {
        console.error("FAILED to initialize S3 storage. Please install dependencies: npm install @aws-sdk/client-s3 multer-s3");
        console.error(e);
        process.exit(1);
    }
} else {
    // Local Mode
    const uploadDir = path.join(__dirname, 'public/uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'public/uploads/'),
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    });

    uploadMiddleware = multer({ storage: storage });
    console.log("Storage initialized: Local Filesystem");
}

module.exports = uploadMiddleware;
