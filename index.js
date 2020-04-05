const parse = require('co-body');
const typeis = require('type-is');


/**
 * @param {object} opts
 *  - {Array} binTypes : default '['image/*']'  types stay data as binary encoded
 *  - {Boolean} isBuffer : binary data type -true buffer -false binary encoded string default false
 *  - {Array} acceptTypes: default ['multipart/form-data']
 *  - {String} limit default '1mb'
 */
module.exports = function(opts){
    opts = opts || {};
    // opts.returnRawBody = true;
    let binTypes = opts.binTypes || ['image/*'];
    let isBuffer = !!opts.isBuffer;
    let acceptTypes = opts.acceptTypes || ['multipart/form-data'];


    return async function formParser(ctx , next){
        if(ctx.request.formData !== undefined) return await next();

        const res = await parseBody(ctx);
        parseFormData(res.parsed , ctx);

        await next();

    }

    async function parseBody(ctx){
        if(ctx.request.is(acceptTypes)){
            console.log('parse form data');
            return await parse.text(ctx, {
                returnRawBody:true,
                encoding:'binary',
                limit: opts.limit
            });
        }
    }


    function parseFormData(rawForm ,ctx ){
        let boundary = ctx.request.headers['content-type'].split(';')[1].split('=')[1].replace(/-*(\w)-*/, '$1');
        console.log('boundary',boundary);
        //formdata types: text or file
        /**
         * text :
         * Content-Disposition: form-data; name="porperty name"
         * 
         * value
         * 
         * file:
         * Content-Disposition: form-data; name="porperty name"; filename="file name"
         * Content-Type: file type
         * 
         * file content
         */
        
        let formData = {};
        rawForm.split(new RegExp('(\\r\\n)?-*'+boundary+'-*(\\r\\n)?')).filter(e=>e).forEach(/**@param {raw chunk for every data} e */e=>{
            let exeres = /\r\n\r\n/.exec(e);
            if(!exeres)return;
            let idx =exeres.index;
            let raw = [Buffer.from(e.slice(0 ,idx ), 'binary' ).toString('utf8') , e.slice(idx+"\r\n\r\n".length)];
            // console.log('raw',raw)
            let res = {};
            res.data = raw[1];
            raw[0].split(/\r\n|;/).filter(e=>e).forEach(/**@param {connected key-value } e*/e=>{
                let tmp = e.split(/:|=/).map(e=>trim(e));
                
                res[tmp[0].toLowerCase()] = tmp[1];
            });

            // return res;
            if(res.name){
                res.name = trimQuotation(res.name)
                formData[res.name?res.name:Symbol()] = res;
            }else{
                throw new Error("form data must have name");
            }

            if(res.filename){
                res.filename = trimQuotation(res.filename);
            }

            if(typeis.is(res['content-type'] , binTypes) && isBuffer ){
                res.data = Buffer.from(res.data , 'binary');
            }else if(! typeis.is(res['content-type'] , binTypes)){
                res.data = Buffer.from(res.data , 'binary').toString(res.charset?res.charset:ctx.request.charset?ctx.request.charset:'utf8');

            }
            
            
        });
        ctx.request.formData = formData;

    }

}

let trimRe = /\s*(\S*)\s*/;
function trim(str){

    return str.replace(trimRe,'$1' );
}

let quoTrimRe = /((?:'|")?)(.*)\1/;
function trimQuotation(str){
    return str.replace(quoTrimRe, '$2');
}

