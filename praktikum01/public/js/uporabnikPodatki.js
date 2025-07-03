const userId = window.location.pathname.split('/')[2];
// ker mam v url api
fetch(`/api/uporabnik/${userId}`)
    .then(res => res.json())
    .then(data => {
      const uporabnik = document.getElementById('uporabnik');
      uporabnik.innerHTML = `
        <div class="card p-3 shadow">
          <p><strong>Ime:</strong> ${data.ime} ${data.priimek}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Vloga:</strong> ${data.vloga}</p>
        </div>
      `;
      const organizirane = document.getElementById('organizirane');
      const prijavljene = document.getElementById('prijavljene');
      const ustvariKartico = (a) => `
        <div class="col">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">${a.tipIgrisca}</h5>
              <h6 class="card-subtitle mb-2 text-muted">${a.lokacija}</h6>
              <p class="card-text">${new Date(a.datumAktivnosti).toLocaleDateString()} ob ${a.casAktivnosti}</p>
              <p class="card-text">${a.opis}</p>
            </div>
          </div>
        </div>
      `;

    if (data.organiziraneAktivnosti.length === 0) {
      organizirane.innerHTML = "<p class='text-muted'>Ni organiziranih aktivnosti.</p>";
    } 
    else {
      data.organiziraneAktivnosti.forEach(a => {
        organizirane.innerHTML += ustvariKartico(a);
      });
    }
    if (data.prijavljeneAktivnosti.length === 0) {
      prijavljene.innerHTML = "<p class='text-muted'>Ni prijavljenih aktivnosti.</p>";
    } 
    else {
      data.prijavljeneAktivnosti.forEach(a => {
        prijavljene.innerHTML += ustvariKartico(a);
      });
    }
  })
    // tu sn sao preverjo ker me je id zajebavo
    .catch(err => {
      document.body.innerHTML = "<p class='text-danger text-center mt-5'>Napaka pri nalaganju podatkov.</p>";
      console.error(err);
    });