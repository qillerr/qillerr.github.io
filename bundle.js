(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
},{"mex-transpiler":2}],2:[function(require,module,exports){
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
const { exclude, Separators, Patterns } = require('./preset.js')

class PerformanceMeasurer{
    constructor(){
        this.measures = [new Date().getTime()];
    }
    lap(){
        this.measures.push(new Date().getTime())
    }
    diffs(){
        let toReturn = [];
        for(let c=1;c<this.measures.length;c++)
        {
            toReturn.push(Math.round((this.measures[c]-this.measures[c-1])));
        }

        return toReturn;
    }
}

/**
 * Replace all occurences, chronologically
 * @param {*} object 
 * @param {*} Patterns 
 */
function findAndReplaceAll(object, Patterns){
    for(let pattern of Patterns)
    {
        while(findAndReplace(object, pattern))
        {
            
        }
    }
}

/**
 * Safely check if object has children
 * @param {object} el 
 */
function checkChildren(el){
    try{
        el.children[0].length;
        return 1;
    }catch(e){
        return 0;
    }
}

/**
 * Check if object's name or facade fits the pattern
 * @param {*} object 
 * @param {string} name name to be checked 
 */
function checkName(object, name)
{
    if(object.name == name)
        return 1;

    if(object.facade == name)
        return 1

    return 0;
}

/**
 * Find and replace all occurences of objects that fit the pattern with a higher-order token
 * @param {array} array 
 * @param {object} pattern 
 * @return {bool} returns 1 if it replaced sth, instantly quits for safety (TODO could be more efficient by not instantly quit)
 */
function findAndReplace(array, pattern){
    for(let c=0;c<array.length;c++){
        //Check if it fits the pattern
        if(c<=array.length-pattern.in.length){
            // console.log(array[c]);
            let correct = 1;
            for(let p=0;p<pattern.in.length;p++)
            {
                let selected = array[c+p];
                if(typeof selected == 'string')
                    {correct = 0; break;}
                if(!checkName(selected, pattern.in[p]))
                    {correct = 0; break;}
            }

            //If it fits the pattern - replace it
            if(correct)
            {
                // console.log('Correcto')
                let toOut = JSON.parse(JSON.stringify(pattern));
                for(let i=0;i<toOut.out.length;i++)
                {
                    let el = toOut.out[i]
                    if(typeof el == 'string')
                        continue;

                    if(typeof el == 'number') //automatic type support
                    {
                        if(checkChildren(array[c+el]))
                        {
                            toOut.out[i] = {type: 'inside', from: el};
                        }
                        else{
                            toOut.out[i] = {type: 'literal', from: el};
                        }
                    }

                    el = toOut.out[i];
                    if(el.type == 'inside')
                    {
                        el.children = JSON.parse(JSON.stringify(array[c+el.from].children[0]));
                    }
                    if(el.type == 'literal')
                    {
                        el.object = JSON.parse(JSON.stringify(array[c+el.from]));
                    }
                }

                array.splice(c, pattern.in.length, toOut);

                return 1;

            }
        }
        
        //Go check it's children
        let selected = array[c];
        if(typeof selected == 'object')
        {
            // console.log(11, selected)
            if(selected.children)
                if(findAndReplace(selected.children[0], pattern))
                    return 1;
            if(selected.out)
                for(let el of selected.out)
                {
                    // console.log('asd');
                    if(el.children)
                        if(findAndReplace(el.children, pattern))
                            return 1;
                }

        }
                
    }
    return 0;
}

/**
 * Get token's value to out
 * @param {object} token 
 */
function getTokenValue(token){
    if(token.mode == 'choose name')
        return token.name;
    if(token.mode == 'ignore_borders')
        return token.value.slice(...token.range)
    if(token.mode == '##')
        return '\\'+token.name.slice(1,-1)+'{'+token.value.slice(...token.range)+'}'

    return token.value;
}

/**
 * Recursively stringify tokens
 * @param {array} tokenArray 
 * @param {*} isDisabled TODO: I honestly don't remember what it does
 */
function builder(tokenArray, isDisabled = 0){
    let out = "";
    
    for(let token of tokenArray)
    {
        if(typeof token == 'string')
        {
            out = out+token;
            continue;
        }
        if(token.type)
        {
            if(token.type == 'paired')
            {
                if(token.name == 'latex')
                {
                    out += builder(token.children[0], 1);
                }
                else{
                    out +=token.val
                    + builder(token.children[0], isDisabled)
                    + token.closingVal;
                
                }

            
                continue;
            }
        }
        if(token.out)
        {
            for(let el of token.out)
            {
                if(typeof el == 'string')
                    {out += el; continue;}
                if(el.children){
                    if(el.children.length)
                    {
                        out += builder(el.children, isDisabled); 	
                    }
                }
                
                if(el.object)
                {
                    if(typeof el.object.value == 'string')
                    {
                        out += getTokenValue(el.object);
                    }
                    else{ // I don't remember if it's needed XD
                        for(let deepEl of el.object.out)
                        {
                            if(typeof deepEl == 'string')
                            {
                                out += deepEl;
                                continue;
                            }
                            if(!deepEl.object)
                            {
                                out += builder(deepEl.children, isDisabled)
                                continue;
                            }
                            
                            if(deepEl.object.type)
                                out += builder(deepEl.object.children[0], isDisabled)
                            else
                                out += getTokenValue(deepEl.object)
                        }
                        
                    }
                    
                }

            }
            continue;
        }
        
        out += getTokenValue(token);
        
        
    }
    
    return out;
}

/**
 * Parses - structures by Separators rules
 * @param {array} arr 
 * @param {integer} index 
 */
function parseTokenize(arr, index=0){
    let c = index;
    let out=[];
    let until = 0;
    
    try{
        if(arr[index].type == 'paired')
        {
            until = 'right_'+arr[index].name;
            c++;
        }
    }catch(e){}
    
    while(c<arr.length)
    {
        if(typeof arr[c] == 'string')
        {
            out.push( arr[c] );
            c++;
            continue;
        }
        if(arr[c].name == until)
            break;
        
        if(arr[c].type)
        {
            if(arr[c].type == 'paired')
            {
                let result = parseTokenize(arr, c);
                let obj = Object.assign({}, arr[c]);
                obj.children = [];
                obj.children[0] = result;
                obj.sum = 2;
                
                result.forEach(el=>{
                    if(typeof el == 'string')
                        obj.sum++;
                    else
                        obj.sum+=el.sum;
                })
                
                c=c+obj.sum;
                out.push(obj);
                
                continue;
            }
        }
        
        let obj = Object.assign({}, arr[c]);
        obj.sum = 1;
        out.push( obj );
        c++;
    }
    
    return out;
}

/**
 * transformed passed array by using provided Separators
 * @param {*} array 
 * @param {*} Separators 
 */
function splitTokenize(array, Separators)
{
    didSomething=true;
    while(didSomething){
        didSomething = false;
        for(let c=0;c<array.length;c++)
        {
            let el = array[c];
            if(typeof el != 'string')
                continue;
            
            for(let separator of Separators)
            {
                let matched = el.match(separator.reg);
                if(!matched)
                    continue;
                
                
                let token = Object.assign({}, separator)
                token.value = matched[0];
                token.reg = null;
                delete token.reg;
                
                let result = [
                    el.substring(0,matched.index),
                    token,
                    el.substring(matched.index+token.value.length)
                ];
                
                result = result.filter(el=>{return el!=""})
                
                array.splice(c, 1, ...result);
                
                didSomething=true;
                break;
            }

            if(didSomething)
                break;
        }
        
        
        
        
    }
}

/**
 * CacheMap - doubles the size of keys (for index) so might not be the best option for large cache, but for small it's worth it
 * Adds index that keeps track of size and chronologically removes old things from the cache
 */
class CacheMap extends Map{
    #maxSize;
    #index = [];

    constructor(maxSize = 256, iterable=[]){
        super(iterable)
        this.maxSize = maxSize;
    }

    unshift(key, value){
        if(this.#index.indexOf(key) > -1){
            this.#index.splice(this.#index.indexOf(key), 1)            
        }
        this.#index.unshift(key)
        this.set(key, value)

        if(this.#index.length >= this.#maxSize){
            this.delete(this.#index[this.#maxSize-1])
            this.#index.splice(this.#maxSize-1)
        }
    }

    /**
     * Puts called key at the top of the cache
     * @param {*} key 
     */
    get(key){
        let returnValue = super.get(key)
        if(this.#index.indexOf(key) > -1){
            this.#index.splice(this.#index.indexOf(key), 1)
            this.#index.unshift(key)
        }
        return returnValue;
    }

    clear(){
        super.clear()
        this.#index = [];
    }
}

module.exports.MexTranspiler = class MexTranspiler {
    debug
    Separators = Separators;
    Patterns = Patterns;
    cache = new CacheMap();

    //Compiles/prepares separators (regex-wise)
    prepSeparators(){
        this.Separators.forEach(sep=>{
            if(sep.val && !sep.reg)
                sep.reg = new RegExp(exclude+' ?'+escapeRegExp(sep.val)+' ?');
            if(typeof sep.reg == 'string')
                sep.reg = new RegExp(exclude+' ?'+escapeRegExp(sep.reg)+' ?');
        })
    }

    constructor(debug = 0, separators = Separators, patterns = Patterns){
        this.debug = debug
        this.Separators = separators
        this.Patterns = patterns
        this.prepSeparators()
    }

    log(...args){
        if(this.debug){
            console.log(...args)
        }
    }

    /**
     * Transpile MeX string to LaTeX string
     * @param {string} text MeX
     * @return {string} LaTeX
     */
    transpile(text)
    {
        if(this.cache.has(text)){
            return this.cache.get(text);
        }
        console.log("New calculation")
        //To work a new line needs to be added
        let arr = ["", text]
        let perf = new PerformanceMeasurer();

        splitTokenize(arr, this.Separators)
        perf.lap(); this.log(arr);
        
        let object = parseTokenize(arr);
        perf.lap();

        findAndReplaceAll(object, this.Patterns);
        perf.lap(); this.log(object);
        
        this.log('Performance[ms]: ',perf.diffs());
        
        let builtLatex = builder(object)
        this.cache.unshift(text, builtLatex)
        return builtLatex;
    }
}
},{"./preset.js":3}],3:[function(require,module,exports){
module.exports.exclude = '(?<!\\.)';

//If you don't want it escapable, then use regex instead of string
module.exports.Separators = [

    //I don't know if it should be continued that way
    { val: 'l**', name: 'latex', type: 'paired' }, //TODO it's not working
    { val: '**l', name: 'right_latex' }, //TODO it's not working

    { reg: /(?<!(\.|\d|\)|\S))%.*$/m, name: 'latex-line', mode: "ignore_borders", range: [1] },
    { reg: /(?<!\.)%l.*$/m, name: 'latex-line', mode: "ignore_borders", range: [2]  },

    { reg: /\n/, name: 'new_line' },
    { reg: /(?<!\.)t{{(.(?!([\#])))*?}}t/, name: '#text#', mode: '##', facade: 'M', range: [3,-3] },
    { reg: /(?<!\.)l{{(.(?!([\#])))*?}}l/, name: 'latex_range', mode: 'ignore_borders', range: [3,-3] },
    { reg: /(?<!\.)m{{(.(?!([\#])))*?}}m/, name: '#mathit#', mode: '##', facade: 'M', range: [3,-3] },

    { reg: /(?<!(\.|\d|\)))%.*$/m, name: 'comment' },
    { reg: /(?<!(\S))%.*$/m, name: 'comm', mode: "ignore_borders", range: [1] },
    
    { reg: /(?<!\\)\\(?!\\)/, name: 'trigger' },
    { reg: /\\/, name: 'backslash' },

    // Example of use: [3,5) for a range
    { val: '.[', name: '\\[', facade: 'non-mutable', mode: 'choose name' },
    { val: '.]', name: '\\]', facade: 'non-mutable', mode: 'choose name' },
    { val: '.(', name: '\\(', facade: 'non-mutable', mode: 'choose name' },
    { val: '.)', name: '\\)', facade: 'non-mutable', mode: 'choose name' },
    
    { reg: /%/, name: 'percent_sign', facade: 'percent' },
    { reg: /-?\d+(\.\d*(\(\d+\))?)?/, name: 'number', facade: 'M' },
    { val: ',', name: 'comma' },

    { val: '[', closingVal: ']', name: 'bracket', type: 'paired' },
    { val: ']', name: 'right_bracket' },
    { val: '{', closingVal: '}', name: 'curly', type: 'paired' },
    { val: '}', name: 'right_curly' },
    { val: '(', closingVal: ')', name: 'paren', type: 'paired', facade: 'M' },
    { val: ')', name: 'right_paren' },
    

    // Operator symbols
    { val: '<<', name: 'll', facade: 'non-mutable', mode: 'choose name' },
    { val: '>>', name: 'gg', facade: 'non-mutable', mode: 'choose name' },
    { val: '~~', name: 'approx', facade: 'non-mutable', mode: 'choose name' },
    { val: '~', name: 'sim', facade: 'non-mutable', mode: 'choose name' },
    { val: '!=', name: 'neq', facade: 'non-mutable', mode: 'choose name' },
    { val: '>=', name: 'geq', facade: 'non-mutable', mode: 'choose name' },
    { val: '<=', name: 'leq', facade: 'non-mutable', mode: 'choose name' },
    { val: '->', name: 'to', facade: 'sep_symbol', mode: 'choose name' },

    { val: '^', name: 'power' },
    { val: '__', name: '2sub' },
    { val: '_', name: 'sub' },
    { val: '>', name: 'greater' },
    { val: '>', name: 'less' },
    
    { val: '+-', name: 'pm', facade: 'non-mutable', mode: 'choose name' },
    { val: '+', name: 'plus' },
    { val: '-', name: 'minus' },
    { val: '*', name: 'multiply' },
    { val: '/', name: 'divide' },
    
    { val: '=', name: 'equal' },
    
    //Simple functions
    { val: 'sin', name: 'sin', facade: 'SF', mode: 'choose name' },
    { val: 'cos', name: 'cos', facade: 'SF', mode: 'choose name' },
    { val: 'tan', name: 'tan', facade: 'SF', mode: 'choose name' },
    { val: 'ctg', name: 'cot', facade: 'SF', mode: 'choose name' },
    { val: 'tg', name: 'tan', facade: 'SF', mode: 'choose name' },
    { val: 'cot', name: 'cot', facade: 'SF', mode: 'choose name' },
    { val: 'ln', name: 'ln', facade: 'SF', mode: 'choose name' },
    
    
    { val: 'int', name: 'int', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'lim', name: 'lim', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'sum', name: 'sum', facade: 'sep_symbol', mode: 'choose name' },


    { val: 'infty', name: 'infty', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'inf', name: 'infty', facade: 'sep_symbol', mode: 'choose name' },
    // { val: 'to', name: 'to', facade: 'sep_symbol', mode: 'choose name' }, disabled -> is working instead
    
    
    // Greek
    
    { val: 'vartheta', name: 'vartheta', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'varepsilon', name: 'varepsilon', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'varpi', name: 'varpi', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'varsigma', name: 'varsigma', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'varrho', name: 'varrho', facade: 'sep_symbol', mode: 'choose name' },

    { val: 'alpha', name: 'alpha', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'beta', name: 'beta', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'gamma', name: 'gamma', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'delta', name: 'delta', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'epsilon', name: 'epsilon', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'zeta', name: 'zeta', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'eta', name: 'eta', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'Gamma', name: 'Gamma', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'Delta', name: 'Delta', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'Theta', name: 'Theta', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'theta', name: 'theta', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'iota', name: 'iota', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'kappa', name: 'kappa', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'lambda', name: 'lambda', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'mu', name: 'mu', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'nu', name: 'nu', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'xi', name: 'xi', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'Lambda', name: 'Lambda', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'Xi', name: 'Xi', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'Pi', name: 'pi', facade: 'sep_symbol', mode: 'choose name' }, //ease of use
    { val: 'pi', name: 'pi', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'rho', name: 'rho', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'sigma', name: 'sigma', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'tau', name: 'tau', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'Sigma', name: 'Sigma', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'Upsilon', name: 'Upsilon', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'Phi', name: 'Phi', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'upsilon', name: 'upsilon', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'phi', name: 'phi', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'varphi', name: 'varphi', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'chi', name: 'chi', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'psi', name: 'psi', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'omega', name: 'omega', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'Psi', name: 'Psi', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'Omega', name: 'Omega', facade: 'sep_symbol', mode: 'choose name' },
    { val: 'micro', name: 'mu', facade: 'sep_symbol', mode: 'choose name' },

    //Here some easier symbols

    { val: 'deg', name: '°', facade: 'degree', mode: 'choose name' },
    { val: 'land', name: 'land', facade: 'non-mutable', mode: 'choose name' },
    { val: 'lor', name: 'lor', facade: 'non-mutable', mode: 'choose name' },
    { val: '...', name: 'dots', facade: 'non-mutable', mode: 'choose name' },


    { val: 'sqrt', name: 'root' },

    { val: '!in', name: 'notin', facade: 'non-mutable', mode: 'choose name' },
    { val: 'in', name: 'in', facade: 'non-mutable', mode: 'choose name' },

    { val: ' X ', name: 'times', facade: 'non-mutable', mode: 'choose name' },


    //At the end here it is:
    { reg: /\w/, name: 'character', facade: 'M'},
    { reg: /  /, name: ' \\; ', mode: 'choose name'},

];

module.exports.Patterns = [

    { in: ['non-mutable'], out: ['\\', 0, ' '], name: 'symbol' },
    { in: ['M', 'percent_sign'], out: [0, '\\%'], name: 'percent', facade: 'M', type: 'facade' },
    { in: ['sep_symbol'], out: ['\\', 0, ' '], name: 'symbol', facade: 'M', type: 'facade' },
    { in: ['SF', 'paren'], out: ['\\',0,'(', 1,')'], name: 'simple_f', facade: 'M', type: 'facade' },
    { in: ['SF', 'power', 'M', 'paren'], out: ['\\',0,'^{',2,'}(', 3,')'], name: 'simple_f', facade: 'M', type: 'facade' },
    { in: ['SF'], out: ['\\',0,' '], name: 'simple_f', facade: 'M', type: 'facade' },
    { in: ['root', 'paren'], out: ['\\sqrt{',1,'}'], name: 'sqrt', facade: 'M', type: 'facade' },
    { in: ['root', 'bracket', 'paren'], out: ['\\sqrt[',1,']{',2,'}'], name: 'n_rt', facade: 'M', type: 'facade' },
    { in: ['M', 'sub', 'M', 'power', 'M'], out: [0,'_{',2,'}^{', 4,'}'], name: 'merged_sub_pow', facade: 'M'},
    { in: ['M', 'sub', 'M'], out: [0,'_{',2,'}'], name: 'merged_subscript', facade: 'M'},
    { in: ['M', '2sub', 'M'], out: [0,'_{_{',2,'}}'], name: 'merged_subscript', facade: 'M'},
    { in: ['M', 'power', 'M'], out: [0,'^{',2,'}'], name: 'merged_power', facade: 'M'},
    { in: ['M', 'divide', 'M'], out: ['\\frac{',0,'}{',2,'}'], name: 'fraction' },

];


},{}]},{},[1]);
