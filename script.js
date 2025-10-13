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

    // --- INISIALISASI ---
    // Cek apakah ada data di URL saat halaman dimuat
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
                // Jika tidak ada URL video, tampilkan UI upload
                // dan beri tahu user untuk upload video yang sama
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
            x: 10, // posisi awal %
            y: 10,
            width: 20, // ukuran awal %
            height: 20,
            link: ''
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
        zoneEl.textContent = `Zona ${zone.id + 1}`;
        
        // Arahkan ke link saat diklik
        zoneEl.addEventListener('click', (e) => {
            e.stopPropagation(); // Mencegah event drag
            if (zone.link) {
                window.open(zone.link, '_blank');
            } else {
                openModal(zone.id);
            }
        });

        zonesOverlay.appendChild(zoneEl);
        setupInteractJS(zoneEl);
    }

    function renderAllZones() {
        zonesOverlay.innerHTML = ''; // Hapus semua zona yang ada
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
            // Update teks pada zona di video
            const zoneEl = document.getElementById(`zone-${zone.id}`);
            if(zoneEl) zoneEl.textContent = `Zona ${zone.id + 1}`;
        }
        closeModal();
    }

    function generateShareableLink() {
        const dataToEncode = JSON.stringify(zones);
        const encodedData = encodeURIComponent(dataToEncode);
        const videoUrl = videoUrlInput.value || ''; // Ambil URL dari input jika ada

        const baseUrl = window.location.origin + window.location.pathname;
        const newUrl = `${baseUrl}?data=${encodedData}${videoUrl ? '&video=' + encodeURIComponent(videoUrl) : ''}`;
        
        shareableLink.value = newUrl;
        shareOutput.classList.remove('hidden');
    }

    // --- INTERACT.JS SETUP ---
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
});
