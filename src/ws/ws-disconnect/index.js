
const { del, query, ws } = require('@architect/shared')

exports.handler = async ({ requestContext : { connectionId, apiId } }) => {
try {
	const connexion = await query('connections', { connectionId })
	if (!connexion.Count){
		console.log(`connectionId ${connectionId} not registered in db`)
		return { statusCode: 404 }
	}
	await del('connections', { connectionId }, { scan: true })
	const { Items: [{ pollId }]} = connexion
	const connections = await query('connections', { pollId }, { scan: true })
	const socket = ws({ requestContext : { apiId } })
	connections.Items.forEach(async ({ connectionId: id }) => {
		console.log(`sending ${connectionId} :`, { connected: connections.Count })
		await socket.send({
			id, 
			payload: { connected: connections.Count }
		})
	})
} catch(e) {console.log(e)}

	return { statusCode: 200 }
}
