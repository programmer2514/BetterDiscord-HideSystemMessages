/**
 * @name HideSystemMessages
 * @author programmer2514
 * @authorId 563652755814875146
 * @description Adds buttons to toggle system messages and chat dividers
 * @version 1.2.0
 * @donate https://ko-fi.com/benjaminpryor
 * @patreon https://www.patreon.com/BenjaminPryor
 * @website https://github.com/programmer2514/BetterDiscord-HideSystemMessages
 * @source https://raw.githubusercontent.com/programmer2514/BetterDiscord-HideSystemMessages/main/HideSystemMessages.plugin.js
 */

module.exports = (() => {
  // Define plugin configuration
  const config = {
    info: {
      name: 'HideSystemMessages',
      authors: [{
        name: 'programmer2514',
        discord_id: '563652755814875146',
        github_username: 'programmer2514',
      }],
      version: '1.2.0',
      description: 'Adds buttons to toggle system messages and chat dividers',
      github: 'https://github.com/programmer2514/BetterDiscord-HideSystemMessages',
      github_raw: 'https://raw.githubusercontent.com/programmer2514/BetterDiscord-HideSystemMessages/main/HideSystemMessages.plugin.js',
    },
    changelog: [{
      title: '1.2.0',
      items: [
        'Fixed on newest Discord release',
        'Increased button visibility',
        'Refactored plugin code',
      ],
    }, {
      title: '1.0.1 - 1.1.0',
      items: [
        'Fixed initial startup issues',
        'Cleaned up method of getting plugin instance',
        'Cleaned up unnecessary console warnings',
        'Hotfix for newest Discord release (breaks plugin on Discord versions <238110)',
        'Added donation links',
      ],
    }, {
      title: '1.0.0',
      items: [
        'Initial release',
      ],
    }],
  };

  // Check for ZeresPluginLibrary
  if (!window.ZeresPluginLibrary) {
    return class {
      load = () => {
        BdApi.UI.showConfirmationModal(
          'Library Missing',
          `The library plugin needed for ${config.info.name} is missing. \
            Please click Download Now to install it.`, {
            confirmText: 'Download Now',
            cancelText: 'Cancel',
            onConfirm: () => {
              require('request')
                .get('https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js',
                  async (err, _response, body) => {
                    if (err) {
                      return require('electron').shell
                        .openExternal('https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js');
                    }
                    await new Promise(r => require('fs').writeFile(require('path')
                      .join(BdApi.Plugins.folder, '0PluginLibrary.plugin.js'), body, r));
                  });
            },
          });
      };

      start = () => {};
      stop = () => {};
    };
  }

  // Build plugin
  const [Plugin, Library] = ZeresPluginLibrary.buildPlugin(config);

  // Define plugin class
  return class HideSystemMessages extends Plugin {
    // Get plugin metadata
    constructor(meta) {
      super();
      this.meta = meta;
    }

    // Initialize the plugin when it is enabled
    start = async () => {
      if (Library.DiscordModules.UserStore.getCurrentUser()) {
        console.log(`%c[${this.meta.name}] ` + '%cAttempting pre-load...',
          'color: #3a71c1; font-weight: 700;', '');
        await this.initialize();
      }
      Library.DiscordModules.Dispatcher.subscribe('POST_CONNECTION_OPEN',
        this.initialize);
      console.log(`%c[${this.meta.name}] `
        + `%c(v${this.meta.version}) `
        + '%chas started.', 'color: #3a71c1; font-weight: 700;',
      'color: #666; font-weight: 600;', '');
    };

    // Restore the default UI when the plugin is disabled
    stop = () => {
      // Terminate HideSystemMessages
      this.terminate();

      // Send shutdown message
      console.log(`%c[${this.meta.name}] `
        + `%c(v${this.meta.version}) `
        + '%chas stopped.', 'color: #3a71c1; font-weight: 700;',
      'color: #666; font-weight: 600;', '');
    };

    // Re-initialize the plugin on channel/server switch
    onSwitch = () => { this.initialize(); };

    // Main plugin code, called by start() and onSwitch()
    initialize = async () => {
      // Make this accessable to arrow functions
      let _this = this;

      // Abstract used classes and elements
      this.classSelected = 'selected_fc4f04';
      this.classIconWrapper = 'iconWrapper_fc4f04';
      this.classClickable = 'clickable_fc4f04';
      this.classAppWrapper = 'app_a01fb1';
      this.classLayers = 'layers_a01fb1';

      this.classSystemMessage = 'systemMessage_d5deea';
      this.classChatDivider = 'divider_c2654d';

      this.insertPoint = document.querySelector('.messagesWrapper_e2e187');
      this.observedContainer = document.querySelector('.app_bd26cc');

      // Clean up UI
      this.terminate();

      // Only run if the messages wrapper exists
      if (!this.insertPoint) return;

      // Create eventListener
      this.eventListenerController = new AbortController();
      this.eventListenerSignal = this.eventListenerController.signal;

      // Create plugin stylesheet
      this.pluginStyle = document.createElement('style');
      this.pluginStyle.setAttribute('id', 'hsm-stylesheet');
      this.pluginStyle.appendChild(document.createTextNode(''));
      document.head.appendChild(this.pluginStyle);
      this.pluginStyle.sheet.insertRule('.' + this.classSystemMessage + ' {}', 0);
      this.pluginStyle.sheet.insertRule('.' + this.classChatDivider + ' {}', 1);

      // Define & add toolbar container
      this.toolbarContainer = document.createElement('div');
      this.toolbarContainer.setAttribute('id', 'hsm-toolbar-container');
      this.toolbarContainer.classList.add('hsm-element');
      this.toolbarContainer.style.cssText = `
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
      this.toolbarContainer.innerHTML = '<div id="hsm-icon-insert-point" style="display: none;"></div>';

      // Insert toolbar in the correct spot
      this.insertPoint.appendChild(this.toolbarContainer);

      // Add mutation observer to the app wrapper because otherwise BDFDB nukes the toolbar
      this.appObserver = new MutationObserver((mutationList) => {
        setTimeout(() => {
          mutationList.forEach((mutationRecord) => {
            mutationRecord.addedNodes.forEach((node) => {
              if (node.classList?.contains(_this.classAppWrapper)
                || node.classList?.contains(_this.classLayers))
                _this.initialize();
            });
          });
        }, 0);
      });
      this.appObserver.observe(this.observedContainer, {
        childList: true,
        subtree: true,
        attributes: false,
      });

      // Define & add new toolbar icons
      // Icons are part of the Bootstrap Icons library, which can be found at https://icons.getbootstrap.com/
      this.systemMessageButton = this.addButton('System Messages', '<path fill="currentColor" d="M2 2a2 2 0 0 0-2 2v8.01A2 2 0 0 0 2 14h5.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-.966-.741l5.64-3.471L8 9.583l7-4.2V8.5a.5.5 0 0 0 1 0V4a2 2 0 0 0-2-2H2Zm3.708 6.208L1 11.105V5.383l4.708 2.825ZM1 4.217V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v.217l-7 4.2-7-4.2Z"/><path fill="currentColor" d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-1.993-1.679a.5.5 0 0 0-.686.172l-1.17 1.95-.547-.547a.5.5 0 0 0-.708.708l.774.773a.75.75 0 0 0 1.174-.144l1.335-2.226a.5.5 0 0 0-.172-.686Z"/>', '-8 -8 24 24');
      this.chatDividerButton = this.addButton('Chat Dividers', '<path fill="currentColor" d="M12 3H4a1 1 0 0 0-1 1v2.5H2V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2.5h-1V4a1 1 0 0 0-1-1zM2 9.5h1V12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9.5h1V12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5zm-1.5-2a.5.5 0 0 0 0 1h15a.5.5 0 0 0 0-1H.5z"/>', '-8 -8 24 24');

      // Read stored user data to decide active state of System Messages button
      if (BdApi.getData('HideSystemMessages', 'systemMessageButtonActive') === 'false') {
        this.systemMessageButton.classList.remove(this.classSelected);
        this.systemMessageButton.style.opacity = '0.5';

        this.pluginStyle.sheet.deleteRule(0);
        this.pluginStyle.sheet.insertRule('.' + this.classSystemMessage + ' { display: none !important;}', 0);
      }
      else {
        BdApi.setData('HideSystemMessages', 'systemMessageButtonActive', 'true');
        this.systemMessageButton.classList.add(this.classSelected);
        this.systemMessageButton.style.opacity = '1.0';
      }

      // Read stored user data to decide active state of Chat Dividers button
      if (BdApi.getData('HideSystemMessages', 'chatDividerButtonActive') === 'false') {
        this.chatDividerButton.classList.remove(this.classSelected);
        this.chatDividerButton.style.opacity = '0.5';

        this.pluginStyle.sheet.deleteRule(1);
        this.pluginStyle.sheet.insertRule('.' + this.classChatDivider + ' { display: none !important; }', 1);
      }
      else {
        BdApi.setData('HideSystemMessages', 'chatDividerButtonActive', 'true');
        this.chatDividerButton.classList.add(this.classSelected);
        this.chatDividerButton.style.opacity = '1.0';
      }

      // Add event listener to the System Messages button to update on click and hover
      this.systemMessageButton.addEventListener('click', function () {
        _this.toggleButton(0);
      }, { signal: this.eventListenerSignal });

      this.systemMessageButton.addEventListener('mouseenter', function () {
        _this.toolbarContainer.style.opacity = '1.0';
      }, { signal: this.eventListenerSignal });

      this.systemMessageButton.addEventListener('mouseleave', function () {
        _this.toolbarContainer.style.opacity = '0.25';
      }, { signal: this.eventListenerSignal });

      // Add event listener to the Chat Dividers button to update on click
      this.chatDividerButton.addEventListener('click', function () {
        _this.toggleButton(1);
      }, { signal: this.eventListenerSignal });

      this.chatDividerButton.addEventListener('mouseenter', function () {
        _this.toolbarContainer.style.opacity = '1.0';
      }, { signal: this.eventListenerSignal });

      this.chatDividerButton.addEventListener('mouseleave', function () {
        _this.toolbarContainer.style.opacity = '0.25';
      }, { signal: this.eventListenerSignal });
    };

    // Terminate the plugin and undo its effects
    terminate = () => {
      // Remove buttons
      document.querySelectorAll('.hsm-element').forEach(e => e.remove());

      // Undo plugin effects
      this.pluginStyle?.parentNode?.removeChild(this.pluginStyle);

      // Abort listeners & observers
      this.eventListenerController?.abort();
      this.appObserver?.disconnect();
    };

    // Adds a new SVG button to the toolbar
    addButton = (ariaLabel, rawSVGData, viewBox) => {
      // Create the icon and define properties
      var newButton = document.createElement('div');
      newButton.classList.add(this.classIconWrapper, this.classClickable, 'hsm-element');
      newButton.setAttribute('role', 'button');
      newButton.setAttribute('aria-label', ariaLabel);
      newButton.setAttribute('tabindex', '0');
      newButton.style.cssText = `
        display: inline-block;
        overflow: hidden;
        margin: 0;
        opacity: 1.0;
      `;
      newButton.innerHTML = `<svg x="0" y="0" class="icon_fc4f04" aria-hidden="false" viewBox="${viewBox}">${rawSVGData}</svg>`;

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
          if (BdApi.getData('HideSystemMessages', 'systemMessageButtonActive') === 'true') {
            this.pluginStyle.sheet.deleteRule(0);
            this.pluginStyle.sheet.insertRule('.' + this.classSystemMessage + ' { display: none;}', 0);

            BdApi.setData('HideSystemMessages', 'systemMessageButtonActive', 'false');
            this.systemMessageButton.classList.remove(this.classSelected);
            this.systemMessageButton.style.opacity = '0.5';
          }
          else {
            this.pluginStyle.sheet.deleteRule(0);
            this.pluginStyle.sheet.insertRule('.' + this.classSystemMessage + ' {}', 0);

            BdApi.setData('HideSystemMessages', 'systemMessageButtonActive', 'true');
            this.systemMessageButton.classList.add(this.classSelected);
            this.systemMessageButton.style.opacity = '1.0';
          }
          break;

        case 1:
          if (BdApi.getData('HideSystemMessages', 'chatDividerButtonActive') === 'true') {
            this.pluginStyle.sheet.deleteRule(1);
            this.pluginStyle.sheet.insertRule('.' + this.classChatDivider + ' { display: none;}', 1);

            BdApi.setData('HideSystemMessages', 'chatDividerButtonActive', 'false');
            this.chatDividerButton.classList.remove(this.classSelected);
            this.chatDividerButton.style.opacity = '0.5';
          }
          else {
            this.pluginStyle.sheet.deleteRule(1);
            this.pluginStyle.sheet.insertRule('.' + this.classChatDivider + ' {}', 1);

            BdApi.setData('HideSystemMessages', 'chatDividerButtonActive', 'true');
            this.chatDividerButton.classList.add(this.classSelected);
            this.chatDividerButton.style.opacity = '1.0';
          }
          break;

        default:
          break;
      }
    };
  };
})();
