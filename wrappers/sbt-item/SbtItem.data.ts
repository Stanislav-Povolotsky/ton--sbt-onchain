import {Address, Cell, beginCell} from '@ton/core';
import {encodeOffChainContent} from "../nft-content/nftContent";
import {Queries as CollectionQueries} from '../nft-collection/NftCollection.data'

export type SbtItemDataBase = {
    inited?: boolean
    index: number
    collectionAddress: Address | null
    ownerAddress: Address | null
    content: Cell | string
}

export type SbtItemData = SbtItemDataBase & {
    authorityAddress: Address
    revokedAt?: number
}

export function buildSbtItemDataCell(data: SbtItemData) {
    let dataCell = beginCell()
    let contentCell = (typeof data.content === 'string') ? encodeOffChainContent(data.content) : data.content

    dataCell.storeUint(data.index, 64)
    dataCell.storeAddress(data.collectionAddress)
    dataCell.storeAddress(data.ownerAddress)
    dataCell.storeRef(contentCell)
    dataCell.storeAddress(data.authorityAddress)
    dataCell.storeUint(data.revokedAt ? data.revokedAt : 0, 64)

    return dataCell.endCell()
}

export function buildSbtItemDeployMessage(conf: { queryId?: number, collectionAddress: Address, passAmount: bigint, itemIndex: number, itemOwnerAddress: Address, itemContent: string, ownerPubKey: bigint }) {
    let msgBody = CollectionQueries.mintNft(conf)

    return {
        messageBody: msgBody,
        collectionAddress: conf.collectionAddress
    }
}

export type SbtSingleData = {
    ownerAddress: Address
    editorAddress: Address
    content: Cell | string
    authorityAddress: Address
    revokedAt?: number
}

export function buildSingleSbtDataCell(data: SbtSingleData) {
    let dataCell = beginCell()
    let contentCell = (typeof data.content === 'string') ? encodeOffChainContent(data.content) : data.content

    dataCell.storeAddress(data.ownerAddress)
    dataCell.storeAddress(data.editorAddress)
    dataCell.storeRef(contentCell)
    dataCell.storeAddress(data.authorityAddress)
    dataCell.storeUint(data.revokedAt ? data.revokedAt : 0, 64)

    return dataCell.endCell()
}

export const OperationCodes = {
    transfer: 0x5fcc3d14,
    excesses: 0xd53276db,
    getStaticData: 0x2fcb26a2,
    getStaticDataResponse: 0x8b771735,
    EditContent: 0x1a0b9d51,
    TransferEditorship: 0x1c04412a,
    ProveOwnership: 0x04ded148,
    OwnershipProof: 0x0524c7ae,
    OwnershipProofBounced: 0xc18e86d2,
    RequestOwnerInfo: 0xd0c3bfea,
    OwnerInfo: 0x0dd607e3,
    TakeExcess: 0xd136d3b3,
    Destroy: 0x1f04537a,
    Revoke: 0x6f89f5e3
}

