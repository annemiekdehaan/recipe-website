// calendar.js
// Deze module genereert een maandkalender en maakt het mogelijk om gerechten
// op specifieke data te plannen. De planning wordt opgeslagen in localStorage
// onder de sleutel "schedule".

document.addEventListener('DOMContentLoaded', () => {
  const monthNames = [
    'januari',
    'februari',
    'maart',
    'april',
    'mei',
    'juni',
    'juli',
    'augustus',
    'september',
    'oktober',
    'november',
    'december',
  ];
  const dayNames = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];

  let currentDate = new Date();
  // Zorg dat de datum op de eerste van de maand staat om het raster eenvoudiger te berekenen
  currentDate.setDate(1);

  const calendarMonthEl = document.getElementById('calendar-month');
  const calendarTable = document.getElementById('calendar-table');
  const prevBtn = document.getElementById('prev-month');
  const nextBtn = document.getElementById('next-month');
  const editor = document.getElementById('schedule-editor');
  const selectedDateEl = document.getElementById('selected-date');
  const selectEl = document.getElementById('schedule-select');
  const saveBtn = document.getElementById('save-schedule');
  const deleteBtn = document.getElementById('delete-schedule');
  const cancelBtn = document.getElementById('cancel-schedule');

  // Lees recepten uit localStorage en zet ze klaar voor gebruik in de dropdown
  const recipes = getRecipes();
  populateRecipeSelect();

  // Haal planning op uit localStorage (object met keys als YYYY-MM-DD en values als recipeId)
  function loadSchedule() {
    return JSON.parse(localStorage.getItem('schedule')) || {};
  }

  function saveSchedule(schedule) {
    localStorage.setItem('schedule', JSON.stringify(schedule));
  }

  function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    calendarMonthEl.textContent = `${monthNames[month]} ${year}`;
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // index 0 = maandag
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const schedule = loadSchedule();
    // Maak het header‑rijtje met dagen
    let html = '<thead><tr>';
    dayNames.forEach((day) => {
      html += `<th>${day}</th>`;
    });
    html += '</tr></thead><tbody>';
    // Bereken hoe veel rijen er nodig zijn (maximaal 6)
    let day = 1;
    for (let row = 0; row < 6; row++) {
      html += '<tr>';
      for (let col = 0; col < 7; col++) {
        if (row === 0 && col < firstDayIndex) {
          // lege cel vóór de eerste dag
          html += '<td></td>';
        } else if (day > daysInMonth) {
          // lege cellen na de laatste dag
          html += '<td></td>';
        } else {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const recipeId = schedule[dateStr];
          const recipe = recipes.find((r) => r.id === recipeId);
          html += `<td data-date="${dateStr}">`;
          html += `<span class="day-number">${day}</span>`;
          if (recipe) {
            const title = recipe.title.length > 18 ? recipe.title.slice(0, 18) + '…' : recipe.title;
            html += `<span class="scheduled-title">${title}</span>`;
          }
          html += '</td>';
          day++;
        }
      }
      html += '</tr>';
    }
    html += '</tbody>';
    calendarTable.innerHTML = html;
    // Add click listeners to date cells
    calendarTable.querySelectorAll('td[data-date]').forEach((cell) => {
      cell.addEventListener('click', () => {
        openEditor(cell.getAttribute('data-date'));
      });
    });
  }

  function openEditor(dateStr) {
    // Toon editor
    editor.classList.remove('hidden');
    selectedDateEl.textContent = dateStr;
    // Stel dropdown in
    const schedule = loadSchedule();
    const recipeId = schedule[dateStr] || '';
    selectEl.value = recipeId;
    // Toon of verberg verwijderknop
    deleteBtn.style.display = recipeId ? 'inline-block' : 'none';
  }

  saveBtn.addEventListener('click', () => {
    const dateStr = selectedDateEl.textContent;
    const chosen = selectEl.value;
    const schedule = loadSchedule();
    if (chosen) {
      schedule[dateStr] = chosen;
    }
    saveSchedule(schedule);
    editor.classList.add('hidden');
    renderCalendar();
  });

  deleteBtn.addEventListener('click', () => {
    const dateStr = selectedDateEl.textContent;
    const schedule = loadSchedule();
    delete schedule[dateStr];
    saveSchedule(schedule);
    editor.classList.add('hidden');
    renderCalendar();
  });

  cancelBtn.addEventListener('click', () => {
    editor.classList.add('hidden');
  });

  prevBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });
  nextBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  function populateRecipeSelect() {
    selectEl.innerHTML = '<option value="">-- Kies een gerecht --</option>';
    recipes.forEach((recipe) => {
      const option = document.createElement('option');
      option.value = recipe.id;
      option.textContent = recipe.title;
      selectEl.appendChild(option);
    });
  }

  /**
   * Haal recepten op uit localStorage. Deze functie is gekopieerd uit script.js
   * omdat calendar.js standalone wordt geladen. Als er geen recepten
   * beschikbaar zijn, wordt een lege array teruggegeven.
   */
  function getRecipes() {
    return JSON.parse(localStorage.getItem('recipes')) || [];
  }

  // Initiële render
  renderCalendar();
});