/**
 * @name HideSystemMessages
 * @author programmer2514
 * @authorId 563652755814875146
 * @description Adds buttons to toggle system messages and chat dividers
 * @version 2.1.0
 * @donate https://ko-fi.com/benjaminpryor
 * @patreon https://www.patreon.com/BenjaminPryor
 * @website https://github.com/programmer2514/BetterDiscord-HideSystemMessages
 * @source https://github.com/programmer2514/BetterDiscord-HideSystemMessages/raw/refs/heads/main/HideSystemMessages.plugin.js
 */

const config = {
  changelog: [
    {
      title: '2.1.0',
      type: 'added',
      items: [
        'Fixed weird spacing on new Discord UI',
        'Substantial performance improvements',
        'Removed unnecessary Webpack modules',
      ],
    },
  ],
};

const runtime = {
  meta: null,
  api: null,
  plugin: null,
  events: {
    controller: null,
    signal: null,
  },

  // Add mutation observer to the app wrapper because otherwise BDFDB nukes the toolbar
  get observer() {
    return this._observer ?? (this._observer = new MutationObserver((mutationList) => {
      mutationList.forEach((mutationRecord) => {
        mutationRecord.addedNodes.forEach((node) => {
          if (node.classList?.contains(modules.app?.app)
            || node.classList?.contains(modules.app?.layers))
            runtime.plugin.initialize();
        });
      });
    }))
  },
};

const constants = {
  I_SYSTEM_MESSAGES: 0,
  I_CHAT_DIVIDERS: 1,
}

const modules = {
  get icons() { return this._icons ?? (this._icons = runtime.api.Webpack.getByKeys('selected', 'iconWrapper', 'clickable', 'icon')); },
  get app() { return this._app ?? (this._app = runtime.api.Webpack.getByKeys('app', 'layers')); },
  get styles() { return this._styles ?? (this._styles = runtime.api.Webpack.getByKeys('ephemeral', 'replying', 'messageListItem')); },
  get dividers() { return this._dividers ?? (this._dividers = runtime.api.Webpack.getByKeys('divider', 'isUnread', 'unreadPill')); },
  get scroller() { return this._scroller ?? (this._scroller = runtime.api.Webpack.getByKeys('messagesWrapper', 'scrollerContent', 'scroller')); },
  get window() { return this._window ?? (this._window = runtime.api.Webpack.getByKeys('appAsidePanelWrapper', 'mobileApp')); },
};

const elements = {
  get insertPoint() { return document.querySelector(`.${modules.scroller?.messagesWrapper}`); },
  get observedContainer() { return document.querySelector(`.${modules.window?.app}`); },
};

const buttons = {
  container: null,
  systemMessages: null,
  chatDividers: null,
};

// Icons are part of the Bootstrap Icons library, which can be found at https://icons.getbootstrap.com/
const icons = {
  systemMessages: '<path fill="currentColor" d="M2 2a2 2 0 0 0-2 2v8.01A2 2 0 0 0 2 14h5.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-.966-.741l5.64-3.471L8 9.583l7-4.2V8.5a.5.5 0 0 0 1 0V4a2 2 0 0 0-2-2H2Zm3.708 6.208L1 11.105V5.383l4.708 2.825ZM1 4.217V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v.217l-7 4.2-7-4.2Z"/><path fill="currentColor" d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-1.993-1.679a.5.5 0 0 0-.686.172l-1.17 1.95-.547-.547a.5.5 0 0 0-.708.708l.774.773a.75.75 0 0 0 1.174-.144l1.335-2.226a.5.5 0 0 0-.172-.686Z"/>',
  chatDividers: '<path fill="currentColor" d="M12 3H4a1 1 0 0 0-1 1v2.5H2V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2.5h-1V4a1 1 0 0 0-1-1zM2 9.5h1V12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9.5h1V12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5zm-1.5-2a.5.5 0 0 0 0 1h15a.5.5 0 0 0 0-1H.5z"/>',
};

const settings = {
  get systemMessageButtonActive() { return runtime.api.Data.load('system-message-button-active'); },
  set systemMessageButtonActive(v) { runtime.api.Data.save('system-message-button-active', v); },

  get chatDividerButtonActive() { return runtime.api.Data.load('chat-divider-button-active'); },
  set chatDividerButtonActive(v) { runtime.api.Data.save('chat-divider-button-active', v); },
};

