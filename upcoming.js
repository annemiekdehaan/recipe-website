// upcoming.js
// Toon een verticale lijst met komende maaltijden, waarin het item in het
// midden van de zichtbare lijst wordt uitgelicht. De planning wordt uit
// localStorage gehaald (zelfde structuur als gebruikt in calendar.js).

document.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('upcoming-list');
  const recipes = getRecipes();

  // Haal schedule uit localStorage en normaliseer naar objectvorm
  function loadSchedule() {
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

  // Haal recepten op uit localStorage (gekopieerd uit script.js)
  function getRecipes() {
    const data = localStorage.getItem('recipes');
    try {
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Fout bij het parsen van recepten:', err);
      return [];
    }
  }

  function buildUpcomingList() {
    const schedule = loadSchedule();
    const entries = [];
    const today = new Date();
    // Verzamel alle geplande maaltijden en converteer naar een lijst van { date, title }
    Object.keys(schedule).forEach((dateStr) => {
      const entry = schedule[dateStr];
      const dateObj = new Date(dateStr);
      // Toon alleen toekomstige (of huidige) data
      if (isNaN(dateObj)) return;
      if (dateObj >= new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
        let title = '';
        if (entry.id) {
          const rec = recipes.find((r) => r.id === entry.id);
          title = rec ? rec.title : '';
        } else if (entry.name) {
          title = entry.name;
        } else if (entry.unknown) {
          title = 'Onbekend';
        }
        entries.push({ date: dateObj, title });
      }
    });
    // Sorteer op datum (oud naar nieuw)
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
    // Activeer de eerste item als standaard
    updateActiveItem();
  }

  function updateActiveItem() {
    const items = Array.from(listEl.children);
    if (!items.length) return;
    const listRect = listEl.getBoundingClientRect();
    const centerY = listRect.top + listRect.height / 2;
    let closestItem = null;
    let minDistance = Infinity;
    items.forEach((item) => {
      // alleen element nodes
      if (!(item instanceof HTMLElement)) return;
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      const distance = Math.abs(itemCenter - centerY);
      if (distance < minDistance) {
        minDistance = distance;
        closestItem = item;
      }
    });
    items.forEach((item) => item.classList.remove('active'));
    if (closestItem) closestItem.classList.add('active');
  }

  // Bouw de lijst bij het laden van de pagina
  buildUpcomingList();
  // Update actieve item tijdens scrollen
  listEl.addEventListener('scroll', () => {
    updateActiveItem();
  });
});