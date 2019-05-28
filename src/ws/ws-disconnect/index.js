
const { del, query, ws } = require('@architect/shared')

exports.handler = async ({ requestContext : { connectionId, apiId } }) => {
try {
	const { Items: [{ pollId }]} = await query('connections', { connectionId })

	await del('connections', { connectionId }, { scan: true })

	const connections = await query('connections', { pollId }, { scan: true })
	const socket = ws({ requestContext : { apiId } })
	connections.Items.forEach(async ({ connectionId: id }) => {
		await socket.send({
			id, 
			payload: { connected: connections.Count }
		})
	})
} catch(e) {console.log(e)}

	return { statusCode: 200 }
}
