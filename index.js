const { Plugin } = require("powercord/entities");
const { open } = require("powercord/modal");
const { findInReactTree } = require("powercord/util");
const { getModule, getModuleByDisplayName, React } = require("powercord/webpack");
const { inject, uninject } = require("powercord/injector");

const { clipboard } = require('electron');

const Settings = require("./components/Settings");
const ViewRawButton = require("./components/ViewRawButton");
const Modal = require("./components/ViewRawModal");

module.exports = class ViewRaw extends Plugin {
	constructor() {
		super();
		this.injectMessageContextMenu = this.injectMessageContextMenu.bind(this);
		this.injectContextMenus = {};
	}

	startPlugin() {
		powercord.api.settings.registerSettings(this.entityID, {
			category: this.entityID,
			label: "View Raw",
			render: (p) =>
				React.createElement(Settings, {
					repatch: () => this.addButtons(true),
					...p,
				}),
		});
		this.loadStylesheet("style.css");

		this.injectOpenContextMenuLazy();
		this.addButtons();
	}

	pluginWillUnload() {
		powercord.api.settings.unregisterSettings(this.entityID);
		this.addButtons(true, true);
		document
			.querySelectorAll(".view-raw-button")
			.forEach((e) => (e.style.display = "none"));

		uninject("view-raw-context-lazy-menu");
	}

	async addButtons(repatch, unpatch) {
		if (repatch) {
			uninject("view-raw-toolbar");
			uninject("view-raw-contextmenu");
		}
		if (unpatch) return;

		if (this.settings.get("toolbar", true)) {
			const MiniPopover = await getModule(
				(m) => m?.default?.displayName === "MiniPopover"
			);
			inject("view-raw-toolbar", MiniPopover, "default", (_, res) => {
				const props = findInReactTree(res, (r) => r?.message);
				if (!props) return res;

				res.props.children.unshift(
					React.createElement(ViewRawButton, {
						allRawData: this.settings.get("allRawData"),
						message: props.message,
					})
				);
				return res;
			});
			MiniPopover.default.displayName = "MiniPopover";
		}

		if (!this.settings.get("contextMenu", true)) return;

		this.injectContextMenus.MessageContextMenu = this.injectMessageContextMenu;
	}

	injectMessageContextMenu() {
		const { MenuGroup, MenuItem } = getModule(["MenuGroup", "MenuItem"], false);
		const MessageContextMenu = getModule(
			(m) => m?.default?.displayName === "MessageContextMenu", false
		);
		inject(
			"view-raw-contextmenu",
			MessageContextMenu,
			"default",
			(args, res) => {
				if (!args[0]?.message || !res?.props?.children) return res;

				res.props.children.splice(
					4,
					0,
					React.createElement(
						MenuGroup,
						null,
						React.createElement(MenuItem, {
							action: () =>
								open(() =>
									React.createElement(Modal, {
										allRawData: this.settings.get("allRawData"),
										message: args[0].message,
									})
								),
							id: "view-raw",
							label: "View Raw",
						}),
						React.createElement(MenuItem, {
							action: () => clipboard.copy(args[0].message.content),
							disabled: !args[0].message.content,
							id: "copy-raw",
							label: "Copy Raw",
						})
					)
				);
				return res;
			}
		);
		MessageContextMenu.default.displayName = "MessageContextMenu";
	}

	injectOpenContextMenuLazy () {
		const module = getModule([ 'openContextMenuLazy' ], false);

		inject('view-raw-context-lazy-menu', module, 'openContextMenuLazy', ([ event, lazyRender, params ]) => {
			const warpLazyRender = async () => {
				const render = await lazyRender(event);

				return (config) => {
					const menu = render(config);
					const CMName = menu?.type?.displayName;

					if (CMName) {
						const moduleByDisplayName = getModuleByDisplayName(CMName, false);

						if (CMName in this.injectContextMenus) {
							this.injectContextMenus[CMName]();
							delete this.injectContextMenus[CMName];
						}
						if (moduleByDisplayName !== null) {
							menu.type = moduleByDisplayName;
						}
					}
					return menu;
				};
			};

			return [ event, warpLazyRender, params ];
		}, true);
	}
};
