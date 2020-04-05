# koa form data parse
parse multipart/form-data for koa

# Usage
```js
const Koa = require('koa');
const formdataParser = require('koa-formDataParse');

const app = new Koa();
app.use(formdataParser());

app.use(async ctx=>{
    ctx.body = ctx.request.formData;
});
```

# Options
- **binTypes:** data types encode with 'binary', default is ['image/*']
- **isBuffer:** set binary data type is buffer or 'binary' encoded string.
- **acceptTypes:** parser enabled only when request content-type hits acceptTypes.
- **limit:** default is '1mb'.

# Licences
MIT


