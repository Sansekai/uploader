// --- THEME TOGGLE LOGIC ---
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const icon = themeToggle.querySelector('i');

// Load theme from local storage
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
    body.setAttribute('data-theme', 'dark');
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
}

themeToggle.addEventListener('click', () => {
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
});

// --- UPLOAD LOGIC ---
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
});

dropZone.addEventListener('drop', handleDrop, false);
fileInput.addEventListener('change', handleFiles, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    fileInput.files = files;
    handleFiles();
}

function handleFiles() {
    const errorArea = document.getElementById('errorArea');
    errorArea.style.display = 'none'; // Reset error
    fileNameDisplay.textContent = '';
    fileNameDisplay.style.display = 'none';

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        
        // --- VALIDASI TIPE FILE ---
        if (!isValidFileType(file)) {
            showError('Invalid file type! Only Image, Video, PDF, and Audio allowed.');
            fileInput.value = ''; 
            return;
        }

        // --- VALIDASI UKURAN FILE ---
        if (file.size > MAX_SIZE_BYTES) {
            showError(`File too large! Max ${MAX_SIZE_MB}MB.`);
            fileInput.value = ''; 
            return;
        }
        
        fileNameDisplay.textContent = `${file.name} (${formatSize(file.size)})`;
        fileNameDisplay.style.display = 'inline-block';
    }
}

function isValidFileType(file) {
    const validTypes = [
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
    
    if (file.type.startsWith('image/')) return true;
    if (file.type.startsWith('video/')) return true;
    if (validTypes.includes(file.type)) return true;
    
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.mp3')) return true;
    if (fileName.endsWith('.heic')) return true;
    if (fileName.endsWith('.heif')) return true;

    return false;
}

function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function uploadFile() {
    const file = fileInput.files[0];
    const uploadBtn = document.getElementById('uploadBtn');
    const resultArea = document.getElementById('resultArea');
    const loadingArea = document.getElementById('loadingArea');
    const errorArea = document.getElementById('errorArea');
    const uploadBox = document.querySelector('.upload-box'); // Select container for hiding later

    if (!file) {
        showError('Please select a file first! 📁');
        return;
    }

    if (!isValidFileType(file)) {
        showError('File type not allowed.');
        return;
    }
    if (file.size > MAX_SIZE_BYTES) {
        showError(`File larger than ${MAX_SIZE_MB}MB.`);
        return;
    }

    // Reset UI
    errorArea.style.display = 'none';
    resultArea.style.display = 'none';
    loadingArea.style.display = 'block';
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = 'Uploading... <i class="fas fa-spinner fa-spin"></i>';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        loadingArea.style.display = 'none';
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = 'Upload Files 🚀';

        if (data.success) {
            showResult(data.url);
        } else {
            showError(data.error || 'Failed to upload file.');
        }

    } catch (err) {
        loadingArea.style.display = 'none';
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = 'Upload Files 🚀';
        showError('Connection error occurred.');
        console.error(err);
    }
}

function showResult(url) {
    const resultArea = document.getElementById('resultArea');
    const resultLink = document.getElementById('resultLink');
    const openLinkBtn = document.getElementById('openLinkBtn');
    const uploadBox = document.querySelector('.upload-box');

    // Hide input area, show result
    uploadBox.style.display = 'none';
    resultArea.style.display = 'block';
    resultArea.style.animation = 'fadeInUp 0.5s ease';
    
    resultLink.value = url;
    openLinkBtn.href = url;
}

function resetUpload() {
    document.querySelector('.upload-box').style.display = 'block';
    document.getElementById('resultArea').style.display = 'none';
    fileInput.value = '';
    fileNameDisplay.textContent = '';
    fileNameDisplay.style.display = 'none';
    document.getElementById('errorArea').style.display = 'none';
}

function copyLink() {
    const copyText = document.getElementById("resultLink");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value).then(() => {
        const btn = document.querySelector('.copy-btn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.style.background = '#00b894';
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = ''; // reset to CSS variable
        }, 2000);
    });
}

function showError(msg) {
    const errorArea = document.getElementById('errorArea');
    errorArea.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
    errorArea.style.display = 'block';
    errorArea.style.animation = 'shake 0.3s ease';
}

// Add CSS keyframes for animations dynamically if needed, 
// though most are handled in CSS file now.
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
@keyframes shake {
    0% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    50% { transform: translateX(5px); }
    75% { transform: translateX(-5px); }
    100% { transform: translateX(0); }
}
`;
document.head.appendChild(styleSheet);