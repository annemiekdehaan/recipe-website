// script.js
// Dit script verzorgt het laden en tonen van recepten op de index- en detailspagina's.

// Zodra het document geladen is, wordt bepaald op welke pagina de gebruiker zich bevindt
// door te controleren of bepaalde elementen aanwezig zijn. Vervolgens wordt de juiste
// functie aangeroepen om de recepten in te laden.
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('recipes-container')) {
    loadIndex();
  }
  if (document.getElementById('details-title')) {
    loadDetails();
  }
  // Als er een lijst voor komende maaltijden op de homepagina aanwezig is,
  // laad deze in en stel een scrolllistener in voor het vergroten van het
  // item dat het dichtst bij het midden staat.
  if (document.getElementById('home-upcoming-list')) {
    renderHomeUpcoming();
    const upcomingListEl = document.getElementById('home-upcoming-list');
    upcomingListEl.addEventListener('scroll', () => {
      updateActiveHomeItem();
    });
  }
});

// Haal recepten op uit localStorage. Als er nog niets is opgeslagen, geef een lege array terug.
function getRecipes() {
  const data = localStorage.getItem('recipes');
  try {
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Fout bij het parsen van recepten:', err);
    return [];
  }
}

// -------------------------------
// Komende maaltijden voor homepagina
// Deze helpers tonen een lijst met geplande maaltijden op de indexpagina.
// Ze lijken op de implementatie in upcoming.js maar zijn hier geïntegreerd
// zodat we geen extra script hoeven in te laden.
function loadScheduleHome() {
  const raw = JSON.parse(localStorage.getItem('schedule')) || {};
  const normalized = {};
  Object.keys(raw).forEach((date) => {
    const val = raw[date];
    if (val && typeof val === 'object') {
      normalized[date] = val;
    } else if (typeof val === 'string') {
      normalized[date] = { id: val };
    }
  });
  return normalized;
}

function renderHomeUpcoming() {
  const listEl = document.getElementById('home-upcoming-list');
  if (!listEl) return;
  const schedule = loadScheduleHome();
  const allRecipes = getRecipes();
  const entries = [];
  const today = new Date();
  Object.keys(schedule).forEach((dateStr) => {
    const entry = schedule[dateStr];
    const dateObj = new Date(dateStr);
    // alleen toekomstige of huidige data weergeven
    if (!isNaN(dateObj) && dateObj >= new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      let title = '';
      if (entry.id) {
        const rec = allRecipes.find((r) => r.id === entry.id);
        title = rec ? rec.title : '';
      } else if (entry.name) {
        title = entry.name;
      } else if (entry.unknown) {
        title = 'Onbekend';
      }
      entries.push({ date: dateObj, title });
    }
  });
  entries.sort((a, b) => a.date - b.date);
  listEl.innerHTML = '';
  if (entries.length === 0) {
    listEl.innerHTML = '<p>Er zijn nog geen geplande maaltijden.</p>';
    return;
  }
  entries.forEach(({ date, title }) => {
    const item = document.createElement('div');
    item.className = 'upcoming-item';
    const dateString = date.toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    item.innerHTML = `<h4>${title || 'Onbekend'}</h4><p>${dateString}</p>`;
    listEl.appendChild(item);
  });
  // markeer standaard het eerste item als actief
  updateActiveHomeItem();
}

function updateActiveHomeItem() {
  const listEl = document.getElementById('home-upcoming-list');
  if (!listEl) return;
  const items = Array.from(listEl.children);
  if (!items.length) return;
  const listRect = listEl.getBoundingClientRect();
  const centerY = listRect.top + listRect.height / 2;
  let closestItem = null;
  let minDistance = Infinity;
  items.forEach((item) => {
    if (!(item instanceof HTMLElement)) return;
    const rect = item.getBoundingClientRect();
    const itemCenter = rect.top + rect.height / 2;
    const distance = Math.abs(itemCenter - centerY);
    if (distance < minDistance) {
      minDistance = distance;
      closestItem = item;
    }
  });
  items.forEach((itm) => itm.classList.remove('active'));
  if (closestItem) closestItem.classList.add('active');
}

