function parseDate(dateText) {
    // Podatki se pridobijo tako da se locijo stevila glede na dolocen pogoj
    const parts = dateText.trim().split(" ob ");
    const dateParts = parts[0].trim().split(".");
    const timeParts = parts[1]?.trim().split(":") || ["00", "00", "00"];

    const day = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; 
    const year = parseInt(dateParts[2]);

    const hour = parseInt(timeParts[0]);
    const minute = parseInt(timeParts[1]);

    return new Date(year, month, day, hour, minute);
}


function sortActivities() {
    const container = document.querySelector('.activity-grid');
    const cards = Array.from(container.querySelectorAll('.activity-card'));
    const sortBy = document.getElementById('sort-select')?.value;

    if (!sortBy || sortBy === 'none') return;

    cards.sort((a, b) => {
        // prebere se ko tekst
        const aDateText = a.querySelector('.activity-date')?.innerText || '';
        const bDateText = b.querySelector('.activity-date')?.innerText || '';
        const aDate = parseDate(aDateText);
        const bDate = parseDate(bDateText);

        // Prebere se stevilo prijavlenih 
        const aCount = parseInt(a.querySelector('.participant-count')?.innerText.split("/")[0] || "0");
        const bCount = parseInt(b.querySelector('.participant-count')?.innerText.split("/")[0] || "0");

        switch (sortBy) {
            case 'date-asc':
                return aDate - bDate;
            case 'date-desc':
                return bDate - aDate;
            case 'participants-asc':
                return aCount - bCount;
            case 'participants-desc':
                return bCount - aCount;
            default:
                return 0;
        }
    });

    cards.forEach(card => container.appendChild(card));
}
