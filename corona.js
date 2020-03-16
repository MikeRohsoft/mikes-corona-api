const http = require('http-wrapper');
const HTMLTableDataExtractor = require('html-table-data-extractor');

let buffer = [];
let bufferTime;

const url = 'https://www.worldometers.info/coronavirus/';

module.exports = () => new Promise(resolve => {
    const now = new Date().getTime();
    if (!bufferTime || (bufferTime + 1800000) < now) {
        console.log(`time to refresh corona DB`);
        bufferTime = now;
    } else {
        return resolve(buffer);
    }

    http.get(url).then((res) => {
        const content = res.content.toString();
        const array = HTMLTableDataExtractor(content);
        const [realHeaders] = array.splice(0, 1);
        const header = [
            'country',
            'total.cases',
            'new.cases',
            'total.deaths',
            'new.deaths',
            'total.recovered',
            'active.cases',
            'serious.critical',
            'total.cases.each.mill',
        ];

        for (let v, i = 0; v = realHeaders[i]; i++) {
            if (typeof v === 'string') {
                realHeaders[i] = v
                    .replace('<br />', ' ')
                    .replace(/&nbsp;/g, ' ');
            }
        }

        const headerMap = {};
        for (let head, i = 0; head = header[i]; i++) {
            headerMap[head] = realHeaders[i];
        }

        const tagregex = /<(\w+)[^>]*?>(.*?)<\/\1>/gs;
        for (const arr of array) {
            for (let v, i = 0; v = arr[i]; i++) {
                const found = tagregex.exec(v);
                if (!!found && !!found[2]) {
                    arr[i] = found[2];
                }
            }
        }
        
        const result = [];
        for (const line of array) {
            const obj = {};
            for (let v, i = 0; v = header[i]; i++) {
                obj[v] = line[i];
            }
            result.push(obj);
        }

        buffer = [headerMap, result];
        resolve(buffer);
    }).catch(console.error);
});
