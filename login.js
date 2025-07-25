// login.js
// Eenvoudige loginfunctionaliteit voor de beheeromgeving. De inloggegevens zijn
// hard gecodeerd voor demonstratiedoeleinden. In een productie-omgeving zou
// authenticatie uiteraard op een server moeten plaatsvinden en wachtwoorden
// beveiligd opgeslagen worden.

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    // Stel gebruikersnaam en wachtwoord vast. Deze kunnen naar wens aangepast worden.
    const validUser = 'chef';
    const validPass = 'lekker';
    if (username === validUser && password === validPass) {
      sessionStorage.setItem('loggedIn', 'true');
      // Na succesvol inloggen terug naar beheerpagina
      window.location.href = 'builder.html';
    } else {
      errorEl.style.display = 'block';
    }
  });
});