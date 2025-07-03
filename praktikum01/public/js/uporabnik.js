function previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        alert('Prosimo, izberite slikovno datoteko (JPEG, PNG, etc.)');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onloadstart = function() {
        // Show loading state if needed
    };
    
    reader.onload = function(e) {
        const preview = document.getElementById('profilePic');
        const defaultIcon = document.getElementById('defaultIcon');
        
        preview.src = e.target.result;
        preview.classList.remove('d-none');
        defaultIcon.classList.add('d-none');
    };
    
    reader.onerror = function() {
        alert('Napaka pri branju datoteke. Poskusite znova.');
    };
    
    reader.readAsDataURL(file);
}
