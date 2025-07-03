document.addEventListener('DOMContentLoaded', function() {
    const authLink = document.getElementById('auth-link');
    const uporabnik = JSON.parse(sessionStorage.getItem('uporabnik'));

    if (uporabnik) {
        // Uporabnik JE prijavljen - prikažemo Odjava
        authLink.textContent = "Odjava";
        authLink.href = "#";
        authLink.onclick = function(e) {
            e.preventDefault();
            sessionStorage.removeItem('uporabnik');
            window.location.href = '/login.html';
        };
    } else {
        // Uporabnik NI prijavljen - prikažemo Prijava/Registracija
        authLink.textContent = "Prijava/Registracija";
        authLink.href = "/login.html";
        authLink.onclick = null;
    }
});
