const { React, getModule } = require('powercord/webpack')
const { FormTitle } = require('powercord/components')
const { Modal } = require('powercord/components/modal')
const { close } = require('powercord/modal')

const ZWS = '\u200B'
const ZWS_RE = /\u200B|\u200C|\u200D|\u2060|\u180E/

function strToReact (str) {
    const zws = <span className='zws'>{ZWS}</span>
    return str.split(ZWS_RE).reduce((r, a) => r.concat(zws, a), []).slice(1)
}

function parseContent (content) {
    const res = getModule(['parse', 'parseTopic'], false).defaultRules.codeBlock
        .react({ content }, null, {})
    const ogRender = res.props.render
    res.props.render = (codeblock) => {
        const res = ogRender(codeblock)
        if (typeof res.props.children.props.children === 'string') {
            res.props.children.props.children = strToReact(res.props.children.props.children)
        } else {
            const props = res.props.children.props.children.props.children[1].props
            if (Array.isArray(props.children)) {
                props.children.forEach(c => {
                    c.props.children[1].props.children = strToReact(c.props.children[1].props.children)
                })
            } else {
                props.children.props.children[1].props.children = strToReact(props.children.props.children[1].props.children)
            }
        }
        return res
    }
    return res
}

module.exports = ({ message }) => <Modal size={ Modal.Sizes.MEDIUM } className='vrmodal'>
    <Modal.Header>
        <FormTitle tag='h4'>Raw message written by { message.author.username }</FormTitle>
        <Modal.CloseButton onClick={ close } />
    </Modal.Header>
    <Modal.Content className={ getModule(['markup'], false).markup }>
        { parseContent(message.content) }
    </Modal.Content>
</Modal>
