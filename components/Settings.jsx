const { React } = require('powercord/webpack')
const { SwitchItem } = require('powercord/components/settings')

module.exports = ({ getSetting, toggleSetting, repatch }) => <>
    <SwitchItem
        value={getSetting('toolbar', true)}
        onChange={() => {
            toggleSetting('toolbar', true)
            repatch()
        }}
    >Show "View Raw" button on message toolbar</SwitchItem>
    <SwitchItem
        value={getSetting('contextMenu', true)}
        onChange={() => {
            toggleSetting('contextMenu', true)
            repatch()
        }}
    >Show "View Raw" buttons in message context menu</SwitchItem>
    <SwitchItem
        value={getSetting('allRawData')}
        onChange={() => toggleSetting('allRawData')}
    >Show "View All Raw Data" instead of "View Raw Embeds"</SwitchItem>
</>
