const { React, getModule } = require('powercord/webpack')
const { FormTitle } = require('powercord/components')
const { Modal } = require('powercord/components/modal')
const { close } = require('powercord/modal')

module.exports = ({ message }) => <Modal size={ Modal.Sizes.MEDIUM } className='vrmodal'>
    <Modal.Header>
        <FormTitle tag='h3'>Raw message written by { message.author.username }</FormTitle>
        <Modal.CloseButton onClick={ close } />
    </Modal.Header>
    <Modal.Content className={ getModule(['markup'], false).markup }>
        { getModule(['parse', 'parseTopic'], false).defaultRules.codeBlock
            .react({ content: message.content }, null, {}) }
    </Modal.Content>
</Modal>
