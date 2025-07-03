// DOM elements
const floatingSearchBtn = document.getElementById('floating-search-btn');
const searchOverlay = document.getElementById('search-overlay');
const closeSearchBtn = document.getElementById('close-search-btn');
const searchForm = document.getElementById('user-search-form');
const searchInput = document.getElementById('username-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const userResults = document.getElementById('user-results');

// Toggle search overlay
floatingSearchBtn.addEventListener('click', () => {
  searchOverlay.classList.add('active');
  searchInput.focus();
});

closeSearchBtn.addEventListener('click', () => {
  searchOverlay.classList.remove('active');
});

// Clear search input
clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  clearSearchBtn.classList.remove('visible');
  userResults.innerHTML = '';
});

searchInput.addEventListener('input', (e) => {
  clearSearchBtn.classList.toggle('visible', e.target.value.length > 0);
});

// Search functionality
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const searchTerm = searchInput.value.trim();
  
  if (searchTerm.length === 0) {
    return;
  }
  
  searchUsers(searchTerm);
});

// Debounce search function
let searchTimeout;
searchInput.addEventListener('input', (e) => {
  const searchTerm = e.target.value.trim();
  
  clearTimeout(searchTimeout);
  
  if (searchTerm.length === 0) {
    userResults.innerHTML = '';
    return;
  }
  
  searchTimeout = setTimeout(() => {
    searchUsers(searchTerm);
  }, 300);
});

//išče glede na to kar hocem v server.js
async function searchUsers(searchTerm) {
  try {
    const res = await fetch(`/uporabnikiIskanje?iskanje=${encodeURIComponent(searchTerm)}`);
    if (!res.ok) throw new Error("Napaka pri iskanju");

    const users = await res.json();
    displayUsers(users);
  } catch (err) {
    console.error("Napaka pri iskanju uporabnikov:", err);
    userResults.innerHTML = '<div class="no-results">Napaka pri iskanju uporabnikov.</div>';
  }
}


function displayUsers(users) {
  if (users.length === 0) {
    userResults.innerHTML = '<div class="no-results">Ni najdenih uporabnikov</div>';
    return;
  }

  userResults.innerHTML = users.map(user => {
    const profilnaSlika = user.slika ? `<img src="/uploads/${user.slika}" alt="Profilna slika" class="user-avatar-img">`
    : `<div class="default-icon user-avatar-img"></div>`; 
    return `
      <a href="/uporabnik/${user.id}/podatkiStran" class="user-card-link">
        <div class="user-card">
          <div class="user-avatar">
            ${profilnaSlika}
          </div>
          <div class="user-info">
            <h4 class="user-name">${user.name}</h4>
            <p class="user-username">@${user.username}</p>
            <div class="user-stats">
              <span>${user.organizedEvents} organiziranih</span>
              <span>${user.attendedEvents} udeležb</span>
              <span>${user.canceledEvents} odjav</span>
            </div>
          </div>
        </div>
      </a>
    `;
  }).join('');
}
