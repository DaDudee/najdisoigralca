let map, currentActivity = null, selectedImages = [];

document.addEventListener('DOMContentLoaded', () => {
    const activityId = new URLSearchParams(window.location.search).get('id');
    activityId ? (loadActivity(activityId), loadComments(activityId)) : 
        document.getElementById('loading').innerHTML = '<p>Napaka: ID aktivnosti ni podan</p>';
});

async function loadActivity(activityId) {
    try {
        // Preveri ali je uporabnik prijavljen
        const prijavljenUporabnik = JSON.parse(sessionStorage.getItem('uporabnik'));
        let prijavljenUporabnikId = prijavljenUporabnik ? prijavljenUporabnik.ID : null;

        // Pridobi prijavljene aktivnosti
        let prijavljeneAktivnosti = [];
        if (prijavljenUporabnikId) {
            const prijaveResp = await fetch(`http://127.0.0.1:2999/uporabnik/${prijavljenUporabnikId}/aktivnosti`);
            if (prijaveResp.ok) {
                const prijaveData = await prijaveResp.json();
                prijavljeneAktivnosti = prijaveData.aktivnosti.map(a => a.ID || a.id);
            }
        }

        const response = await fetch(`http://127.0.0.1:2999/aktivnost/${activityId}`);
        if (!response.ok) throw new Error('Aktivnost ni bila najdena');
        
        currentActivity = await response.json();
        displayActivity(currentActivity, prijavljeneAktivnosti);
        initializeMap(currentActivity.lokacija);
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('activity-detail').style.display = 'block';
    } catch (error) {
        document.getElementById('loading').innerHTML = `<p>Napaka pri nalaganju: ${error.message}</p>`;
    }
}

