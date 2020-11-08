const {
	entities: { Plugin },
	util: { findInReactTree },
	injector: { inject, uninject },
	webpack: { React, getModule },
} = require("powercord");

const MiniPopover = getModule(
	(m) => m?.default?.displayName === "MiniPopover",
	false
);

const ViewRawButton = require("./components/ViewRawButton");

const MessageC = getModule(
	(m) => m?.prototype?.getReaction && m?.prototype?.isSystemDM,
	false
);

module.exports = class ViewRaw extends Plugin {
	async startPlugin() {
		this.loadStylesheet("style.css");

		inject("view-raw-button", MiniPopover, "default", (args, res) => {
			const props = findInReactTree(res, (r) => r?.message);
			if (!props) return res;

			// Hacky clone. All strings so who cares.
			let message = JSON.parse(
				JSON.stringify(
					MessageC ? new MessageC(props.message) : props.message
				)
			);
			// Censor personal data.
			for (const data in message.author) {
				if (
					typeof message.author[data] !== "function" &&
					[
						"id",
						"username",
						"usernameNormalized",
						"discriminator",
						"avatar",
						"bot",
						"system",
					].indexOf(data) === -1
				) {
					delete message.author[data];
				}
			}

			res.props.children.unshift(
				React.createElement(ViewRawButton, {
					message,
				})
			);
			return res;
		});

		MiniPopover.default.displayName = "MiniPopover";
	}

	pluginWillUnload() {
		uninject("view-raw-button");
	}
};
