const canvas = document.querySelector('#square-canvas');
const modeTitle = document.querySelector('#mode-title');
const itemCount = document.querySelector('#item-count');
const settingsOutput = document.querySelector('#settings-output');
const generatedCss = document.querySelector('#generated-css');
const copyButton = document.querySelector('#copy-css');
const copyLabel = copyButton.querySelector('.copy-label');
const modeButtons = document.querySelectorAll('.mode-button');
const optionPanels = document.querySelectorAll('.options-panel');
const displayPanel = document.querySelector('.display-options');
const resetButton = document.querySelector('#reset-options');

const defaultSettings = {
  grid: {
    columns: '3',
    gap: '16',
    alignment: 'stretch'
  },
  flex: {
    direction: 'row',
    gap: '16',
    wrap: 'wrap'
  },
  display: {
    count: '9',
    size: 'medium'
  }
};

const settings = structuredClone(defaultSettings);

const prettyValues = {
  alignment: { stretch: 'stretch', center: 'center', 'space-evenly': 'space evenly' },
  direction: { row: 'row', column: 'column' },
  wrap: { wrap: 'wrap', nowrap: 'no wrap' },
  size: { small: 'small', medium: 'medium', large: 'large' }
};

function activeMode() {
  return canvas.classList.contains('flex-mode') ? 'flex' : 'grid';
}

function displayValue(key, value) {
  return prettyValues[key]?.[value] ?? value;
}

function generatedCssText() {
  const mode = activeMode();
  const modeSettings = settings[mode];
  const displaySettings = settings.display;
  const sizeWidths = { small: '75%', medium: '90%', large: '100%' };
  const rowBases = { small: '25%', medium: '30%', large: '33.333%' };
  const hiddenRule = Number(displaySettings.count) < 9
    ? `\n.gradient-square:nth-child(n + ${Number(displaySettings.count) + 1}) { display: none; }`
    : '';

  if (mode === 'grid') {
    const squareWidth = modeSettings.alignment === 'stretch' ? '100%' : sizeWidths[displaySettings.size];
    const justifySelf = modeSettings.alignment === 'stretch' ? 'stretch' : 'center';
    return `.square-canvas {\n  display: grid;\n  grid-template-columns: repeat(${modeSettings.columns}, minmax(0, 1fr));\n  gap: ${modeSettings.gap}px;\n}\n\n.gradient-square {\n  width: ${squareWidth};\n  justify-self: ${justifySelf};\n  aspect-ratio: 1;\n}${hiddenRule}`;
  }

  const isColumn = modeSettings.direction === 'column';
  return `.square-canvas {\n  display: flex;\n  flex-direction: ${modeSettings.direction};\n  flex-wrap: ${modeSettings.wrap};\n  gap: ${modeSettings.gap}px;\n}\n\n.gradient-square {\n  flex: ${isColumn ? '0 0 auto' : `0 1 calc(${rowBases[displaySettings.size]} - var(--gap))`};\n  width: ${isColumn ? sizeWidths[displaySettings.size] : 'auto'};\n  aspect-ratio: 1;\n}${hiddenRule}`;
}

function syncControls() {
  [...optionPanels, displayPanel].forEach((panel) => {
    const modeSettings = settings[panel.dataset.panel];
    panel.querySelectorAll('[data-setting]').forEach((control) => {
      control.value = modeSettings[control.dataset.setting];
      const output = panel.querySelector(`[data-output="${control.dataset.setting}"]`);
      if (output) output.textContent = control.value;
    });
  });
}

function renderReadout() {
  settingsOutput.innerHTML = Object.entries(settings)
    .map(([mode, modeSettings]) => `
      <div class="settings-group${mode === activeMode() ? ' is-current' : ''}">
        <strong>${mode === 'grid' ? 'Grid' : mode === 'flex' ? 'Flexbox' : 'Display'}</strong>
        ${Object.entries(modeSettings)
          .map(([key, value]) => `<span>${key}: ${displayValue(key, value)}</span>`)
          .join('')}
      </div>`)
    .join('');
}

