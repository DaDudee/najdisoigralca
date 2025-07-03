function filterByDateRange() {
    const startInput = document.getElementById('start-date').value;
    const endInput = document.getElementById('end-date').value;

    // spremeni se v objekt pol pa prebere in izpise glede na izbiro
    const startDate = startInput ? new Date(startInput) : null;
    const endDate = endInput ? new Date(endInput) : null;

    const cards = document.querySelectorAll('.activity-card');

    cards.forEach(card => {
        const dateText = card.querySelector('.activity-date')?.innerText || '';
        const activityDate = parseDate(dateText);

        let show = true;

        if (startDate && activityDate < startDate) {
            show = false;
        }

        if (endDate) {
            // 1 dan sn addal da se je izpisalo tudi za izbran datum
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            if (activityDate > endOfDay) {
                show = false;
            }
        }

        card.style.display = show ? 'block' : 'none';
    });
}