// Laad alle recepten op de indexpagina en maak voor elk recept een kaart aan.
function loadIndex() {
  // Verzamel alle recepten en stel globale variabelen in voor filtering en trending
  const allRecipes = getRecipes();
  const gridContainer = document.getElementById('recipes-container');
  const searchInput = document.getElementById('search-input');
  const categoriesEl = document.getElementById('categories-filter');
  const trendingEl = document.getElementById('trending-carousel');

  // Als er geen recepten zijn, toon een melding en verberg filterelementen
  if (!allRecipes || allRecipes.length === 0) {
    if (gridContainer) {
      gridContainer.innerHTML =
        '<p>Er zijn nog geen recepten. Ga naar de <a href="builder.html">builder</a> om je eerste recept toe te voegen.</p>';
    }
    if (categoriesEl) categoriesEl.style.display = 'none';
    if (searchInput) searchInput.style.display = 'none';
    if (trendingEl) trendingEl.style.display = 'none';
    return;
  }

  // Haal unieke tags op om te gebruiken als categorieën. Verwijder eventuele lege items.
  const uniqueTags = Array.from(
    new Set(
      allRecipes
        .flatMap((r) => (Array.isArray(r.tags) ? r.tags : []))
        .filter((tag) => tag && tag.trim() !== '')
    )
  ).sort((a, b) => a.localeCompare(b));

  let searchQuery = '';
  let selectedCategory = null; // null betekent 'Alle categorieën'

  /**
   * Bouw de horizontale carrousel met de eerste paar recepten. Er wordt geen filter toegepast;
   * dit dient als etalage van populaire of recente recepten.
   */
  function renderTrending() {
    if (!trendingEl) return;
    trendingEl.innerHTML = '';
    // Toon maximaal 8 recepten in de carrousel
    const trendingList = allRecipes.slice(0, 8);
    trendingList.forEach((recipe) => {
      const card = document.createElement('div');
      card.className = 'trending-card';
      const imageSrc = recipe.image ? recipe.image : 'placeholder_light_gray_block.png';
      card.innerHTML = `\
        <img src="${imageSrc}" alt="${recipe.title}">\
        <div class="card-content">\
          <h4>${recipe.title}</h4>\
          <p>${truncate(recipe.description || '', 60)}</p>\
        </div>\
      `;
      card.addEventListener('click', () => {
        window.location.href = 'details.html?id=' + encodeURIComponent(recipe.id);
      });
      trendingEl.appendChild(card);
    });
  }

  /**
   * Bouw de categorieënbalk. Naast de tags uit de recepten is er ook een optie 'Alles'
   * waarmee alle recepten zichtbaar worden. Wanneer een gebruiker op een categorie klikt,
   * wordt deze als actief gemarkeerd en worden de recepten in het grid gefilterd.
   */
  function renderCategoryFilters() {
    if (!categoriesEl) return;
    categoriesEl.innerHTML = '';
    // Voeg een knop toe voor 'Alles'
    const allBtn = document.createElement('button');
    allBtn.className = 'category';
    allBtn.textContent = 'Alles';
    if (!selectedCategory) allBtn.classList.add('active');
    allBtn.addEventListener('click', () => {
      selectedCategory = null;
      updateActiveButtons();
      filterAndRender();
    });
    categoriesEl.appendChild(allBtn);
    uniqueTags.forEach((tag) => {
      const btn = document.createElement('button');
      btn.className = 'category';
      btn.textContent = tag;
      if (selectedCategory === tag) btn.classList.add('active');
      btn.addEventListener('click', () => {
        // Zet deze tag als geselecteerd en schakel eventueel vorige uit.
        if (selectedCategory === tag) {
          selectedCategory = null;
        } else {
          selectedCategory = tag;
        }
        updateActiveButtons();
        filterAndRender();
      });
      categoriesEl.appendChild(btn);
    });
  }

  // Werk de visuele actieve status van categorieknoppen bij
  function updateActiveButtons() {
    if (!categoriesEl) return;
    const buttons = categoriesEl.querySelectorAll('.category');
    buttons.forEach((btn) => {
      const tag = btn.textContent;
      if (!selectedCategory && tag === 'Alles') {
        btn.classList.add('active');
      } else if (selectedCategory === tag) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Filter recepten op basis van de zoekterm en de geselecteerde categorie
  function filterRecipes() {
    return allRecipes.filter((recipe) => {
      // Filter op zoekquery
      let matchQuery = true;
      if (searchQuery) {
        const content = (
          (recipe.title || '') +
          ' ' +
          (recipe.description || '') +
          ' ' +
          (recipe.ingredients || '') +
          ' ' +
          (recipe.herbs || '') +
          ' ' +
          (Array.isArray(recipe.tags) ? recipe.tags.join(' ') : '')
        ).toLowerCase();
        matchQuery = content.includes(searchQuery);
      }
      // Filter op categorie: als er een categorie is geselecteerd, controleer of deze aanwezig is in de tags van het recept
      let matchCategory = true;
      if (selectedCategory) {
        const rTags = Array.isArray(recipe.tags) ? recipe.tags : [];
        matchCategory = rTags.includes(selectedCategory);
      }
      return matchQuery && matchCategory;
    });
  }

  // Render receptkaarten in het raster
  function renderRecipes(list) {
    if (!gridContainer) return;
    gridContainer.innerHTML = '';
    if (list.length === 0) {
      gridContainer.innerHTML = '<p>Geen recepten gevonden.</p>';
      return;
    }
    list.forEach((recipe) => {
      const card = document.createElement('div');
      card.className = 'recipe-card';
      const imageSrc = recipe.image ? recipe.image : 'placeholder_light_gray_block.png';
      card.innerHTML = `\
        <img src="${imageSrc}" alt="${recipe.title}">\
        <div class="card-content">\
          <h3>${recipe.title}</h3>\
          <p>${truncate(recipe.description || '', 80)}</p>\
        </div>\
      `;
      card.addEventListener('click', () => {
        window.location.href = 'details.html?id=' + encodeURIComponent(recipe.id);
      });
      gridContainer.appendChild(card);
    });
  }

  function filterAndRender() {
    const filtered = filterRecipes();
    renderRecipes(filtered);
  }

  // Initialise: bouw trending carrousel, categorieën en receptgrid
  renderTrending();
  renderCategoryFilters();
  renderRecipes(allRecipes);

  // Eventlisteners
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      filterAndRender();
    });
  }
}

