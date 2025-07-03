const uporabnikJSON = sessionStorage.getItem('uporabnik');

if (uporabnikJSON) {
    const uporabnik = JSON.parse(uporabnikJSON);

    const profilePic = document.getElementById("profilePic");
    const defaultIcon = document.getElementById("defaultIcon");

    if (uporabnik.slika) {
        profilePic.src = `/uploads/${uporabnik.slika}`;
        profilePic.classList.remove("d-none");
        defaultIcon.classList.add("d-none");
    }

    document.getElementById('uporabnikPodatki').innerHTML = `
        <h3>${uporabnik.ime} ${uporabnik.priimek}!</h3>
        <p><strong>Email:</strong> ${uporabnik.email}</p>
        <p><strong>Telefonska številka:</strong> ${uporabnik.telefonskaSt}</p>
        <p><strong>Vloga:</strong> ${uporabnik.vloga}</p>
    `;
} else {
    document.getElementById('uporabnikPodatki').innerHTML = `
        <p class="text-danger">Uporabnik ni prijavljen.</p>
    `;
}
