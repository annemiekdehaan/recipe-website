// builder.js
// Dit script beheert het toevoegen, bewerken en verwijderen van recepten via de builderpagina.

document.addEventListener('DOMContentLoaded', () => {
  // Verifieer of de gebruiker is ingelogd voordat de beheerpagina wordt geladen. Als
  // er geen geldige sessie is, ga naar de loginpagina. Er wordt gebruikgemaakt van
  // sessionStorage zodat de login alleen voor de huidige browsersessie geldt.
  if (sessionStorage.getItem('loggedIn') !== 'true') {
    window.location.href = 'login.html';
    return;
  }
  const form = document.getElementById('recipe-form');
  const titleInput = document.getElementById('title');
  const descInput = document.getElementById('description');
  const ingredientsInput = document.getElementById('ingredients');
  // Nieuw veld voor kruiden/specerijen
  const herbsInput = document.getElementById('herbs');
  // Het instructiesveld is verwijderd; we vervangen dit door een tagsveld voor labels
  const tagsInput = document.getElementById('tags');
  const imageInput = document.getElementById('image');
  const imagePreview = document.getElementById('image-preview');
  const saveButton = document.getElementById('save-button');
  const cancelButton = document.getElementById('cancel-edit');
  const tableBody = document.querySelector('#recipes-table tbody');
  let editingId = null;
  let imageData = null;

  // Haal alle recepten op uit localStorage en vul de tabel.
  function loadRecipes() {
    const recipes = JSON.parse(localStorage.getItem('recipes')) || [];
    tableBody.innerHTML = '';
    if (recipes.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 2;
      td.textContent = 'Nog geen recepten toegevoegd.';
      td.style.textAlign = 'center';
      tr.appendChild(td);
      tableBody.appendChild(tr);
      return;
    }
    recipes.forEach((recipe) => {
      const tr = document.createElement('tr');
      const tdTitle = document.createElement('td');
      tdTitle.textContent = recipe.title;
      const tdActions = document.createElement('td');
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Bewerken';
      editBtn.className = 'edit-btn';
      editBtn.addEventListener('click', () => startEdit(recipe.id));
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Verwijderen';
      deleteBtn.className = 'delete-btn';
      deleteBtn.addEventListener('click', () => deleteRecipe(recipe.id));
      tdActions.append(editBtn, deleteBtn);
      tr.append(tdTitle, tdActions);
      tableBody.appendChild(tr);
    });
  }

  // Start met bewerken van een bestaand recept. Vul het formulier met bestaande waarden.
  function startEdit(id) {
    const recipes = JSON.parse(localStorage.getItem('recipes')) || [];
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) return;
    editingId = id;
    document.getElementById('form-title').textContent = 'Recept bewerken';
    saveButton.textContent = 'Bijwerken';
    cancelButton.style.display = 'inline-block';
    titleInput.value = recipe.title;
    descInput.value = recipe.description || '';
    ingredientsInput.value = recipe.ingredients || '';
    herbsInput.value = recipe.herbs || '';
    // Vul tags in als deze aanwezig zijn
    tagsInput.value = (recipe.tags && Array.isArray(recipe.tags)) ? recipe.tags.join(', ') : '';
    if (recipe.image) {
      imageData = recipe.image;
      imagePreview.src = recipe.image;
      imagePreview.style.display = 'block';
    } else {
      imageData = null;
      imagePreview.style.display = 'none';
    }
    // Zorg dat de gebruiker meteen naar boven scrollt zodat het formulier zichtbaar is.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Reset het formulier naar de standaardstatus voor het toevoegen van een nieuw recept.
  function resetForm() {
    editingId = null;
    document.getElementById('form-title').textContent = 'Nieuw recept';
    saveButton.textContent = 'Opslaan';
    cancelButton.style.display = 'none';
    form.reset();
    imageData = null;
    imagePreview.style.display = 'none';
    // Wis het kruidenveld expliciet omdat form.reset() mogelijk niet werkt in sommige browsers
    if (herbsInput) herbsInput.value = '';
  }

  // Eventlistener om het bewerken te annuleren en het formulier te resetten.
  cancelButton.addEventListener('click', () => {
    resetForm();
  });

  // Lees de geselecteerde afbeelding en toon een preview. Sla het resultaat (dataURI) op in imageData.
  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) {
      imageData = null;
      imagePreview.style.display = 'none';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      imageData = e.target.result;
      imagePreview.src = imageData;
      imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  // Verwerk het indienen van het formulier, sla nieuw recept op of update bestaand recept.
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title) {
      alert('Titel is verplicht.');
      return;
    }
    const description = descInput.value.trim();
    const ingredients = ingredientsInput.value.trim();
    const herbs = herbsInput.value.trim();
    // Lees tags uit het veld en zet om naar een array (split op komma's).
    let tags = tagsInput.value
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);

    // Genereer automatische labels op basis van trefwoorden in titel, beschrijving,
    // ingrediënten en kruiden. Deze eenvoudige heuristiek voegt relevante
    // labels toe zonder dat de gebruiker dit handmatig hoeft te doen.
    const combinedText = `${title} ${description} ${ingredients} ${herbs}`.toLowerCase();
    const keywordMappings = [
      { keywords: ['curry', 'tikka', 'masala'], labels: ['Curry', 'Indiaas'] },
      { keywords: ['stamppot'], labels: ['Comfortfood', 'Hollands'] },
      { keywords: ['salade', 'salad'], labels: ['Gezond', 'Salade'] },
      { keywords: ['pasta'], labels: ['Pasta', 'Italiaans'] },
      { keywords: ['soep'], labels: ['Soep', 'Comfortfood'] },
      { keywords: ['wrap'], labels: ['Snel', 'Lunch'] },
      { keywords: ['smoothie'], labels: ['Gezond', 'Drankje'] },
      { keywords: ['pizza'], labels: ['Pizza', 'Italiaans'] },
      { keywords: ['rijst'], labels: ['Aziatisch'] }
    ];
    keywordMappings.forEach((mapping) => {
      if (mapping.keywords.some((kw) => combinedText.includes(kw))) {
        mapping.labels.forEach((lbl) => {
          if (!tags.includes(lbl)) {
            tags.push(lbl);
          }
        });
      }
    });
    let recipes = JSON.parse(localStorage.getItem('recipes')) || [];
    if (editingId) {
      recipes = recipes.map((r) => {
        if (r.id === editingId) {
          return {
            ...r,
            title,
            description,
            ingredients,
            herbs,
            tags,
            image: imageData || null,
          };
        }
        return r;
      });
    } else {
      const newRecipe = {
        id: Date.now().toString(),
        title,
        description,
        ingredients,
        herbs,
        tags,
        image: imageData || null,
        // Initialize ratings array for nieuwe recepten zodat gebruikers kunnen beoordelen
        ratings: [],
      };
      recipes.push(newRecipe);
    }
    localStorage.setItem('recipes', JSON.stringify(recipes));
    loadRecipes();
    resetForm();
  });

  // Verwijder een recept na bevestiging.
  function deleteRecipe(id) {
    if (!confirm('Weet je zeker dat je dit recept wilt verwijderen?')) return;
    let recipes = JSON.parse(localStorage.getItem('recipes')) || [];
    recipes = recipes.filter((r) => r.id !== id);
    localStorage.setItem('recipes', JSON.stringify(recipes));
    loadRecipes();
    // Als het recept dat verwijderd werd toevallig werd bewerkt, reset het formulier.
    if (editingId === id) {
      resetForm();
    }
  }

  // Stel functies beschikbaar in de globale scope zodat knoppen in dynamisch toegevoegde elementen ze kunnen aanroepen (niet strikt noodzakelijk, maar handig bij debugging).
  window.deleteRecipe = deleteRecipe;
  window.startEdit = startEdit;

  // Laad recepten zodra de pagina is geladen.
  loadRecipes();

  // Laad ook de maaltijdaanvragen en toon deze in een tabel.
  loadRequests();

  /**
   * Laad alle maaltijdaanvragen uit localStorage en geef ze weer in een tabel. Voor elke aanvraag
   * wordt het gekozen recept (indien van toepassing) vertaald naar een titel. Beheerders kunnen
   * aanvragen als afgehandeld markeren, waarna ze uit het overzicht verdwijnen.
   */
  function loadRequests() {
    const requests = JSON.parse(localStorage.getItem('requests')) || [];
    const requestsTableBody = document.querySelector('#requests-table tbody');
    if (!requestsTableBody) return;
    requestsTableBody.innerHTML = '';
    if (requests.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 4;
      td.textContent = 'Geen aanvragen beschikbaar.';
      td.style.textAlign = 'center';
      tr.appendChild(td);
      requestsTableBody.appendChild(tr);
      return;
    }
    // Haal recepten op om id's om te zetten naar titels
    const recipes = JSON.parse(localStorage.getItem('recipes')) || [];
    requests.forEach((req) => {
      const tr = document.createElement('tr');
      // Naam
      const tdName = document.createElement('td');
      tdName.textContent = req.name;
      // E-mail
      const tdEmail = document.createElement('td');
      tdEmail.textContent = req.email;
      // Gerecht of suggestie
      const tdRecipe = document.createElement('td');
      let text = '';
      if (req.recipeId) {
        const found = recipes.find((r) => r.id === req.recipeId);
        text = found ? found.title : 'Onbekend recept';
      } else {
        text = req.suggestion || 'Geen suggestie';
      }
      tdRecipe.textContent = text;
      // Acties
      const tdActions = document.createElement('td');
      const doneBtn = document.createElement('button');
      doneBtn.textContent = 'Afgerond';
      doneBtn.className = 'edit-btn';
      doneBtn.addEventListener('click', () => completeRequest(req.id));
      tdActions.appendChild(doneBtn);
      tr.append(tdName, tdEmail, tdRecipe, tdActions);
      requestsTableBody.appendChild(tr);
    });
  }

  /**
   * Verwijder een aanvraag uit localStorage wanneer deze is afgehandeld en werk het overzicht bij.
   * @param {string} requestId Het ID van de aanvraag die verwijderd moet worden.
   */
  function completeRequest(requestId) {
    let requests = JSON.parse(localStorage.getItem('requests')) || [];
    requests = requests.filter((req) => req.id !== requestId);
    localStorage.setItem('requests', JSON.stringify(requests));
    loadRequests();
  }
});