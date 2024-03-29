const { React, getModule } = require('powercord/webpack')
const { FormTitle } = require('powercord/components')
const { Category } = require('powercord/components/settings')
const { Modal } = require('powercord/components/modal')
const { close } = require('powercord/modal')

const classes = getModule(['markup'], false)
const parser = getModule(['parse', 'parseTopic'], false)

const ZWS = '\u200B'
const ZWS_RE = /\u200B|\u200C|\u200D|\u2060|\u180E/

function strToReact(str) {
    const zws = <span className='zws'>{ZWS}</span>
    return str.split(ZWS_RE).reduce((r, a) => r.concat(zws, a), []).slice(1)
}

// What the hell is this.
function parseContent(content) {
	const res = parser.defaultRules.codeBlock.react({ content }, null, {})
	const ogRender = res.props.render
	res.props.render = (codeblock) => {
		const res = ogRender(codeblock)
		const props = res?.props?.children?.props
		if (!props?.children) return res
		if (typeof props.children === 'string') {
			props.children = strToReact(props.children)
		} else {
			const props2 = props.children.props.children[1].props
			if (Array.isArray(props2.children)) {
				props2.children.forEach((c) => {
					c.props.children[1].props.children = strToReact(
						c.props.children[1].props.children
					)
				})
			} else {
				props2.children.props.children[1].props.children = strToReact(
					props2.children.props.children[1].props.children
				)
			}
		}
		return res
	}
	return res
}

class ViewRawModal extends React.PureComponent {
	constructor(props) {
		super(props)

		this.state = { viewAllRawData: !props.message.content }
	}

	render() {
		const { message } = this.props, allRawData = this.props.allRawData || !message.embeds.length
		return <Modal size={Modal.Sizes.LARGE} className='vrmodal'>
			<Modal.Header>
				<FormTitle tag='h4'>
					Raw message written by {message.author.username}
				</FormTitle>
				<Modal.CloseButton onClick={close} />
			</Modal.Header>
			<Modal.Content className={classes.markup}>
				{message.content ? parseContent(message.content) : null}
				<Category
					name={allRawData ? 'View All Raw Data' : 'View Raw Embeds'}
					opened={this.state.viewAllRawData}
					onChange={() => this.setState({
						viewAllRawData: !this.state.viewAllRawData
					})}
				>
					{parser.defaultRules.codeBlock.react({
						content: JSON.stringify(allRawData ? message : message.embeds, null, '\t'),
						lang: 'json'
					}, null, {})}
				</Category>
			</Modal.Content>
		</Modal>
	}
}

// Might as well.
module.exports = window.KLibrary?.Tools?.ReactTools?.WrapBoundary?.(ViewRawModal) || ViewRawModal