async function loadComments(activityId) {
    try {
        const response = await fetch(`/aktivnost/${activityId}/komentarji`);
        if (!response.ok) throw new Error('Napaka pri pridobivanju komentarjev');
        
        const comments = await response.json();
        const commentsList = document.getElementById('comments-list');
        const user = JSON.parse(sessionStorage.getItem('uporabnik'));
        const isOrganizer = user && user.vloga === 'organizator';
        
        commentsList.innerHTML = comments.map(comment => {
            const images = comment.potDoSlike ? JSON.parse(comment.potDoSlike) : [];
            let imageHtml = '';
            
            if (images.length > 0) {
                if (comment.slikaOdobrena === null) {
                    // Pending images
                    imageHtml = `
                        <div class="pending-image">
                            <p>Slika čaka na odobritev organizatorja</p>
                            ${isOrganizer ? `
                                <div class="pending-image-preview">
                                    <img src="${images[0]}" alt="Slika za odobritev" class="comment-image">
                                </div>
                                <div class="approval-buttons">
                                    <button onclick="approveImage(${comment.ID}, true)" class="approve-btn" title="Odobri sliko">
                                        <i class="fas fa-check"></i>
                                    </button>
                                    <button onclick="approveImage(${comment.ID}, false)" class="reject-btn" title="Zavrni sliko">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    `;
                } else if (comment.slikaOdobrena) {
                    // Approved images
                    imageHtml = images.map(image => 
                        `<img src="${image}" alt="Slikovni komentar" class="comment-image">`
                    ).join('');
                }
                // Rejected images (slikaOdobrena === 0 || slikaOdobrena === false) are not shown
            }
            
            return `
                <div class="comment">
                    <div class="comment-header">
                        <span class="comment-author">${comment.ime} ${comment.priimek}</span>
                        <span class="comment-date">${new Date(comment.datumObjave).toLocaleString('sl-SI')}</span>
                    </div>
                    <div class="comment-content">
                        <p>${comment.vsebina}</p>
                        ${imageHtml}
                    </div>
                </div>
            `;
        }).join('');
        
        document.getElementById('comments-count').textContent = `${comments.length} komentarjev`;
    } catch (error) {
        console.error('Napaka pri nalaganju komentarjev:', error);
        commentsList.innerHTML = '<div class="error">Napaka pri nalaganju komentarjev</div>';
    }
}

async function approveImage(commentId, approved) {
    try {
        console.log('Odobritev slike:', { commentId, approved });
        
        const response = await fetch(`/komentar/${commentId}/slika`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ odobreno: approved })
        });
        
        if (!response.ok) throw new Error('Napaka pri odobritvi slike');
        
        const result = await response.json();
        console.log('Odgovor od strežnika:', result);
        
        // Ponovno naloži komentarje
        await loadComments(currentActivity.ID);
        showSuccessMessage(approved ? 'Slika je bila odobrena' : 'Slika je bila zavrnjena');
    } catch (error) {
        console.error('Napaka pri odobritvi slike:', error);
        alert('Napaka pri odobritvi slike');
    }
}

function displayActivity(activity, prijavljeneAktivnosti) {
    const date = new Date(activity.datumAktivnosti);
    document.getElementById('activity-title').textContent = activity.tipIgrisca || 'Neimenovana aktivnost';
    document.getElementById('activity-location').textContent = activity.lokacija || 'Neznana lokacija';
    document.getElementById('activity-date').textContent = `${date.toLocaleDateString('sl-SI')} ob ${activity.casAktivnosti}`;
    document.getElementById('activity-description').textContent = activity.opis || 'Opis ni na voljo.';
    document.getElementById('participant-max').textContent = activity.maxIgralcev || '0';
    document.getElementById('participant-min').textContent = activity.minIgralcev || '0';
    document.getElementById('organizer-name').textContent = activity.organizator || 'Neznan';
    
    // Nastavi gumb za prijavo/odjavo
    const joinBtn = document.getElementById('join-btn');
    const prijavljenNaAktivnost = prijavljeneAktivnosti.includes(activity.ID || activity.id);
    
    if (prijavljenNaAktivnost) {
        joinBtn.classList.remove('btn-primary');
        joinBtn.classList.add('btn-danger');
        joinBtn.innerHTML = 'Odjavi se';
        joinBtn.onclick = () => odjaviSe(activity.ID || activity.id);
    } else {
        joinBtn.classList.remove('btn-danger');
        joinBtn.classList.add('btn-primary');
        joinBtn.innerHTML = 'Prijavi se';
        joinBtn.onclick = () => prijaviSe(activity.ID || activity.id);
    }

    document.getElementById('share-btn').addEventListener('click', shareActivity);
    document.getElementById('comment-submit').addEventListener('click', addComment);
    document.getElementById('image-input').addEventListener('change', handleImageUpload);
}

async function initializeMap(location) {
    if (!location) return;
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(location)}`);
        const data = await response.json();
        if (data.length > 0) {
            const { lat, lon } = data[0];
            map = L.map('map').setView([lat, lon], 13);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
            L.marker([lat, lon]).addTo(map).bindPopup(`Lokacija: ${location}`).openPopup();
        }
    } catch (error) { console.error('Napaka pri nalaganju zemljevida:', error); }
}

function shareActivity() {
    navigator.share ? navigator.share({
        title: currentActivity.tipIgrisca,
        text: `Poglej to športno aktivnost: ${currentActivity.tipIgrisca}`,
        url: window.location.href
    }) : (navigator.clipboard.writeText(window.location.href), alert('Povezava je bila kopirana!'));
}

async function addComment() {
    const session = await (await fetch('/check-session', { credentials: 'include' })).json();
    if (!session.valid) return (alert('Za komentiranje se morate prijaviti!'), window.location.href = 'login.html');
    
    const commentText = document.getElementById('comment-input').value.trim();
    if (!commentText) return alert('Komentar ne sme biti prazen!');
    if (!currentActivity?.ID) return alert('Napaka: aktivnost ni naložena');
    
    try {
        const formData = new FormData();
        formData.append('vsebina', commentText);
        selectedImages.forEach(image => formData.append('slike', image));
        
        const response = await fetch(`/aktivnost/${currentActivity.ID}/komentarji`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error((await response.json()).error || 'Napaka pri pošiljanju komentarja');
        
        document.getElementById('comment-input').value = '';
        document.getElementById('images-preview').innerHTML = '';
        selectedImages = [];
        document.getElementById('image-count').textContent = '0 slik';
        
        await loadComments(currentActivity.ID);
        showSuccessMessage('Komentar je bil uspešno dodan!');
    } catch (error) {
        console.error('Napaka pri dodajanju komentarja:', error);
        alert(`Napaka pri dodajanju komentarja: ${error.message}`);
    }
}

function showSuccessMessage(message, type) {
    const messageElement = document.createElement('div');
    messageElement.className = `success-message ${type}`;
    messageElement.textContent = message;
    messageElement.style.cssText = 'position:fixed;top:20px;right:20px;padding:15px 20px;border-radius:5px;box-shadow:0 2px 10px rgba(0,0,0,0.2);z-index:1000;font-size:14px;transition:opacity 0.3s ease;color:white;';
    document.body.appendChild(messageElement);
    setTimeout(() => {
        messageElement.style.opacity = '0';
        setTimeout(() => messageElement.remove(), 300);
    }, 3000);
}

async function handleImageUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Preveri vlogo uporabnika
    const user = JSON.parse(sessionStorage.getItem('uporabnik'));
    if (!user) {
        alert('Za nalaganje slik se morate prijaviti!');
        return;
    }
    
    const totalSize = Array.from(files).reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 20 * 1024 * 1024) return alert('Skupna velikost slik ne sme presegati 20MB');
    
    selectedImages = [];
    document.getElementById('images-preview').innerHTML = '';
    
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return alert(`Datoteka ${file.name} ni slika!`);
        if (file.size > 5 * 1024 * 1024) return alert(`Slika ${file.name} je prevelika (max 5MB)`);
        
        selectedImages.push(file);
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById('images-preview').innerHTML += `
                <div class="preview-item">
                    <img src="${e.target.result}" alt="Predogled">
                    <button onclick="removePreviewImage(this, '${file.name}')"><i class="fas fa-times"></i></button>
                </div>`;
        };
        reader.readAsDataURL(file);
    });
    
    document.getElementById('image-count').textContent = `${selectedImages.length} ${selectedImages.length === 1 ? 'slika' : 'slike'}`;
}

