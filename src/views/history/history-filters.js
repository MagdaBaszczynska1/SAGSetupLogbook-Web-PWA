import { createElement } from "../../utils/dom.js";

export function createHistoryFilters() {
  const section = createElement("section", {
    className: "history-filters app-card",
    attributes: { "aria-labelledby": "history-filters-heading" }
  });
  section.innerHTML = `
    <div class="history-section-heading">
      <h2 id="history-filters-heading">Filtry i sortowanie</h2>
      <button type="button" class="text-action" data-action="clear-history-filters" hidden>Wyczyść filtry</button>
    </div>
    <label class="history-filter-field">Rower
      <select data-field="history-bike-filter" aria-label="Filtruj historię według roweru"></select>
    </label>
    <fieldset class="segmented-control history-suspension-filter">
      <legend>Zawieszenie</legend>
      <button type="button" data-history-suspension="all">Wszystkie</button>
      <button type="button" data-history-suspension="fork">Widelec</button>
      <button type="button" data-history-suspension="shock">Damper</button>
    </fieldset>
    <label class="history-filter-field">Sortowanie
      <select data-field="history-sort-order" aria-label="Kolejność pomiarów według daty">
        <option value="newestFirst">Od najnowszych</option>
        <option value="oldestFirst">Od najstarszych</option>
      </select>
    </label>
    <p class="history-count" data-text="history-count" aria-live="polite"></p>
  `;
  return section;
}
