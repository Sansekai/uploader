const express = require('express');
const axios = require('axios');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Konfigurasi Multer
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 } // Limit 20MB
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.render('index', {
        title: 'Uploader',
        description: 'Upload file (Gambar, Video, PDF, & Audio) dengan cepat.'
    });
});

// Modifikasi Route Upload untuk menangani Error Multer (Size Limit)
app.post('/upload', (req, res) => {
    upload.single('file')(req, res, async (err) => {
        // 1. Handle Error dari Multer (termasuk limit size)
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.json({ success: false, error: 'Ukuran file terlalu besar! Maksimal 20MB.' });
            }
            return res.json({ success: false, error: err.message });
        } else if (err) {
            return res.json({ success: false, error: 'Terjadi kesalahan saat upload file.' });
        }

        // 2. Logic Upload Utama (hanya jalan jika tidak ada error upload)
        try {
            if (!req.file) {
                return res.json({ success: false, error: 'Tidak ada file yang diunggah.' });
            }

            const mimeType = req.file.mimetype;
            const fileName = req.file.originalname;

            // --- VALIDASI TIPE FILE (SERVER SIDE) ---
            const allowedMimes = [
                'application/pdf',
                'image/heic',
                'image/heif',
                'audio/mpeg', 
                'audio/mp3',
                'audio/mp4',
                'audio/wav',
                'video/quicktime',
                'video/mp4'
            ];

            const isImage = mimeType.startsWith('image/');
            const isVideo = mimeType.startsWith('video/');
            const isAllowedSpecific = allowedMimes.includes(mimeType);

            const isHeicExt = fileName.endsWith('.heic') || fileName.endsWith('.heif');

            if (!isImage && !isVideo && !isAllowedSpecific && !isHeicExt) {
                return res.json({ 
                    success: false, 
                    error: 'Format file tidak didukung. Hanya Mendukuang Gambar, Video, PDF, & Audio.' 
                });
            }
            // ----------------------------------------

            const buffer = req.file.buffer;
            const fileSize = req.file.size;
            const ext = path.extname(fileName).replace('.', '') || 'bin';

            let typeValue = 'other';
            if (isImage) typeValue = 'image';
            else if (isVideo) typeValue = 'video';
            else if (mimeType === 'audio/mpeg' || mimeType.startsWith('audio/')) typeValue = 'audio';
            else if (mimeType === 'application/pdf') typeValue = 'pdf';

            // ===============
            // Sorry this API is closed source
            // ===============

            res.json({
                success: true,
                url: resourceUrl,
                filename: fileName,
                size: fileSize,
                type: mimeType
            });

        } catch (err) {
            console.error(err);
            res.json({ success: false, error: 'Gagal mengupload file. ' + err.message });
        }
    });
});

app.listen(port, () => {
    console.log(`Server berjalan di PORT:${port}`);
});