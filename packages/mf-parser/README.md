# mf-parser

  [![NPM version][npm-image]][npm-url]
  [![npm download][download-image]][download-url]

.


## Installation

`$ npm install mf-parser`

## [API Documentation](https://cheminfo-js.github.io/mf-parser/)

## Example

```js
const parseToHtml = require('mf-parser').parseToHtml;
let html = parseToHtml('Et3N . 2HCl);
```

You may also be interested to parse first the MF and then retrieve display representation
```js
const MFParser = require('mf-parser');
let parsed = MFParser.parse('Et3N . 2HCl');
let displayed = MFParser.toDisplay(parsed);
// displayed could be used to ocreate a custom renderer
console.log(displayed);
```



## License

  [MIT](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/mf-parser.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/mf-parser
[download-image]: https://img.shields.io/npm/dm/mf-parser.svg?style=flat-square
[download-url]: https://www.npmjs.com/package/mf-parser