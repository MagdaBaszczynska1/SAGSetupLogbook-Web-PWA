import { createElement } from "../../utils/dom.js";

export function createSaveBar() {
  const element = createElement("div", { className: "measurement-save-bar" });
  element.innerHTML = `
    <p data-text="save-hint">Ustaw ugięcie, aby zapisać pomiar.</p>
    <p class="save-error" data-text="save-error" role="alert" hidden></p>
    <button class="primary-action" type="button" data-action="save" disabled>Zapisz pomiar</button>
  `;
  return element;
}
