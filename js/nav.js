const hamburger = document.getElementById('hamburger');
const dropdown = document.getElementById('nav-dropdown');

if (hamburger && dropdown) {
  hamburger.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', () => dropdown.classList.remove('open'));
}
