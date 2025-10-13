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

    // Elemen Upload GitHub
    const uploadToGithubBtn = document.getElementById('upload-to-github-btn');
    const githubUploadPanel = document.getElementById('github-upload-panel');
    const githubTokenInput = document.getElementById('github-token-input');
    const uploadProgress = document.getElementById('upload-progress');
    const uploadResult = document.getElementById('upload-result');

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
    let uploadedFile = null; // Menyimpan file yang diunggah

    // --- INISIALISASI ---
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('data');
    const sharedVideoUrl = urlParams.get('video');

    if (sharedData) {
        try {
            zones = JSON.parse(decodeURIComponent(sharedData));
            zoneIdCounter = Math.max(...zones.map(z => z.id), 0) + 1;
            if (sharedVideoUrl) {
                videoUrlInput.value = sharedVideoUrl;
                loadVideoFromUrl(sharedVideoUrl);
            } else {
                alert('Link shareable berhasil dimuat! Silakan unggah video yang sama untuk melihat zona interaktif.');
            }
        } catch (e) {
            console.error("Gagal memuat data dari URL:", e);
        }
    }
    
    // Cek token di localStorage
    const savedToken = localStorage.getItem('github_pat');
    if (savedToken) {
        githubTokenInput.value = savedToken;
    }

    // --- EVENT LISTENERS ---
    uploadArea.addEventListener('click', () => videoUpload.click());
    videoUpload.addEventListener('change', handleVideoUpload);
    addZoneBtn.addEventListener('click', addNewZone);
    generateLinkBtn.addEventListener('click', generateShareableLink);
    copyLinkBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(shareableLink.value);
        copyLinkBtn.textContent = 'Tersalin!';
        setTimeout(() => copyLinkBtn.textContent = 'Salin', 2000);
    });
    
    // Event Listener Perekaman
    recordBtn.addEventListener('click', toggleRecording);
    videoPlayer.addEventListener('loadedmetadata', () => {
        recordingCanvas.width = videoPlayer.videoWidth;
        recordingCanvas.height = videoPlayer.videoHeight;
    });

    // Event Listener Daftar Link
    copyLinksBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(linksListTextarea.value);
        copyLinksBtn.innerHTML = '<i class="fas fa-check"></i> Tersalin!';
        setTimeout(() => copyLinksBtn.innerHTML = '<i class="fas fa-copy"></i> Salin Daftar Link', 2000);
    });

    // Event Listener Upload GitHub
    uploadToGithubBtn.addEventListener('click', () => {
        githubUploadPanel.classList.toggle('hidden');
    });
    githubTokenInput.addEventListener('input', (e) => {
        if (e.target.value) {
            localStorage.setItem('github_pat', e.target.value);
            triggerUpload();
        }
    });

    // Modal Event Listeners
    closeBtn.addEventListener('click', closeModal);
    cancelLinkBtn.addEventListener('click', closeModal);
    saveLinkBtn.addEventListener('click', saveZoneLink);
    window.addEventListener('click', (e) => {
        if (e.target === linkModal) closeModal();
    });

    // --- FUNGSI-FUNGSI UTAMA ---
    function handleVideoUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('video/')) {
            uploadedFile = file; // Simpan file untuk keperluan upload
            const fileURL = URL.createObjectURL(file);
            videoPlayer.src = fileURL;
            showEditor();
        } else {
            alert('Silakan pilih file video yang valid.');
        }
    }

    function loadVideoFromUrl(url) {
        videoPlayer.src = url;
        showEditor();
    }

    function showEditor() {
        uploadSection.classList.add('hidden');
        editorSection.classList.remove('hidden');
        renderAllZones();
    }

    // --- FUNGSI ZONA ---
    function addNewZone() {
        const newZone = { id: zoneIdCounter++, x: 10, y: 10, width: 20, height: 20, link: '' };
        zones.push(newZone);
        renderZone(newZone);
        updateZonesList();
    }

    function renderZone(zone) {
        const zoneEl = document.createElement('div');
        zoneEl.classList.add('clickable-zone');
        zoneEl.id = `zone-${zone.id}`;
        zoneEl.style.left = `${zone.x}%`;
        zoneEl.style.top = `${zone.y}%`;
        zoneEl.style.width = `${zone.width}%`;
        zoneEl.style.height = `${zone.height}%`;
        zoneEl.innerHTML = `Zona ${zone.id + 1}<i class="fas fa-edit edit-icon" title="Edit Link"></i>`;
        
        const editIcon = zoneEl.querySelector('.edit-icon');
        editIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            openModal(zone.id);
        });

        zoneEl.addEventListener('click', (e) => {
            e.stopPropagation();
            if (zone.link) window.open(zone.link, '_blank');
        });

        zonesOverlay.appendChild(zoneEl);
        setupInteractJS(zoneEl);
    }

    function renderAllZones() {
        zonesOverlay.innerHTML = '';
        zones.forEach(zone => renderZone(zone));
        updateZonesList();
    }

    function updateZonesList() {
        zonesList.innerHTML = '';
        if (zones.length === 0) { zonesList.innerHTML = '<li>Belum ada zona.</li>'; return; }
        zones.forEach(zone => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>Zona ${zone.id + 1}: ${zone.link || 'Tidak ada link'}</span>
                <div>
                    <button class="btn btn-secondary" onclick="openModal(${zone.id})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteZone(${zone.id})">Hapus</button>
                </div>
            `;
            zonesList.appendChild(li);
        });
    }

    function deleteZone(id) {
        zones = zones.filter(z => z.id !== id);
        renderAllZones();
    }

    // --- FUNGSI MODAL ---
    function openModal(zoneId) {
        currentEditingZoneId = zoneId;
        const zone = zones.find(z => z.id === zoneId);
        zoneLinkInput.value = zone.link || '';
        linkModal.classList.remove('hidden');
    }

    function closeModal() {
        linkModal.classList.add('hidden');
        currentEditingZoneId = null;
    }

    function saveZoneLink() {
        const zone = zones.find(z => z.id === currentEditingZoneId);
        if (zone) {
            zone.link = zoneLinkInput.value;
            updateZonesList();
        }
        closeModal();
    }

    // --- FUNGSI SHARE & REKAM ---
    function generateShareableLink() {
        const dataToEncode = JSON.stringify(zones);
        const encodedData = encodeURIComponent(dataToEncode);
        const videoUrl = videoUrlInput.value || '';
        const baseUrl = window.location.origin + window.location.pathname;
        const newUrl = `${baseUrl}?data=${encodedData}${videoUrl ? '&video=' + encodeURIComponent(videoUrl) : ''}`;
        shareableLink.value = newUrl;
        shareOutput.classList.remove('hidden');
    }

    function toggleRecording() {
        if (isRecording) stopRecording();
        else startRecording();
    }

    function startRecording() {
        if (zones.length === 0) { alert('Tambahkan setidaknya satu zona sebelum merekam.'); return; }
        
        recordedChunks = [];
        const stream = recordingCanvas.captureStream(30);
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

        mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) recordedChunks.push(event.data); };
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            downloadLink.href = url;
            downloadSection.classList.remove('hidden');
            generateLinksList(); // Buat daftar link setelah rekaman selesai
        };

        mediaRecorder.start();
        isRecording = true;
        recordBtn.innerHTML = '<i class="fas fa-stop"></i> Hentikan Rekam';
        recordBtn.classList.remove('btn-danger'); recordBtn.classList.add('btn-secondary');
        recordingIndicator.classList.remove('hidden');
        downloadSection.classList.add('hidden'); linksListSection.classList.add('hidden');
        
        videoPlayer.currentTime = 0; videoPlayer.play();
        drawCanvas();
    }

    function stopRecording() {
        mediaRecorder.stop();
        isRecording = false;
        recordBtn.innerHTML = '<i class="fas fa-record-vinyl"></i> Mulai Rekam Video';
        recordBtn.classList.remove('btn-secondary'); recordBtn.classList.add('btn-danger');
        recordingIndicator.classList.add('hidden');
        videoPlayer.pause();
        cancelAnimationFrame(animationFrameId);
    }

    function drawCanvas() {
        if (!isRecording) return;
        ctx.drawImage(videoPlayer, 0, 0, recordingCanvas.width, recordingCanvas.height);
        zones.forEach(zone => {
            const x = (zone.x / 100) * recordingCanvas.width;
            const y = (zone.y / 100) * recordingCanvas.height;
            const width = (zone.width / 100) * recordingCanvas.width;
            const height = (zone.height / 100) * recordingCanvas.height;
            ctx.strokeStyle = '#007bff'; ctx.lineWidth = 3; ctx.strokeRect(x, y, width, height);
            ctx.fillStyle = 'rgba(0, 123, 255, 0.4)'; ctx.fillRect(x, y, width, height);
            ctx.fillStyle = 'white'; ctx.font = 'bold 20px Poppins'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(`Zona ${zone.id + 1}`, x + width / 2, y + height / 2);
        });
        if (videoPlayer.currentTime < videoPlayer.duration) {
            animationFrameId = requestAnimationFrame(drawCanvas);
        } else {
            stopRecording();
        }
    }

    function generateLinksList() {
        const zonesWithLinks = zones.filter(z => z.link);
        if (zonesWithLinks.length === 0) { linksListSection.classList.add('hidden'); return; }
        let listText = "Link yang disebutkan dalam video:\n\n";
        zonesWithLinks.forEach(zone => { listText += `👉 Zona ${zone.id + 1}: ${zone.link}\n`; });
        linksListTextarea.value = listText;
        linksListSection.classList.remove('hidden');
    }

    // --- FUNGSI UPLOAD GITHUB ---
   // --- FUNGSI UPLOAD GITHUB (VERSI BARU & LEBIH ANDAL) ---
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

    // !!! PENTING: PASTIKAN BAGIAN INI SUDAH BENAR !!!
    const githubUsername = 'video-interactive'; // Ganti dengan username Anda
    const repoName = 'src'; // Ganti dengan nama repository Anda
    const path = `videos/${uploadedFile.name}`; // Path tempat file akan disimpan

    // Baca file sebagai Base64
    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64content = reader.result.split(',')[1];

        const apiUrl = `https://api.github.com/repos/${githubUsername}/${repoName}/contents/${path}`;

        const body = {
            message: `Menambahkan video baru: ${uploadedFile.name}`,
            content: base64content
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            const result = await response.json();

            if (response.ok && result.content) {
                // URL file yang di-upload
                const videoUrl = result.content.download_url;
                videoUrlInput.value = videoUrl;

                uploadProgress.classList.add('hidden');
                uploadResult.textContent = `✅ Upload berhasil! Video tersimpan di: ${path}`;
                uploadResult.className = 'success';
                uploadResult.classList.remove('hidden');
            } else {
                // Tampilkan error dari GitHub jika ada
                throw new Error(result.message || 'Gagal mengunggah file ke GitHub.');
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
    // --- INTERACT.JS SETUP ---
 // --- FUNGSI INTERACT.JS YANG BENAR ---
function setupInteractJS(element) {
    interact(element)
        .draggable({
            listeners: {
                move(event) {
                    const target = event.target;
                    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                    const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                    // Konversi pixel ke persentase
                    const parentRect = target.parentElement.getBoundingClientRect();
                    const xPercent = (x / parentRect.width) * 100;
                    const yPercent = (y / parentRect.height) * 100;

                    target.style.left = `${xPercent}%`;
                    target.style.top = `${yPercent}%`;
                    
                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);

                    // Update state
                    const zoneId = parseInt(target.id.split('-')[1]);
                    const zone = zones.find(z => z.id === zoneId);
                    if (zone) {
                        zone.x = xPercent;
                        zone.y = yPercent;
                    }
                }
            },
            modifiers: [
                interact.modifiers.restrictRect({
                    restriction: 'parent',
                    endOnly: true
                })
            ]
        })
        .resizable({
            edges: { left: true, right: true, bottom: true, top: true },
            listeners: {
                move(event) {
                    const target = event.target;
                    let x = (parseFloat(target.getAttribute('data-x')) || 0);
                    let y = (parseFloat(target.getAttribute('data-y')) || 0);

                    target.style.width = `${event.rect.width}px`;
                    target.style.height = `${event.rect.height}px`;

                    x += event.deltaRect.left;
                    y += event.deltaRect.top;

                    target.style.left = `${x}px`;
                    target.style.top = `${y}px`;

                    // Konversi ke persentase
                    const parentRect = target.parentElement.getBoundingClientRect();
                    const xPercent = (x / parentRect.width) * 100;
                    const yPercent = (y / parentRect.height) * 100;
                    const widthPercent = (event.rect.width / parentRect.width) * 100;
                    const heightPercent = (event.rect.height / parentRect.height) * 100;

                    target.style.left = `${xPercent}%`;
                    target.style.top = `${yPercent}%`;
                    target.style.width = `${widthPercent}%`;
                    target.style.height = `${heightPercent}%`;

                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);

                    // Update state
                    const zoneId = parseInt(target.id.split('-')[1]);
                    const zone = zones.find(z => z.id === zoneId);
                    if (zone) {
                        zone.x = xPercent;
                        zone.y = yPercent;
                        zone.width = widthPercent;
                        zone.height = heightPercent;
                    }
                }
            },
            modifiers: [
                interact.modifiers.restrictEdges({
                    outer: 'parent'
                }),
                interact.modifiers.restrictSize({
                    min: { width: 50, height: 50 }
                })
            ],
            inertia: true
        });
}

// Fungsi helper untuk interact.js
interact.maxInteractions(Infinity);
    // Fungsi helper untuk interact.js (dipisah untuk kemudahan)
    interact.maxInteractions(Infinity);
});
