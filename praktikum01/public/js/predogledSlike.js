function previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function () {
        const profilePic = document.getElementById('profilePic');
        const defaultIcon = document.getElementById('defaultIcon');

        profilePic.src = reader.result;
        profilePic.classList.remove("d-none");
        if (defaultIcon) defaultIcon.classList.add("d-none");
    };
    reader.readAsDataURL(file);
}