// Verkort een string tot n karakters en voeg een ellipsis toe als deze langer is.
function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

// ---------- Ratingfunctionaliteit ----------

/**
 * Toon sterren en gemiddelde beoordeling voor een recept en registreer
 * click‑events om een nieuwe rating op te slaan. Ratings worden in een
 * array opgeslagen binnen het receptobject onder de key "ratings".
 *
 * @param {Object} recipe Het recept waarvoor de rating wordt getoond.
 */
function renderRating(recipe) {
  const ratingStarsEl = document.getElementById('rating-stars');
  const ratingAverageEl = document.getElementById('rating-average');
  if (!ratingStarsEl || !ratingAverageEl) return;
  // Verwijder eerdere sterren
  ratingStarsEl.innerHTML = '';
  const ratings = Array.isArray(recipe.ratings) ? recipe.ratings : [];
  const average = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  ratingAverageEl.textContent = ratings.length
    ? `Gemiddelde beoordeling: ${average.toFixed(1)} / 5`
    : 'Nog geen beoordelingen.';
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.classList.add('star');
    if (i <= Math.round(average)) {
      star.classList.add('filled');
    }
    star.innerHTML = '&#9733;';
    star.addEventListener('click', () => {
      addRating(recipe.id, i);
    });
    ratingStarsEl.appendChild(star);
  }
}

/**
 * Voeg een rating toe aan een recept en sla deze op in localStorage. Daarna
 * wordt de ratingweergave opnieuw gerenderd.
 *
 * @param {string} id De ID van het recept dat wordt beoordeeld.
 * @param {number} value De waardering (1 t/m 5).
 */
