import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, toNano } from '@ton/core';
import { buildSbtItemDataCell, buildSingleSbtDataCell, Queries, SbtItemData, SbtItemDataBase, SbtSingleData } from "./SbtItem.data"

export class SbtItem implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new SbtItem(address);
    }

    static createFromConfig(config: SbtItemData, code: Cell, workchain = 0) {
        const data = buildSbtItemDataCell(config);
        const init = { code, data };
        return new SbtItem(contractAddress(workchain, init), init);
    }

    static createSingleFromConfig(config: SbtSingleData, code: Cell, workchain = 0) {
        const data = buildSingleSbtDataCell(config);
        const init = { code, data };
        return new SbtItem(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        return await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async getNftData(provider: ContractProvider): Promise<SbtItemDataBase> {
        const nftData = (await provider.get('get_nft_data', [])).stack
        
        return {
            inited: nftData.readBoolean(),
            index: nftData.readNumber(),
            collectionAddress: nftData.readAddressOpt(),
            ownerAddress: nftData.readAddressOpt(),
            content: nftData.readCell(),
        }        
    }

    async getSbtData(provider: ContractProvider): Promise<SbtItemDataBase> {
        return await this.getNftData(provider)
    }

    async getAuthority(provider: ContractProvider): Promise<Address | null> {
        const stack = (await provider.get('get_authority_address', [])).stack
        return stack.readAddressOpt()
    }

    async getRevokedTime(provider: ContractProvider): Promise<number | null> {
        const stack = (await provider.get('get_revoked_time', [])).stack
        let res = stack.readNumber()
        return (res === 0) ? null : res
    }

    async getEditor(provider: ContractProvider): Promise<Address | null> {
        let res = await provider.get('get_editor', [])
        return res.stack.readAddressOpt()
    }

    //
    //  Internal messages
    //

    async sendTransfer(provider: ContractProvider, via: Sender, to: Address) {
        throw new Error('Not implemented for SBT')
    }

    async sendGetStaticData(provider: ContractProvider, via: Sender) {
        let msgBody = Queries.getStaticData({})

        return await provider.internal(via, {
            value: toNano('0.05'),
            body: msgBody
        })
    }

    async sendEditContent(provider: ContractProvider, via: Sender, params: { queryId?: number, content: Cell}) {
        let msgBody = Queries.editContent(params)
        return await provider.internal(via, {
            value: toNano('0.05'),
            body: msgBody
        })
    }

    async sendTransferEditorship(provider: ContractProvider, via: Sender, params: { queryId?: number, newEditor: Address, responseTo: Address | null, forwardAmount?: bigint }) {
        let msgBody = Queries.transferEditorship(params)
        return await provider.internal(via, {
            value: toNano('0.05'),
            body: msgBody
        })
    }

    async sendDestoy(provider: ContractProvider, via: Sender, params?: { queryId?: number }) {
        let msgBody = Queries.destroy(params || {})
        return await provider.internal(via, {
            value: toNano('0.05'),
            body: msgBody
        })
    }

    async sendRevoke(provider: ContractProvider, via: Sender, params?: { queryId?: number }) {
        let msgBody = Queries.revoke(params || {})
        return await provider.internal(via, {
            value: toNano('0.05'),
            body: msgBody
        })
    }

    async sendTakeExcess(provider: ContractProvider, via: Sender, params?: { queryId?: number }) {
        let msgBody = Queries.takeExcess(params || {})
        return await provider.internal(via, {
            value: toNano('0.05'),
            body: msgBody
        })
    }
}
