const { React, getModule } = require('powercord/webpack')
const { FormTitle } = require('powercord/components')
const { Category } = require('powercord/components/settings')
const { Modal } = require('powercord/components/modal')
const { close } = require('powercord/modal')

const classes = getModule(['markup'], false)
const parser = getModule(['parse', 'parseTopic'], false)

const ZWS = '\u200B'
const ZWS_RE = /\u200B|\u200C|\u200D|\u2060|\u180E/

function strToReact (str) {
    const zws = <span className='zws'>{ZWS}</span>
    return str.split(ZWS_RE).reduce((r, a) => r.concat(zws, a), []).slice(1)
}

function parseContent (content) {
    const res = parser.defaultRules.codeBlock.react({ content }, null, {})
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

const toJSON = e => {
    for (k of Object.keys(e)) {
        const newKey = k.replace('URL', '_url').replace(/[A-Z]/g, l => '_' + l.toLowerCase()).replace('raw_', '')
        if (newKey == k) continue
        e[newKey] = e[k]
        delete e[k]
    }
    return e
}

module.exports = class VRModal extends React.PureComponent {
    constructor(props) {
        super(props)

        this.state = { viewEmbeds: !props.message.content }
    }

    render() {
        const { message } = this.props
        console.log(message)
        return <Modal size={ Modal.Sizes.MEDIUM } className='vrmodal'>
            <Modal.Header>
                <FormTitle tag='h4'>Raw message written by { message.author.username }</FormTitle>
                <Modal.CloseButton onClick={ close } />
            </Modal.Header>
            <Modal.Content className={ classes.markup }>
                { message.content ? parseContent(message.content) : null }
                { message.embeds.length ? <Category name='View raw embeds' opened={this.state.viewEmbeds} onChange={() => this.setState({ viewEmbeds: !this.state.viewEmbeds })}>
                    { parser.defaultRules.codeBlock.react({ content: JSON.stringify(message.embeds.map(embed => {
                        const e = _.cloneDeep(embed)
                        delete e.id
                        toJSON(e)
                        for (k of Object.keys(e).filter(k => typeof e[k] == 'object')) {
                            if (!Array.isArray(e[k])) toJSON(e[k])
                            else e[k].map(el => typeof el == 'object' && !Array.isArray(el) ? toJSON(el) : el)
                        }
                        return e
                    }), null, 4), lang: 'json' }, null, {}) }
                </Category> : null }
            </Modal.Content>
        </Modal>
    }
}
