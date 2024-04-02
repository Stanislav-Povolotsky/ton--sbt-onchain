import fs from 'fs';
import { Address, Cell, toNano } from '@ton/core';
import { SbtItem } from '../wrappers/sbt-item/SbtItem';
import { NftCollection } from "../wrappers/nft-collection/NftCollection";
import { NetworkProvider } from '@ton/blueprint';
import { decodeOffChainContent, decodeOnChainContent } from '../wrappers/nft-content/nftContent';

export async function run(provider: NetworkProvider, args: string[]) {
    const collectionInfoFile = "collection.json";
    let collectionInfo = JSON.parse(fs.readFileSync(collectionInfoFile, 'utf8'));
    
    let continueShowInfo = true;
    while(continueShowInfo) {
        try {
            let passedArg = args.length > 0
            const itemIndex = parseInt(args.length > 0 ? args[0] : await provider.ui().input('Item Index'));
            continueShowInfo = !passedArg

            const collection = provider.open(
                NftCollection.createFromAddress(Address.parse(collectionInfo.collectionAddress))
            );

            console.log('Collection address:', collection.address);

            if (!(await provider.isContractDeployed(collection.address))) {
                console.log('Collection not deployed');
                break;
            }

            let collData = await collection.getCollectionData();
            console.log('Collection data:');
            console.log('\tNext item ID:', collData.nextItemId);
            console.log('\tOwner address:', collData.ownerAddress.toString());
            console.log('\tContent:', decodeOnChainContent(collData.collectionContent));

            let itemAddress = await collection.getNftAddressByIndex(itemIndex);
            console.log('Item data:');
            console.log('\tItem index:', itemIndex)
            console.log('\tItem address:', itemAddress.toString())

            if (!(await provider.isContractDeployed(itemAddress))) {
                console.log('\tItem status:', "Not deployed");
                continue;
            }

            const item = provider.open(
                SbtItem.createFromAddress(itemAddress)
            );

            let itemData = await item.getNftData();
            console.log('Item nft data:');
            console.log('\tInitialized:', (itemData.inited ? itemData.inited! : 'n/a'));
            console.log('\tCollection address:', (itemData.collectionAddress ? itemData.collectionAddress!.toString() : 'null'));
            console.log('\tOwner address:', (itemData.ownerAddress ? itemData.ownerAddress!.toString() : 'null'));
            console.log('\tContent:', decodeOnChainContent((itemData.content instanceof Cell) ? itemData.content : Cell.EMPTY));

            let fullData = await collection.getNftContent(itemIndex, (itemData.content instanceof Cell) ? itemData.content : Cell.EMPTY);
            console.log('Full nft data:');
            console.log('\tContent:', decodeOnChainContent(fullData));
        } catch(e: any) {
            console.error('Error:', e);
        }
    }
}
