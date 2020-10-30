const { Plugin } = require('powercord/entities')
const { findInReactTree } = require('powercord/util')
const { getModule, React } = require('powercord/webpack')
const { inject, uninject } = require('powercord/injector')
const { open } = require('powercord/modal')

const Modal = require('./Modal')

module.exports = class ViewRaw extends Plugin {
    async startPlugin() {
        this.loadStylesheet('style.css')

        const Menu = await getModule(['MenuGroup', 'MenuItem'])
        const MessageContextMenu = await getModule(m => m.default && m.default.displayName == 'MessageContextMenu')

        inject('view-raw', MessageContextMenu, 'default', (args, res) => {
            if (!findInReactTree(res, c => c.props && c.props.id == 'view-raw')) res.props.children.splice(4, 0,
                React.createElement(Menu.MenuGroup, null, React.createElement(Menu.MenuItem, {
                    action: () => open(() => React.createElement(Modal, { message: args[0].message })),
                    disabled: !args[0].message.content && !args[0].message.embeds.length,
                    id: 'view-raw',
                    label: 'View Raw'
                })
            ))

            return res
        })
        MessageContextMenu.default.displayName = 'MessageContextMenu'
    }

    pluginWillUnload() {
        uninject('view-raw')
    }
}
