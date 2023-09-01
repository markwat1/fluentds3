/*
required
npm install mersenne-twister
npm install --save @types/mersenne-twister
*/
import MersenneTwister = require('mersenne-twister');

export function replaceStrings(s:string,rv:{[name:string]: string}){
    let r = s;
    for(let k in rv){
        r = r.replace(k,rv[k]);
    }
    return r;
}
export function escapeChars(s:string, chars:string){
    var r:string = '';
    const l = s.length;
    for(var i=0;i<l;i++){
        var c = s.charAt(i);
        if(chars.indexOf(c) >= 0){
            c = '\\' + c;
        }
        r = r + c;
    }
    return r;
}

export interface passwordGeneratorProps{
    length:number;
    useNum?:boolean;
    useUppercase?:boolean;
    useLowercase?:boolean;
    useSymbol?:boolean;
    forceNum?:boolean;
    forceUppercase?:boolean;
    forceLowercase?:boolean;
    forceSymbol?:boolean;
    symbols?:string;
    chars?:string;
};

interface checkResult {
    numNumeric:number;
    numLowerCase:number;
    numUpperCase:number;
    numSymbol:number;
};
const numChars = '0123456789';
const lowerCaseChars = 'abcdefghijklmnopqrstuvwxyz';
const upperCaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
//const symbolChars = ' `~!@#$%^&*()_+-={}[]\\|:;"\'<>,.?/';
const symbolChars = '~!@#%^&*()_+-={}[]|:;<>,.?/';
const RETRY_LIMIT = 100;

function checkChars(s:string){
    var cr:checkResult = {numNumeric:0,numLowerCase:0,numUpperCase:0,numSymbol:0};
    for(let i = 0; i < s.length; i++){
        const c = s.charAt(i);
        if(numChars.indexOf(c)>=0){
            cr.numNumeric++;
        }else if(lowerCaseChars.indexOf(c)>=0){
            cr.numLowerCase++;
        }else if(upperCaseChars.indexOf(c)>=0){
            cr.numUpperCase++;
        }else if(symbolChars.indexOf(c)>=0){
            cr.numSymbol++;
        }
    }
    return cr;
}
export class PasswordGenerator {
    private mt: MersenneTwister;
    constructor() {
        this.mt = new MersenneTwister();
    }
    public generate(props: passwordGeneratorProps) {
        var p: passwordGeneratorProps = props;
        if (typeof p.useNum === 'undefined') {
            p.useNum = true;
        }
        if (typeof p.useUppercase === 'undefined') {
            p.useUppercase = true;
        }
        if (typeof p.useLowercase === 'undefined') {
            p.useLowercase = true;
        }
        if (typeof p.useSymbol === 'undefined') {
            p.useSymbol = true;
        }
        if (typeof p.forceNum === 'undefined') {
            p.forceNum = true;
        }
        if (p.useNum == false){
            p.forceNum = false;
        }
        if (typeof p.forceUppercase === 'undefined') {
            p.forceUppercase = true;
        }
        if (p.useUppercase == false){
            p.forceUppercase = false;
        }
        if (typeof p.forceLowercase === 'undefined') {
            p.forceLowercase = true;
        }
        if (p.useLowercase == false){
            p.forceLowercase = false;
        }
        if (typeof p.forceSymbol === 'undefined') {
            p.forceSymbol = true;
        }
        if (p.useSymbol == false){
            p.forceSymbol = false;
        }
        var chars = '';
        if(typeof p.chars === 'undefined'){
            if (p.useNum) {
                chars = chars + numChars;
            }
            if (p.useLowercase) {
                chars = chars + lowerCaseChars;
            }
            if (p.useUppercase) {
                chars = chars + upperCaseChars;
            }
            if (p.useSymbol) {
                if (typeof p.symbols === 'undefined') {
                    chars = chars + symbolChars;
                } else {
                    chars = chars + p.symbols;
                }
            }
        }else{
            chars = p.chars;
            const cr = checkChars(chars);
            if(cr.numLowerCase == 0){
                p.forceNum = false;
            }
            if(cr.numUpperCase == 0){
                p.forceUppercase = false;
            }
            if(cr.numLowerCase == 0){
                p.forceLowercase = false;
            }
            if(cr.numSymbol == 0){
                p.forceSymbol = false;
            }
        }
        var cont = true;
        var pw: string = '';
        var retryCounter = 0;
        do {
            cont = false;
            pw = '';
            for (let i = 0; i < p.length; i++) {
                var nextc = chars.charAt(this.mt.random_int() % chars.length)
                pw = pw + nextc;
            }
            const pwck = checkChars(pw);
            if (p.forceNum && pwck.numNumeric == 0) {
                cont = true;
            }
            if (p.forceLowercase && pwck.numLowerCase == 0) {
                cont = true;
            }
            if (p.forceUppercase && pwck.numUpperCase == 0) {
                cont = true;
            }
            if (p.forceSymbol && pwck.numSymbol == 0) {
                cont = true;
            }
            if(retryCounter > RETRY_LIMIT){
                return '';
            }
        } while (cont);
        return pw;
    }
}
