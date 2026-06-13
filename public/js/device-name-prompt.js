import { applyTranslations } from './i18n.js';
import {
  getSuggestedDeviceName,
  setSyncDeviceName,
  markDeviceNamePromptCompleted,
  shouldShowDeviceNamePrompt,
  getSyncDeviceName,
} from './sync-device.js';

let _promptOpen = false;

/**
 * One-time modal asking the user to name this device for BookOrbit stats.
 * Shown on existing installs once; new installs see it on first library or reader open.
 */
export async function maybePromptDeviceName() {
  if (_promptOpen || !shouldShowDeviceNamePrompt()) return;

  _promptOpen = true;
  const suggested = getSyncDeviceName();

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop device-name-prompt-backdrop';
  backdrop.innerHTML = `
    <div class="modal device-name-prompt" role="dialog" aria-modal="true" style="max-width:420px">
      <h2 data-i18n="device_prompt.title">Name this device</h2>
      <p style="margin:.5rem 0 1rem;color:var(--color-text-muted);font-size:.9rem" data-i18n="device_prompt.body">
        BookOrbit uses this to show which device you read on. You can change it later in Settings.
      </p>
      <label for="device-prompt-input" class="sr-only" data-i18n="device_prompt.label">Device name</label>
      <input
        type="text"
        id="device-prompt-input"
        class="device-prompt-input"
        maxlength="64"
        autocomplete="off"
        autocapitalize="words"
        spellcheck="false"
        data-i18n-placeholder="device_prompt.placeholder"
        placeholder="e.g. Galaxy Tab"
      />
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="device-prompt-skip" data-i18n="device_prompt.skip">Not now</button>
        <button type="button" class="btn btn-primary" id="device-prompt-save" data-i18n="device_prompt.save">Save</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);
  applyTranslations();

  const input = backdrop.querySelector('#device-prompt-input');
  input.value = suggested;

  function close(markComplete) {
    if (markComplete) markDeviceNamePromptCompleted();
    backdrop.remove();
    _promptOpen = false;
  }

  backdrop.querySelector('#device-prompt-skip').addEventListener('click', () => close(true));
  backdrop.querySelector('#device-prompt-save').addEventListener('click', () => {
    const name = input.value.trim() || suggested;
    if (name) setSyncDeviceName(name);
    close(true);
  });
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close(true);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') backdrop.querySelector('#device-prompt-save').click();
    if (e.key === 'Escape') backdrop.querySelector('#device-prompt-skip').click();
  });

  input.focus();
  input.select();

  // Refine suggestion asynchronously without blocking the modal.
  void getSuggestedDeviceName().then((better) => {
    if (!document.body.contains(backdrop) || !better) return;
    if (!input.value.trim() || input.value === suggested) input.value = better;
  }).catch(() => {});
}
