import { Network } from 'alchemy-sdk';

import { faker } from '@faker-js/faker';

import { AlchemyService } from './alchemy.service';

describe('AlchemySerice', () => {
    let service: AlchemyService;

    beforeAll(() => {
        service = new AlchemyService();
    });

    describe('#getNFTsForCollection', () => {
        it('should work', async () => {
            const mockResponse = [
                {
                    'id': {
                        'tokenId': '0x0000000000000000000000000000000000000000000000000000000000000000'
                    }
                },
                {
                    'id': {
                        'tokenId': '0x0000000000000000000000000000000000000000000000000000000000000001'
                    }
                },
                {
                    'id': {
                        'tokenId': '0x0000000000000000000000000000000000000000000000000000000000000002'
                    }
                },
                {
                    'id': {
                        'tokenId': '0x0000000000000000000000000000000000000000000000000000000000000003'
                    }
                },
                {
                    'id': {
                        'tokenId': '0x0000000000000000000000000000000000000000000000000000000000000004'
                    }
                },
                {
                    'id': {
                        'tokenId': '0x0000000000000000000000000000000000000000000000000000000000000005'
                    }
                },
                {
                    'id': {
                        'tokenId': '0x0000000000000000000000000000000000000000000000000000000000000006'
                    }
                },
                {
                    'id': {
                        'tokenId': '0x0000000000000000000000000000000000000000000000000000000000000007'
                    }
                },
                {
                    'id': {
                        'tokenId': '0x0000000000000000000000000000000000000000000000000000000000000008'
                    }
                },
                {
                    'id': {
                        'tokenId': '0x0000000000000000000000000000000000000000000000000000000000000009'
                    }
                }
            ];

            jest.spyOn(service as any, '_getNFTsForCollection').mockImplementation(async () => mockResponse);
            const result = await service.getNFTsForCollection(Network.ARB_GOERLI, faker.finance.ethereumAddress());
            expect(result.length).toEqual(mockResponse.length);
            expect(result[5]).toEqual(BigInt(mockResponse[5].id.tokenId).toString());
        });
    });

    describe('#getTokenIdFromNFTActivity', () => {
        it('should work', async () => {
            const req = {
                'webhookId': 'wh_v394g727u681i5rj',
                'id': 'whevt_13vxrot10y8omrdp',
                'createdAt': '2022-08-03T23:29:11.267808614Z',
                'type': 'NFT_ACTIVITY',
                'event': {
                    'activity': [
                        {
                            'network': 'ETH_GOERLI',
                            'fromAddress': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f77',
                            'toAddress': '0x15dd13f3c4c5279222b5f09ed1b9e9340ed17185',
                            'contractAddress': '0xf4910c763ed4e47a585e2d34baa9a4b611ae448c',
                            'blockNum': '0x78b94e',
                            'hash': '0x6ca7fed3e3ca7a97e774b0eab7d8f46b7dcad5b8cf8ff28593a2ba00cdef4bff',
                            'erc1155Metadata': [
                                {
                                    'tokenId': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f77000000000000010000000001',
                                    'value': '0x1'
                                }
                            ],
                            'category': 'erc721',
                            'tokenId': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f77000000000000010000000001',
                            'log': {
                                'address': '0xf4910c763ed4e47a585e2d34baa9a4b611ae448c',
                                'topics': [
                                    '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62',
                                    '0x0000000000000000000000002acc2dff0c1fa9c1c62f518c9415a0ca60e03f77',
                                    '0x0000000000000000000000002acc2dff0c1fa9c1c62f518c9415a0ca60e03f77',
                                    '0x00000000000000000000000015dd13f3c4c5279222b5f09ed1b9e9340ed17185'
                                ],
                                'data': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f770000000000000100000000010000000000000000000000000000000000000000000000000000000000000001',
                                'blockNumber': '0x78b94e',
                                'transactionHash': '0x6ca7fed3e3ca7a97e774b0eab7d8f46b7dcad5b8cf8ff28593a2ba00cdef4bff',
                                'transactionIndex': '0x1b',
                                'blockHash': '0x4887f8bfbba48b7bff0362c34149d76783feae32f29bff3d98c841bc2ba1902f',
                                'logIndex': '0x16',
                                'removed': false
                            }
                        },
                        {
                            'network': 'ETH_GOERLI',
                            'fromAddress': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f77',
                            'toAddress': '0x15dd13f3c4c5279222b5f09ed1b9e9340ed17185',
                            'contractAddress': '0xf4910c763ed4e47a585e2d34baa9a4b611ae448c',
                            'blockNum': '0x78b94e',
                            'hash': '0x6ca7fed3e3ca7a97e774b0eab7d8f46b7dcad5b8cf8ff28593a2ba00cdef4bff',
                            'erc1155Metadata': [
                                {
                                    'tokenId': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f77000000000000010000000001',
                                    'value': '0x1'
                                }
                            ],
                            'tokenId': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f77000000000000010000000002',
                            'category': 'erc721',
                            'log': {
                                'address': '0xf4910c763ed4e47a585e2d34baa9a4b611ae448c',
                                'topics': [
                                    '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62',
                                    '0x0000000000000000000000002acc2dff0c1fa9c1c62f518c9415a0ca60e03f77',
                                    '0x0000000000000000000000002acc2dff0c1fa9c1c62f518c9415a0ca60e03f77',
                                    '0x00000000000000000000000015dd13f3c4c5279222b5f09ed1b9e9340ed17185'
                                ],
                                'data': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f770000000000000100000000010000000000000000000000000000000000000000000000000000000000000001',
                                'blockNumber': '0x78b94e',
                                'transactionHash': '0x6ca7fed3e3ca7a97e774b0eab7d8f46b7dcad5b8cf8ff28593a2ba00cdef4bff',
                                'transactionIndex': '0x1b',
                                'blockHash': '0x4887f8bfbba48b7bff0362c34149d76783feae32f29bff3d98c841bc2ba1902f',
                                'logIndex': '0x16',
                                'removed': false
                            }
                        },
                        {
                            'network': 'ETH_GOERLI',
                            'fromAddress': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f77',
                            'toAddress': '0x15dd13f3c4c5279222b5f09ed1b9e9340ed17185',
                            'contractAddress': '0xf4910c763ed4e47a585e2d34baa9a4b611ae448c',
                            'blockNum': '0x78b94e',
                            'hash': '0x6ca7fed3e3ca7a97e774b0eab7d8f46b7dcad5b8cf8ff28593a2ba00cdef4bff',
                            'erc1155Metadata': [
                                {
                                    'tokenId': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f77000000000000010000000001',
                                    'value': '0x1'
                                }
                            ],
                            'tokenId': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f77000000000000010000000003',
                            'category': 'erc721',
                            'log': {
                                'address': '0xf4910c763ed4e47a585e2d34baa9a4b611ae448c',
                                'topics': [
                                    '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62',
                                    '0x0000000000000000000000002acc2dff0c1fa9c1c62f518c9415a0ca60e03f77',
                                    '0x0000000000000000000000002acc2dff0c1fa9c1c62f518c9415a0ca60e03f77',
                                    '0x00000000000000000000000015dd13f3c4c5279222b5f09ed1b9e9340ed17185'
                                ],
                                'data': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f770000000000000100000000010000000000000000000000000000000000000000000000000000000000000001',
                                'blockNumber': '0x78b94e',
                                'transactionHash': '0x6ca7fed3e3ca7a97e774b0eab7d8f46b7dcad5b8cf8ff28593a2ba00cdef4bff',
                                'transactionIndex': '0x1b',
                                'blockHash': '0x4887f8bfbba48b7bff0362c34149d76783feae32f29bff3d98c841bc2ba1902f',
                                'logIndex': '0x16',
                                'removed': false
                            }
                        }
                    ]
                }
            };
            const result = service.getTokenIdFromNFTActivity(req);
            expect(result.length).toEqual(3);
            const inspectIdx = 2;
            expect(result[inspectIdx]).toEqual(BigInt(req.event.activity[inspectIdx].tokenId).toString());
        });

        it('should handle deduplication', async () => {
            const req = {
                'webhookId': 'wh_v394g727u681i5rj',
                'id': 'whevt_13vxrot10y8omrdp',
                'createdAt': '2022-08-03T23:29:11.267808614Z',
                'type': 'NFT_ACTIVITY',
                'event': {
                    'activity': [
                        {
                            'network': 'ETH_GOERLI',
                            'fromAddress': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f77',
                            'toAddress': '0x15dd13f3c4c5279222b5f09ed1b9e9340ed17185',
                            'contractAddress': '0xf4910c763ed4e47a585e2d34baa9a4b611ae448c',
                            'blockNum': '0x78b94e',
                            'hash': '0x6ca7fed3e3ca7a97e774b0eab7d8f46b7dcad5b8cf8ff28593a2ba00cdef4bff',
                            'erc1155Metadata': [
                                {
                                    'tokenId': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f77000000000000010000000001',
                                    'value': '0x1'
                                }
                            ],
                            'category': 'erc721',
                            'tokenId': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f77000000000000010000000001',
                            'log': {
                                'address': '0xf4910c763ed4e47a585e2d34baa9a4b611ae448c',
                                'topics': [
                                    '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62',
                                    '0x0000000000000000000000002acc2dff0c1fa9c1c62f518c9415a0ca60e03f77',
                                    '0x0000000000000000000000002acc2dff0c1fa9c1c62f518c9415a0ca60e03f77',
                                    '0x00000000000000000000000015dd13f3c4c5279222b5f09ed1b9e9340ed17185'
                                ],
                                'data': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f770000000000000100000000010000000000000000000000000000000000000000000000000000000000000001',
                                'blockNumber': '0x78b94e',
                                'transactionHash': '0x6ca7fed3e3ca7a97e774b0eab7d8f46b7dcad5b8cf8ff28593a2ba00cdef4bff',
                                'transactionIndex': '0x1b',
                                'blockHash': '0x4887f8bfbba48b7bff0362c34149d76783feae32f29bff3d98c841bc2ba1902f',
                                'logIndex': '0x16',
                                'removed': false
                            }
                        },
                        {
                            'network': 'ETH_GOERLI',
                            'fromAddress': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f77',
                            'toAddress': '0x15dd13f3c4c5279222b5f09ed1b9e9340ed17185',
                            'contractAddress': '0xf4910c763ed4e47a585e2d34baa9a4b611ae448c',
                            'blockNum': '0x78b94e',
                            'hash': '0x6ca7fed3e3ca7a97e774b0eab7d8f46b7dcad5b8cf8ff28593a2ba00cdef4bff',
                            'erc1155Metadata': [
                                {
                                    'tokenId': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f77000000000000010000000001',
                                    'value': '0x1'
                                }
                            ],
                            'tokenId': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f77000000000000010000000002',
                            'category': 'erc721',
                            'log': {
                                'address': '0xf4910c763ed4e47a585e2d34baa9a4b611ae448c',
                                'topics': [
                                    '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62',
                                    '0x0000000000000000000000002acc2dff0c1fa9c1c62f518c9415a0ca60e03f77',
                                    '0x0000000000000000000000002acc2dff0c1fa9c1c62f518c9415a0ca60e03f77',
                                    '0x00000000000000000000000015dd13f3c4c5279222b5f09ed1b9e9340ed17185'
                                ],
                                'data': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f770000000000000100000000010000000000000000000000000000000000000000000000000000000000000001',
                                'blockNumber': '0x78b94e',
                                'transactionHash': '0x6ca7fed3e3ca7a97e774b0eab7d8f46b7dcad5b8cf8ff28593a2ba00cdef4bff',
                                'transactionIndex': '0x1b',
                                'blockHash': '0x4887f8bfbba48b7bff0362c34149d76783feae32f29bff3d98c841bc2ba1902f',
                                'logIndex': '0x16',
                                'removed': false
                            }
                        },
                        {
                            'network': 'ETH_GOERLI',
                            'fromAddress': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f77',
                            'toAddress': '0x15dd13f3c4c5279222b5f09ed1b9e9340ed17185',
                            'contractAddress': '0xf4910c763ed4e47a585e2d34baa9a4b611ae448c',
                            'blockNum': '0x78b94e',
                            'hash': '0x6ca7fed3e3ca7a97e774b0eab7d8f46b7dcad5b8cf8ff28593a2ba00cdef4bff',
                            'erc1155Metadata': [
                                {
                                    'tokenId': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f77000000000000010000000001',
                                    'value': '0x1'
                                }
                            ],
                            'tokenId': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f77000000000000010000000002',
                            'category': 'erc721',
                            'log': {
                                'address': '0xf4910c763ed4e47a585e2d34baa9a4b611ae448c',
                                'topics': [
                                    '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62',
                                    '0x0000000000000000000000002acc2dff0c1fa9c1c62f518c9415a0ca60e03f77',
                                    '0x0000000000000000000000002acc2dff0c1fa9c1c62f518c9415a0ca60e03f77',
                                    '0x00000000000000000000000015dd13f3c4c5279222b5f09ed1b9e9340ed17185'
                                ],
                                'data': '0x2acc2dff0c1fa9c1c62f518c9415a0ca60e03f770000000000000100000000010000000000000000000000000000000000000000000000000000000000000001',
                                'blockNumber': '0x78b94e',
                                'transactionHash': '0x6ca7fed3e3ca7a97e774b0eab7d8f46b7dcad5b8cf8ff28593a2ba00cdef4bff',
                                'transactionIndex': '0x1b',
                                'blockHash': '0x4887f8bfbba48b7bff0362c34149d76783feae32f29bff3d98c841bc2ba1902f',
                                'logIndex': '0x16',
                                'removed': false
                            }
                        }
                    ]
                }
            };
            const result = service.getTokenIdFromNFTActivity(req);
            expect(result.length).toEqual(2);
        });
    });
});