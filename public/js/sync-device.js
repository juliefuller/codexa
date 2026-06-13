const NAME_KEY = 'codexa_sync_device_name';
const ID_KEY = 'codexa_sync_device_id';
const PROMPT_KEY = 'codexa_device_name_prompt_v4';
const HIGH_ENTROPY_TIMEOUT_MS = 1500;

const GENERIC_MODELS = /^(linux|k|android|wv|mobile)$/i;
const GENERIC_NAMES = /^(codexa(\s*\([^)]+\))?|web|k|linux|android|samsung tablet|android tablet|android phone)$/i;

/** Common Samsung tablet/phone model codes → friendly names. */
const SAMSUNG_MODELS = {
  'SM-X710': 'Galaxy Tab S9',
  'SM-X716B': 'Galaxy Tab S9',
  'SM-X810': 'Galaxy Tab S9+',
  'SM-X816B': 'Galaxy Tab S9+',
  'SM-X910': 'Galaxy Tab S9 Ultra',
  'SM-X916B': 'Galaxy Tab S9 Ultra',
  'SM-X218': 'Galaxy Tab S9 FE',
  'SM-X520': 'Galaxy Tab S10+',
  'SM-T870': 'Galaxy Tab S7',
  'SM-T875': 'Galaxy Tab S7',
  'SM-T970': 'Galaxy Tab S7+',
  'SM-T976B': 'Galaxy Tab S7+',
  'SM-P610': 'Galaxy Tab S6 Lite',
  'SM-P613': 'Galaxy Tab S6 Lite',
  'SM-P615': 'Galaxy Tab S6 Lite',
  'SM-T220': 'Galaxy Tab A7 Lite',
  'SM-T500': 'Galaxy Tab A7',
  'SM-X200': 'Galaxy Tab A8',
};

let cachedHighEntropyModel;

function formatModelName(model) {
  const trimmed = String(model || '').trim();
  if (!trimmed) return '';
  const upper = trimmed.toUpperCase();
  return (SAMSUNG_MODELS[upper] || trimmed).slice(0, 64);
}

function detectDeviceNameFromUA(ua) {
  if (/Boox|ONYX/i.test(ua)) {
    const boox = ua.match(/(Boox\s+[\w\s.-]+|ONYX[\w\s.-]*)/i);
    if (boox?.[1]) return boox[1].trim().slice(0, 64);
  }

  const androidPatterns = [
    /Android[^;]*;\s*([^;)]+?)(?:\s+Build\/|\))/i,
    /;\s*(SM-[A-Z0-9]+)\s*(?:Build|;|\))/i,
    /;\s*([A-Z][A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)*)\s+Build\//i,
  ];
  for (const pattern of androidPatterns) {
    const match = ua.match(pattern);
    if (match?.[1]) {
      const model = match[1].trim();
      if (model && !GENERIC_MODELS.test(model)) return formatModelName(model);
    }
  }

  if (/Android/i.test(ua)) {
    if (/Samsung|SM-/i.test(ua)) return 'Samsung tablet';
    if (/Mobile/i.test(ua)) return 'Android phone';
    return 'Android tablet';
  }

  if (/iPad/i.test(ua)) return 'iPad';
  if (/iPhone/i.test(ua)) return 'iPhone';

  const uaDataPlatform = navigator.userAgentData?.platform;
  if (uaDataPlatform && !/^linux$/i.test(uaDataPlatform)) {
    return `Codexa (${uaDataPlatform})`.slice(0, 64);
  }

  if (navigator.platform && !/^linux/i.test(navigator.platform)) {
    return `Codexa (${navigator.platform})`.slice(0, 64);
  }

  if (/Win/i.test(ua)) return 'Codexa (Windows)';
  if (/Mac/i.test(ua) && !/iPhone|iPad/.test(ua)) return 'Codexa (Mac)';

  return 'Codexa';
}

function detectDeviceNameSync() {
  return detectDeviceNameFromUA(navigator.userAgent || '');
}

async function fetchHighEntropyModel() {
  if (cachedHighEntropyModel !== undefined) return cachedHighEntropyModel;
  cachedHighEntropyModel = '';
  try {
    const uaData = navigator.userAgentData;
    if (uaData?.getHighEntropyValues) {
      const hints = await Promise.race([
        uaData.getHighEntropyValues(['model', 'platform', 'mobile']),
        new Promise((resolve) => {
          window.setTimeout(() => resolve(null), HIGH_ENTROPY_TIMEOUT_MS);
        }),
      ]);
      const model = hints?.model?.trim();
      if (model && !GENERIC_MODELS.test(model)) {
        cachedHighEntropyModel = formatModelName(model);
      }
    }
  } catch { /* ignore */ }
  return cachedHighEntropyModel;
}

export function hasCompletedDeviceNamePrompt() {
  try {
    return localStorage.getItem(PROMPT_KEY) === '1';
  } catch {
    return false;
  }
}

export function markDeviceNamePromptCompleted() {
  try {
    localStorage.setItem(PROMPT_KEY, '1');
  } catch { /* ignore */ }
}

/** True once per install — includes pre-existing installs that never named the device. */
export function shouldShowDeviceNamePrompt() {
  if (hasCompletedDeviceNamePrompt()) return false;
  return true;
}

export async function getSuggestedDeviceName() {
  const highEntropy = await fetchHighEntropyModel();
  const detected = highEntropy || detectDeviceNameSync();
  if (detected && !GENERIC_NAMES.test(detected)) return detected;
  return detectDeviceNameSync() || 'Codexa';
}

function createDeviceId() {
  if (typeof crypto?.randomUUID === 'function') {
    return `codexa-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  }
  return `codexa-${Math.random().toString(36).slice(2, 14)}`;
}

export function getSyncDeviceId() {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id || id === 'codexa-web') {
      // Legacy builds shared one id across all browsers; mint a per-device id instead.
      id = createDeviceId();
      localStorage.setItem(ID_KEY, id);
    }
    return id.slice(0, 64);
  } catch {
    return 'codexa-web';
  }
}

export function getSyncDeviceName() {
  try {
    const saved = localStorage.getItem(NAME_KEY);
    if (saved?.trim()) return saved.trim().slice(0, 64);
  } catch { /* ignore */ }
  return detectDeviceNameSync();
}

export function setSyncDeviceName(name) {
  const trimmed = String(name || '').trim().slice(0, 64);
  try {
    if (trimmed) localStorage.setItem(NAME_KEY, trimmed);
    else localStorage.removeItem(NAME_KEY);
  } catch { /* ignore */ }
}

/** Re-detect the device name from the OS and replace generic auto-detected labels. Never blocks UI. */
export function refreshSyncDeviceNameFromSystem() {
  void (async () => {
    try {
      const saved = localStorage.getItem(NAME_KEY)?.trim() || '';
      const highEntropy = await fetchHighEntropyModel();
      const detected = highEntropy || detectDeviceNameSync();
      if (!detected) return;

      if (!saved || GENERIC_NAMES.test(saved)) {
        if (!GENERIC_NAMES.test(detected)) setSyncDeviceName(detected);
      }
    } catch { /* ignore */ }
  })();
  return getSyncDeviceName();
}

export function getSyncDevice() {
  return {
    device: getSyncDeviceName(),
    device_id: getSyncDeviceId(),
  };
}
