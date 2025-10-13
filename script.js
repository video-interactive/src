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
        githubUploadPanel.calssList.toggle('hidden');
        // !!! PENTING: UBAH BAGIAN INI !!!
        const githubUsername = 'video-interactive'; // Ganti dengan username Anda
        const repoName = 'src'; // Ganti dengan nama repository Anda
        const uploadPath = 'video'; // Nama folder untuk menyimpan video

        const uploadUrl = `https://github.com/${video-interactive}/${src}/upload/main/${uploadPath}`;
        githubUploadLink.href = uploadUrl;
        githubInstructions.classList.remove('hidden');
    });


    // --- FUNGSI-FUNGSI (handleVideoUpload, loadVideoFromUrl, showEditor, dll. tetap sama) ---
   let uploadedFile = null; // Variabel global untuk menyimpan file
    function handleVideoUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('video/')) {
            uploadedFile = file; // Simpan file ke variabel global
            const fileURL = URL.createObjectURL(file);
            videoPlayer.src = fileURL;
            showEditor();
        } else {
            alert('Silakan pilih file video yang valid.');
        }
    }
 // Tambahkan event listener untuk input token
    githubTokenInput.addEventListener('input', (e) => {
        if (e.target.value) {
            localStorage.setItem('github_pat', e.target.value);
            triggerUpload(); // Mulai upload jika token ada
        }
    });
 // --- FUNGSI BARU: TRIGGER UPLOAD KE GITHUB ---
    async function triggerUpload() {
        if (!uploadedFile) {
            alert('Silakan pilih file video terlebih dahulu.');
            return;
        }

        const token = githubTokenInput.value || localStorage.getItem('github_pat');
        if (!token) {
            alert('Token Akses GitHub diperlukan.');
            return;
        }

        // Tampilkan progress
        uploadProgress.classList.remove('hidden');
        uploadResult.classList.add('hidden');
        // !!! PENTING: UBAH BAGIAN INI !!!
        const githubUsername = 'video-interactive
'; // Ganti dengan username Anda
        const repoName = 'src'; // Ganti dengan nama repository Anda

        // Baca file sebagai Base64
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64data = reader.result.split(',')[1]; // Ambil bagian data saja

            const payload = {
                event_type: 'video-upload-event',
                client_payload: {
                    filename: uploadedFile.name,
                    content: base64data
                }
            };

            try {
                const response = await fetch(`https://api.github.com/repos/${video-interactive}/${src}/dispatches`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    // Tunggu beberapa saat agar Actions selesai
                    setTimeout(() => {
                        const videoUrl = `https://raw.githubusercontent.com/${video-interactive}/${src}/main/videos/${uploadedFile.name}`;
                        videoUrlInput.value = videoUrl;
                        uploadProgress.classList.add('hidden');
                        uploadResult.textContent = `✅ Upload berhasil! Video tersimpan di: videos/${uploadedFile.name}`;
                        uploadResult.className = 'success';
                        uploadResult.classList.remove('hidden');
                    }, 15000); // Tunggu 15 detik
                } else {
                    throw new Error('Gagal mengirim perintah ke GitHub Actions.');
                }
            } catch (error) {
                console.error(error);
                uploadProgress.classList.add('hidden');
                uploadResult.textContent = `❌ Error: ${error.message}`;
                uploadResult.className = 'error';
                uploadResult.classList.remove('hidden');
            }
        };
        reader.readAsDataURL(uploadedFile);
    }

    // Cek apakah token sudah ada di localStorage saat halaman dimuat
    window.addEventListener('load', () => {
        const savedToken = localStorage.getItem('github_pat');
        if (savedToken) {
            githubTokenInput.value = savedToken;
        }
    });

    // ... (fungsi setupInteractJS tetap sama) ...
});

    // --- INTERACT.JS SETUP (Tetap Sama) ---
    function setupInteractJS(element) {
        interact(element).draggable({ /* ... */ }).resizable({ /* ... */ });
    }
});
