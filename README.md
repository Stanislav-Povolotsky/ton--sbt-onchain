# TON SBT with onchain metadata

Based on [Getgems NFT contracts](https://github.com/getgems-io/nft-contracts/)

## Project structure

-   `contracts` - source code of all the smart contracts of the project and their dependencies.
-   `wrappers` - wrapper classes (implementing `Contract` from @ton/core) for the contracts, including any [de]serialization primitives and compilation functions.
-   `tests` - tests for the contracts.
-   `scripts` - scripts used by the project, mainly the deployment scripts.

## How to use

### Build

`npx blueprint build` or `yarn blueprint build`

### Test

`npx blueprint test` or `yarn blueprint test`

### Deploy or run another script

`npx blueprint run` or `yarn blueprint run`

### Scripts

1. Deploy collection:  
   `npx blueprint run collectionDeploy`
   ```shell
   Using file: collectionDeploy
   ? Which network do you want to use? testnet
   ? Which wallet are you using? TON Connect compatible mobile wallet (example: Tonkeeper)
   Connected to wallet at address: EQD9Ahgp6Uxa-uFn01oyxoHPX70j1eR51BB2lsnZFVardfyn
   Collection address:  EQDsuoTrnMU3wge0ulYgrf-74pox70NAH4lRuqKYvNQdN5l0
   Collection info saved to  collection.json
   Sending transaction. Approve in your wallet...[TON_CONNECT_SDK] Send http-bridge request: ...
   Sent transaction
   Deploy request sent
   Contract deployed at address EQDsuoTrnMU3wge0ulYgrf-74pox70NAH4lRuqKYvNQdN5l0
   You can view it at https://testnet.tonscan.org/address/EQDsuoTrnMU3wge0ulYgrf-74pox70NAH4lRuqKYvNQdN5l0
   Collection deployed:  EQDsuoTrnMU3wge0ulYgrf-74pox70NAH4lRuqKYvNQdN5l0
   ```
3. Mint SBT for deployed collection:  
   `npx blueprint run collectionMintSbt`
   ```shell
   Using file: collectionMintSbt
   ? Which network do you want to use? testnet
   ? Which wallet are you using? TON Connect compatible mobile wallet (example: Tonkeeper)
   Connected to wallet at address: EQD9Ahgp6Uxa-uFn01oyxoHPX70j1eR51BB2lsnZFVardfyn
   Collection address: EQDsuoTrnMU3wge0ulYgrf-74pox70NAH4lRuqKYvNQdN5l0
   Next item ID: 0
   Next item index: 0  address: EQDwe9Zts_2BRa7by3oBffXna7EHzMQw9EsGJRGLKM0eucam
   Sending transaction. Approve in your wallet...[TON_CONNECT_SDK] Send http-bridge request: ...
   Sent transaction
   Sent collection mint request
   Contract deployed at address EQDwe9Zts_2BRa7by3oBffXna7EHzMQw9EsGJRGLKM0eucam
   You can view it at https://testnet.tonscan.org/address/EQDwe9Zts_2BRa7by3oBffXna7EHzMQw9EsGJRGLKM0eucam
   Item deployed: EQDwe9Zts_2BRa7by3oBffXna7EHzMQw9EsGJRGLKM0eucam
   ```
5. Display information for deployed SBT token:  
   `npx blueprint run collectionGetAllInfo`
   ```shell
   ? Which network do you want to use? testnet
   ? Which wallet are you using? TON Connect compatible mobile wallet (example: Tonkeeper)
   Connected to wallet at address: EQD9Ahgp6Uxa-uFn01oyxoHPX70j1eR51BB2lsnZFVardfyn
   ? Item Index 0
   Collection address: EQDsuoTrnMU3wge0ulYgrf-74pox70NAH4lRuqKYvNQdN5l0
   Collection data:
           Next item ID: 1
           Owner address: EQD9Ahgp6Uxa-uFn01oyxoHPX70j1eR51BB2lsnZFVardfyn
           Content: {
     name: 'Diploma',
     description: 'Collection of personal diplomas for students',
     image_data: <Buffer 89 50 4e 47 0d 0a 1a 0a 00 00 00 0d 49 48 44 52 00 00 03 60 00 00 03 60 04 03 00 00 00 b8 bc 16 97 00 00 00 1e 50 4c 54 45 47 70 4c 2c 3e 50 2c 3e 50 ... 7894 more bytes>
   }
   Item data:
           Item index: 0
           Item address: EQDwe9Zts_2BRa7by3oBffXna7EHzMQw9EsGJRGLKM0eucam
   Item nft data:
           Initialized: true
           Collection address: EQDsuoTrnMU3wge0ulYgrf-74pox70NAH4lRuqKYvNQdN5l0
           Owner address: EQD9Ahgp6Uxa-uFn01oyxoHPX70j1eR51BB2lsnZFVardfyn
           Content: { description: 'Student 1' }
   Full nft data:
           Content: {
     name: 'Personal diploma for the student',
     description: 'Diploma for the student: Student 1',
     image_data: <Buffer 89 50 4e 47 0d 0a 1a 0a 00 00 00 0d 49 48 44 52 00 00 02 02 00 00 01 ae 08 03 00 00 00 d5 ad 9e f6 00 00 00 04 67 41 4d 41 00 00 b1 8f 0b fc 61 05 00 ... 18925 more bytes>
   }
   ```

## Useful links

- Overview && guides  
  https://docs.ton.org/develop/dapps/defi/tokens
- NFT standard (TEP 62)  
  https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md
- Token Data Standard (TEP 64)  
  https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md
- SBT (Soulbound NFT) standard (TEP 85)  
  https://github.com/ton-blockchain/TEPs/blob/master/text/0085-sbt-standard.md
- NFTRoyalty standard extension (TEP 66)  
  https://github.com/ton-blockchain/TEPs/blob/master/text/0066-nft-royalty-standard.md
