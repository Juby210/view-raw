const { Plugin } = require("powercord/entities");
const { open } = require("powercord/modal");
const { findInReactTree } = require("powercord/util");
const { getModule, getModuleByDisplayName, React } = require("powercord/webpack");
const { inject, uninject } = require("powercord/injector");

const Settings = require("./components/Settings");
const ViewRawButton = require("./components/ViewRawButton");
const Modal = require("./components/ViewRawModal");

module.exports = class ViewRaw extends Plugin {
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

		this.addButtons()
	}

	pluginWillUnload() {
		powercord.api.settings.unregisterSettings(this.entityID);
		this.addButtons(true, true);
		document
			.querySelectorAll(".view-raw-button")
			.forEach((e) => (e.style.display = "none"));
	}

	async addButtons(repatch, unpatch) {
		if (repatch) {
			uninject('view-raw-toolbar')
			uninject('view-raw-contextmenu')
			uninject('view-raw-context-lazy-menu')
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

		this.lazyPatchContextMenu('MessageContextMenu', MessageContextMenu => {
			const { MenuGroup, MenuItem } = getModule(['MenuGroup', 'MenuItem'], false)
			inject('view-raw-contextmenu', MessageContextMenu, 'default', (args, res) => {
				if (!args[0]?.message || !res?.props?.children) return res

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
										allRawData: this.settings.get('allRawData'),
										message: args[0].message,
									})
								),
							id: 'view-raw',
							label: 'View Raw',
						}),
						React.createElement(MenuItem, {
							action: () => DiscordNative.clipboard.copy(args[0].message.content),
							disabled: !args[0].message.content,
							id: 'copy-raw',
							label: 'Copy Raw',
						})
					)
				)
				return res
			})
			MessageContextMenu.default.displayName = 'MessageContextMenu'
		})
	}

	async lazyPatchContextMenu(displayName, patch) {
		const filter = m => m.default && m.default.displayName === displayName
		const m = getModule(filter, false)
		if (m) patch(m)
		else {
			const module = getModule([ 'openContextMenuLazy' ], false)
			inject('view-raw-context-lazy-menu', module, 'openContextMenuLazy', args => {
				const lazyRender = args[1]
				args[1] = async () => {
					const render = await lazyRender(args[0])

					return (config) => {
						const menu = render(config)
						if (menu?.type?.displayName === displayName && patch) {
							uninject('view-raw-context-lazy-menu')
							patch(getModule(filter, false))
							patch = false
						}
						return menu
					}
				}
				return args
			}, true)
		}
	}
};
