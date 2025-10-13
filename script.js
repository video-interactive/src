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

    // Elemen Perekaman Baru
    const recordBtn = document.getElementById('record-btn');
    const downloadSection = document.getElementById('download-section');
    const downloadLink = document.getElementById('download-link');
    const recordingIndicator = document.getElementById('recording-indicator');
    const recordingCanvas = document.getElementById('recording-canvas');
    const ctx = recordingCanvas.getContext('2d');

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
    
    // Event Listener Perekaman Baru
    recordBtn.addEventListener('click', toggleRecording);
    videoPlayer.addEventListener('loadedmetadata', () => {
        recordingCanvas.width = videoPlayer.videoWidth;
        recordingCanvas.height = videoPlayer.videoHeight;
    });

    // Modal Event Listeners
    closeBtn.addEventListener('click', closeModal);
    cancelLinkBtn.addEventListener('click', closeModal);
    saveLinkBtn.addEventListener('click', saveZoneLink);
    window.addEventListener('click', (e) => {
        if (e.target === linkModal) closeModal();
    });

    // --- FUNGSI-FUNGSI ---
    function handleVideoUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('video/')) {
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

    function addNewZone() {
        const newZone = {
            id: zoneIdCounter++,
            x: 10, y: 10, width: 20, height: 20, link: ''
        };
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
        zoneEl.innerHTML = `
            Zona ${zone.id + 1}
            <i class="fas fa-edit edit-icon" title="Edit Link"></i>
        `;
        
        // Event listener untuk ikon edit
        const editIcon = zoneEl.querySelector('.edit-icon');
        editIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            openModal(zone.id);
        });

        // Arahkan ke link saat diklik
        zoneEl.addEventListener('click', (e) => {
            e.stopPropagation();
            if (zone.link) {
                window.open(zone.link, '_blank');
            }
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
        if (zones.length === 0) {
            zonesList.innerHTML = '<li>Belum ada zona.</li>';
            return;
        }
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

    function generateShareableLink() {
        const dataToEncode = JSON.stringify(zones);
        const encodedData = encodeURIComponent(dataToEncode);
        const videoUrl = videoUrlInput.value || '';
        const baseUrl = window.location.origin + window.location.pathname;
        const newUrl = `${baseUrl}?data=${encodedData}${videoUrl ? '&video=' + encodeURIComponent(videoUrl) : ''}`;
        shareableLink.value = newUrl;
        shareOutput.classList.remove('hidden');
    }

    // --- FUNGSI PEREKAMAN VIDEO BARU ---
    function toggleRecording() {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }

    function startRecording() {
        if (zones.length === 0) {
            alert('Tambahkan setidaknya satu zona sebelum merekam.');
            return;
        }
        
        recordedChunks = [];
        const stream = recordingCanvas.captureStream(30); // 30 FPS
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            downloadLink.href = url;
            downloadSection.classList.remove('hidden');
        };

        mediaRecorder.start();
        isRecording = true;
        recordBtn.innerHTML = '<i class="fas fa-stop"></i> Hentikan Rekam';
        recordBtn.classList.remove('btn-danger');
        recordBtn.classList.add('btn-secondary');
        recordingIndicator.classList.remove('hidden');
        downloadSection.classList.add('hidden');
        
        videoPlayer.currentTime = 0;
        videoPlayer.play();
        drawCanvas();
    }

    function stopRecording() {
        mediaRecorder.stop();
        isRecording = false;
        recordBtn.innerHTML = '<i class="fas fa-record-vinyl"></i> Mulai Rekam Video';
        recordBtn.classList.remove('btn-secondary');
        recordBtn.classList.add('btn-danger');
        recordingIndicator.classList.add('hidden');
        videoPlayer.pause();
        cancelAnimationFrame(animationFrameId);
    }

    function drawCanvas() {
        if (!isRecording) return;

        // Gambar frame video
        ctx.drawImage(videoPlayer, 0, 0, recordingCanvas.width, recordingCanvas.height);

        // Gambar zona-zona di atasnya
        zones.forEach(zone => {
            const x = (zone.x / 100) * recordingCanvas.width;
            const y = (zone.y / 100) * recordingCanvas.height;
            const width = (zone.width / 100) * recordingCanvas.width;
            const height = (zone.height / 100) * recordingCanvas.height;

            ctx.strokeStyle = '#007bff';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);
            
            ctx.fillStyle = 'rgba(0, 123, 255, 0.4)';
            ctx.fillRect(x, y, width, height);

            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px Poppins';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`Zona ${zone.id + 1}`, x + width / 2, y + height / 2);
        });

        // Lanjutkan animasi jika video belum selesai
        if (videoPlayer.currentTime < videoPlayer.duration) {
            animationFrameId = requestAnimationFrame(drawCanvas);
        } else {
            // Hentikan perekaman saat video selesai
            stopRecording();
        }
    }


    // --- INTERACT.JS SETUP (Tetap Sama) ---
    function setupInteractJS(element) {
        interact(element)
            .draggable({
                listeners: {
                    move(event) {
                        const target = event.target;
                        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                        const parentRect = target.parentElement.getBoundingClientRect();
                        const xPercent = (x / parentRect.width) * 100;
                        const yPercent = (y / parentRect.height) * 100;
                        target.style.left = `${xPercent}%`;
                        target.style.top = `${yPercent}%`;
                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);
                        const zoneId = parseInt(target.id.split('-')[1]);
                        const zone = zones.find(z => z.id === zoneId);
                        if (zone) { zone.x = xPercent; zone.y = yPercent; }
                    }
                },
                modifiers: [ interact.modifiers.restrictRect({ restriction: 'parent', endOnly: true }) ]
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
                        const zoneId = parseInt(target.id.split('-')[1]);
                        const zone = zones.find(z => z.id === zoneId);
                        if (zone) {
                            zone.x = xPercent; zone.y = yPercent;
                            zone.width = widthPercent; zone.height = heightPercent;
                        }
                    }
                },
                modifiers: [
                    interact.modifiers.restrictEdges({ outer: 'parent' }),
                    interact.modifiers.restrictSize({ min: { width: 50, height: 50 } })
                ],
                inertia: true
            });
    }
});
