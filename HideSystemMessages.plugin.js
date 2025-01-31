/**
 * @name HideSystemMessages
 * @author programmer2514
 * @authorId 563652755814875146
 * @description Adds buttons to toggle system messages and chat dividers
 * @version 2.0.0
 * @donate https://ko-fi.com/benjaminpryor
 * @patreon https://www.patreon.com/BenjaminPryor
 * @website https://github.com/programmer2514/BetterDiscord-HideSystemMessages
 * @source https://github.com/programmer2514/BetterDiscord-HideSystemMessages/raw/refs/heads/main/HideSystemMessages.plugin.js
 */

const config = {
  changelog: [
    {
      title: '2.0.0',
      type: 'added',
      items: [
        'Fixed for latest Discord release',
        'Plugin no longer depends on ZeresPluginLibrary',
        'Greatly increased robustness against Discord updates',
      ],
    },
    {
      title: '1.0.1 - 1.2.0',
      type: 'added',
      items: [
        'Fixed initial startup issues',
        'Cleaned up method of getting plugin instance',
        'Cleaned up unnecessary console warnings',
        'Hotfix for newest Discord release (breaks plugin on Discord versions <238110)',
        'Added donation links',
        'Fixed on newest Discord release',
        'Increased button visibility',
        'Refactored plugin code',
      ],
    },
    {
      title: '1.0.0',
      type: 'added',
      items: [
        'Initial release',
      ],
    },
  ],
};

const runtime = {
  meta: null,
  api: null,
  events: {
    controller: null,
    signal: null,
  },
  observer: null,
};

const modules = {
  icons: null,
  app: null,
  styles: null,
  dividers: null,
  scroller: null,
  window: null,
};

const elements = {
  insertPoint: null,
  observedContainer: null,
};

const buttons = {
  container: null,
  systemMessages: null,
  chatDividers: null,
};

