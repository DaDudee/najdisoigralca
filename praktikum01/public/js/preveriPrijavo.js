function prikaziObvestilo(sporocilo) {
    alert(sporocilo);
}
const uporabnik = JSON.parse(sessionStorage.getItem("uporabnik"));

if (!uporabnik || !uporabnik.ID) {
    prikaziObvestilo("Uporabnik ni prijavljen.");
    window.location.href = "index.html";
}
