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
  // Extra input voor het invoeren van een nieuw gerecht, wordt getoond wanneer
  // "custom" is geselecteerd in de dropdown.
  const customInput = document.getElementById('custom-meal');
  const saveBtn = document.getElementById('save-schedule');
  const deleteBtn = document.getElementById('delete-schedule');
  const cancelBtn = document.getElementById('cancel-schedule');

  // Lees recepten uit localStorage en zet ze klaar voor gebruik in de dropdown
  const recipes = getRecipes();
  populateRecipeSelect();

  // Haal planning op uit localStorage (object met keys als YYYY-MM-DD en values als recipeId)
  function loadSchedule() {
    const raw = JSON.parse(localStorage.getItem('schedule')) || {};
    // Converteer eventueel oude stringwaardes (recipeId's) naar objectvorm { id: <id> }
    const normalized = {};
    Object.keys(raw).forEach((date) => {
      const val = raw[date];
      if (val && typeof val === 'object') {
        normalized[date] = val;
      } else if (typeof val === 'string') {
        normalized[date] = { id: val };
      } else {
        // onbekend type, sla over
      }
    });
    return normalized;
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
          const entry = schedule[dateStr];
          html += `<td data-date="${dateStr}">`;
          html += `<span class="day-number">${day}</span>`;
          if (entry) {
            let titleText = '';
            if (entry.id) {
              const rec = recipes.find((r) => r.id === entry.id);
              titleText = rec ? rec.title : '';
            } else if (entry.name) {
              titleText = entry.name;
            } else if (entry.unknown) {
              titleText = 'Onbekend';
            }
            if (titleText) {
              const shortTitle = titleText.length > 18 ? titleText.slice(0, 18) + '…' : titleText;
              html += `<span class="scheduled-title">${shortTitle}</span>`;
            }
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
    // Stel dropdown in op basis van huidige planning
    const schedule = loadSchedule();
    const entry = schedule[dateStr];
    if (!entry) {
      selectEl.value = '';
      customInput.style.display = 'none';
      customInput.value = '';
      deleteBtn.style.display = 'none';
    } else if (entry.id) {
      selectEl.value = entry.id;
      customInput.style.display = 'none';
      customInput.value = '';
      deleteBtn.style.display = 'inline-block';
    } else if (entry.name) {
      selectEl.value = 'custom';
      customInput.style.display = 'block';
      customInput.value = entry.name;
      deleteBtn.style.display = 'inline-block';
    } else if (entry.unknown) {
      selectEl.value = 'unknown';
      customInput.style.display = 'none';
      customInput.value = '';
      deleteBtn.style.display = 'inline-block';
    } else {
      selectEl.value = '';
      customInput.style.display = 'none';
      customInput.value = '';
      deleteBtn.style.display = 'none';
    }
  }

  saveBtn.addEventListener('click', () => {
    const dateStr = selectedDateEl.textContent;
    const chosen = selectEl.value;
    const schedule = loadSchedule();
    if (chosen) {
      if (chosen === 'unknown') {
        schedule[dateStr] = { unknown: true };
      } else if (chosen === 'custom') {
        const name = customInput.value.trim();
        if (name) {
          schedule[dateStr] = { name };
        } else {
          // Als er geen naam is ingevoerd, sla niets op
          delete schedule[dateStr];
        }
      } else {
        schedule[dateStr] = { id: chosen };
      }
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
    // Voeg opties toe voor alle bestaande gerechten
    recipes.forEach((recipe) => {
      const option = document.createElement('option');
      option.value = recipe.id;
      option.textContent = recipe.title;
      selectEl.appendChild(option);
    });
    // Optie voor onbekend/geen gerecht (nader te bepalen)
    const unknownOption = document.createElement('option');
    unknownOption.value = 'unknown';
    unknownOption.textContent = 'Onbekend (nog te bepalen)';
    selectEl.appendChild(unknownOption);
    // Optie voor handmatig invoeren van een nieuw gerecht
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.textContent = 'Nieuw gerecht invoeren';
    selectEl.appendChild(customOption);
    // Voeg een eventlistener toe om het invoerveld te tonen of te verbergen
    selectEl.addEventListener('change', () => {
      if (selectEl.value === 'custom') {
        customInput.style.display = 'block';
      } else {
        customInput.style.display = 'none';
        customInput.value = '';
      }
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