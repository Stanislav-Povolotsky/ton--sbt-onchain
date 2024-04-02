import {Address, Cell, Slice, Builder, contractAddress, beginCell, storeStateInit, Dictionary, DictionaryKey, DictionaryValue, DictionaryKeyTypes} from '@ton/core';
import { encodeOffChainContent } from '../nft-content/nftContent';

export type RoyaltyParams = {
    royaltyFactor: number
    royaltyBase: number
    royaltyAddress: Address
}

export type NftCollectionData = {
    ownerAddress: Address,
    nextItemIndex?: number | bigint
    collectionContent: string | Cell
    commonContent: string | Cell
    nftItemCode: Cell
    royaltyParams: RoyaltyParams
}

// default#_ royalty_factor:uint16 royalty_base:uint16 royalty_address:MsgAddress = RoyaltyParams;
// storage#_ owner_address:MsgAddress next_item_index:uint64
//           ^[collection_content:^Cell common_content:^Cell]
//           nft_item_code:^Cell
//           royalty_params:^RoyaltyParams
//           = Storage;

export function buildNftCollectionDataCell(data: NftCollectionData) {
    let dataCell = beginCell()

    dataCell.storeAddress(data.ownerAddress)
    dataCell.storeUint(data.nextItemIndex || 0, 64)

    let contentCell = beginCell()

    let collectionContent = (data.collectionContent instanceof Cell) ? data.collectionContent : 
        encodeOffChainContent(data.collectionContent);
    let commonContent = (data.commonContent instanceof Cell) ? data.commonContent : 
        beginCell().storeStringTail(data.commonContent).endCell();

    contentCell.storeRef(collectionContent)
    contentCell.storeRef(commonContent)
    dataCell.storeRef(contentCell)

    dataCell.storeRef(data.nftItemCode)

    let royaltyCell = beginCell()
    royaltyCell.storeUint(data.royaltyParams.royaltyFactor, 16)
    royaltyCell.storeUint(data.royaltyParams.royaltyBase, 16)
    royaltyCell.storeAddress(data.royaltyParams.royaltyAddress)
    dataCell.storeRef(royaltyCell)

    return dataCell.endCell()
}

export function buildNftCollectionStateInit(conf: NftCollectionData, code: Cell) {
    let dataCell = buildNftCollectionDataCell(conf)
    let stateInit = {
        code: code,
        data: dataCell
    }

    let stateInitCell = storeStateInit(stateInit)

    let address = contractAddress(0, stateInit)

    return {
        stateInit: stateInitCell,
        stateInitMessage: stateInit,
        address
    }
}

export const OperationCodes = {
    Mint: 1,
    BatchMint: 2,
    ChangeOwner: 3,
    EditContent: 4,
    GetRoyaltyParams: 0x693d3950,
    GetRoyaltyParamsResponse: 0xa8cb00ad
}

export type CollectionMintNftItemInput = {
    passAmount: bigint
    index: number
    ownerAddress: Address
    content: string | Cell
}

export type CollectionMintSbtItemInput = {
    passAmount: bigint
    index: number
    ownerAddress: Address
    authorityAddress: Address
    content: string | Cell
}

