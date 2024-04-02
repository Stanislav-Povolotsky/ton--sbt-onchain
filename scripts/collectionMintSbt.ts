import fs from 'fs';
import { Address, toNano } from '@ton/core';
import { SbtItem } from '../wrappers/sbt-item/SbtItem';
import { NftCollection } from "../wrappers/nft-collection/NftCollection";
import { compile, NetworkProvider } from '@ton/blueprint';
import { encodeOnChainContent } from '../wrappers/nft-content/nftContent';

export async function run(provider: NetworkProvider, args: string[]) {
    const collectionInfoFile = "collection.json";
    let collectionInfo = JSON.parse(fs.readFileSync(collectionInfoFile, 'utf8'));
    
    //const ownerAddress = Address.parse(args.length > 0 ? args[0] : await ui.input('Owner address'));
    const ownerAddress = provider.sender().address!;
    const authorityAddress = ownerAddress;

    const collection = provider.open(
        NftCollection.createFromAddress(Address.parse(collectionInfo.collectionAddress))
    );

    console.log('Collection address:', collection.address);

    if (!(await provider.isContractDeployed(collection.address))) {
        throw new Error('Collection not deployed');
    }

    let collData = await collection.getCollectionData();
    console.log('Next item ID:', collData.nextItemId);

    let itemIndex = collData.nextItemId;
    let itemAddress = await collection.getNftAddressByIndex(itemIndex);
    console.log('Next item index:', collData.nextItemId, ' address:', itemAddress.toString());

    if (await provider.isContractDeployed(itemAddress)) {
        throw Error('Already deployed');
    }

    let res = await collection.sendDeployNewSbt(provider.sender(), toNano('0.15'), {
        passAmount: toNano('0.1'),
        itemIndex: itemIndex,
        itemOwnerAddress: ownerAddress,
        itemContent: encodeOnChainContent({
            "description": "Stanislav Povolotsky",
        }),
        itemAuthority: authorityAddress
    })
    console.log('Sent collection mint request');

    await provider.waitForDeploy(itemAddress);
    console.log('Item deployed:', itemAddress);
}
