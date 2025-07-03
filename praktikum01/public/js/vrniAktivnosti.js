document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sport = urlParams.get('sport') || "NI GA";
    vrniAktivnosti(sport);
});

let multiMap;
let locationMarkers = L.layerGroup();

async function vrniAktivnosti(sportName) {
    try {
        //najprej preverimo ali je uporabnik prijavljen
        const prijavljenUporabnik = JSON.parse(sessionStorage.getItem('uporabnik'));
        let prijavljenUporabnikId;

        if (prijavljenUporabnik) {
            prijavljenUporabnikId = prijavljenUporabnik.ID;
        }
        else {
            prijavljenUporabnikId = null;
        }

        //če je prijavljen, uporabimo kar endpoint od prej, ki je za pridobivanje aktivnosti glede na uporabnika (ID)
        //
        //za dinamicna gumba "Prijavi se" in "Odjavi se" potem uporabljamo aktivnosti, ki smo jih preko tega endpointa dobili
        //shranimo jih v tabelo "prijavljeneAktivnosti"

        let prijavljeneAktivnosti = [];
        if (prijavljenUporabnikId) {
            const prijaveResp = await fetch(`http://192.168.0.39:3000/uporabnik/${prijavljenUporabnikId}/aktivnosti`);
            if (prijaveResp.ok) {
                const prijaveData = await prijaveResp.json();
                prijavljeneAktivnosti = prijaveData.aktivnosti.map(a => a.ID || a.id);
            }
        }

        //isti endpoint kot prej, za izpis aktivnsoti
        const response = await fetch(`http://192.168.0.39:3000/aktivnosti/${sportName}`);
        if (!response.ok) {
            throw new Error("Napaka pri pošiljanju zahtevka");
        }

        const data = await response.json();
        const aktivnosti = data.aktivnosti;
        const container = document.querySelector('.activity-grid');
        container.innerHTML = '';

        const locations = []; //shrani vse lokacije za mapo

        aktivnosti.forEach(aktivnost => {
            const card = document.createElement('div');
            card.classList.add('activity-card');
            card.dataset.id = aktivnost.id;

            const jeOrganizator = prijavljenUporabnikId === aktivnost.FKuporabnik;
            const organizatorTag = jeOrganizator
                ? `<div style="color:red;font-weight:bold;margin-bottom:5px;">Ste organizator</div>`
                : '';

            //to nevem kaj je bom dau vn
            const participantAvatars = aktivnost.udelezenci?.slice(0, 2).map(ime => `<div class="participant-avatar">${ime}</div>`).join('') || '';
            const dodatni = aktivnost.udelezenci?.length > 2 ? `<div class="participant-avatar">+${aktivnost.udelezenci.length - 2}</div>` : '';
            const participantCount = `<span class="participant-count">${aktivnost.udelezenci?.length || 0}/${aktivnost.maxIgralcev}</span>`;
            //

            card.innerHTML = `
            <div class="activity-content">
                <h3 class="activity-title">${aktivnost.tipIgrisca || "Neimenovana aktivnost"}</h3>
                <div class="activity-info">
                    <div class="activity-location">
                        <i class="fas fa-map-marker-alt"></i> ${aktivnost.lokacija || "Neznana lokacija"}
                    </div>
                    <div class="activity-date">
                        <i class="far fa-calendar-alt"></i> ${new Date(aktivnost.datumAktivnosti).toLocaleDateString('sl-SI')} ob ${aktivnost.casAktivnosti}
                    </div>
                </div>
                <p class="activity-description">${aktivnost.opis || "Opis ni na voljo."}</p>
                <div class="activity-meta">
                    <div class="participant-info">
                        <i class="fas fa-users"></i>
                        <span class="participant-count">${aktivnost.minIgralcev || 0}/${aktivnost.maxIgralcev}</span>
                    </div>
                    ${prijavljenUporabnikId === aktivnost.FKuporabnik ? `
                <div class="organizer-label" style="color:red;font-weight:bold;margin-top:5px;">
                    Ste organizator!
                </div>` : ''}
                </div>
                <div class="activity-actions"></div>
            </div>
            `;

            //izbira gumbov "Prijavi se" / "Odjavi se"
            const actionsDiv = card.querySelector('.activity-actions');

            const prijavljenNaAktivnost = prijavljeneAktivnosti.includes(aktivnost.ID || aktivnost.id);
            const btn = document.createElement('button');
            btn.classList.add('btn');

            //spremnijamo vsebino gumba glede na vsebino aktivnosti v tabeli
            if (prijavljenNaAktivnost) {
                btn.classList.add('btn-danger');
                btn.textContent = 'Odjavi se';
                btn.addEventListener('click', (e) => {
                    odjaviSe(aktivnost.ID || aktivnost.id);

                });
            }
            else {
                btn.classList.add('btn-primary');
                btn.textContent = 'Prijavi se';
                btn.addEventListener('click', (e) => {
                    prijaviSe(aktivnost.ID || aktivnost.id);
                });
            }

            actionsDiv.prepend(btn);
             //klik na kartico preusmeri na stran z detajli aktivnosti
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.activity-actions')) {
                    window.location.href = `enaAktivnost.html?id=${aktivnost.ID || aktivnost.id}`;
                }
            });

            card.addEventListener('click', (e) => {
                if (!e.target.closest('.activity-actions')) {
                    const naslov = encodeURIComponent(aktivnost.tipIgrisca || "Neimenovana aktivnost");
                    const opis = encodeURIComponent(aktivnost.opis || "Brez opisa.");
                    const lokacija = encodeURIComponent(aktivnost.lokacija || "Neznana lokacija");

                    const datum = new Date(aktivnost.datumAktivnosti);
                    const ura = aktivnost.casAktivnosti;

                    const [uraH, uraM] = ura.split(':').map(x => parseInt(x));
                    const zacetek = new Date(datum);
                    zacetek.setHours(uraH, uraM);

                    const konec = new Date(zacetek.getTime() + 60 * 60 * 1000); // trajanje 1h

                    // Format za Google Calendar (YYYYMMDDTHHmmssZ)
                    const formatDateTime = d => {
                        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                    };

                    const start = formatDateTime(zacetek);
                    const end = formatDateTime(konec);

                    const calendarURL = `http://calendar.google.com/calendar/render?action=TEMPLATE&text=${naslov}&dates=${start}/${end}&details=${opis}&location=${lokacija}`;

                    window.open(calendarURL, '_blank');
                }
            });
            container.appendChild(card);

            //dodaj lokacijo če obstaja
            if (aktivnost.lokacija && typeof aktivnost.lokacija === 'string') {
                locations.push(aktivnost.lokacija);
            }
        });

        //sortiranje po izbiri
        document.getElementById('sort-select').addEventListener('change', sortActivities);
        sortActivities();

        //klic mape z vsemi lokacijami
        displayMultipleActivitiesMap(locations);

    }
    catch (error) {
        console.error("Napaka:", error);
    }
}

