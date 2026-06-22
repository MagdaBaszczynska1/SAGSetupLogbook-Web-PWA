import { TRAIL_CONDITION_CONTENT } from "../../models/ride-journal-entry.js";
import { createElement } from "../../utils/dom.js";

export function createJournalFilters() {
  const section = createElement("section", {
    className: "journal-filters app-card",
    attributes: { "aria-labelledby": "journal-filters-heading" }
  });
  section.innerHTML = `
    <div class="journal-section-heading">
      <h2 id="journal-filters-heading">Wyszukiwanie i filtry</h2>
      <button type="button" class="text-action" data-action="clear-journal-filters" hidden>Wyczyść</button>
    </div>
    <label class="journal-filter-field">Szukaj
      <input type="search" data-field="journal-search" placeholder="Trasa, rower, notatka…" autocomplete="off">
    </label>
    <label class="journal-filter-field">Rower
      <select data-field="journal-bike-filter" aria-label="Filtruj Dziennik według roweru"></select>
    </label>
    <label class="journal-filter-field">Warunki
      <select data-field="journal-condition-filter" aria-label="Filtruj Dziennik według warunków">
        <option value="all">Wszystkie warunki</option>
      </select>
    </label>
    <label class="journal-filter-field">Sortowanie
      <select data-field="journal-sort-order" aria-label="Kolejność wpisów Dziennika">
        <option value="newestFirst">Od najnowszych</option>
        <option value="oldestFirst">Od najstarszych</option>
        <option value="highestRated">Najwyżej ocenione</option>
      </select>
    </label>
    <p class="journal-count" data-text="journal-count" aria-live="polite"></p>
  `;

  const conditionSelect = section.querySelector('[data-field="journal-condition-filter"]');
  for (const [value, content] of Object.entries(TRAIL_CONDITION_CONTENT)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = content.title;
    conditionSelect.append(option);
  }
  return section;
}
