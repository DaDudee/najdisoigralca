document.addEventListener('DOMContentLoaded', function() {
    loadComments();
    document.getElementById('comment-submit').addEventListener('click', addComment);
    
    // Add Enter key functionality
    document.getElementById('comment-input').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addComment();
        }
    });
});

async function loadComments() {
    try {
        const response = await fetch('/indexKomentarji');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const comments = await response.json();
        const commentsList = document.getElementById('comments-list');
        commentsList.innerHTML = '';
        
        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
                <div class="comment-content">
                    <p>${comment.vsebina}</p>
                    <div class="comment-meta">
                        <span class="comment-author">${comment.ime} ${comment.priimek}</span>
                        <span class="comment-date">${formatDate(comment.datumObjave)}</span>
                    </div>
                </div>
            `;
            commentsList.appendChild(commentElement);
        });
        
        document.getElementById('comments-count').textContent = comments.length;
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

async function addComment() {
    const user = JSON.parse(sessionStorage.getItem('uporabnik'));
    if (!user) {
        alert('Za dodajanje komentarja se morate prijaviti!');
        window.location.href = 'login.html';
        return;
    }

    const commentText = document.getElementById('comment-input').value.trim();
    if (!commentText) {
        alert('Prosim vnesite komentar');
        return;
    }

    try {
        const response = await fetch('/indexKomentarji', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                vsebina: commentText,
                FKuporabnik: user.ID
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        document.getElementById('comment-input').value = '';
        loadComments();
    } catch (error) {
        console.error('Error adding comment:', error);
        alert('Prišlo je do napake pri dodajanju komentarja');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('sl-SI', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
} 