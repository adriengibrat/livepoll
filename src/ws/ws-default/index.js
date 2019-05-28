
const { query, ws } = require('@architect/shared')

exports.handler = async ({ requestContext : { connectionId, apiId }, body }) => {
	const { pollId } = JSON.parse(body)
	if (!pollId) return { statusCode: 400 }
	const connections = await query('connections', { pollId }, { scan: true })
	const socket = ws({ requestContext : { apiId } })
	connections.Items.forEach(async ({ connectionId: id }) => {
		await socket.send({
			id, 
			payload: { connected: connections.Count }
		})
	})
	return { statusCode: 200 }
}
