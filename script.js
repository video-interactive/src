document.addEventListener('DOMContentLoaded', () => {
    // --- DETEKSI HALAMAN ---
    // Cek apakah kita berada di halaman player atau editor
    const isPlayerPage = window.location.pathname.endsWith('player.html');

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
    const zoneCtaInput = document.getElementById('zone-cta-input');
    const zoneLinkInput = document.getElementById('zone-link-input');
    const zoneOpacityInput = document.getElementById('zone-opacity-input');
    const zoneOpacityValue = document.getElementById('zone-opacity-value');
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
    let uploadedFile = null;

    // --- INISIALISASI ---
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('data');
    const sharedVideoUrl = urlParams.get('video');

    if (sharedData) {
        try {
            zones = JSON.parse(decodeURIComponent(sharedData));
            zoneIdCounter = Math.max(...zones.map(z => z.id), 0) + 1;
            if (sharedVideoUrl) {
                // Jika di halaman player, langsung load video. Jika di editor, isi input.
                if (isPlayerPage) {
                    loadVideoFromUrl(sharedVideoUrl);
                } else {
                    videoUrlInput.value = sharedVideoUrl;
                    loadVideoFromUrl(sharedVideoUrl);
                }
            } else {
                // Pesan error hanya relevan untuk halaman editor
                if (!isPlayerPage) {
                    alert('Link shareable berhasil dimuat! Namun, tidak ada URL video di dalamnya. Silakan unggah video yang sama untuk melihat zona interaktif.');
                }
            }
        } catch (e) {
            console.error("Gagal memuat data dari URL:", e);
        }
    } else {
        // Jika tidak ada data dan ini adalah halaman player, tampilkan pesan error
        if (isPlayerPage) {
            document.body.innerHTML = '<div style="color:white; text-align:center; padding:2rem; font-family: sans-serif;"><h1>Error</h1><p>Link tidak valid atau tidak ada data video interaktif.</p></div>';
        }
    }
    
    const savedToken = localStorage.getItem('github_pat');
    if (savedToken && githubTokenInput) {
        githubTokenInput.value = savedToken;
    }

    const autoplayParam = urlParams.get('autoplay');
    if (autoplayParam === 'true') {
        videoPlayer.addEventListener('loadedmetadata', () => {
            videoPlayer.muted = true; 
            videoPlayer.play().catch(error => console.error("Autoplay dicegah oleh browser:", error));
        }, { once: true });
    }

    // --- EVENT LISTENERS ---
    // Hanya tambahkan listener jika elemennya ada (bukan di halaman player)
    if (uploadArea) uploadArea.addEventListener('click', () => videoUpload.click());
    if (videoUpload) videoUpload.addEventListener('change', handleVideoUpload);
    if (addZoneBtn) addZoneBtn.addEventListener('click', addNewZone);
    if (generateLinkBtn) generateLinkBtn.addEventListener('click', generateShareableLink);
    if (copyLinkBtn) copyLinkBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(shareableLink.value);
        copyLinkBtn.textContent = 'Tersalin!';
        setTimeout(() => copyLinkBtn.textContent = 'Salin', 2000);
    });
    
    if (recordBtn) recordBtn.addEventListener('click', toggleRecording);
    if (videoPlayer) videoPlayer.addEventListener('loadedmetadata', () => {
        recordingCanvas.width = videoPlayer.videoWidth;
        recordingCanvas.height = videoPlayer.videoHeight;
    });

    if (copyLinksBtn) copyLinksBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(linksListTextarea.value);
        copyLinksBtn.innerHTML = '<i class="fas fa-check"></i> Tersalin!';
        setTimeout(() => copyLinksBtn.innerHTML = '<i class="fas fa-copy"></i> Salin Daftar Link', 2000);
    });

    if (uploadToGithubBtn) uploadToGithubBtn.addEventListener('click', () => {
        githubUploadPanel.classList.toggle('hidden');
    });
    if (githubTokenInput) githubTokenInput.addEventListener('input', (e) => {
        if (e.target.value) {
            localStorage.setItem('github_pat', e.target.value);
            triggerUpload();
        }
    });

    if (zoneOpacityInput) zoneOpacityInput.addEventListener('input', (e) => {
        const opacity = e.target.value;
        zoneOpacityValue.textContent = `${Math.round(opacity * 100)}%`;
        if (currentEditingZoneId !== null) {
            const zoneEl = document.getElementById(`zone-${currentEditingZoneId}`);
            if (zoneEl) {
                zoneEl.style.backgroundColor = `rgba(0, 123, 255, ${opacity})`;
                zoneEl.style.borderColor = `rgba(0, 123, 255, ${Math.max(opacity, 0.5)})`;
            }
        }
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelLinkBtn) cancelLinkBtn.addEventListener('click', closeModal);
    if (saveLinkBtn) saveLinkBtn.addEventListener('click', saveZoneLink);
    window.addEventListener('click', (e) => {
        if (e.target === linkModal) closeModal();
    });

    // --- FUNGSI-FUNGSI UTAMA ---
    function handleVideoUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('video/')) {
            uploadedFile = file;
            const fileURL = URL.createObjectURL(file);
            videoPlayer.src = fileURL;
            showEditor();
        } else {
            alert('Silakan pilih file video yang valid.');
        }
    }

    function loadVideoFromUrl(url) {
        videoPlayer.src = url;
        if (!isPlayerPage) showEditor();
    }

    function showEditor() {
        if (uploadSection) uploadSection.classList.add('hidden');
        if (editorSection) editorSection.classList.remove('hidden');
        renderAllZones();
    }

    // --- FUNGSI ZONA ---
    function addNewZone() {
        const newZone = { id: zoneIdCounter++, x: 10, y: 10, width: 20, height: 20, link: '', cta: 'Klik di sini', opacity: 0.4 };
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
        
        const opacity = zone.opacity || 0.4;
        zoneEl.style.backgroundColor = `rgba(0, 123, 255, ${opacity})`;
        zoneEl.style.borderColor = `rgba(0, 123, 255, ${Math.max(opacity, 0.5)})`;
        
        // Di halaman player, tidak ada tombol edit
        zoneEl.innerHTML = isPlayerPage ? zone.cta : `${zone.cta}<i class="fas fa-edit edit-icon" title="Edit"></i>`;
        
        const editIcon = zoneEl.querySelector('.edit-icon');
        if (editIcon) {
            editIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                openModal(zone.id);
            });
        }

        zoneEl.addEventListener('click', (e) => {
            e.stopPropagation();
            if (zone.link) window.open(zone.link, '_blank');
        });

        zonesOverlay.appendChild(zoneEl);
        if (!isPlayerPage) setupInteractJS(zoneEl);
    }

    function renderAllZones() {
        zonesOverlay.innerHTML = '';
        zones.forEach(zone => renderZone(zone));
        if (!isPlayerPage) updateZonesList();
    }

    function updateZonesList() {
        if (!zonesList) return;
        zonesList.innerHTML = '';
        if (zones.length === 0) { zonesList.innerHTML = '<li>Belum ada zona.</li>'; return; }
        zones.forEach(zone => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span><strong>${zone.cta}</strong>: ${zone.link || 'Tidak ada link'}</span>
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
        if (isPlayerPage) return; // Tidak ada modal di halaman player
        currentEditingZoneId = zoneId;
        const zone = zones.find(z => z.id === zoneId);
        zoneCtaInput.value = zone.cta || '';
        zoneLinkInput.value = zone.link || '';
        
        const opacity = zone.opacity || 0.4;
        zoneOpacityInput.value = opacity;
        zoneOpacityValue.textContent = `${Math.round(opacity * 100)}%`;
        
        linkModal.classList.remove('hidden');
    }

    function closeModal() {
        if (linkModal) linkModal.classList.add('hidden');
        currentEditingZoneId = null;
    }

    function saveZoneLink() {
        const zone = zones.find(z => z.id === currentEditingZoneId);
        if (zone) {
            zone.cta = zoneCtaInput.value || 'Klik di sini';
            zone.link = zoneLinkInput.value;
            zone.opacity = parseFloat(zoneOpacityInput.value);
            updateZonesList();
            renderAllZones();
        }
        closeModal();
    }

    // --- FUNGSI SHARE & REKAM ---
    function generateShareableLink() {
        if (!videoUrlInput.value) {
            alert('Untuk membuat link shareable yang lengkap, Anda harus mengunggah video ke GitHub terlebih dahulu. URL video diperlukan agar orang lain bisa melihatnya.');
            if(uploadToGithubBtn) uploadToGithubBtn.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        const dataToEncode = JSON.stringify(zones);
        const encodedData = encodeURIComponent(dataToEncode);
        const videoUrl = videoUrlInput.value;
        
        // !!! PERUBAHAN PENTING: Gunakan player.html untuk link shareable !!!
        const baseUrl = window.location.origin + window.location.pathname.replace('index.html', 'player.html');
        const newUrl = `${baseUrl}?data=${encodedData}&video=${encodeURIComponent(videoUrl)}&autoplay=true`;
        
        shareableLink.value = newUrl;
        shareOutput.classList.remove('hidden');
    }

    function toggleRecording() { if (isRecording) stopRecording(); else startRecording(); }

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
            generateLinksList();
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
            
            const opacity = zone.opacity || 0.4;
            ctx.strokeStyle = `rgba(0, 123, 255, ${Math.max(opacity, 0.5)})`;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);
            ctx.fillStyle = `rgba(0, 123, 255, ${opacity})`;
            ctx.fillRect(x, y, width, height);
            
            ctx.fillStyle = 'white'; ctx.font = 'bold 20px Poppins'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(zone.cta, x + width / 2, y + height / 2);
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
        zonesWithLinks.forEach(zone => { listText += `👉 "${zone.cta}": ${zone.link}\n`; });
        linksListTextarea.value = listText;
        linksListSection.classList.remove('hidden');
    }

    // --- FUNGSI UPLOAD GITHUB ---
    async function triggerUpload() {
        if (!uploadedFile) { alert('Silakan pilih file video terlebih dahulu.'); return; }
        const token = githubTokenInput.value || localStorage.getItem('github_pat');
        if (!token) { alert('Token Akses GitHub diperlukan.'); return; }
        uploadProgress.classList.remove('hidden'); uploadResult.classList.add('hidden');
        
        // !!! PENTING: UBAH BAGIAN INI !!!
        const githubUsername = 'video-interactive';
        const repoName = 'src';
        const path = `videos/${uploadedFile.name}`;
        const apiUrl = `https://api.github.com/repos/${githubUsername}/${repoName}/contents/${path}`;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64content = reader.result.split(',')[1];
            let fileSha = null;

            try {
                const getResponse = await fetch(apiUrl, {
                    method: 'GET',
                    headers: { 'Authorization': `token ${token}` }
                });

                if (getResponse.ok) {
                    const fileData = await getResponse.json();
                    fileSha = fileData.sha;
                } else if (getResponse.status !== 404) {
                    throw new Error(`Gagal mengecek file: ${getResponse.statusText}`);
                }

                const body = {
                    message: `${fileSha ? 'Memperbarui' : 'Menambahkan'} video: ${uploadedFile.name}`,
                    content: base64content,
                };
                if (fileSha) {
                    body.sha = fileSha;
                }

                const putResponse = await fetch(apiUrl, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body)
                });

                const result = await putResponse.json();
                if (putResponse.ok && result.content) {
                    const videoUrl = result.content.download_url;
                    videoUrlInput.value = videoUrl;
                    uploadProgress.classList.add('hidden');
                    uploadResult.textContent = `✅ Upload berhasil! Video ${fileSha ? 'diperbarui' : 'disimpan'} di: ${path}`;
                    uploadResult.className = 'success'; uploadResult.classList.remove('hidden');
                } else {
                    throw new Error(result.message || 'Gagal mengunggah file ke GitHub.');
                }

            } catch (error) {
                console.error(error);
                uploadProgress.classList.add('hidden');
                uploadResult.textContent = `❌ Error: ${error.message}`;
                uploadResult.className = 'error'; uploadResult.classList.remove('hidden');
            }
        };
        reader.readAsDataURL(uploadedFile);
    }

    // --- FUNGSI INTERACT.JS ---
    function setupInteractJS(element) {
        interact(element)
            .draggable({ /* ... */ })
            .resizable({ /* ... */ });
    }
    interact.maxInteractions(Infinity);
});
