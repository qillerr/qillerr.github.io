const MexTranspiler = require('mex-transpiler').MexTranspiler
const Transpiler = new MexTranspiler(0)
function updateMeX(){
	//MathJax already has typeset cache or w/e they're doing so we need only to split the Transpiler
	let val = editor.getValue()

	val = val.split('\n\n')
	for(let c in val){
		let transpiled = Transpiler.transpile(val[c])
		val[c] = transpiled;
	}
	
	document.getElementById('out').value = val.join('\n\n');

	//It's no differential synchronization but, we're gonna try and narrow down the new area

	






	val = val.join('\\math_end \\math_start')
	val = val.replaceAll('\n', '\\math_end \\math_start');
	document.getElementById('tex-out').innerHTML = '\\math_start'+val+'\\math_end';


	// let returned = Transpiler.transpile(editor.getValue());
	// document.getElementById('out').value = returned;
	// returned = returned.replaceAll('\n', '\\math_end \\math_start');
	// document.getElementById('tex-out').innerHTML = '\\math_start'+returned+'\\math_end';

	// console.log(document.getElementById('tex-out').innerHTML)
	MathJax.typeset()
}
function checkIfNew(){
	let val = editor.getValue();;
	let start = performance.now();
	try{
		if(lastValue != val )
		{
			lastValue = val;
			updateMeX();
		}	
	}catch(e){
		console.log('ERROR', e)
	}finally{
		console.log('It took '+(performance.now()-start))
		setTimeout(checkIfNew, ((performance.now()-start)*2+200) );
	}
}
$( document ).ready(()=>{
	checkIfNew();
})