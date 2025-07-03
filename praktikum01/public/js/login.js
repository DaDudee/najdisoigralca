// prijava
async function login(event) {
    event.preventDefault(); 

    const formData = new FormData(document.getElementById('loginForm'));
    const email = formData.get('email');
    const geslo = formData.get('geslo');
    
    try {
        const odgovor = await fetch('/login', { 
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, geslo })
        });

        if (odgovor.ok) {
            const uporabnik = await odgovor.json();
            
            // Shranimo uporabnika v session storage
            sessionStorage.setItem('uporabnik', JSON.stringify(uporabnik));
            
            window.location.href = 'index.html';
        } else {
            const napaka = await odgovor.json();
            const napakaElement = document.getElementById('napaka');
            napakaElement.innerText = napaka.error || 'Napaka pri prijavi';
            napakaElement.style.display = 'block'; // prikažemo napako
        }
    } catch (error) {
        console.error("Napaka pri prijavi:", error);
        const napakaElement = document.getElementById('napaka');
        napakaElement.innerText = 'Napaka pri prijavi.';
        napakaElement.style.display = 'block'; // prikažemo napako
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('timeout')) {
        alert('Vaša seja je potekla zaradi neaktivnosti. Prosimo, prijavite se znova.');
    }
});