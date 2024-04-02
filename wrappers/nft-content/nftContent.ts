import {Builder, Cell, Dictionary, beginCell} from '@ton/core';
import { sha256_sync } from '@ton/crypto'

const ON_CHAIN_CONTENT_PREFIX       = 0x00
const OFF_CHAIN_CONTENT_PREFIX      = 0x01

const CONTENT_DATA_FORMAT_SNAKE     = 0x00;
const CONTENT_DATA_FORMAT_CHUNKED   = 0x01;

export function flattenSnakeCell(cell: Cell) {
    let c: Cell|null = cell

    let res = Buffer.alloc(0)

    while (c) {
        let cs = c.beginParse()
        let data = cs.loadBuffer(cs.remainingBits / 8);
        res = Buffer.concat([res, data])
        c = c.refs[0]
    }

    return res
}

function bufferToChunks(buff: Buffer, chunkSize: number) {
    let chunks: Buffer[] = []
    while (buff.byteLength > 0) {
        chunks.push(buff.slice(0, chunkSize))
        buff = buff.slice(chunkSize)
    }
    return chunks
}

export function makeSnakeCell(data: Buffer) {
    let chunks = bufferToChunks(data, 127)
    let rootCell = new Builder()
    for(let p = chunks.length - 1; p >= 0; p--) {
        let curCell = rootCell;
        curCell.storeBuffer(chunks[p]);
        if(p > 0) {
            rootCell = new Builder();
            rootCell.storeRef(curCell);            
        }
    }
    return rootCell.endCell();
}

export function encodeOffChainContent(content: string) {
    let data = Buffer.from(content)
    let offChainPrefix = Buffer.from([OFF_CHAIN_CONTENT_PREFIX])
    data = Buffer.concat([offChainPrefix, data])
    return makeSnakeCell(data)
}

export function decodeOffChainContent(content: Cell) {
    let data = flattenSnakeCell(content)

    let prefix = data[0]
    if (prefix !== OFF_CHAIN_CONTENT_PREFIX) {
        throw new Error(`Unknown content prefix: ${prefix.toString(16)}`)
    }
    return data.slice(1).toString()
}

export function toSha256(s: string): bigint {
    return BigInt('0x' + sha256_sync(s).toString('hex'))
}

export function toTextCellSnake(s: string | Buffer): Cell {
    let data = (s instanceof Buffer) ? s : Buffer.from(s);
    data = Buffer.concat([Buffer.from([CONTENT_DATA_FORMAT_SNAKE]), data]);
    return makeSnakeCell(data);
}

export function decodeOnChainCell(cell: Cell): string | Buffer {
    let cs = cell.beginParse();
    if(cs.remainingBits < 8 || cs.preloadUint(8) != CONTENT_DATA_FORMAT_SNAKE) {
        throw new Error(`Invalid content data format`);
    }
    cs.loadUint(8);
    let res: Buffer = Buffer.alloc(0);
    while(true) {
        if(cs.remainingBits >= 8) {
            let chunk = cs.loadBuffer(cs.remainingBits >> 3);
            res = Buffer.concat([res, chunk])
        }
        if(cs.remainingRefs > 0) {
            cs = cs.loadRef().beginParse();
        } else {
            break;
        }
    }

    // Check buffer contains only utf-8 chars and no zero chars (0..31 except 10, 13, 9)
    try {
        let resUtf8 = res.toString('utf-8');
        if(Buffer.from(resUtf8, 'utf-8').compare(res) === 0 && 
            res.find((c) => (c < 32 && (c != 10 && c != 13 && c !== 9))) === undefined)
        {
            return resUtf8;
        }
    } catch(e: any) {
        // pass
    }

    return res;
}

// 'contect' should be dictionary
export function encodeOnChainContent(content: Map<string, string | Buffer> | { [key: string]: string | Buffer }): Cell {
    const keyLen = 256;
    const keys = Dictionary.Keys.BigUint(256);
    const values = Dictionary.Values.Cell();
    let d = Dictionary.empty(keys, values);
    
    if(content instanceof Map) {
        for (const [key, value] of content.entries()) {
            d.set(toSha256(key), toTextCellSnake(value));
        }
    } else {
        for (let key in content) {
            const value = content[key];
            d.set(toSha256(key), toTextCellSnake(value));
        }
    }
    return beginCell().storeUint(ON_CHAIN_CONTENT_PREFIX, 8).storeDict(d).endCell()
}

function addKeysHashesToTheMap(map: Map<bigint, string>, keys?: string[]): Map<bigint, string> {
    if(keys && keys.length > 0) {
        let existingKeys = Array.from(map.values());
        keys.forEach((key) => {
            if(!existingKeys.includes(key)) {
                map.set(toSha256(key), key);
            }
        });
    }
    return map;
}

let g_supportedKeys = addKeysHashesToTheMap(new Map(), [
    "uri", "name", "description", "image", "image_data", "symbol", "decimals", "content_url", "attributes", "amount_style", "render_type", "currency", "game"]);

export function decodeOnChainContent(content: Cell, additionalSupportedFields?: string[]): { [key: string]: string | Buffer } {
    let res: { [key: string]: string | Buffer } = {};

    let hashToKey = addKeysHashesToTheMap(g_supportedKeys, additionalSupportedFields);
    let cs = content.beginParse();
    if(cs.remainingBits < 8 || cs.preloadUint(8) != ON_CHAIN_CONTENT_PREFIX) {
        throw new Error(`Invalid onchain content prefix`);
    }
    cs.loadUint(8);

    const keyLen = 256;
    const keys = Dictionary.Keys.BigUint(256);
    const values = Dictionary.Values.Cell();
    let d = cs.loadDict(keys, values);

    d.keys().forEach((key) => {
        let keyStr = hashToKey.get(key);
        if(keyStr === undefined) {
            keyStr = "hash_" + key.toString(16);
        }

        let valueCell = d.get(key);
        if(valueCell !== undefined) {
            res[keyStr] = decodeOnChainCell(valueCell);
        }
    });

    return res;
}