function applySettings() {
  const mode = activeMode();
  const modeSettings = settings[mode];
  const displaySettings = settings.display;
  const sizeWidths = { small: '75%', medium: '90%', large: '100%' };
  const rowBases = { small: 'calc(25% - var(--gap))', medium: 'calc(30% - var(--gap))', large: 'calc(33.333% - var(--gap))' };

  canvas.classList.remove('square-size-small', 'square-size-medium', 'square-size-large');
  canvas.classList.add(`square-size-${displaySettings.size}`);
  itemCount.textContent = `${displaySettings.count.padStart(2, '0')} objects`;
  document.querySelectorAll('.gradient-square').forEach((square, index) => {
    square.hidden = index >= Number(displaySettings.count);
  });

  if (mode === 'grid') {
    canvas.classList.remove('grid-align-center', 'grid-align-stretch', 'grid-align-space-evenly');
    canvas.classList.add(`grid-align-${modeSettings.alignment}`);
    canvas.style.setProperty('--canvas-columns', modeSettings.columns);
    canvas.style.setProperty('--gap', `${modeSettings.gap}px`);
    canvas.style.alignItems = modeSettings.alignment === 'center' ? 'center' : 'stretch';
    canvas.style.justifyContent = modeSettings.alignment === 'space-evenly' ? 'space-evenly' : 'stretch';
    canvas.style.gridTemplateColumns = modeSettings.alignment === 'space-evenly'
      ? `repeat(${modeSettings.columns}, minmax(0, 1fr))`
      : '';
  } else {
    canvas.style.setProperty('--gap', `${modeSettings.gap}px`);
    canvas.style.flexDirection = modeSettings.direction;
    canvas.style.flexWrap = modeSettings.wrap;
    document.querySelectorAll('.gradient-square').forEach((square) => {
      const isColumn = modeSettings.direction === 'column';
      square.style.flex = isColumn
        ? '0 0 auto'
        : modeSettings.wrap === 'nowrap' ? `1 1 ${rowBases[displaySettings.size]}` : `0 1 ${rowBases[displaySettings.size]}`;
      square.style.width = isColumn ? sizeWidths[displaySettings.size] : '';
    });
  }

  modeTitle.textContent = mode === 'grid' ? 'CSS Grid' : 'CSS Flexbox';
  renderReadout();
  generatedCss.textContent = generatedCssText();
}

function bindPanel(panel) {
  const mode = panel.dataset.panel;
  panel.addEventListener('input', (event) => {
    const control = event.target.closest('[data-setting]');
    if (!control) return;
    const key = control.dataset.setting;
    settings[mode][key] = control.value;
    const output = panel.querySelector(`[data-output="${key}"]`);
    if (output) output.textContent = control.value;
    applySettings();
  });

  panel.addEventListener('change', (event) => {
    const control = event.target.closest('[data-setting]');
    if (!control) return;
    settings[mode][control.dataset.setting] = control.value;
    applySettings();
  });
}

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    modeButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-pressed', isActive);
    });
    optionPanels.forEach((panel) => panel.classList.toggle('is-hidden', panel.dataset.panel !== mode));
    canvas.classList.toggle('grid-mode', mode === 'grid');
    canvas.classList.toggle('flex-mode', mode === 'flex');
    applySettings();
  });
});

resetButton.addEventListener('click', () => {
  Object.keys(settings).forEach((mode) => Object.assign(settings[mode], defaultSettings[mode]));
  syncControls();
  applySettings();
});

copyButton.addEventListener('click', async () => {
  const css = generatedCss.textContent;
  try {
    await navigator.clipboard.writeText(css);
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = css;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
  }
  copyLabel.textContent = 'Copied';
  setTimeout(() => { copyLabel.textContent = 'Copy CSS'; }, 1400);
});

optionPanels.forEach(bindPanel);
bindPanel(displayPanel);
syncControls();
applySettings();