function removePreviewImage(button, fileName) {
    selectedImages = selectedImages.filter(file => file.name !== fileName);
    button.parentElement.remove();
    document.getElementById('image-count').textContent = `${selectedImages.length} ${selectedImages.length === 1 ? 'slika' : 'slike'}`;
}

document.getElementById('comment-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) (e.preventDefault(), addComment());
});

async function prijaviSe(aktivnostId) {
    const prijavljenUporabnik = JSON.parse(sessionStorage.getItem('uporabnik'));
    if (!prijavljenUporabnik) {
        alert("Za prijavo se morate najprej prijaviti!");
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:2999/aktivnost/${aktivnostId}/prijava`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uporabnikId: prijavljenUporabnik.ID })
        });

        if (response.ok) {
            showSuccessMessage('Uspešno prijavljen!', 'success');
            // Ponovno naloži aktivnost za posodobitev stanja
            loadActivity(aktivnostId);
        } else {
            const error = await response.json();
            showSuccessMessage(error.error || 'Napaka pri prijavi.', 'error');
        }
    } catch (err) {
        console.error('Napaka pri pošiljanju prijave:', err);
        showSuccessMessage('Napaka pri prijavi.', 'error');
    }
}

async function odjaviSe(aktivnostId) {
    try {
        const uporabnik = JSON.parse(sessionStorage.getItem('uporabnik'));
        if (!uporabnik || !uporabnik.ID) {
            showSuccessMessage('Uporabnik ni prijavljen!', 'error');
            return;
        }

        const response = await fetch(`http://127.0.0.1:2999/aktivnost/${aktivnostId}/odjava`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uporabnikId: uporabnik.ID })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Odjava ni uspela.');
        }

        showSuccessMessage('Uspešno odjavljen!', 'danger');
        // Ponovno naloži aktivnost za posodobitev stanja
        loadActivity(aktivnostId); 
    } catch (error) {
        console.error('Napaka pri odjavi:', error);
        alert('Napaka pri odjavi: ' + error.message);
    }
}
document.getElementById('add-calendar-btn').addEventListener('click', function() {
    const naslov = encodeURIComponent(document.getElementById('activity-title').textContent.trim());
    const opis = encodeURIComponent(document.getElementById('activity-description').textContent.trim());
    const lokacija = encodeURIComponent(document.getElementById('activity-location').textContent.trim());
    const datumText = document.getElementById('activity-date').textContent.trim();

    // v obliki 2.6.2025 16:00:00
    const regex = /(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})\s*ob\s*(\d{2}:\d{2}:\d{2})/;
    const ujema = datumText.match(regex);

    if (!ujema) {
        alert('Nepravilno formatiran datum');
        return;
    }

    const dan = ujema[1].padStart(2, '0');
    const mesec = ujema[2].padStart(2, '0');
    const leto = ujema[3];
    const ura = ujema[4]; 

    const zacetek = new Date(`${leto}-${mesec}-${dan}T${ura}`);
    const konec = new Date(zacetek.getTime() + 60 * 60 * 1000); // eno uro razlike

    const formatDateTime = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const start = formatDateTime(zacetek);
    const end = formatDateTime(konec);

    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +`&text=${naslov}` + `&dates=${start}/${end}` +
                    `&details=${opis}` + `&location=${lokacija}`;

    window.open(gcalUrl, '_blank');
});
