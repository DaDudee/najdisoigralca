// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    let feedback = [];

    // Length check
    if (password.length >= 8) {
        strength += 25;
    } else {
        feedback.push("Geslo mora vsebovati vsaj 8 znakov");
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
        strength += 25;
    } else {
        feedback.push("Dodajte vsaj eno veliko črko");
    }

    // Number check
    if (/[0-9]/.test(password)) {
        strength += 25;
    } else {
        feedback.push("Dodajte vsaj eno številko");
    }

    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) {
        strength += 25;
    } else {
        feedback.push("Dodajte vsaj en poseben znak");
    }

    // Update UI
    const strengthBar = document.getElementById('password-strength-bar');
    const strengthText = document.getElementById('password-strength-text');

    strengthBar.style.width = strength + '%';

    // Set color based on strength
    if (strength <= 25) {
        strengthBar.className = 'progress-bar bg-danger';
        strengthText.textContent = 'Šibko geslo';
    } else if (strength <= 50) {
        strengthBar.className = 'progress-bar bg-warning';
        strengthText.textContent = 'Srednje geslo';
    } else if (strength <= 75) {
        strengthBar.className = 'progress-bar bg-info';
        strengthText.textContent = 'Dobro geslo';
    } else {
        strengthBar.className = 'progress-bar bg-success';
        strengthText.textContent = 'Zelo močno geslo';
    }

    // Add feedback if password is not strong enough
    if (strength < 100) {
        strengthText.textContent += ': ' + feedback.join(', ');
    }

    return strength;
}

// Add event listener for password input
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            checkPasswordStrength(this.value);
        });
    }
});

async function register(event) {
    event.preventDefault();

    // Grab input values
    const ime = document.getElementById('name').value.trim();
    const priimek = document.getElementById('surname').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefon = document.getElementById('phone').value.trim();
    const geslo = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const termsChecked = document.getElementById('terms').checked;

    // Clear previous errors
    const napakaElement = document.getElementById('napaka');
    napakaElement.classList.add('d-none');

    // Client-side validation
    if (!termsChecked) {
        showError('Za registracijo morate sprejeti pogoje uporabe.');
        return;
    }

    if (geslo !== confirmPassword) {
        showError('Gesli se ne ujemata.');
        return;
    }

    // Check password strength
    const passwordStrength = checkPasswordStrength(geslo);
    if (passwordStrength < 75) {
        showError('Geslo mora biti vsaj "dobro" (vsebovati vsaj 8 znakov, veliko črko, številko in poseben znak).');
        return;
    }

    try {
        const odgovor = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ime,
                priimek,
                email,
                telefon,
                geslo,
                confirmPassword: geslo // Send again for server validation
            })
        });

        const data = await odgovor.json();

        if (odgovor.ok) {
            showSuccessMessage('Registracija uspešna!', 'success');
            window.location.href = 'login.html';
        } else {
            showError(data.error || 'Napaka pri registraciji');
        }
    } catch (error) {
        console.error('Napaka pri registraciji:', error);
        showError('Napaka pri povezavi s strežnikom');
    }
}

function showError(msg) {
    const napakaElement = document.getElementById('napaka');
    napakaElement.textContent = msg;
    napakaElement.classList.remove('d-none');
    // Scroll to error message
    napakaElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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