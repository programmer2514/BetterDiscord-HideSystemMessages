/**
 * @name HideSystemMessages
 * @author TenorTheHusky
 * @authorId 563652755814875146
 * @description Adds buttons to toggle system messages and chat dividers
 * @version 1.0.1
 * @website https://github.com/programmer2514/BetterDiscord-HideSystemMessages
 * @source https://raw.githubusercontent.com/programmer2514/BetterDiscord-HideSystemMessages/main/HideSystemMessages.plugin.js
 */

module.exports = (() => {

    // Define plugin configuration
    const config = {
        info: {
            name: 'HideSystemMessages',
            authors: [{
                name: 'TenorTheHusky',
                discord_id: '563652755814875146',
                github_username: 'programmer2514'
            }],
            version: '1.0.1',
            description: 'Adds buttons to toggle system messages and chat dividers',
            github: 'https://github.com/programmer2514/BetterDiscord-HideSystemMessages',
            github_raw: 'https://raw.githubusercontent.com/programmer2514/BetterDiscord-HideSystemMessages/main/HideSystemMessages.plugin.js'
        },
        changelog: [{
            title: '1.0.1',
            items: [
                'Fixed initial startup issues'
            ]
        }, {
            title: '1.0.0',
            items: [
                'Initial release'
            ]
        }]
    };

    // Check for ZeresPluginLibrary
    if (!window.ZeresPluginLibrary) {
        return class {
            constructor() { this._config = config; }
            getName() { return config.info.name; }
            getAuthor() { return config.info.authors.map(a => a.name).join(', '); }
            getDescription() { return config.info.description; }
            getVersion() { return config.info.version; }
            load() {
                BdApi.showConfirmationModal(
                    'Library Missing',
                    `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`,
                    {
                        confirmText: 'Download Now',
                        cancelText: 'Cancel',
                        onConfirm: () => {
                            require('request').get('https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js', async (err, _response, body) => {
                                if (err) {
                                    return require('electron').shell.openExternal('https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js');
                                }
                                await new Promise(r => require('fs').writeFile(require('path').join(BdApi.Plugins.folder, '0PluginLibrary.plugin.js'), body, r));
                            });
                        }
                });
            }
            start() { }
            stop() { }
        }
    }

    // Build plugin
    const [Plugin, Api] = ZeresPluginLibrary.buildPlugin(config);

    // Define plugin class
    return class HideSystemMessages extends Plugin {

        // Main plugin code, called by start() and onSwitch()
        initialize() {

            // Abstract used classes and elements
            this.classSelected = 'selected-29KTGM';
            this.classIconWrapper = 'iconWrapper-2awDjA';
            this.classClickable = 'clickable-ZD7xvu';
            this.classAppWrapper = 'app-2CXKsg';

            this.classSystemMessage = 'systemMessage-1H1Z20'
            this.classChatDivider = 'divider-IqmEqJ'

            this.insertPoint = document.querySelector('.messagesWrapper-RpOMA3');
            this.appWrapper = document.querySelector('.app-3xd6d0');

            let hsm = this;

            // Clean up UI
            this.terminate();

            // Create eventListener
            this.eventListenerController = new AbortController();
            this.eventListenerSignal = this.eventListenerController.signal;

            // Create plugin stylesheet
            this.pluginStyle = document.createElement("style");
            this.pluginStyle.setAttribute('id', 'hsm-stylesheet');
            this.pluginStyle.appendChild(document.createTextNode(""));
            document.head.appendChild(this.pluginStyle);
            hsm.pluginStyle.sheet.insertRule("." + this.classSystemMessage + " {}", 0);
            hsm.pluginStyle.sheet.insertRule("." + this.classChatDivider + " {}", 1);

            // Define & add toolbar container
            this.toolbarContainer = document.createElement('div');
            this.toolbarContainer.setAttribute('id', 'hsm-toolbar-container');
            this.toolbarContainer.classList.add('hsm-element');
            this.toolbarContainer.style.alignItems = 'left';
            this.toolbarContainer.style.display = 'flex';
            this.toolbarContainer.style.padding = '0px';
            this.toolbarContainer.style.margin = '0px';
            this.toolbarContainer.style.border = '0px';
            this.toolbarContainer.style.opacity = '0.1';
            this.toolbarContainer.style.transition = 'opacity 100ms';
            this.toolbarContainer.style.position = 'absolute';
            this.toolbarContainer.style.zIndex = '100000';
            this.toolbarContainer.innerHTML = '<div id="hsm-icon-insert-point" style="display: none;"></div>';

            // Insert toolbar in the correct spot
            hsm.insertPoint.appendChild(hsm.toolbarContainer);

            // Add mutation observer to the app wrapper because otherwise BDFDB nukes the toolbar
            this.appObserver = new MutationObserver((mutationList) => {
                try {
                    for (let i = 0; i < mutationList.length; i++) {
                        if (mutationList[i].addedNodes[0])
                            if (mutationList[i].addedNodes[0].classList.contains(hsm.classAppWrapper))
                                hsm.initialize();
                    }
                } catch(e) {
                    console.warn('%c[HideSystemMessages] ' + '%cFailed to trigger mutationObserver reload! (see below)', 'color: #3a71c1; font-weight: 700;', '');
                    console.warn(e);
                }
            });
            this.appObserver.observe(this.appWrapper, {childList: true});

            // Define & add new toolbar icons
            // Icons are part of the Bootstrap Icons library, which can be found at https://icons.getbootstrap.com/
            this.systemMessageButton = this.addButton("System Messages", '<path fill="currentColor" d="M2 2a2 2 0 0 0-2 2v8.01A2 2 0 0 0 2 14h5.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-.966-.741l5.64-3.471L8 9.583l7-4.2V8.5a.5.5 0 0 0 1 0V4a2 2 0 0 0-2-2H2Zm3.708 6.208L1 11.105V5.383l4.708 2.825ZM1 4.217V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v.217l-7 4.2-7-4.2Z"/><path fill="currentColor" d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-1.993-1.679a.5.5 0 0 0-.686.172l-1.17 1.95-.547-.547a.5.5 0 0 0-.708.708l.774.773a.75.75 0 0 0 1.174-.144l1.335-2.226a.5.5 0 0 0-.172-.686Z"/>', '-8 -8 24 24');
            this.chatDividerButton = this.addButton("Chat Dividers", '<path fill="currentColor" d="M12 3H4a1 1 0 0 0-1 1v2.5H2V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2.5h-1V4a1 1 0 0 0-1-1zM2 9.5h1V12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9.5h1V12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5zm-1.5-2a.5.5 0 0 0 0 1h15a.5.5 0 0 0 0-1H.5z"/>', '-8 -8 24 24');

            // Read stored user data to decide active state of System Messages button
            if (BdApi.getData('HideSystemMessages', 'systemMessageButtonActive') === 'false') {
                hsm.systemMessageButton.classList.remove(hsm.classSelected);
                hsm.systemMessageButton.style.opacity = '0.5';

                hsm.pluginStyle.sheet.deleteRule(0);
                hsm.pluginStyle.sheet.insertRule("." + hsm.classSystemMessage + " { display: none;}", 0);

            } else if (BdApi.getData('HideSystemMessages', 'systemMessageButtonActive') === 'true') {
                hsm.systemMessageButton.classList.add(hsm.classSelected);
                hsm.systemMessageButton.style.opacity = '1.0';
            } else {
                BdApi.setData('HideSystemMessages', 'systemMessageButtonActive', 'true');
                hsm.systemMessageButton.classList.add(hsm.classSelected);
                hsm.systemMessageButton.style.opacity = '1.0';
            }

            // Read stored user data to decide active state of Chat Dividers button
            if (BdApi.getData('HideSystemMessages', 'chatDividerButtonActive') === 'false') {
                hsm.chatDividerButton.classList.remove(hsm.classSelected);
                hsm.chatDividerButton.style.opacity = '0.5';

                hsm.pluginStyle.sheet.deleteRule(1);
                hsm.pluginStyle.sheet.insertRule("." + hsm.classChatDivider + " { display: none;}", 1);

            } else if (BdApi.getData('HideSystemMessages', 'chatDividerButtonActive') === 'true') {
                hsm.chatDividerButton.classList.add(hsm.classSelected);
                hsm.chatDividerButton.style.opacity = '1.0';
            } else {
                BdApi.setData('HideSystemMessages', 'chatDividerButtonActive', 'true');
                hsm.chatDividerButton.classList.add(hsm.classSelected);
                hsm.chatDividerButton.style.opacity = '1.0';
            }

            // Add event listener to the System Messages button to update on click and hover
            hsm.systemMessageButton.addEventListener('click', function(){
                hsm.toggleButton(0);
            }, {signal: hsm.eventListenerSignal});

            hsm.systemMessageButton.addEventListener('mouseenter', function(){
                hsm.toolbarContainer.style.opacity = '1.0';
            }, {signal: hsm.eventListenerSignal});

            hsm.systemMessageButton.addEventListener('mouseleave', function(){
                hsm.toolbarContainer.style.opacity = '0.1';
            }, {signal: hsm.eventListenerSignal});

            // Add event listener to the Chat Dividers button to update on click
            hsm.chatDividerButton.addEventListener('click', function(){
                hsm.toggleButton(1);
            }, {signal: hsm.eventListenerSignal});

            hsm.chatDividerButton.addEventListener('mouseenter', function(){
                hsm.toolbarContainer.style.opacity = '1.0';
            }, {signal: hsm.eventListenerSignal});

            hsm.chatDividerButton.addEventListener('mouseleave', function(){
                hsm.toolbarContainer.style.opacity = '0.1';
            }, {signal: hsm.eventListenerSignal});
        }

        // Terminate the plugin and undo its effects
        terminate() {
            let hsm = BdApi.Plugins.get('HideSystemMessages').instance;

            // Remove buttons
            document.querySelectorAll('.hsm-element').forEach(e => e.remove());

            // Undo plugin effects
            if (hsm.pluginStyle)
                hsm.pluginStyle.parentNode.removeChild(hsm.pluginStyle);

            // Abort listeners & observers
            if (hsm.eventListenerController)
                hsm.eventListenerController.abort();
            if (hsm.appObserver)
                hsm.appObserver.disconnect();
        }

        // Initialize the plugin when it is enabled
        start() {
            Api.DiscordModules.UserStore.addConditionalChangeListener(() => {
                if (Api.DiscordModules.UserStore.getCurrentUser()) {
                    console.log('%c[HideSystemMessages] ' + `%c(v${BdApi.Plugins.get('HideSystemMessages').version}) ` + '%chas started.', 'color: #3a71c1; font-weight: 700;', 'color: #666; font-weight: 600;', '');

                    try {
                        this.initialize();
                    } catch(e) {
                        console.warn('%c[HideSystemMessages] ' + '%cCould not initialize plugin! (see below)	', 'color: #3a71c1; font-weight: 700;', '');
                        console.warn(e);
                    }

                    return false;
                }
            });
        }

        // Restore the default UI when the plugin is disabled
        stop() {
            // Terminate HideSystemMessages
            this.terminate();

            // Send shutdown message
            console.log('%c[CollapsibleUI] ' + `%c(v${BdApi.Plugins.get('HideSystemMessages').version}) ` + '%chas stopped.', 'color: #3a71c1; font-weight: 700;', 'color: #666; font-weight: 600;', '');
        }

        // Re-initialize the plugin on channel/server switch
        onSwitch() {
            try {
                this.initialize();
            } catch(e) {
                console.warn('%c[HideSystemMessages] ' + '%cCould not initialize plugin! (see below)', 'color: #3a71c1; font-weight: 700;', '');
                console.warn(e);
            }
        }

        // Adds a new SVG button to the toolbar
        addButton(ariaLabel, rawSVGData, viewBox) {
            let hsm = BdApi.Plugins.get('HideSystemMessages').instance;

            // Create the icon and define properties
            var newButton = document.createElement('div');
                newButton.classList.add(hsm.classIconWrapper);
                newButton.classList.add(hsm.classClickable);
                newButton.classList.add('hsm-element');
                newButton.setAttribute('role', 'button');
                newButton.setAttribute('aria-label', ariaLabel);
                newButton.setAttribute('tabindex', '0');
                newButton.style.display = 'inline-block';
                newButton.style.overflow = 'hidden';
                newButton.style.margin = '0px';
                newButton.style.opacity = '1.0';
                newButton.innerHTML = '<svg x="0" y="0" class="icon-2xnN2Y" aria-hidden="false" viewBox="' + viewBox + '">' + rawSVGData + '</svg>';

            // Insert icon to the left of the search bar
            document.getElementById('hsm-toolbar-container').insertBefore(newButton, document.getElementById('hsm-icon-insert-point'));

            // Return DOM Element of newly-created toolbar icon
            return newButton;

        }

        // Toggles a button at the specified index

        /* BUTTON INDEX:            *
         *--------------------------*
         * 0 - systemMessageButton  *
         * 1 - chatDividerButton    *
         *--------------------------*/
        toggleButton(index) {
            let hsm = BdApi.Plugins.get('HideSystemMessages').instance;
            switch (index) {
                case 0:
                    if (BdApi.getData('HideSystemMessages', 'systemMessageButtonActive') === 'true') {

                        hsm.pluginStyle.sheet.deleteRule(0);
                        hsm.pluginStyle.sheet.insertRule("." + hsm.classSystemMessage + " { display: none;}", 0);

                        BdApi.setData('HideSystemMessages', 'systemMessageButtonActive', 'false');
                        hsm.systemMessageButton.classList.remove(hsm.classSelected);
                        hsm.systemMessageButton.style.opacity = '0.5';
                    } else {

                        hsm.pluginStyle.sheet.deleteRule(0);
                        hsm.pluginStyle.sheet.insertRule("." + hsm.classSystemMessage + " {}", 0);

                        BdApi.setData('HideSystemMessages', 'systemMessageButtonActive', 'true');
                        hsm.systemMessageButton.classList.add(hsm.classSelected);
                        hsm.systemMessageButton.style.opacity = '1.0';
                    }
                    break;

                case 1:
                    if (BdApi.getData('HideSystemMessages', 'chatDividerButtonActive') === 'true') {

                        hsm.pluginStyle.sheet.deleteRule(1);
                        hsm.pluginStyle.sheet.insertRule("." + hsm.classChatDivider + " { display: none;}", 1);

                        BdApi.setData('HideSystemMessages', 'chatDividerButtonActive', 'false');
                        hsm.chatDividerButton.classList.remove(hsm.classSelected);
                        hsm.chatDividerButton.style.opacity = '0.5';
                    } else {

                        hsm.pluginStyle.sheet.deleteRule(1);
                        hsm.pluginStyle.sheet.insertRule("." + hsm.classChatDivider + " {}", 1);

                        BdApi.setData('HideSystemMessages', 'chatDividerButtonActive', 'true');
                        hsm.chatDividerButton.classList.add(hsm.classSelected);
                        hsm.chatDividerButton.style.opacity = '1.0';
                    }
                    break;

                default:
                    break;
            }
        }
    }

})();
