// preverjanje prijavljenega uporabnika
function getLoggedInUser() {
    try {
        console.log('Preverjam sessionStorage...');
        const userData = sessionStorage.getItem('uporabnik');

        // ce uporabnik ni prijavljen, ne more dodajati sportnih aktivnosti
        if (!userData) {
            console.log('Ni podatkov o uporabniku v sessionStorage');
            return null;
        }

        console.log('Podatki iz sessionStorage:', userData);
        const user = JSON.parse(userData);

        if (!user || typeof user !== 'object') {
            console.log('Neveljavni podatki uporabnika');
            return null;
        }

        if (!user.ime || !user.priimek || !user.email) {
            console.log('Manjkajo obvezni podatki uporabnika');
            return null;
        }

        console.log('Uporabnik najden:', user);
        return user;
    } catch (error) {
        console.error('Napaka pri branju uporabnika:', error);
        return null;
    }
}

// prikaz html za dodajanje aktivnosti 
function showAddActivityModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
    <div class="modal-content">
        <span class="close-btn">&times;</span>
        <h2>Dodaj novo aktivnost</h2>
        <form id="add-activity-form">
            <div class="form-group">
                <label for="activity-organizer">Trener (ime in priimek):</label>
                <input type="text" id="activity-organizer" required>
            </div>
            <div class="form-group">
                <label for="activity-type">Vrsta aktivnosti:</label>
                <input type="text" id="activity-type" required>
            </div>
            <div class="form-group">
                <label for="activity-location">Lokacija:</label>
                <input type="text" id="activity-location" required>
            </div>
            <div class="form-group">
                <label for="activity-date">Datum:</label>
                <input type="date" id="activity-date" required>
            </div>
            <div class="form-group">
                <label for="activity-time">Čas:</label>
                <input type="time" id="activity-time" required>
            </div>
            <div class="form-group">
                <label for="activity-max-players">Maksimalno število igralcev:</label>
                <input type="number" id="activity-max-players" min="1" required>
            </div>
            <div class="form-group">
                <label for="activity-description">Opis:</label>
                <textarea id="activity-description" rows="4"></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Dodaj aktivnost</button>
        </form>
    </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.close-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.querySelector('#add-activity-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const user = getLoggedInUser();
        if (!user) {
            alert('Za dodajanje aktivnosti se morate prijaviti!');
            return;
        }

        // preverimo ali je max stevilo igralcev st in ce vec kot 1
        const maxPlayers = parseInt(document.getElementById('activity-max-players').value);
        if (isNaN(maxPlayers) || maxPlayers < 1) {
            alert('Vnesite veljavno število igralcev!');
            return;
        }

        const activityData = {
            organizator: document.getElementById('activity-organizer').value.trim(),
            tipIgrisca: document.getElementById('activity-type').value.trim(),
            lokacija: document.getElementById('activity-location').value.trim(),
            datumAktivnosti: document.getElementById('activity-date').value,
            casAktivnosti: document.getElementById('activity-time').value,
            maxIgralcev: maxPlayers,
            opis: document.getElementById('activity-description').value.trim(),
            sport: new URLSearchParams(window.location.search).get('sport'),
            FKuporabnik: user.ID
        };

        try {
            console.log('Pošiljam podatke:', activityData);

            const response = await fetch('http://192.168.0.39:3000/aktivnosti', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(activityData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Napaka strežnika:', errorData);
                throw new Error(errorData?.message || `Napaka strežnika: ${response.status}`);
            }

            const result = await response.json();
            console.log('Odgovor strežnika:', result);

            showSuccessMessage('Aktivnost uspešno dodana!', 'success');
            document.body.removeChild(modal);

            // osvežimo seznam aktivnosti
            const urlParams = new URLSearchParams(window.location.search);
            const sport = urlParams.get('sport') || "NI GA";
            vrniAktivnosti(sport);

        } 
        catch (error) {
            console.error('Napaka:', error);
            showSuccessMessage(`Prišlo je do napake: ${error.message}`, 'error');
        }
    });
}

// gumb za dodajanje aktivnosti
document.querySelector('.floating-btn').addEventListener('click', function () {
    const user = getLoggedInUser();
    if (user) {
        showAddActivityModal();
    } 
    else {
        showSuccessMessage('Za dodajanje aktivnosti se morate prijaviti!', 'error');
        // preusmeritev na prijavo, če ni prijavljen
        window.location.href = '/login.html';
    }
});

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
            loadActivities();
        } else {
            const error = await response.json();
            showSuccessMessage(error.error || 'Napaka pri prijavi.', 'error');
        }
    } catch (err) {
        showSuccessMessage('Napaka pri prijavi.', 'error');
    }
}

async function odjaviSe(aktivnostId) {
    try {
        const response = await fetch(`http://192.168.0.39:3000/aktivnost/${aktivnostId}/odjava`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        if (response.ok) {
            showSuccessMessage('Uspešno odjavljen!', 'danger');
            // Ponovno naloži aktivnosti za posodobitev stanja
            loadActivities();
        } else {
            const error = await response.json();
            showSuccessMessage(error.error || 'Napaka pri odjavi.', 'error');
        }
    } catch (err) {
        showSuccessMessage('Napaka pri odjavi.', 'error');
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