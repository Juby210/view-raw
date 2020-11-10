const { Plugin } = require('powercord/entities')
const { findInReactTree } = require('powercord/util')
const { getModule, React } = require('powercord/webpack')
const { inject, uninject } = require('powercord/injector')

const ViewRawButton = require('./components/ViewRawButton')

module.exports = class ViewRaw extends Plugin {
	async startPlugin() {
		this.loadStylesheet('style.css')

		const MiniPopover = await getModule(m => m?.default?.displayName === 'MiniPopover')
		inject('view-raw-button', MiniPopover, 'default', (args, res) => {
			const props = findInReactTree(res, (r) => r?.message)
			if (!props) return res

			const message = _.cloneDeep(props.message)
			// Censor personal data.
			for (const data in message.author) {
				if (
					typeof message.author[data] !== 'function' &&
					[
						'id',
						'username',
						'usernameNormalized',
						'discriminator',
						'avatar',
						'bot',
						'system',
						'publicFlags',
					].indexOf(data) === -1
				) delete message.author[data]
			}

			res.props.children.unshift(
				React.createElement(ViewRawButton, { message })
			)
			return res
		})
		MiniPopover.default.displayName = 'MiniPopover'
	}

	pluginWillUnload() {
		uninject('view-raw-button')
	}
}