function addRating(id, value) {
  const recipes = getRecipes();
  const recipe = recipes.find((r) => r.id === id);
  if (!recipe) return;
  if (!Array.isArray(recipe.ratings)) {
    recipe.ratings = [];
  }
  recipe.ratings.push(value);
  localStorage.setItem('recipes', JSON.stringify(recipes));
  renderRating(recipe);
}

// Laad details van een specifiek recept op de detailpagina.
function loadDetails() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    // Geen ID meegegeven
    const container = document.querySelector('.recipe-details-page');
    if (container) container.innerHTML = '<p>Geen recept gevonden.</p>';
    return;
  }
  const recipes = getRecipes();
  const recipe = recipes.find((r) => r.id === id);
  if (!recipe) {
    const container = document.querySelector('.recipe-details-page');
    if (container) container.innerHTML = '<p>Recept niet gevonden.</p>';
    return;
  }
  const imgEl = document.getElementById('details-image');
  const titleEl = document.getElementById('details-title');
  const descEl = document.getElementById('details-description');
  const ingredientsEl = document.getElementById('details-ingredients');
  const herbsEl = document.getElementById('details-herbs');

  // Voor de ratingsectie: haal elementen op voor sterren en gemiddelde
  const ratingStarsEl = document.getElementById('rating-stars');
  const ratingAverageEl = document.getElementById('rating-average');
  // We tonen geen instructies meer in de detailpagina, dus er is geen
  // element voor instructies nodig. Het oorspronkelijke element is
  // verwijderd uit de HTML en hoeft hier niet meer opgehaald te worden.
  const tagsEl = document.getElementById('details-tags');
  // Stel afbeelding in of een placeholder als er geen foto is
  imgEl.src = recipe.image ? recipe.image : 'placeholder_light_gray_block.png';
  titleEl.textContent = recipe.title;
  descEl.textContent = recipe.description || '';
  // Ingrediënten kunnen door de gebruiker per regel worden ingevoerd. Splits op nieuwe regel.
  if (recipe.ingredients && recipe.ingredients.trim() !== '') {
    const lines = recipe.ingredients.split(/\r?\n/).filter((line) => line.trim().length > 0);
    ingredientsEl.innerHTML = '';
    lines.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item.trim();
      ingredientsEl.appendChild(li);
    });
  } else {
    // Als er geen ingrediënten zijn opgegeven, verberg de hele sectie
    ingredientsEl.parentElement.style.display = 'none';
  }

  // Kruiden/specerijen worden op dezelfde manier verwerkt als ingrediënten: splits op
  // regels en toon elk kruid als een lijstitem. Wanneer er geen kruiden zijn,
  // verberg de hele sectie.
  if (herbsEl) {
    if (recipe.herbs && recipe.herbs.trim() !== '') {
      const lines = recipe.herbs.split(/\r?\n/).filter((line) => line.trim().length > 0);
      herbsEl.innerHTML = '';
      lines.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item.trim();
        herbsEl.appendChild(li);
      });
    } else {
      if (herbsEl.parentElement) {
        herbsEl.parentElement.style.display = 'none';
      }
    }
  }

  // Toon rating: bereken gemiddelde en toon sterren. Indien nog geen ratings zijn
  // toegevoegd wordt een melding getoond. Bij het aanklikken van een ster wordt
  // een beoordeling opgeslagen en het overzicht opnieuw getoond.
  if (ratingStarsEl && ratingAverageEl) {
    renderRating(recipe);
  }
  // Instructies worden niet weergegeven; de sectie is uit de HTML verwijderd.

  // Toon labels indien beschikbaar, anders verberg de sectie
  if (tagsEl) {
    if (recipe.tags && Array.isArray(recipe.tags) && recipe.tags.length > 0) {
      tagsEl.innerHTML = '';
      recipe.tags.forEach((tag) => {
        const li = document.createElement('li');
        li.textContent = tag;
        li.className = 'tag';
        tagsEl.appendChild(li);
      });
    } else {
      // verberg de hele sectie (parent of tagsEl)
      if (tagsEl.parentElement) tagsEl.parentElement.style.display = 'none';
    }
  }
}