// konfiguracija
const SESSION_TIMEOUT = 120 * 60 * 1000; // 120 minut   
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minut
let inactivityTimer;

// odjava
async function logout() {
    try {
        await fetch('/logout', { method: 'POST' });
    } catch (error) {
        console.error('Napaka pri strežniški odjavi:', error);
    } finally {
        sessionStorage.removeItem('uporabnik');
        updateAuthLink();
        window.location.href = 'login.html';
    }
}

// avtomatska odjava ob neaktivnosti
function logoutDueToInactivity() {
    sessionStorage.removeItem('uporabnik');
    updateAuthLink();
    window.location.href = 'login.html?timeout=1';
}

// upravljanje neaktivnosti
function setupInactivityTimer() {
    function resetTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(logoutDueToInactivity, SESSION_TIMEOUT);
    }

    ['mousemove', 'keydown', 'click', 'scroll'].forEach(event => {
        window.addEventListener(event, resetTimer);
    });

    resetTimer();
}

// preverjanje seje s strežnikom
async function checkSession() {
    try {
        const response = await fetch('/check-session');
        const data = await response.json();
        if (!data.valid) {
            logoutDueToInactivity();
        }
    } catch (error) {
        console.error('Napaka pri preverjanju seje:', error);
    }
}

// menjavanje linka prijava/odjava
function updateAuthLink() {
    const authLink = document.getElementById('auth-link');
    const uporabnik = JSON.parse(sessionStorage.getItem('uporabnik'));

    if (authLink) {
        if (uporabnik) {
            authLink.textContent = "Odjava";
            authLink.href = "#";
            authLink.onclick = function(e) {
                e.preventDefault();
                logout();
            };
        } else {
            authLink.textContent = "Prijava/Registracija";
            authLink.href = "login.html";
            authLink.onclick = null;
        }
    }
}

// inicializacija
function initSessionManagement() {
    if (!window.location.pathname.includes('login.html')) {
        // Preveri ali je uporabnik prijavljen
        if (!sessionStorage.getItem('uporabnik')) {
            window.location.href = 'login.html';
            return;
        }
        setupInactivityTimer();
        
        setInterval(checkSession, SESSION_CHECK_INTERVAL);
        
        updateAuthLink();
        
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('timeout')) {
            alert('Vaša seja je potekla zaradi neaktivnosti. Prosimo, prijavite se znova.');
        }
    }
}

document.addEventListener('DOMContentLoaded', initSessionManagement);