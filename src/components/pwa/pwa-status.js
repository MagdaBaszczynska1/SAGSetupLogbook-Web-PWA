import { createElement } from "../../utils/dom.js";

export function createPwaStatus({ pwaManager }) {
  const root = createElement("div", {
    className: "pwa-status-stack",
    attributes: { "aria-live": "polite", "aria-atomic": "true" }
  });

  const offline = createElement("div", {
    className: "pwa-banner pwa-banner--offline",
    attributes: { role: "status", hidden: "" }
  });
  offline.append(
    createElement("strong", { text: "Tryb offline" }),
    createElement("span", { text: "Aplikacja korzysta z zapisanej wersji. Dane lokalne nadal są dostępne." })
  );

  const update = createElement("div", {
    className: "pwa-banner pwa-banner--update",
    attributes: { role: "status", hidden: "" }
  });
  update.append(
    createElement("div", {
      children: [
        createElement("strong", { text: "Dostępna nowa wersja" }),
        createElement("span", { text: "Zaktualizuj aplikację, aby wczytać komplet zgodnych plików." })
      ]
    }),
    createElement("button", {
      className: "primary-action",
      text: "Zaktualizuj",
      attributes: { type: "button", "data-action": "activate-pwa-update" }
    })
  );

  const error = createElement("div", {
    className: "pwa-banner pwa-banner--error",
    attributes: { role: "status", hidden: "" }
  });

  root.append(offline, update, error);

  root.addEventListener("click", event => {
    const button = event.target.closest('[data-action="activate-pwa-update"]');
    if (!button) return;
    button.disabled = true;
    button.textContent = "Aktualizowanie…";
    const started = pwaManager.activateUpdate();
    if (!started) {
      button.disabled = false;
      button.textContent = "Zaktualizuj";
    }
  });

  pwaManager.subscribe(state => {
    offline.hidden = state.online;
    update.hidden = !state.updateAvailable;
    error.hidden = !state.errorMessage;
    error.textContent = state.errorMessage ?? "";
    const button = update.querySelector("button");
    if (!state.updateAvailable) {
      button.disabled = false;
      button.textContent = "Zaktualizuj";
    }
  });

  return root;
}
