const MexTranspiler = require('mex-transpiler').MexTranspiler
const Transpiler = new MexTranspiler(0)
				// console.log(1);
				function updateMeX(){
					// console.log(2);
					let returned = Transpiler.transpile(editor.getValue());
					document.getElementById('out').value = returned;
					returned = returned.replaceAll('\n', '\\math_end \\math_start');
					document.getElementById('tex-out').innerHTML = '\\math_start'+returned+'\\math_end';

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
						setTimeout(checkIfNew, ((performance.now()-start)*2+200) );
					}
				}
				setTimeout(()=>{checkIfNew()},500);