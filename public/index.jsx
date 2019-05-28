/** @jsx h */
import { h, app } from 'https://unpkg.com/hyperapp@2.0.0-beta.13/src/index.js?module'

const update = (state, newState) => ({ ...state, ...newState })

const Check = () => 
	<div class="checkmark">
		<div class="success">
			<span class="tip" />
			<span class="long" />
			<div class="circle" />
			<div class="fix" />
		</div>
	</div>

// Application bootstrap
app({
	init: () => [
		{},
		[ dispatch => {
			const ws = new WebSocket(WS_URL)
			ws.onopen = () => {
				ws.send(JSON.stringify({ action: 'init', pollId: location.hash.replace(/^#/, '') }))
				ws.onmessage = (({ data }) => dispatch(update, JSON.parse(data)))
			}
		} ],
	],
	view: state =>
		<main onclick={ () => [ update, { ok: !state.ok } ] }>
			<pre style={ { display: 'none', position: 'absolute', color: 'white' } }>{ JSON.stringify(state) }</pre>
			{ !state.title ? <div class="wait"><span/></div> : '' }
			{ state.text ? <h2>{ state.text }</h2> : <h1>{ state.title }</h1> }
			
			<ol>{ state.options && state.options.map(option => <li>{ option }</li>) }</ol>
			
			{ state.connected ? <span class="connected">👪 <small>{ state.connected } connected people</small></span> : '' }
		</main>
	,
	node: document.getElementById('app')
})// <Check checked={ state.ok } />

// https://github.com/developit/snarkdown/blob/master/src/index.js