module.exports = class HideSystemMessages {
  // Get api and metadata
  constructor(meta) {
    runtime.meta = meta;
    runtime.api = new BdApi(runtime.meta.name);
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

    // Load Discord modules
    const UserStore = runtime.api.Webpack.getByKeys('getCurrentUser', 'getUser');
    const Dispatcher = runtime.api.Webpack.getByKeys('dispatch', 'isDispatching');

    // Start plugin
    if (UserStore.getCurrentUser()) {
      console.log(`%c[${runtime.meta.name}] ` + '%cAttempting pre-load...',
        'color: #3a71c1; font-weight: 700;', '');
      await this.initialize();
    }

    Dispatcher.subscribe('POST_CONNECTION_OPEN', this.initialize);

    console.log(`%c[${runtime.meta.name}] `
      + `%c(v${runtime.meta.version}) `
      + '%chas started.', 'color: #3a71c1; font-weight: 700;',
    'color: #666; font-weight: 600;', '');
  };

  // Restore the default UI when the plugin is disabled
  stop = () => {
    // Terminate HideSystemMessages
    this.terminate();

    // Send shutdown message
    console.log(`%c[${runtime.meta.name}] `
      + `%c(v${runtime.meta.version}) `
      + '%chas stopped.', 'color: #3a71c1; font-weight: 700;',
    'color: #666; font-weight: 600;', '');
  };

  // Re-initialize the plugin on channel/server switch
  onSwitch = async () => { this.initialize(); };

  // Main plugin code, called by start() and onSwitch()
  initialize = async () => {
    // Make this accessible to arrow functions
    let _this = this;

    // Get modules
    modules.icons = runtime.api.Webpack.getByKeys('selected', 'iconWrapper', 'clickable', 'icon');
    modules.app = runtime.api.Webpack.getByKeys('app', 'layers');
    modules.styles = runtime.api.Webpack.getByKeys('ephemeral', 'replying', 'messageListItem');
    modules.dividers = runtime.api.Webpack.getByKeys('divider', 'isUnread', 'unreadPill');
    modules.scroller = runtime.api.Webpack.getByKeys('messagesWrapper', 'scrollerContent', 'scroller');
    modules.window = runtime.api.Webpack.getByKeys('appAsidePanelWrapper', 'mobileApp');

    // Get elements
    elements.insertPoint = document.querySelector('.' + modules.scroller.messagesWrapper);
    elements.observedContainer = document.querySelector('.' + modules.window.app);

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
      opacity: 0.25;
      transition: opacity 100ms;
      filter: drop-shadow(0px 0px 6px #000000);
      z-index: 100000;
    `;
    buttons.container.innerHTML = '<div id="hsm-icon-insert-point" style="display: none;"></div>';

    // Insert toolbar in the correct spot
    elements.insertPoint.appendChild(buttons.container);

    // Add mutation observer to the app wrapper because otherwise BDFDB nukes the toolbar
    runtime.observer = new MutationObserver((mutationList) => {
      setTimeout(() => {
        mutationList.forEach((mutationRecord) => {
          mutationRecord.addedNodes.forEach((node) => {
            if (node.classList?.contains(modules.app.app)
              || node.classList?.contains(modules.app.layers))
              _this.initialize();
          });
        });
      }, 0);
    });
    runtime.observer.observe(elements.observedContainer, {
      childList: true,
      subtree: true,
      attributes: false,
    });

    // Define & add new toolbar icons
    // Icons are part of the Bootstrap Icons library, which can be found at https://icons.getbootstrap.com/
    buttons.systemMessages = this.addButton('System Messages', '<path fill="currentColor" d="M2 2a2 2 0 0 0-2 2v8.01A2 2 0 0 0 2 14h5.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-.966-.741l5.64-3.471L8 9.583l7-4.2V8.5a.5.5 0 0 0 1 0V4a2 2 0 0 0-2-2H2Zm3.708 6.208L1 11.105V5.383l4.708 2.825ZM1 4.217V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v.217l-7 4.2-7-4.2Z"/><path fill="currentColor" d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-1.993-1.679a.5.5 0 0 0-.686.172l-1.17 1.95-.547-.547a.5.5 0 0 0-.708.708l.774.773a.75.75 0 0 0 1.174-.144l1.335-2.226a.5.5 0 0 0-.172-.686Z"/>', '-8 -8 24 24');
    buttons.chatDividers = this.addButton('Chat Dividers', '<path fill="currentColor" d="M12 3H4a1 1 0 0 0-1 1v2.5H2V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2.5h-1V4a1 1 0 0 0-1-1zM2 9.5h1V12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9.5h1V12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5zm-1.5-2a.5.5 0 0 0 0 1h15a.5.5 0 0 0 0-1H.5z"/>', '-8 -8 24 24');

    // Read stored user data to decide active state of System Messages button
    if (!runtime.api.Data.load('system-message-button-active')) {
      buttons.systemMessages.classList.remove(modules.icons.selected);
      buttons.systemMessages.style.opacity = '0.5';

      runtime.api.DOM.addStyle('hsm-hide-msg', `.${modules.styles.systemMessage} { display: none !important; }`);
    }
    else {
      runtime.api.Data.save('system-message-button-active', true);
      buttons.systemMessages.classList.add(modules.icons.selected);
      buttons.systemMessages.style.opacity = '1.0';
    }

    // Read stored user data to decide active state of Chat Dividers button
    if (!runtime.api.Data.load('chat-divider-button-active')) {
      buttons.chatDividers.classList.remove(modules.icons.selected);
      buttons.chatDividers.style.opacity = '0.5';

      runtime.api.DOM.addStyle('hsm-hide-div', `.${modules.dividers.divider} { display: none !important; }`);
    }
    else {
      runtime.api.Data.save('chat-divider-button-active', true);
      buttons.chatDividers.classList.add(modules.icons.selected);
      buttons.chatDividers.style.opacity = '1.0';
    }

    // Add event listener to the System Messages button to update on click and hover
    buttons.systemMessages.addEventListener('click', function () {
      _this.toggleButton(0);
    }, { signal: runtime.events.signal });

    buttons.systemMessages.addEventListener('mouseenter', function () {
      buttons.container.style.opacity = '1.0';
    }, { signal: runtime.events.signal });

    buttons.systemMessages.addEventListener('mouseleave', function () {
      buttons.container.style.opacity = '0.25';
    }, { signal: runtime.events.signal });

    // Add event listener to the Chat Dividers button to update on click
    buttons.chatDividers.addEventListener('click', function () {
      _this.toggleButton(1);
    }, { signal: runtime.events.signal });

    buttons.chatDividers.addEventListener('mouseenter', function () {
      buttons.container.style.opacity = '1.0';
    }, { signal: runtime.events.signal });

    buttons.chatDividers.addEventListener('mouseleave', function () {
      buttons.container.style.opacity = '0.25';
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
  addButton = (ariaLabel, rawSVGData, viewBox) => {
    // Create the icon and define properties
    var newButton = document.createElement('div');
    newButton.classList.add(modules.icons.iconWrapper, modules.icons.clickable, 'hsm-element');
    newButton.setAttribute('role', 'button');
    newButton.setAttribute('aria-label', ariaLabel);
    newButton.setAttribute('tabindex', '0');
    newButton.style.cssText = `
      display: inline-block;
      overflow: hidden;
      margin: 0;
      opacity: 1.0;
    `;
    newButton.innerHTML = `<svg x="0" y="0" class="icon__9293f" aria-hidden="false" viewBox="${viewBox}">${rawSVGData}</svg>`;

    // Insert icon to the left of the search bar
    document.getElementById('hsm-toolbar-container').insertBefore(newButton, document.getElementById('hsm-icon-insert-point'));

    // Return DOM Element of newly-created toolbar icon
    return newButton;
  };

  // Toggles a button at the specified index

  /* BUTTON INDEX:             *
    * ------------------------- *
    *  0 - systemMessageButton  *
    *  1 - chatDividerButton    *
    * ------------------------- */
  toggleButton = (index) => {
    switch (index) {
      case 0:
        if (runtime.api.Data.load('system-message-button-active')) {
          runtime.api.DOM.addStyle('hsm-hide-msg', `.${modules.styles.systemMessage} { display: none !important; }`);

          runtime.api.Data.save('system-message-button-active', false);
          buttons.systemMessages.classList.remove(modules.icons.selected);
          buttons.systemMessages.style.opacity = '0.5';
        }
        else {
          runtime.api.DOM.removeStyle('hsm-hide-msg');

          runtime.api.Data.save('system-message-button-active', true);
          buttons.systemMessages.classList.add(modules.icons.selected);
          buttons.systemMessages.style.opacity = '1.0';
        }
        break;

      case 1:
        if (runtime.api.Data.load('chat-divider-button-active')) {
          runtime.api.DOM.addStyle('hsm-hide-div', `.${modules.dividers.divider} { display: none !important; }`);

          runtime.api.Data.save('chat-divider-button-active', false);
          buttons.chatDividers.classList.remove(modules.icons.selected);
          buttons.chatDividers.style.opacity = '0.5';
        }
        else {
          runtime.api.DOM.removeStyle('hsm-hide-div');

          runtime.api.Data.save('chat-divider-button-active', true);
          buttons.chatDividers.classList.add(modules.icons.selected);
          buttons.chatDividers.style.opacity = '1.0';
        }
        break;

      default:
        break;
    }
  };
};