export const Queries = {
    transfer: (params: { queryId?: number, newOwner: Address | null, responseTo?: Address, forwardAmount?: bigint }) => {
        let msgBody = beginCell()
        msgBody.storeUint(OperationCodes.transfer, 32)
        msgBody.storeUint(params.queryId || 0, 64)
        msgBody.storeAddress(params.newOwner)
        msgBody.storeAddress(params.responseTo || null)
        msgBody.storeBit(false) // no custom payload
        msgBody.storeCoins(params.forwardAmount ?? 0n)
        msgBody.storeBit(0) // no forward_payload yet

        return msgBody
    },
    destroy: (params: { queryId?: number}) => {
        let msgBody = beginCell()
        msgBody.storeUint(OperationCodes.Destroy, 32)
        msgBody.storeUint(params.queryId || 0, 64)
        return msgBody.endCell()
    },
    revoke: (params: { queryId?: number}) => {
        let msgBody = beginCell()
        msgBody.storeUint(OperationCodes.Revoke, 32)
        msgBody.storeUint(params.queryId || 0, 64)
        return msgBody.endCell()
    },
    takeExcess: (params: { queryId?: number}) => {
        let msgBody = beginCell()
        msgBody.storeUint(OperationCodes.TakeExcess, 32)
        msgBody.storeUint(params.queryId || 0, 64)
        return msgBody.endCell()
    },
    proveOwnership: (params: { queryId?: number, to: Address, data: Cell, withContent:boolean }) => {
        let msgBody = beginCell()
        msgBody.storeUint(OperationCodes.ProveOwnership, 32)
        msgBody.storeUint(params.queryId || 0, 64)
        msgBody.storeAddress(params.to)
        msgBody.storeRef(params.data)
        msgBody.storeBit(params.withContent)

        return msgBody.endCell()
    },
    requestOwnerInfo: (params: { queryId?: number, to: Address, data: Cell, withContent:boolean }) => {
        let msgBody = beginCell()
        msgBody.storeUint(OperationCodes.RequestOwnerInfo, 32)
        msgBody.storeUint(params.queryId || 0, 64)
        msgBody.storeAddress(params.to)
        msgBody.storeRef(params.data)
        msgBody.storeBit(params.withContent)

        return msgBody.endCell()
    },
    ownershipProof: (params: { queryId?: number, id: number, owner: Address, data: Cell }, bounced?: boolean) => {
        let msgBody = beginCell()
        if (bounced === true) {
            msgBody.storeUint(0xffffffff, 32)
        }
        msgBody.storeUint(OperationCodes.OwnershipProof, 32)
        msgBody.storeUint(params.queryId || 0, 64)
        msgBody.storeUint(params.id, 256)
        msgBody.storeAddress(params.owner)
        msgBody.storeRef(params.data)
        msgBody.storeUint(0, 64)
        msgBody.storeBit(true)
        msgBody.storeRef(beginCell().endCell())

        return msgBody.endCell()
    },
    ownerInfo: (params: { queryId?: number, id: number, initiator: Address, owner: Address, data: Cell }, bounced?: boolean) => {
        let msgBody = beginCell()
        if (bounced === true) {
            msgBody.storeUint(0xffffffff, 32)
        }
        msgBody.storeUint(OperationCodes.OwnerInfo, 32)
        msgBody.storeUint(params.queryId || 0, 64)
        msgBody.storeUint(params.id, 256)
        msgBody.storeAddress(params.initiator)
        msgBody.storeAddress(params.owner)
        msgBody.storeRef(params.data)
        msgBody.storeUint(0, 64)
        msgBody.storeBit(true)
        msgBody.storeRef(beginCell().endCell())

        return msgBody.endCell()
    },
    getStaticData: (params: {queryId?: number}) => {
        let msgBody = beginCell()
        msgBody.storeUint(OperationCodes.getStaticData, 32)
        msgBody.storeUint(params.queryId || 0, 64)
        msgBody.storeUint(OperationCodes.getStaticData, 32)

        msgBody.storeUint(OperationCodes.getStaticData, 32)
        msgBody.storeUint(OperationCodes.getStaticData, 32)
        msgBody.storeUint(OperationCodes.getStaticData, 32)
        msgBody.storeUint(OperationCodes.getStaticData, 32)
        msgBody.storeUint(OperationCodes.getStaticData, 32)
        msgBody.storeUint(OperationCodes.getStaticData, 32)
        msgBody.storeUint(OperationCodes.getStaticData, 32)
        msgBody.storeUint(OperationCodes.getStaticData, 32)

        return msgBody.endCell()
    },
    editContent: (params: { queryId?: number, content: Cell }) => {
        let msgBody = beginCell()
        msgBody.storeUint(OperationCodes.EditContent, 32)
        msgBody.storeUint(params.queryId || 0, 64)
        msgBody.storeRef(params.content)

        return msgBody.endCell()
    },
    transferEditorship: (params: { queryId?: number, newEditor: Address, responseTo: Address|null, forwardAmount?: bigint }) => {
        let msgBody = beginCell()
        msgBody.storeUint(OperationCodes.TransferEditorship, 32)
        msgBody.storeUint(params.queryId || 0, 64)
        msgBody.storeAddress(params.newEditor)
        msgBody.storeAddress(params.responseTo || null)
        msgBody.storeBit(false) // no custom payload
        msgBody.storeCoins(params.forwardAmount || 0)
        msgBody.storeBit(0) // no forward_payload yet

        return msgBody.endCell()
    },
}