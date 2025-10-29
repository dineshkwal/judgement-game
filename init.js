/* ---------- INITIALIZATION ---------- */
const suits = ['♠','♥','♣','♦'];

// Avatar preview on registration screen
document.getElementById('avatarSelect')?.addEventListener('change', function(){
  const val = this.value;
  const preview = document.getElementById('avatarPreview');
  if(val && preview){
    preview.src = val;
    preview.style.display = 'block';
  }
});

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
  showScreen('register');
});
