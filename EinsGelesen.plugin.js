/**
 * @name EinsGelesen
 * @author EinsMarvs
 * @version 1.0.0
 * @description Fügt der Serverliste und dem Erwähnungs-Popup eine Schaltfläche "Löschen" hinzu | Made by EinsMarvs | BETA-VERSION
 */

 module.exports = (_ => {
	const config = {
		"info": {
			"name": "EinsGelesen",
			"author": "EinsMarvs",
			"version": "1.0.0",
			"description": "Fügt der Serverliste und dem Erwähnungs-Popup eine Schaltfläche 'Löschen' hinzu | Made by EinsMarvs | BETA-VERSION"
		}
	};

	return !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
		getName () {return config.info.name;}
		getAuthor () {return config.info.author;}
		getVersion () {return config.info.version;}
		getDescription () {return `Das für ${config.info.name} benötigte Bibliotheks-Plugin fehlt. Öffnen Sie die Plugin-Einstellungen, um es herunterzuladen. \n\n${config.info.description}`;}
		
		downloadLibrary () {
			require("request").get("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js", (e, r, b) => {
				if (!e && b && r.statusCode == 200) require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => BdApi.showToast("Finished downloading BDFDB Library", {type: "success"}));
				else BdApi.alert("Fehler", "Das BDFDB Library Plugin konnte nicht heruntergeladen werden. Versuchen Sie es später erneut oder laden Sie es manuell von GitHub herunter: https://mwittrien.github.io/downloader/?library");
			});
		}
		
		load () {
			if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, {pluginQueue: []});
			if (!window.BDFDB_Global.downloadModal) {
				window.BDFDB_Global.downloadModal = true;
				BdApi.showConfirmationModal("Bibliothek fehlt", `Das für ${config.info.name} benötigte Bibliotheks-Plugin fehlt. Bitte klicken Sie auf "Jetzt herunterladen", um es zu installieren.`, {
					confirmText: "Jetzt herunterladen",
					cancelText: "Abbruch",
					onCancel: _ => {delete window.BDFDB_Global.downloadModal;},
					onConfirm: _ => {
						delete window.BDFDB_Global.downloadModal;
						this.downloadLibrary();
					}
				});
			}
			if (!window.BDFDB_Global.pluginQueue.includes(config.info.name)) window.BDFDB_Global.pluginQueue.push(config.info.name);
		}
		start () {this.load();}
		stop () {}
		getSettingsPanel () {
			let template = document.createElement("template");
			template.innerHTML = `<div style="color: var(--header-primary); font-size: 16px; font-weight: 300; white-space: pre; line-height: 22px;">Das für ${config.info.name} benötigte Bibliotheks-Plugin fehlt.\nBitte klicken Sie auf <a style="font-weight: 500;">Jetzt herunterladen</a>, um es zu installieren.</div>`;
			template.content.firstElementChild.querySelector("a").addEventListener("click", this.downloadLibrary);
			return template.content.firstElementChild;
		}
	} : (([Plugin, BDFDB]) => {
		var _this;
		var blacklist, clearing;
		var settings = {};
		
		const ReadAllButtonComponent = class ReadAllButton extends BdApi.React.Component {
			clearClick() {
				if (settings.includeGuilds) this.clearGuilds(settings.includeMuted ? this.getGuilds() : this.getUnread());
				if (settings.includeDMs) BDFDB.DMUtils.markAsRead(this.getPingedDMs());
			}
			clearGuilds(guildIds) {
				BDFDB.GuildUtils.markAsRead(guildIds.filter(id => id && !blacklist.includes(id)));
			}
			getGuilds() {
				return BDFDB.LibraryModules.FolderStore.getFlattenedGuilds().map(g => g.id).filter(n => n);
			}
			getUnread() {
				return this.getGuilds().filter(id => BDFDB.LibraryModules.UnreadGuildUtils.hasUnread(id) || BDFDB.LibraryModules.UnreadGuildUtils.getMentionCount(id) > 0);
			}
			getPinged() {
				return this.getGuilds().filter(id => BDFDB.LibraryModules.UnreadGuildUtils.getMentionCount(id) > 0);
			}
			getMuted() {
				return this.getGuilds().filter(id => BDFDB.LibraryModules.MutedUtils.isGuildOrCategoryOrChannelMuted(id));
			}
			getPingedDMs() {
				return BDFDB.LibraryModules.ChannelStore.getSortedPrivateChannels().map(c => c.id).filter(id => id && BDFDB.LibraryModules.UnreadChannelUtils.getMentionCount(id) > 0);
			}
			render() {
				return BDFDB.ReactUtils.createElement("div", {
					className: BDFDB.disCNS.guildouter + BDFDB.disCN._readallnotificationsbuttonframe,
					children: BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.disCNS.guildiconwrapper + BDFDB.disCN._readallnotificationsbuttoninner,
							children: BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.disCNS.guildiconchildwrapper + BDFDB.disCN._readallnotificationsbuttonbutton,
							children: "Alle lesen",
							onClick: _ => {
								if (!settings.confirmClear) this.clearClick();
								else BDFDB.ModalUtils.confirm(_this, _this.labels.modal_confirmnotifications, _ => this.clearClick());
							},
							onContextMenu: event => {
								BDFDB.ContextMenuUtils.open(_this, event, BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuGroup, {
									children: [
										BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuItem, {
											label: _this.labels.context_unreadguilds,
											id: BDFDB.ContextMenuUtils.createItemId(_this.name, "markieren-ungelesen-lesen"),
											action: _ => this.clearGuilds(this.getUnread())
										}),
										BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuItem, {
											label: _this.labels.context_pingedguilds,
											id: BDFDB.ContextMenuUtils.createItemId(_this.name, "markieren-gelesen"),
											action: _ => this.clearGuilds(this.getPinged())
										}),
										BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuItem, {
											label: _this.labels.context_mutedguilds,
											id: BDFDB.ContextMenuUtils.createItemId(_this.name, "stumm-lesen markieren"),
											action: _ => this.clearGuilds(this.getMuted())
										}),
										BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuItem, {
											label: _this.labels.context_guilds,
											id: BDFDB.ContextMenuUtils.createItemId(_this.name, "alles-lesen-markieren"),
											action: _ => this.clearGuilds(this.getGuilds())
										}),
										BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuItem, {
											label: _this.labels.context_dms,
											id: BDFDB.ContextMenuUtils.createItemId(_this.name, "markieren-dms-lesen"),
											action: _ => BDFDB.DMUtils.markAsRead(this.getPingedDMs())
										})
									]
								}));
							}
						})
					})
				});
			}
		};
	
		return class ReadAllNotificationsButton extends Plugin {
			onLoad () {
				_this = this;
				
				this.defaults = {
					settings: {
						addClearButton:	{value: true, 	inner: false,	description: "Hinzufügen einer Schaltfläche 'Erwähnungen löschen' zum Popout der letzten Erwähnungen"},
						confirmClear:	{value: false,	inner: false, 	description: "Bitten Sie vor dem Löschen um Ihre Bestätigung"},
						includeGuilds:	{value: true, 	inner: true,	description: "ungelesene Server"},
						includeMuted:	{value: false, 	inner: true,	description: "stummgeschaltete ungelesene Server"},
						includeDMs:		{value: false, 	inner: true,	description: "ungelesene DMs"}
					}
				};
				
				this.patchedModules = {
					after: {
						Guilds: "render",
						RecentMentions: "default",
						RecentsHeader: "default"
					}
				};
				
				this.css = `
					${BDFDB.dotCN.messagespopouttabbar} {
						flex: 1 0 auto;
					}
					${BDFDB.dotCN.messagespopouttabbar} ~ * {
						margin-left: 10px;
					}
					${BDFDB.dotCN._readallnotificationsbuttonframe} {
						height: 24px;
						margin-bottom: 10px;
					}
					${BDFDB.dotCN._readallnotificationsbuttonframe}:active {
						transform: translateY(1px);
					}
					${BDFDB.dotCN._readallnotificationsbuttoninner} {
						height: 24px;
					}
					${BDFDB.dotCN._readallnotificationsbuttonbutton} {
						border-radius: 4px;
						height: 24px;
						font-size: 12px;
						line-height: 1.3;
						white-space: nowrap;
						cursor: pointer;
					}
				`;
			}
			
			onStart () {
				let loadedBlacklist = BDFDB.DataUtils.load(this, "blacklist");
				this.saveBlacklist(!BDFDB.ArrayUtils.is(loadedBlacklist) ? [] : loadedBlacklist);

				this.forceUpdateAll();
			}
			
			onStop () {
				this.forceUpdateAll();
			}

			getSettingsPanel (collapseStates = {}) {
				let settingsPanel, settingsItems = [];
				
				settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.CollapseContainer, {
					title: "Einstellungen",
					collapseStates: collapseStates,
					children: Object.keys(settings).filter(key => !this.defaults.settings[key].inner).map(key => BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
						type: "Switch",
						plugin: this,
						keys: ["settings", key],
						label: this.defaults.settings[key].description,
						value: settings[key]
					})).concat(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsPanelList, {
						title: "Bei Linksklick auf die Schaltfläche 'Alles lesen' folgende Elemente als gelesen markieren:",
						first: false,
						last: true,
						children: Object.keys(settings).filter(key => this.defaults.settings[key].inner).map(key => BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
							type: "Switch",
							plugin: this,
							keys: ["settings", key],
							label: this.defaults.settings[key].description,
							value: settings[key]
						}))
					}))
				}));
				
				settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.CollapseContainer, {
					title: "Server",
					collapseStates: collapseStates,
					children: [
						BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsGuildList, {
							className: BDFDB.disCN.marginbottom20,
							disabled: BDFDB.DataUtils.load(this, "blacklist"),
							onClick: disabledGuilds => {
								this.saveBlacklist(disabledGuilds);
							}
						}),
						BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsItem, {
							type: "Button",
							color: BDFDB.LibraryComponents.Button.Colors.GREEN,
							label: "Aktivieren für alle Server",
							onClick: _ => {
								this.batchSetGuilds(settingsPanel, collapseStates, true);
							},
							children: BDFDB.LanguageUtils.LanguageStrings.ENABLE
						}),
						BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsItem, {
							type: "Button",
							color: BDFDB.LibraryComponents.Button.Colors.PRIMARY,
							label: "Deaktivieren für alle Server",
							onClick: _ => {
								this.batchSetGuilds(settingsPanel, collapseStates, false);
							},
							children: BDFDB.LanguageUtils.LanguageStrings.DISABLE
						})
					]
				}));
				
				return settingsPanel = BDFDB.PluginUtils.createSettingsPanel(this, settingsItems);
			}

			onSettingsClosed () {
				if (this.SettingsUpdated) {
					delete this.SettingsUpdated;
					this.forceUpdateAll();
				}
			}
		
			forceUpdateAll () {
				settings = BDFDB.DataUtils.get(this, "settings");
				
				BDFDB.PatchUtils.forceAllUpdates(this);
			}
		
			processGuilds (e) {
				if (typeof e.returnvalue.props.children == "function") {
					let childrenRender = e.returnvalue.props.children;
					e.returnvalue.props.children = (...args) => {
						let children = childrenRender(...args);
						this.checkTree(children);
						return children;
					};
				}
				else this.checkTree(e.returnvalue);
			}
			
			checkTree (returnvalue) {
				let tree = BDFDB.ReactUtils.findChild(returnvalue, {filter: n => n && n.props && typeof n.props.children == "function"});
				if (tree) {
					let childrenRender = tree.props.children;
					tree.props.children = (...args) => {
						let children = childrenRender(...args);
						this.handleGuilds(children);
						return children;
					};
				}
				else this.handleGuilds(returnvalue);
			}
			
			handleGuilds (returnvalue) {
				let [children, index] = BDFDB.ReactUtils.findParent(returnvalue, {name: "ConnectedUnreadDMs"});
				if (index > -1) children.splice(index + 1, 0, BDFDB.ReactUtils.createElement(ReadAllButtonComponent, {}));
			}

			processRecentMentions (e) {
				if (e.instance.props.header && e.instance.props.header.props) e.instance.props.header.props.messages = e.returnvalue.props.messages;
			}

			processRecentsHeader (e) {
				if (settings.addClearButton && e.instance.props.tab == "Recent Mentions") e.returnvalue.props.children.push(BDFDB.ReactUtils.createElement("div", {
					children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TooltipContainer, {
						text: `${BDFDB.LanguageUtils.LanguageStrings.CLOSE} (${BDFDB.LanguageUtils.LanguageStrings.FORM_LABEL_ALL})`,
						children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Clickable, {
							className: BDFDB.disCNS.messagespopoutbutton + BDFDB.disCNS.messagespopoutbuttonsecondary + BDFDB.disCN.messagespopoutbuttonsize32,
							children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SvgIcon, {
								nativeClass: true,
								name: BDFDB.LibraryComponents.SvgIcon.Names.CLOSE,
								width: 16,
								height: 16
							}),
							onClick: _ => {
								let clear = _ => {
									if (clearing) return BDFDB.NotificationUtils.toast(`${this.labels.toast_alreadyclearing} - ${BDFDB.LanguageUtils.LibraryStrings.please_wait}`, {type: "danger"});
									let messages = [].concat(e.instance.props.messages).filter(n => n);
									if (messages.length) {
										clearing = true;
										let toastInterval;
										let loadingString = `${this.labels.toast_clearing} - ${BDFDB.LanguageUtils.LibraryStrings.please_wait}`;
										let currentLoadingString = loadingString;
										let toast = BDFDB.NotificationUtils.toast(currentLoadingString, {
											timeout: 0,
											onClose: _ => {BDFDB.TimeUtils.clear(toastInterval);}
										});
										toastInterval = BDFDB.TimeUtils.interval(_ => {
											currentLoadingString = currentLoadingString.endsWith(".....") ? loadingString : currentLoadingString + ".";
											toast.update(currentLoadingString);
										}, 500);
										for (let i = 0; i < messages.length; i++) BDFDB.TimeUtils.timeout(_ => {
											BDFDB.LibraryModules.RecentMentionUtils.deleteRecentMention(messages[i].id);
											if (i == messages.length - 1) {
												clearing = false;
												toast.close();
												BDFDB.NotificationUtils.toast(this.labels.toastcleared, {type: "success"});
											}
										}, i * 1000);
									}
								};
								if (settings.confirmClear) BDFDB.ModalUtils.confirm(this, this.labels.modal_confirmmentions, clear);
								else clear();
							}
						})
					})
				}));
			}
			
			batchSetGuilds (settingsPanel, collapseStates, value) {
				if (!value) {
					for (let id of BDFDB.LibraryModules.FolderStore.getFlattenedGuildIds()) blacklist.push(id);
					this.saveBlacklist(BDFDB.ArrayUtils.removeCopies(blacklist));
				}
				else this.saveBlacklist([]);
				BDFDB.PluginUtils.refreshSettingsPanel(this, settingsPanel, collapseStates);
			}
			
			saveBlacklist (savedBlacklist) {
				blacklist = savedBlacklist;
				BDFDB.DataUtils.save(savedBlacklist, this, "blacklist");
			}

			setLabelsByLanguage () {
				switch (BDFDB.LanguageUtils.getLanguage().id) {
					case "de":		// German
						return {
							context_dms:						"Direktnachrichten",
							context_guilds:						"Alle Server",
							context_mutedguilds:				"Stummgeschaltete Server",
							context_pingedguilds:				"Gepingte Server",
							context_unreadguilds:				"Ungelesene Server",
							modal_confirmmentions:				"Möchten Sie wirklich alle ungelesenen Erwähnungen löschen?",
							modal_confirmnotifications:			"Möchten Sie wirklich alle ungelesenen Benachrichtigungen löschen?",
							toast_alreadyclearing:				"Löscht bereits einige Erwähnungen",
							toast_cleared:						"Alle kürzlich Erwähnungen wurden gelöscht",
							toast_clearing:						"Löscht alle letzten Erwähnungen"
						};
					default:		// English
						return {
							context_dms:						"Direct Messages",
							context_guilds:						"All Servers",
							context_mutedguilds:				"Muted Servers",
							context_pingedguilds:				"Pinged Servers",
							context_unreadguilds:				"Unread Servers",
							modal_confirmmentions:				"Are you sure you want to delete all unread Mentions?",
							modal_confirmnotifications:			"Are you sure you want to delete all unread Notifications?",
							toast_alreadyclearing:				"Already clearing some Mentions",
							toast_cleared:						"All recent Mentions have been cleared",
							toast_clearing:						"Clearing all recent Mentions"
						};
				}
			}
		};
	})(window.BDFDB_Global.PluginUtils.buildPlugin(config));
})();
