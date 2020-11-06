const { CacheMap, MexTranspiler } = require('mex-transpiler')
const katex = require('katex')

const Transpiler = new MexTranspiler(0)

let cache = new CacheMap();

function updateMeX(){
	let currentObjects = document.querySelectorAll('#tex-out > div')
	
	for(let obj of currentObjects){
		if(!cache.has(obj.getAttribute('val')))
			cache.unshift( obj.getAttribute('val'), obj )
	}


	//MathJax already has typeset cache or w/e they're doing so we need only to split the Transpiler
	let val = editor.getValue()

	val = val.split('\n\n')
	for(let c in val){
		let transpiled = Transpiler.transpile(val[c])
		val[c] = transpiled;
	}
	
	document.getElementById('out').value = val.join('\n\n');
	document.getElementById('tex-out').innerHTML = ''
	
	let valSet = new Set()
	let typesetArray = []
	for(let c=0;c<val.length;c++){

		let el = document.createElement('div')
		el.setAttribute('val',val[c])
		
		if(cache.has(val[c])){
			if(!valSet.has(val[c]))
				el = cache.get(val[c])
			else
				el = cache.get(val[c]).cloneNode(1)
			el.setAttribute('val',val[c])
			document.getElementById('tex-out').appendChild(el)	
			valSet.add(val[c])
		}
		else{
			valSet.add(val[c])
			el.class = 'tex'
			val[c] = val[c].replaceAll('\n', '\\\\')
			el.innerHTML = '\\[' + val[c] + '\\]'
			document.getElementById('tex-out').appendChild(el)	
			katex.render(val[c], el, {
				displayMode: true,
				strict: 'ignore',
				fleqn: true,
				delimiters: [
						{left: "$$", right: "$$", display: true},
						{left: "\\(", right: "\\)", display: false},
						{left: "\\[", right: "\\]", display: true}
				]//,
				//throwOnError: true
			})

		}
		
	}
	// console.log(performance.now()-start, typesetArray.length)
	
	// MathJax.typesetPromise(typesetArray, ()=>{

	// })
}
function checkIfNew(){
	let val = editor.getValue();;
	let start = performance.now();
	try{
		if(lastValue != val )
		{
			lastValue = val;
			updateMeX();
			console.log('It took '+(performance.now()-start))
		}	
	}catch(e){
		// console.log('ERROR', e)
	}finally{
		setTimeout(checkIfNew, ((performance.now()-start)*2+100) );
	}
}
$( document ).ready(()=>{
	checkIfNew();
})