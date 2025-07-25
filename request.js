// request.js
// Hiermee kunnen collega's of bezoekers een maaltijd aanvragen. Ze kunnen een bestaand recept
// selecteren of een eigen suggestie doen. De aanvragen worden opgeslagen in localStorage
// zodat de chef ze kan inzien via de beheerpagina.

document.addEventListener('DOMContentLoaded', () => {
  const recipeSelect = document.getElementById('req-recipe');
  const suggestionGroup = document.getElementById('suggestion-group');
  const suggestionTextarea = document.getElementById('req-suggestion');
  const successMessage = document.getElementById('request-success');
  const form = document.getElementById('request-form');

  // Voor het aanvragen van een volledig nieuw gerecht gebruiken we een speciale waarde
  const NEW_RECIPE_VALUE = 'nieuw';

  // Laad bestaande recepten en vul het select-element
  function loadRecipeOptions() {
    const recipes = JSON.parse(localStorage.getItem('recipes')) || [];
    // Voeg een optie toe waarmee de gebruiker een eigen suggestie kan doen
    const defaultOption = document.createElement('option');
    defaultOption.value = NEW_RECIPE_VALUE;
    defaultOption.textContent = 'Anders / Eigen suggestie';
    recipeSelect.appendChild(defaultOption);
    // Voeg elke bestaande recepttitel toe als optie
    recipes.forEach((recipe) => {
      const opt = document.createElement('option');
      opt.value = recipe.id;
      opt.textContent = recipe.title;
      recipeSelect.appendChild(opt);
    });
  }

  // Toon of verberg het veld voor een eigen suggestie op basis van de selectie
  recipeSelect.addEventListener('change', () => {
    if (recipeSelect.value === NEW_RECIPE_VALUE) {
      suggestionGroup.style.display = 'block';
      suggestionTextarea.setAttribute('required', 'true');
    } else {
      suggestionGroup.style.display = 'none';
      suggestionTextarea.removeAttribute('required');
    }
  });

  // Verwerk het versturen van de aanvraag en sla deze op
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('req-name').value.trim();
    const email = document.getElementById('req-email').value.trim();
    const selected = recipeSelect.value;
    let suggestion = '';
    let recipeId = null;
    if (selected === NEW_RECIPE_VALUE) {
      suggestion = suggestionTextarea.value.trim();
    } else {
      recipeId = selected;
    }
    // Stel de aanvraag samen
    const newRequest = {
      id: Date.now().toString(),
      name,
      email,
      recipeId,
      suggestion,
      createdAt: new Date().toISOString(),
    };
    // Lees bestaande aanvragen uit localStorage
    const requests = JSON.parse(localStorage.getItem('requests')) || [];
    requests.push(newRequest);
    localStorage.setItem('requests', JSON.stringify(requests));
    // Toon succesmelding en reset het formulier
    form.reset();
    suggestionGroup.style.display = 'none';
    suggestionTextarea.removeAttribute('required');
    successMessage.style.display = 'block';
    // Verberg het formulier zodat gebruikers niet per ongeluk nogmaals versturen
    form.style.display = 'none';
  });

  // Laad opties bij het initialiseren
  loadRecipeOptions();
});