export const Queries = {
    mintNft: (params: { queryId?: number, passAmount: bigint, itemIndex: number, itemOwnerAddress: Address, itemContent: string | Cell }) => {
        let msgBody = beginCell()

        msgBody.storeUint(OperationCodes.Mint, 32)
        msgBody.storeUint(params.queryId || 0, 64)
        msgBody.storeUint(params.itemIndex, 64)
        msgBody.storeCoins(params.passAmount)

        let itemContent = (params.itemContent instanceof Cell) ? params.itemContent : 
            beginCell().storeStringTail(params.itemContent).endCell();
        let nftItemMessage = beginCell()

        nftItemMessage.storeAddress(params.itemOwnerAddress)
        nftItemMessage.storeRef(itemContent)

        msgBody.storeRef(nftItemMessage)

        return msgBody.endCell()
    },
    mintSbt: (params: { queryId?: number, passAmount: bigint, itemIndex: number, itemOwnerAddress: Address, itemContent: string | Cell, itemAuthority: Address }) => {
        let msgBody = beginCell()

        msgBody.storeUint(OperationCodes.Mint, 32)
        msgBody.storeUint(params.queryId || 0, 64)
        msgBody.storeUint(params.itemIndex, 64)
        msgBody.storeCoins(params.passAmount)

        let itemContent = (params.itemContent instanceof Cell) ? params.itemContent : 
            beginCell().storeStringTail(params.itemContent).endCell();

        let sbtItemMessage = beginCell()

        sbtItemMessage.storeAddress(params.itemOwnerAddress)
        sbtItemMessage.storeRef(itemContent)
        sbtItemMessage.storeAddress(params.itemAuthority)

        msgBody.storeRef(sbtItemMessage)

        return msgBody.endCell()
    },
    batchMintNft: (params: { queryId?: number, items: CollectionMintNftItemInput[] }) => {
        if (params.items.length > 250) {
            throw new Error('Too long list')
        }

        class CollectionMintNftItemInputDictionaryValue implements DictionaryValue<CollectionMintNftItemInput> {
            serialize(src: CollectionMintNftItemInput, cell: Builder): void {
                let nftItemMessage = beginCell();
                let itemContent = (src.content instanceof Cell) ? src.content : 
                    beginCell().storeStringTail(src.content).endCell();
                nftItemMessage.storeAddress(src.ownerAddress);
                nftItemMessage.storeRef(itemContent);
                cell.storeCoins(src.passAmount);
                cell.storeRef(nftItemMessage);
            }

            parse(cell: Slice): CollectionMintNftItemInput {
                const nftItemMessage = cell.loadRef().beginParse();
                const itemContent = nftItemMessage.loadRef();
                const ownerAddress = nftItemMessage.loadAddress();
                const content = itemContent;
                const passAmount = cell.loadCoins();
                return {
                    index: 0,
                    ownerAddress,
                    content,
                    passAmount
                };
            }
        }

        let itemsMap = Dictionary.empty<number, CollectionMintNftItemInput>(Dictionary.Keys.Uint(64), new CollectionMintNftItemInputDictionaryValue());
        for (let item of params.items) {
            itemsMap.set(item.index, item)
        }

        let dictCell = beginCell()
            .storeDictDirect(itemsMap)
            .endCell();
        
        let msgBody = beginCell()

        msgBody.storeUint(OperationCodes.BatchMint, 32)
        msgBody.storeUint(params.queryId || 0, 64)
        msgBody.storeRef(dictCell)

        return msgBody.endCell()
    },
    batchMintSbt: (params: { queryId?: number, items: CollectionMintSbtItemInput[] }) => {
        if (params.items.length > 250) {
            throw new Error('Too long list')
        }

        class CollectionMintSbtItemInputDictionaryValue implements DictionaryValue<CollectionMintSbtItemInput> {
            serialize(src: CollectionMintSbtItemInput, cell: Builder): void {
                let nftItemMessage = beginCell();
                let itemContent = (src.content instanceof Cell) ? src.content : 
                    beginCell().storeStringTail(src.content).endCell();
                nftItemMessage.storeAddress(src.ownerAddress);
                nftItemMessage.storeRef(itemContent);
                nftItemMessage.storeAddress(src.authorityAddress)

                cell.storeCoins(src.passAmount);
                cell.storeRef(nftItemMessage);
            }

            parse(cell: Slice): CollectionMintSbtItemInput {
                const nftItemMessage = cell.loadRef().beginParse();
                const itemContent = nftItemMessage.loadRef();
                const ownerAddress = nftItemMessage.loadAddress();
                const authorityAddress = nftItemMessage.loadAddress();
                const content = itemContent;
                const passAmount = cell.loadCoins();
                return {
                    index: 0,
                    ownerAddress,
                    content,
                    passAmount,
                    authorityAddress
                };
            }
        }

        let itemsMap = Dictionary.empty<number, CollectionMintNftItemInput>(Dictionary.Keys.Uint(64), new CollectionMintSbtItemInputDictionaryValue());
        for (let item of params.items) {
            itemsMap.set(item.index, item)
        }

        let dictCell = beginCell()
            .storeDictDirect(itemsMap)
            .endCell();
        
        let msgBody = beginCell()

        msgBody.storeUint(OperationCodes.BatchMint, 32)
        msgBody.storeUint(params.queryId || 0, 64)
        msgBody.storeRef(dictCell)

        return msgBody.endCell()
    },
    changeOwner: (params: { queryId?: number, newOwner: Address}) => {
        let msgBody = beginCell()
        msgBody.storeUint(OperationCodes.ChangeOwner, 32)
        msgBody.storeUint(params.queryId || 0, 64)
        msgBody.storeAddress(params.newOwner)
        return msgBody.endCell()
    },
    getRoyaltyParams: (params: { queryId?: number }) => {
        let msgBody = beginCell()
        msgBody.storeUint(OperationCodes.GetRoyaltyParams, 32)
        msgBody.storeUint(params.queryId || 0, 64)
        return msgBody.endCell()
    },
    editContent: (params: { queryId?: number, collectionContent: string | Cell, commonContent: string | Cell, royaltyParams: RoyaltyParams }) => {
        let msgBody = beginCell()
        msgBody.storeUint(OperationCodes.EditContent, 32)
        msgBody.storeUint(params.queryId || 0, 64)

        let royaltyCell = beginCell()
        royaltyCell.storeUint(params.royaltyParams.royaltyFactor, 16)
        royaltyCell.storeUint(params.royaltyParams.royaltyBase, 16)
        royaltyCell.storeAddress(params.royaltyParams.royaltyAddress)

        let contentCell = beginCell()

        let collectionContent = (params.collectionContent instanceof Cell) ? params.collectionContent : 
            beginCell().storeStringTail(params.collectionContent).endCell();
        let commonContent = (params.commonContent instanceof Cell) ? params.commonContent : 
            beginCell().storeStringTail(params.commonContent).endCell();

        contentCell.storeRef(collectionContent)
        contentCell.storeRef(commonContent)

        msgBody.storeRef(contentCell)
        msgBody.storeRef(royaltyCell)

        return msgBody.endCell()
    }
}