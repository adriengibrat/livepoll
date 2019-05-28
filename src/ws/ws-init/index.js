
const { save, query, ws } = require('@architect/shared')

exports.handler = async ({ requestContext: { connectionId, apiId } }) => {
try {
	const { Items: polls } = await query('polls')
	const _active = q => q && q.active
	const poll = polls.find(({ questions }) => questions.some(_active)) || {}
	if (!poll) return { statusCode: 200 }
	const { pollId, title, questions } = poll
	const [ question ] = [].concat(questions).filter(_active)
	delete question.active
	await save('connections', { pollId, connectionId })
	const connections = await query('connections', { pollId }, { scan: true })
	const socket = ws({ requestContext: { apiId } })
	connections.Items.forEach(async ({ connectionId: id }) => await socket.send({
		id, payload: { pollId, title, ...question, votes: [1,2,3], connected: connections.Count }
	}))
	console.log('init ok', connections.Count)
} catch(e) {console.log(e)}
	return { statusCode: 200 }
}
