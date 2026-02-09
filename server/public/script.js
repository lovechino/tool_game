const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const filePreview = document.getElementById('file-preview');
const filenameSpan = document.getElementById('filename');
const removeBtn = document.getElementById('remove-file');
const uploadContent = document.querySelector('.upload-content');

const actionSection = document.getElementById('action-section');
const generateBtn = document.getElementById('generate-btn');
const statusSection = document.getElementById('status-section');
const resultCard = document.getElementById('result-card');
const downloadLink = document.getElementById('download-link');
const resetBtn = document.getElementById('reset-btn');

let selectedFile = null;

// --- Drag & Drop ---
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

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

fileInput.addEventListener('change', function () {
    handleFiles(this.files);
});

function handleFiles(files) {
    if (files.length > 0) {
        selectedFile = files[0];
        if (selectedFile.type !== "application/x-zip-compressed" && !selectedFile.name.endsWith('.zip')) {
            alert("Please upload a ZIP file!");
            selectedFile = null;
            return;
        }
        showPreview(selectedFile.name);
    }
}

function showPreview(name) {
    uploadContent.classList.add('hidden');
    filePreview.classList.remove('hidden');
    filenameSpan.textContent = name;
    actionSection.classList.remove('hidden');
    dropZone.style.borderStyle = 'solid';
}

removeBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // prevent triggering file input
    resetSelection();
});

function resetSelection() {
    selectedFile = null;
    fileInput.value = '';
    uploadContent.classList.remove('hidden');
    filePreview.classList.add('hidden');
    actionSection.classList.add('hidden');
    dropZone.style.borderStyle = 'dashed';
    resultCard.classList.add('hidden');
    statusSection.classList.add('hidden');
}

// --- Generate Action ---
generateBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    // UI Updates
    generateBtn.disabled = true;
    generateBtn.querySelector('.btn-text').textContent = 'Processing...';
    generateBtn.querySelector('.loader').classList.remove('hidden');
    statusSection.classList.remove('hidden');

    resetStatusIcons();
    updateStatus('upload', 'active');

    // Simulate status progression for UX (since we don't have real-time socket updates yet)
    setTimeout(() => {
        updateStatus('upload', 'success');
        updateStatus('build', 'active');
    }, 1000);

    // API Call
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
        const response = await fetch('/create-game', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Server returned error');
        }

        const data = await response.json();

        // Complete UI
        updateStatus('build', 'success');
        updateStatus('compress', 'success'); // fast finish

        showResult(data.downloadUrl);

    } catch (error) {
        console.error("Upload Error:", error);
        alert(`❌ Error: ${error.message}\nCheck console for details.`);
        updateStatus('build', 'error');
        resetBtnState();
        generateBtn.disabled = false;
    }
});

function updateStatus(id, state) {
    const el = document.getElementById(`status-${id}`);
    el.className = `status-icon ${state}`;
    if (state === 'success') el.textContent = '✓';
    if (state === 'active') el.textContent = '⟳';
    if (state === 'error') el.textContent = '✕';
}

function resetStatusIcons() {
    ['upload', 'build', 'compress'].forEach(id => {
        const el = document.getElementById(`status-${id}`);
        el.className = 'status-icon pending';
        el.textContent = '○';
    });
}

function showResult(url) {
    statusSection.classList.add('hidden');
    actionSection.classList.add('hidden');
    resultCard.classList.remove('hidden');
    downloadLink.href = url;
}

function resetBtnState() {
    generateBtn.disabled = false;
    generateBtn.querySelector('.btn-text').textContent = '🚀 Generate Game';
    generateBtn.querySelector('.loader').classList.add('hidden');
}

resetBtn.addEventListener('click', () => {
    resetSelection();
    resetBtnState();
});
