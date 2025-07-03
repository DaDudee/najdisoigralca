document.addEventListener('DOMContentLoaded', () => {
    // Hamburger meni
    const hamburger = document.querySelector('.hamburger-menu');
    const navs = document.querySelectorAll('nav.nav');
    const dropdowns = document.querySelectorAll('.dropdown');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navs.forEach(nav => nav.classList.toggle('active'));
        });
    }

    document.addEventListener('click', (event) => {
        const clickedInsideHeader = event.target.closest('header');
        const clickedOnHamburger = event.target.closest('.hamburger-menu');
        const clickedInsideNav = Array.from(navs).some(nav => nav.contains(event.target));

        if (!clickedInsideHeader || (!clickedOnHamburger && !clickedInsideNav)) {
            navs.forEach(nav => nav.classList.remove('active'));
        }
    });

    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('click', e => e.stopPropagation());
    });

    // Carousel
    const carousel = document.querySelector('.carousel');
    const list = carousel?.querySelector('.list');
    const backButton = document.getElementById('back');

    if (carousel && list) {
        ['next', 'prev'].forEach(id => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', () => {
                    const items = carousel.querySelectorAll('.item');
                    carousel.classList.remove('next', 'prev');

                    if (id === 'next') {
                        list.append(items[0]);
                        carousel.classList.add('next');
                    } else {
                        list.prepend(items[items.length - 1]);
                        carousel.classList.add('prev');
                    }

                    button.disabled = true;
                    setTimeout(() => (button.disabled = false), 2000);
                });
            }
        });
    }

    // Scroll arrow functionality
    const scrollArrow = document.querySelector('.scroll-arrow');
    const hiddenSections = document.querySelector('.hidden-sections');
    let isVisible = false;

    scrollArrow.addEventListener('click', function() {
        if (!isVisible) {
            hiddenSections.classList.add('visible');
            scrollArrow.style.transform = 'rotate(180deg)';
            isVisible = true;
            
            // Smooth scroll to the sections
            hiddenSections.scrollIntoView({ behavior: 'smooth' });
        } else {
            hiddenSections.classList.remove('visible');
            scrollArrow.style.transform = 'rotate(0deg)';
            isVisible = false;
            
            // Smooth scroll back to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
});
