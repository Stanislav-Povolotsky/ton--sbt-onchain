import {decodeOffChainContent, decodeOnChainCell, decodeOnChainContent, encodeOffChainContent, encodeOnChainContent, flattenSnakeCell, makeSnakeCell} from "./nftContent";

describe('nft content encoder', () => {
    it('should encode off chain content', async () => {
        let text = `Apple was founded as Apple Computer Company on April 1, 1976, by Steve Jobs, Steve Wozniak and Ronald Wayne to develop and sell Wozniak's Apple I personal computer. It was incorporated by Jobs and Wozniak as Apple Computer, Inc. in 1977 and the company's next computer, the Apple II became a best seller. Apple went public in 1980, to instant financial success. The company went onto develop new computers featuring innovative graphical user interfaces, including the original Macintosh, announced in a critically acclaimed advertisement, "1984", directed by Ridley Scott. By 1985, the high cost of its products and power struggles between executives caused problems. Wozniak stepped back from Apple amicably, while Jobs resigned to found NeXT, taking some Apple employees with him.`

        expect(decodeOffChainContent(encodeOffChainContent(text))).toEqual(text)
    })

    it('should encode on chain content', async () => {
        let config = {
            "name": "My name",
            "description": "Hello, 你好, こんにちは, 안녕하세요, مرحبا, नमस्ते, Привет, Olá, Hola, Salut, Ciao",
            "image_data": Buffer.concat([Buffer.from("PNG\x00\x01\x02"), Buffer.alloc(400, 0), Buffer.from("end")]),
            "some_custom_unknown_field": "HI",
        }
        let cell = encodeOnChainContent(config);
        let decoded = decodeOnChainContent(cell, ["some_custom_unknown_field"]);
        expect(decoded).toEqual(config)

        let config2 = {
            ...config,
            some_custom_unknown_field2: "field2"
        }

        cell = encodeOnChainContent(config2)
        decoded = decodeOnChainContent(cell);
        expect(decoded.some_custom_unknown_field2).toEqual(undefined);
        expect(decoded.hash_5292647aafbfd0a79f652875f31a4d91960db06b74150738e5dc3b6d0023847b).toEqual("field2");
    })

})

