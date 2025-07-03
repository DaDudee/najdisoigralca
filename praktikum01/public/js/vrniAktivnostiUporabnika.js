document.addEventListener("DOMContentLoaded", async () => {
    const uporabnik = JSON.parse(sessionStorage.getItem("uporabnik"));
    if (!uporabnik) {
        const container = document.querySelector("#collapsePrijavljene .accordion-body");
        container.innerHTML = "Noben uporabnik ni prijavljen!";
        return;
    }

    try {
        const res = await fetch(`http://192.168.0.39:3000/uporabnik/${uporabnik.ID}/aktivnosti`);
        const data = await res.json();

        const container = document.querySelector("#collapsePrijavljene .accordion-body");
        container.innerHTML = "";

        data.aktivnosti.forEach(akt => {
            const div = document.createElement("div");
            div.classList.add("aktivnost");

            //easy fix da preveris ce je uporabnik organizator... 
            //samo pogledas a je match med FK in uporabnikom... potem display-as glede na to gumba uredu in brisi
            const jeOrganizator = akt.FKuporabnik === uporabnik.ID;

            div.innerHTML = `
        <h3>${akt.sport}</h3>
        <div class="podrobnosti">
            <div><strong>Datum:</strong> ${new Date(akt.datumAktivnosti).toLocaleDateString()}</div>
            <div><strong>Ura:</strong> ${akt.casAktivnosti.slice(0, 5)}</div>
            <div><strong>Lokacija:</strong> ${akt.lokacija}</div>
            <div><strong>Status:</strong> <span class="status potrjen">Potrjeno</span></div>
            <div class="activity-actions">
                ${jeOrganizator ? `
                    <button class="btn btn-primary" title="Uredi">
                        <i class="fas fa-edit"></i> Uredi
                    </button>
                    <button class="btn btn-danger btn-odstrani" data-id="${akt.ID}" title="Odstrani">
                        <i class="fas fa-trash-alt"></i> Odstrani
                    </button>
                ` : ''}
            </div>
            <div class="edit-form mt-3" style="display: none;"></div>
        </div>
    `;

     //redirect
    div.addEventListener('click', (e) => {
        if (!e.target.closest('button') && !e.target.closest('.activity-actions')) {
            window.location.href = `enaAktivnost.html?id=${akt.ID}`;
        }
    });

            container.appendChild(div);
        });


        // --- BRISANJE ---
        container.addEventListener("click", async (e) => {
            if (!e.target.closest(".btn-odstrani")) return;

            const btn = e.target.closest(".btn-odstrani");
            const aktivnostId = btn.getAttribute("data-id");
            const aktivnostDiv = btn.closest(".aktivnost");

            if (!aktivnostDiv) {
                alert("Napaka: ni najden starš z razredom 'aktivnost'");
                return;
            }

            try {
                const delRes = await fetch(`http://192.168.0.39:3000/aktivnosti/${aktivnostId}`, {
                    method: "DELETE"
                });

                if (delRes.ok) {
                    const successMessage = document.getElementById('deleteSuccessToast');
                    successMessage.style.display = 'block';
                    setTimeout(() => {
                        successMessage.style.display = 'none';
                        aktivnostDiv.remove();
                    }, 1500);
                } else {
                    alert("Napaka pri brisanju aktivnosti.");
                }
            } catch (err) {
                console.error("Napaka pri DELETE zahtevku:", err);
                alert("Napaka na strežniku.");
            }
        });

        // --- UREJANJE ---
        container.addEventListener("click", async (e) => {
            if (!e.target.closest(".btn-primary[title='Uredi']")) return;

            const btn = e.target.closest(".btn-primary[title='Uredi']");
            const aktivnostDiv = btn.closest(".aktivnost");
            const id = aktivnostDiv.querySelector(".btn-odstrani").getAttribute("data-id");

            try {
                const res = await fetch(`http://192.168.0.39:3000/aktivnosti/aktivnost/${id}`);
                if (!res.ok) {
                    throw new Error("Napaka pri pridobivanju aktivnosti");
                }
                const akt = await res.json();
                const formContainer = aktivnostDiv.querySelector(".edit-form");

                //ORGANIZATOR SPLOH NI FAKING SMISELEN TUKI AMPKA JE ZE 20 ENDPOINTOV NARJENIH NA TA ATRIBUT IN GA NE NEBOM SPREMINJOU, SAMO RENAME-ou
                formContainer.innerHTML = `
                    <form class="dynamic-edit-form">
                        <input type="hidden" name="id" value="${akt.ID}">
                        <div><label>Trener:</label><input type="text" name="organizator" value="${akt.organizator}" required></div>
                        <div><label>Tip igrišča:</label><input type="text" name="tipIgrisca" value="${akt.tipIgrisca}" required></div>
                        <div><label>Lokacija:</label><input type="text" name="lokacija" value="${akt.lokacija}" required></div>
                        <div><label>Datum:</label><input type="date" name="datumAktivnosti" value="${akt.datumAktivnosti.slice(0, 10)}" required></div>
                        <div><label>Čas:</label><input type="time" name="casAktivnosti" value="${akt.casAktivnosti.slice(0, 5)}" required></div>
                        <div><label>Max igralcev:</label><input type="number" name="maxIgralcev" value="${akt.maxIgralcev}" required></div>
                        <div><label>Opis:</label><textarea name="opis">${akt.opis || ''}</textarea></div>
                        <button type="submit" class="btn btn-success mt-2">Shrani</button>
                        <button type="button" class="btn btn-secondary mt-2 ms-2 btn-preklici">Prekliči</button>
                    </form>
                `;

                formContainer.style.display = "block";
            } catch (err) {
                console.error("Napaka pri urejanju aktivnosti:", err);
                alert("Napaka pri nalaganju aktivnosti.");
            }
        });

        // --- SUBMIT UREJANJA ---
        container.addEventListener("submit", async (e) => {
            if (!e.target.classList.contains("dynamic-edit-form")) return;

            e.preventDefault();
            const form = e.target;
            const data = Object.fromEntries(new FormData(form));
            const id = data.id;

            try {
                const res = await fetch(`http://192.168.0.39:3000/aktivnosti/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        organizator: data.organizator,
                        tipIgrisca: data.tipIgrisca,
                        lokacija: data.lokacija,
                        datumAktivnosti: data.datumAktivnosti,
                        casAktivnosti: data.casAktivnosti,
                        maxIgralcev: parseInt(data.maxIgralcev),
                        opis: data.opis
                    })
                });

                if (res.ok) {
                    const successMessage = document.getElementById('successToast');
                    successMessage.style.display = 'block';
                    setTimeout(() => {
                        successMessage.style.display = 'none';
                        location.reload();
                    }, 1500);
                } else {
                    alert("Napaka pri shranjevanju sprememb.");
                }
            } catch (err) {
                console.error("Napaka pri posodobitvi:", err);
                alert("Napaka na strežniku.");
            }
        });

        // --- PREKLIČI ---
        container.addEventListener("click", (e) => {
            if (e.target.classList.contains("btn-preklici")) {
                const formContainer = e.target.closest(".edit-form");
                formContainer.innerHTML = "";
                formContainer.style.display = "none";
            }
        });

    } catch (error) {
        console.error("Napaka pri nalaganju aktivnosti:", error);
    }
});
