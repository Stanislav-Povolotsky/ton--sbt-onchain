import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, toNano } from '@ton/core';
import { buildNftCollectionDataCell, CollectionMintNftItemInput, CollectionMintSbtItemInput, NftCollectionData, Queries, RoyaltyParams } from "./NftCollection.data"
import { decodeOffChainContent, encodeOffChainContent } from "../nft-content/nftContent"

export class NftCollection implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) { }
    fees: {
        defaultFee: bigint;
        sendDeployFee?: bigint;
        sendGetRoyaltyParamsFee?: bigint;
        sendEditContentFee?: bigint;
        sendChangeOwnerFee?: bigint;
        sendBatchDeployNftFee?: bigint;
        sendDeployNewNftFee?: bigint;
        sendDeployNewSbtFee?: bigint;
    } = { defaultFee: toNano(0.1), sendDeployFee: toNano(1) }

    static createFromAddress(address: Address) {
        return new NftCollection(address);
    }

    static createFromConfig(config: NftCollectionData | Cell, code: Cell, workchain = 0) {
        const data = (config instanceof Cell) ? config : buildNftCollectionDataCell(config);
        const init = { code, data };
        return new NftCollection(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    //
    // Get methods
    //

    async getCollectionData(provider: ContractProvider): Promise<{ nextItemId: number, ownerAddress: Address, collectionContent: Cell }> {
        let res = await provider.get('get_collection_data', [])
        let [nextItemId, collectionContent, ownerAddress] = [res.stack.readNumber(), res.stack.readCell(), res.stack.readAddressOpt()]

        return {
            nextItemId: nextItemId,
            collectionContent: collectionContent,
            ownerAddress: ownerAddress!
        }
    }

    async getNftAddressByIndex(provider: ContractProvider, index: number): Promise<Address> {
        let res = (await provider.get('get_nft_address_by_index', [{
            type: 'int',
            value: BigInt(index)
        }])).stack
        return res.readAddress()
    }

    async getRoyaltyParams(provider: ContractProvider): Promise<RoyaltyParams> {
        let res = (await provider.get('royalty_params', [])).stack
        let [royaltyFactor, royaltyBase, royaltyAddress] = [res.readNumber(), res.readNumber(), res.readAddress()]

        return {
            royaltyFactor: royaltyFactor,
            royaltyBase: royaltyBase,
            royaltyAddress: royaltyAddress
        }
    }

    async getNftContent(provider: ContractProvider, index: number, nftIndividualContent: Cell): Promise<Cell> {
        let res = (await provider.get('get_nft_content', [
            { type: 'int', value: BigInt(index) },
            { type: 'cell', cell: nftIndividualContent }
        ])).stack

        return res.readCell()
    }

    async getNftContentStr(provider: ContractProvider, index: number, nftIndividualContent: Cell | string): Promise<string> {
        let res = await this.getNftContent(provider, index, (typeof nftIndividualContent === 'string') ? encodeOffChainContent(nftIndividualContent) : nftIndividualContent)
        let contentCell = res.beginParse()
        if(contentCell.remainingBits < 8 || contentCell.preloadUint(8) != 1) {
            throw new Error('Content is not a string')
        }
        return decodeOffChainContent(res)
    }

    //
    // Internal messages
    //

    async sendDeployNewNft(provider: ContractProvider, via: Sender, value: bigint, params: { queryId?: number, passAmount: bigint, itemIndex: number, itemOwnerAddress: Address, itemContent: string | Cell }) {
        let msgBody = Queries.mintNft(params)

        return await provider.internal(via, {
            value: value,
            body: msgBody
        })
    }

    async sendDeployNewSbt(provider: ContractProvider, via: Sender, value: bigint, params: { queryId?: number, passAmount: bigint, itemIndex: number, itemOwnerAddress: Address, itemContent: string | Cell, itemAuthority: Address }) {
        let msgBody = Queries.mintSbt(params)

        return await provider.internal(via, {
            value: value,
            body: msgBody
        })
    }

    async sendBatchDeployNft(provider: ContractProvider, via: Sender, value: bigint, params: { queryId?: number, items: CollectionMintNftItemInput[] }) {
        let msgBody = Queries.batchMintNft(params)

        return await provider.internal(via, {
            value: value,
            body: msgBody
        })
    }

    async sendBatchDeploySbt(provider: ContractProvider, via: Sender, value: bigint, params: { queryId?: number, items: CollectionMintSbtItemInput[] }) {
        let msgBody = Queries.batchMintSbt(params)

        return await provider.internal(via, {
            value: value,
            body: msgBody
        })
    }

    async sendChangeOwner(provider: ContractProvider, via: Sender, newOwner: Address) {
        let msgBody = Queries.changeOwner({ newOwner })

        return await provider.internal(via, {
            value: this.fees.sendChangeOwnerFee || this.fees.defaultFee,
            body: msgBody
        })
    }

    async sendGetRoyaltyParams(provider: ContractProvider, via: Sender) {
        let msgBody = Queries.getRoyaltyParams({})

        return await provider.internal(via, {
            value: this.fees.sendGetRoyaltyParamsFee || this.fees.defaultFee,
            body: msgBody
        })
    }

    async sendEditContent(provider: ContractProvider, via: Sender, params: { queryId?: number, collectionContent: string | Cell, commonContent: string | Cell, royaltyParams: RoyaltyParams }) {
        let msgBody = Queries.editContent(params)
        return await provider.internal(via, {
            value: this.fees.sendEditContentFee || this.fees.defaultFee,
            body: msgBody
        })
    }
}