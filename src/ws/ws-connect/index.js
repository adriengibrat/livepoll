const { save, query, ws } = require('@architect/shared')
exports.handler = async ({ requestContext : { connectionId, apiId } }) => {
try {
	await save('connections', { connectionId, pollId: 'Wait' })
	const { Items: polls } = await query('polls')
	const _active = q => q && q.active
	const poll = polls.find(({ questions }) => questions.some(_active))
	console.log('connect', poll)
	if (!poll) return { statusCode: 200 }
	const { pollId, title, questions } = poll
	const connections = await query('connections', { pollId }, { scan: true })
	const socket = ws({ requestContext : { apiId } })
	await socket.send({
		id: connectionId, 
		payload: { pollId, title, ...questions.find(_active), votes: [1,2,3], connected: connections.Count }
	})
} catch(e) {console.log(e)}
	return { statusCode: 200 }
}
