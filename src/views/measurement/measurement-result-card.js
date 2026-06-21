import { createElement } from "../../utils/dom.js";

export function createResultsSection() {
  const element = createElement("div", {
    className: "measurement-results",
    attributes: { "data-region": "results", hidden: "" }
  });
  element.innerHTML = `
    <section class="app-card result-card" aria-labelledby="current-sag-title">
      <div class="card-heading"><span class="card-heading__icon" aria-hidden="true">%</span><h3 id="current-sag-title">Aktualny SAG</h3></div>
      <div class="result-summary"><strong data-text="current-sag"></strong><span data-text="result-target"></span></div>
      <div class="interpretation-card" data-region="interpretation" role="status"><strong data-text="interpretation-title"></strong><span data-text="interpretation-explanation"></span></div>
    </section>
    <section class="app-card result-details" aria-labelledby="result-details-title">
      <div class="card-heading"><span class="card-heading__icon" aria-hidden="true">☷</span><h3 id="result-details-title">Szczegóły wyniku</h3></div>
      <div class="value-row"><span data-text="target-compression-title"></span><strong data-text="target-compression"></strong></div>
      <div class="card-divider"></div>
      <div class="value-row"><span>Różnica względem celu</span><strong data-text="difference"></strong></div>
    </section>
  `;
  return element;
}
