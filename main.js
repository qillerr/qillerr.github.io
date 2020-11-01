const { CacheMap, MexTranspiler } = require('mex-transpiler')

const Transpiler = new MexTranspiler(0)

let cache = new CacheMap();

function updateMeX(){
	let currentObjects = document.querySelectorAll('#tex-out > div')
	
	for(let obj of currentObjects){
		if(!cache.has(obj.getAttribute('val')))
			cache.unshift( obj.getAttribute('val'), obj )
	}

	// let start=performance.now();

	//MathJax already has typeset cache or w/e they're doing so we need only to split the Transpiler
	let val = editor.getValue()

	val = val.split('\n\n')
	for(let c in val){
		let transpiled = Transpiler.transpile(val[c])
		val[c] = transpiled;
	}
	
	document.getElementById('out').value = val.join('\n\n');
	document.getElementById('tex-out').innerHTML = ''
	
	let typesetArray = []
	for(let c=0;c<val.length;c++){

		let el = document.createElement('div')
		el.setAttribute('val',val[c])
		
		if(cache.has(val[c])){
			el = cache.get(val[c])
			el.setAttribute('val',val[c])
			document.getElementById('tex-out').appendChild(el)	
		}
		else{
			el.class = 'tex'
			val[c] = val[c].replaceAll('\n', '\\math_end \\math_start')
			el.innerHTML = '\\math_start' + val[c] + '\\math_end'
			document.getElementById('tex-out').appendChild(el)	
			typesetArray.push(el)
		}
		
	}
	// console.log(performance.now()-start, typesetArray.length)
	
	MathJax.typesetPromise(typesetArray, ()=>{

	})
}
function checkIfNew(){
	let val = editor.getValue();;
	let start = performance.now();
	try{
		if(lastValue != val )
		{
			lastValue = val;
			updateMeX();
			// console.log('It took '+(performance.now()-start))
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