//funkcija za prikaz več lokacij na mapi... 
//OD MIHATA JE V enaAktivnost.js !!!
async function displayMultipleActivitiesMap(locations) {
    if (!Array.isArray(locations) || locations.length === 0) return;

    if (!multiMap) {
        multiMap = L.map('map').setView([0, 0], 2);
        L.tileLayer('http://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
        }).addTo(multiMap);
    }

    locationMarkers.clearLayers();
    const bounds = [];

    for (const location of locations) {
        try {
            const encodedLocation = encodeURIComponent(location);
            const url = `http://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodedLocation}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.length > 0) {
                const { lat, lon } = data[0];
                const marker = L.marker([lat, lon]).bindPopup(`Lokacija: ${location}`);
                locationMarkers.addLayer(marker);
                bounds.push([lat, lon]);
            }
        } catch (error) {
            console.error(`Napaka pri iskanju lokacije "${location}":`, error);
        }
    }

    locationMarkers.addTo(multiMap);
    if (bounds.length > 0) {
        multiMap.fitBounds(bounds);
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

async function prijaviSe(aktivnostId) {
    const prijavljenUporabnik = JSON.parse(sessionStorage.getItem('uporabnik'));
    if (!prijavljenUporabnik) {
        showSuccessMessage("Za prijavo se morate najprej prijaviti!", 'error');
        return;
    }

    try {
        const response = await fetch(`http://192.168.0.39:3000/aktivnost/${aktivnostId}/prijava`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uporabnikId: prijavljenUporabnik.ID })
        });

        if (response.ok) {
            showSuccessMessage('Uspešno prijavljen!', 'success');
            // Ponovno naloži aktivnosti za posodobitev stanja
            const sport = new URLSearchParams(window.location.search).get('sport') || "NI GA";
            vrniAktivnosti(sport);
        } else {
            const error = await response.json();
            showSuccessMessage(error.error || 'Napaka pri prijavi.', 'error');
        }
    } catch (err) {
        showSuccessMessage('Napaka pri prijavi.', 'error');
    }
}

async function odjaviSe(aktivnostId) {
    const prijavljenUporabnik = JSON.parse(sessionStorage.getItem('uporabnik'));
    if (!prijavljenUporabnik) {
        showSuccessMessage("Za odjavo se morate najprej prijaviti!", 'error');
        return;
    }

    try {
        // Najprej pridobimo podrobnosti o aktivnosti
        const aktivnostResp = await fetch(`http://192.168.0.39:3000/aktivnost/${aktivnostId}`);
        if (!aktivnostResp.ok) {
            showSuccessMessage("Napaka pri pridobivanju aktivnosti.", 'error');
            return;
        }

        const aktivnostData = await aktivnostResp.json();
        const organizatorId = aktivnostData.FKuporabnik;

        // Preverimo, če je uporabnik organizator
        if (prijavljenUporabnik.ID === organizatorId) {
            showSuccessMessage("Organizator se ne more odjaviti od svoje aktivnosti. Lahko jo le ureja ali izbriše.", 'error');
            return;
        }

        // Če ni organizator, nadaljuj z odjavo
        const response = await fetch(`http://192.168.0.39:3000/aktivnost/${aktivnostId}/odjava`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uporabnikId: prijavljenUporabnik.ID })
        });

        if (response.ok) {
            showSuccessMessage('Uspešno odjavljen!', 'danger');
            const sport = new URLSearchParams(window.location.search).get('sport') || "NI GA";
            vrniAktivnosti(sport);
        } else {
            const error = await response.json();
            showSuccessMessage(error.error || 'Napaka pri odjavi.', 'error');
        }
    } catch (err) {
        showSuccessMessage('Napaka pri odjavi.', 'error');
    }
}