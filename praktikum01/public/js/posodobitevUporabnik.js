document.getElementById('urediUporabnikaForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    try {
        const obstojecUporabnik = JSON.parse(sessionStorage.getItem('uporabnik'));
        if (!obstojecUporabnik) throw new Error('Uporabnik ni prijavljen.');

        const userId = obstojecUporabnik.ID;

        // tu grem skozi vse uporabnike
        formData.forEach((value, key) => {
    if (!value && key !== "slika" && key !== "geslo") {
        formData.set(key, obstojecUporabnik[key]);
    }
    });

        if (!formData.get('geslo')) {
            formData.delete('geslo');
        }
        if (!formData.get('slika') || formData.get('slika').name === "") {
            formData.delete('slika');
        }

        // updejtani podatki in slika
        const response = await fetch(`http://192.168.0.39:3000/uporabnik/${userId}`, {
            method: 'PUT',
            body: formData
        });

        if (!response.ok) throw new Error('Napaka pri posodobitvi.');

        const fetchUpdated = await fetch(`http://192.168.0.39:3000/uporabnik/${userId}`);
        if (!fetchUpdated.ok) throw new Error('Napaka pri pridobivanju podatkov.');

        const updatedUser = await fetchUpdated.json();

        if (updatedUser.slika && !updatedUser.slika.startsWith('uploads/')) {
            updatedUser.slika = `${updatedUser.slika}`;
        }

        sessionStorage.setItem('uporabnik', JSON.stringify(updatedUser));

        document.getElementById('sporociloShranjeno').style.display = 'block';
        console.log('Uporabnik posodobljen in znova prebran iz baze:', updatedUser);
    } catch (err) {
        console.error(err);
    }
});
