// ce das const se ti prikaze tocno tam ko je dan marker
var map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// testno da vidim ce dela marker
L.marker([46.5547, 15.6459]).addTo(map)
    .bindPopup('Testna lokacija')
    .openPopup();


        /* document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sport = urlParams.get('sport') || "NI GA"; 

    vrniAktivnosti(sport);
});

async function vrniAktivnosti(sportName) {
    try {
        const response = await fetch(`http://192.168.0.39:3000/aktivnosti/${sportName}`);
        if (!response.ok) {
            throw new Error("Napaka pri pošiljanju zahtevka");
        }

        const data = await response.json();
        const aktivnosti = data.aktivnosti;
        const container = document.querySelector('.activity-grid');
        container.innerHTML = '';

        // Uporabimo prvi prikazani zemljevid
        let mapInitialized = false;
        let map;

        aktivnosti.forEach(async (aktivnost, index) => {
            const card = document.createElement('div');
            card.classList.add('activity-card');
            card.dataset.id = aktivnost.id;

            const participantAvatars = aktivnost.udelezenci?.slice(0, 2).map(ime => `<div class="participant-avatar">${ime}</div>`).join('') || '';
            const dodatni = aktivnost.udelezenci?.length > 2 ? `<div class="participant-avatar">+${aktivnost.udelezenci.length - 2}</div>` : '';
            const participantCount = `<span class="participant-count">${aktivnost.udelezenci?.length || 0}/${aktivnost.maxIgralcev}</span>`;

            card.innerHTML = `
                <div class="activity-image" style="background-image: url('../images/aktivnosti.jpg');"></div>
                <div class="activity-content">
                    <h3 class="activity-title">${aktivnost.tipIgrisca || "Neimenovana aktivnost"}</h3>
                    <div class="activity-location">
                        <i class="fas fa-map-marker-alt"></i> ${aktivnost.lokacija || "Neznana lokacija"}
                    </div>
                    <p class="activity-description">${aktivnost.opis || "Opis ni na voljo."}</p>
                    <div class="activity-meta">
                        <span class="activity-date">
                            <i class="far fa-calendar-alt"></i> ${new Date(aktivnost.datumAktivnosti).toLocaleDateString('sl-SI')} ob ${aktivnost.casAktivnosti}
                        </span>
                        <div class="activity-participants">
                            <div class="participant-avatars">
                                ${participantAvatars}
                                ${dodatni}
                            </div>
                            ${participantCount}
                        </div>
                    </div>
                    <div class="activity-actions">
                        <button class="btn btn-primary prijavi-btn">Prijavi se</button>
                        <button class="btn btn-secondary" title="Komentiraj"><i class="far fa-comment"></i></button>
                        <button class="btn btn-accent" title="Shrani"><i class="far fa-heart"></i></button>
                    </div>
                </div>
            `;
            card.addEventListener('click', () => {
                console.log('Podatki o aktivnosti:', aktivnost);
            });

            container.appendChild(card);

            if (aktivnost.lokacija) {
                const odgovor = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${aktivnost.lokacija}`);
                const odgovor_JSON = await odgovor.json();
                    const lat = odgovor_JSON[0].lat;
                    const lon = odgovor_JSON[0].lon;
                    var map = L.map('map').setView([lat, lon], 17);
                    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
                    L.marker([lat, lon]).addTo(map).bindPopup(aktivnost.lokacija).openPopup();

                    mapInitialized = true;
                }
            });

        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', sortActivities);
            sortActivities();
        }

    } catch (error) {
        console.error("Napaka:", error);
    }
}
*/