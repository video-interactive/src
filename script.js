document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMEN DOM ---
    const uploadSection = document.getElementById('upload-section');
    const editorSection = document.getElementById('editor-section');
    const uploadArea = document.getElementById('upload-area');
    const videoUpload = document.getElementById('video-upload');
    const videoPlayer = document.getElementById('video-player');
    const zonesOverlay = document.getElementById('zones-overlay');
    const addZoneBtn = document.getElementById('add-zone-btn');
    const zonesList = document.getElementById('zones-list');
    const generateLinkBtn = document.getElementById('generate-link-btn');
    const shareOutput = document.getElementById('share-output');
    const shareableLink = document.getElementById('shareable-link');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const videoUrlInput = document.getElementById('video-url-input');

    // Elemen Perekaman
    const recordBtn = document.getElementById('record-btn');
    const downloadSection = document.getElementById('download-section');
    const downloadLink = document.getElementById('download-link');
    const recordingIndicator = document.getElementById('recording-indicator');
    const recordingCanvas = document.getElementById('recording-canvas');
    const ctx = recordingCanvas.getContext('2d');

    // Elemen Daftar Link
    const linksListSection = document.getElementById('links-list-section');
    const linksListTextarea = document.getElementById('links-list-textarea');
    const copyLinksBtn = document.getElementById('copy-links-btn');

    // ELEMEN BARU untuk GitHub
    const uploadToGithubBtn = document.getElementById('upload-to-github-btn');
    const githubInstructions = document.getElementById('github-instructions');
    const githubUploadLink = document.getElementById('github-upload-link');

    // Modal
    const linkModal = document.getElementById('link-modal');
    const closeBtn = document.querySelector('.close-btn');
    const zoneLinkInput = document.getElementById('zone-link-input');
    const saveLinkBtn = document.getElementById('save-link-btn');
    const cancelLinkBtn = document.getElementById('cancel-link-btn');

    // --- STATE ---
    let zones = [];
    let currentEditingZoneId = null;
    let zoneIdCounter = 0;
    let mediaRecorder;
    let recordedChunks = [];
    let isRecording = false;
    let animationFrameId;

    // --- INISIALISASI & EVENT LISTENERS ---
    // ... (semua event listener sebelumnya tetap sama) ...
    uploadArea.addEventListener('click', () => videoUpload.click());
    videoUpload.addEventListener('change', handleVideoUpload);
    addZoneBtn.addEventListener('click', addNewZone);
    generateLinkBtn.addEventListener('click', generateShareableLink);
    copyLinkBtn.addEventListener('click', () => { /* ... */ });
    recordBtn.addEventListener('click', toggleRecording);
    videoPlayer.addEventListener('loadedmetadata', () => { /* ... */ });
    copyLinksBtn.addEventListener('click', () => { /* ... */ });
    closeBtn.addEventListener('click', closeModal);
    cancelLinkBtn.addEventListener('click', closeModal);
    saveLinkBtn.addEventListener('click', saveZoneLink);
    window.addEventListener('click', (e) => { if (e.target === linkModal) closeModal(); });

    // EVENT LISTENER BARU untuk GitHub
    uploadToGithubBtn.addEventListener('click', () => {
        // !!! PENTING: UBAH BAGIAN INI !!!
        const githubUsername = 'video-interactive'; // Ganti dengan username Anda
        const repoName = 'src'; // Ganti dengan nama repository Anda
        const uploadPath = 'video'; // Nama folder untuk menyimpan video

        const uploadUrl = `https://github.com/${video-interactive}/${src}/upload/main/${uploadPath}`;
        githubUploadLink.href = uploadUrl;
        githubInstructions.classList.remove('hidden');
    });


    // --- FUNGSI-FUNGSI (handleVideoUpload, loadVideoFromUrl, showEditor, dll. tetap sama) ---
    function handleVideoUpload(e) { /* ... */ }
    function loadVideoFromUrl(url) { /* ... */ }
    function showEditor() { /* ... */ }
    function addNewZone() { /* ... */ }
    function renderZone(zone) { /* ... */ }
    function renderAllZones() { /* ... */ }
    function updateZonesList() { /* ... */ }
    function deleteZone(id) { /* ... */ }
    function openModal(zoneId) { /* ... */ }
    function closeModal() { /* ... */ }
    function saveZoneLink() { /* ... */ }
    function generateShareableLink() { /* ... */ }
    function toggleRecording() { /* ... */ }
    function startRecording() { /* ... */ }
    function stopRecording() { /* ... */ }
    function drawCanvas() { /* ... */ }
    function generateLinksList() { /* ... */ }

    // --- INTERACT.JS SETUP (Tetap Sama) ---
    function setupInteractJS(element) {
        interact(element).draggable({ /* ... */ }).resizable({ /* ... */ });
    }
});
