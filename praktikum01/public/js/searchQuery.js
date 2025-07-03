function searchSport() {
    const input = document.getElementById('search-input').value.toLowerCase();
    const cards = document.querySelectorAll('.activity-card');

    cards.forEach(card => {
        const title = card.querySelector('.activity-title').textContent.toLowerCase();
        const description = card.querySelector('.activity-description').textContent.toLowerCase();

        if (title.includes(input) || description.includes(input)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}