import { APPEARANCE_MODE } from "../../stores/app-settings-store.js";
import { createElement } from "../../utils/dom.js";

const MODES = Object.freeze([
  { value: APPEARANCE_MODE.SYSTEM, title: "Systemowy", description: "Dopasuj do ustawień urządzenia." },
  { value: APPEARANCE_MODE.LIGHT, title: "Jasny", description: "Zawsze używaj jasnego wyglądu." },
  { value: APPEARANCE_MODE.DARK, title: "Ciemny", description: "Zawsze używaj ciemnego wyglądu." }
]);

export function createSettingsDialog() {
  const dialog = createElement("dialog", {
    className: "app-dialog more-dialog settings-dialog",
    attributes: { "aria-labelledby": "settings-title" }
  });
  dialog.innerHTML = `
    <div class="dialog-panel more-dialog-panel">
      <div class="dialog-heading">
        <h3 id="settings-title">Ustawienia</h3>
        <button type="button" data-action="close-settings" aria-label="Zamknij ustawienia">×</button>
      </div>
      <section class="settings-section" aria-labelledby="appearance-title">
        <div class="more-section-heading"><div><h4 id="appearance-title">Wygląd</h4><p>Zmiana jest stosowana natychmiast i zapisywana w tej przeglądarce.</p></div></div>
        <div class="appearance-options" data-region="appearance-options"></div>
        <p class="form-error" data-text="settings-error" role="alert" hidden></p>
      </section>
      <section class="settings-section">
        <h4>Dostępność</h4>
        <p>Aplikacja respektuje systemowe ustawienia ograniczenia ruchu i zwiększonego kontrastu. Wielkość tekstu możesz zmieniać w ustawieniach przeglądarki lub urządzenia.</p>
      </section>
    </div>
  `;
  const container = dialog.querySelector('[data-region="appearance-options"]');
  MODES.forEach(mode => {
    const button = createElement("button", {
      className: "appearance-option",
      attributes: {
        type: "button",
        "data-appearance-mode": mode.value,
        "aria-pressed": "false"
      }
    });
    button.append(
      createElement("span", { className: "appearance-option__preview", attributes: { "data-preview": mode.value, "aria-hidden": "true" } }),
      createElement("span", {
        className: "appearance-option__content",
        children: [
          createElement("strong", { text: mode.title }),
          createElement("small", { text: mode.description })
        ]
      }),
      createElement("span", { className: "appearance-option__check", text: "✓", attributes: { "aria-hidden": "true" } })
    );
    container.append(button);
  });
  return dialog;
}

export function renderSettingsDialog(dialog, snapshot) {
  dialog.querySelectorAll("[data-appearance-mode]").forEach(button => {
    const active = button.dataset.appearanceMode === snapshot.appearanceMode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const error = dialog.querySelector('[data-text="settings-error"]');
  error.hidden = !snapshot.errorMessage;
  error.textContent = snapshot.errorMessage ?? "";
}