module.exports = class HideSystemMessages {
  // Get api and metadata
  constructor(meta) {
    runtime.meta = meta;
    runtime.api = new BdApi(runtime.meta.name);
    runtime.plugin = this;
  }

  // Initialize the plugin when it is enabled
  start = async () => {
    // Show changelog
    const savedVersion = runtime.api.Data.load('version');
    if (savedVersion !== runtime.meta.version) {
      runtime.api.UI.showChangelogModal(
        {
          title: runtime.meta.name,
          subtitle: runtime.meta.version,
          blurb: runtime.meta.description,
          changes: config.changelog,
        },
      );
      runtime.api.Data.save('version', runtime.meta.version);
    }

    // Start plugin
    this.initialize();
    runtime.api.Logger.info('Enabled');
  };

  // Restore the default UI when the plugin is disabled
  stop = () => {
    // Terminate HideSystemMessages
    this.terminate();

    // Send shutdown message
    runtime.api.Logger.info('Disabled');
  };

  // Re-initialize the plugin on channel/server switch
  onSwitch = async () => { this.initialize(); };

  // Main plugin code, called by start() and onSwitch()
  initialize = async () => {
    // Clean up UI
    this.terminate();

    // Only run if the messages wrapper exists
    if (!elements.insertPoint) return;

    // Create event listener
    runtime.events.controller = new AbortController();
    runtime.events.signal = runtime.events.controller.signal;

    // Define & add toolbar container
    buttons.container = document.createElement('div');
    buttons.container.setAttribute('id', 'hsm-toolbar-container');
    buttons.container.classList.add('hsm-element');
    buttons.container.style.cssText = `
      display: flex;
      position: absolute;
      align-items: left;
      padding: 0;
      margin: 0;
      border: 0;
      opacity: 0.35;
      transition: opacity 100ms;
      filter: drop-shadow(0px 0px 6px #000000);
      z-index: 100000;
    `;
    buttons.container.innerHTML = '<div id="hsm-icon-insert-point" style="display: none;"></div>';

    // Insert toolbar in the correct spot
    elements.insertPoint.appendChild(buttons.container);

    // Start mutation observer
    runtime.observer.observe(elements.observedContainer, {
      childList: true,
      subtree: true,
      attributes: false,
    });

    // Define & add new toolbar icons
    buttons.systemMessages = this.addButton('System Messages', icons.systemMessages);
    buttons.chatDividers = this.addButton('Chat Dividers', icons.chatDividers);

    // Decide active state of buttons
    this.toggleButton(constants.I_SYSTEM_MESSAGES, false);
    this.toggleButton(constants.I_CHAT_DIVIDERS, false);

    // Add event listener to the System Messages button to update on click and hover
    buttons.systemMessages.addEventListener('click', function () {
      runtime.plugin.toggleButton(constants.I_SYSTEM_MESSAGES);
    }, { signal: runtime.events.signal });

    buttons.systemMessages.addEventListener('mouseenter', function () {
      buttons.container.style.opacity = '1.0';
    }, { signal: runtime.events.signal });

    buttons.systemMessages.addEventListener('mouseleave', function () {
      buttons.container.style.opacity = '0.35';
    }, { signal: runtime.events.signal });

    // Add event listener to the Chat Dividers button to update on click
    buttons.chatDividers.addEventListener('click', function () {
      runtime.plugin.toggleButton(constants.I_CHAT_DIVIDERS);
    }, { signal: runtime.events.signal });

    buttons.chatDividers.addEventListener('mouseenter', function () {
      buttons.container.style.opacity = '1.0';
    }, { signal: runtime.events.signal });

    buttons.chatDividers.addEventListener('mouseleave', function () {
      buttons.container.style.opacity = '0.35';
    }, { signal: runtime.events.signal });
  };

  // Terminate the plugin and undo its effects
  terminate = () => {
    // Remove buttons
    document.querySelectorAll('.hsm-element').forEach(e => e.remove());

    // Undo plugin effects
    runtime.api.DOM.removeStyle('hsm-hide-div');
    runtime.api.DOM.removeStyle('hsm-hide-msg');

    // Abort listeners & observers
    runtime.events.controller?.abort();
    runtime.observer?.disconnect();
  };

  // Adds a new SVG button to the toolbar
  addButton = (ariaLabel, rawSVGData) => {
    // Create the icon and define properties
    var newButton = document.createElement('div');
    newButton.classList.add(modules.icons?.iconWrapper, modules.icons?.clickable, 'hsm-element');
    newButton.setAttribute('role', 'button');
    newButton.setAttribute('aria-label', ariaLabel);
    newButton.setAttribute('tabindex', '0');
    newButton.style.cssText = `
      display: inline-block;
      overflow: hidden;
      margin: 0;
      opacity: 1.0;
      width: 24px;
    `;
    newButton.innerHTML = `<svg x="0" y="0" class="icon__9293f" aria-hidden="false" viewBox="-8 -8 24 24">${rawSVGData}</svg>`;

    // Insert icon into the toolbar
    document.getElementById('hsm-toolbar-container').insertBefore(newButton, document.getElementById('hsm-icon-insert-point'));

    // Return DOM Element of newly-created toolbar icon
    return newButton;
  };

  // Toggles a button at the specified index
  toggleButton = (index, toggle = true) => {
    switch (index) {
      case constants.I_SYSTEM_MESSAGES:
        if (toggle) settings.systemMessageButtonActive = !settings.systemMessageButtonActive;
        if (!settings.systemMessageButtonActive) {
          runtime.api.DOM.addStyle('hsm-hide-msg', `.${modules.styles?.systemMessage} { display: none !important; }`);
          buttons.systemMessages.classList.remove(modules.icons?.selected);
          buttons.systemMessages.style.opacity = '0.65';
        }
        else {
          runtime.api.DOM.removeStyle('hsm-hide-msg');
          buttons.systemMessages.classList.add(modules.icons?.selected);
          buttons.systemMessages.style.opacity = '1.0';
        }
        break;

      case constants.I_CHAT_DIVIDERS:
        if (toggle) settings.chatDividerButtonActive = !settings.chatDividerButtonActive;
        if (!settings.chatDividerButtonActive) {
          runtime.api.DOM.addStyle('hsm-hide-div', `.${modules.dividers?.divider} { display: none !important; }`);
          buttons.chatDividers.classList.remove(modules.icons?.selected);
          buttons.chatDividers.style.opacity = '0.65';
        }
        else {
          runtime.api.DOM.removeStyle('hsm-hide-div');
          buttons.chatDividers.classList.add(modules.icons?.selected);
          buttons.chatDividers.style.opacity = '1.0';
        }
        break;
    }
  };
};
