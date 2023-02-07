import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ContentfulService } from '../contentful/contentful.service';
import { GrantService } from './grant.service';

describe('GrantService', () => {
    let serviceUnderTest: GrantService;
    let elasticService: ElasticsearchService;
    let contentfulService: ContentfulService;

    const mockSearch = jest.fn();
    const mockFetchEntries = jest.fn();

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GrantService,
                { provide: ElasticsearchService, useValue: mockSearch },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest
                            .fn()
                            .mockReturnValue('mock-env-variable-value'),
                    },
                },
                {
                    provide: ContentfulService,
                    useValue: {
                        fetchEntries: mockFetchEntries,
                    },
                },
            ],
        }).compile();
        serviceUnderTest = module.get<GrantService>(GrantService);
        elasticService = module.get<ElasticsearchService>(ElasticsearchService);
        contentfulService = module.get<ContentfulService>(ContentfulService);

        mockSearch.mockReset();
        elasticService.search = mockSearch.mockReturnValue({
            body: {
                hits: {
                    total: {
                        value: 0,
                    },
                },
            },
        });
    });

    it('should be defined', () => {
        expect(serviceUnderTest).toBeDefined();
    });

    describe('findAllUpcomingOpeningGrants', () => {
        it('should return an array of grant ids for updated grants', async () => {
            const testGrantId1 = 'test-grant-id-1';
            const testGrantId2 = "test-grant-id-2'";

            elasticService.search = mockSearch.mockReturnValue({
                body: {
                    hits: {
                        total: {
                            value: 2,
                        },
                        hits: [
                            {
                                _id: testGrantId1,
                            },
                            {
                                _id: testGrantId2,
                            },
                        ],
                    },
                },
            });

            const response = await serviceUnderTest.findAllUpdatedGrants();

            expect(mockSearch).toHaveBeenCalledTimes(1);
            expect(mockSearch).toHaveBeenCalledWith({
                index: 'mock-env-variable-value',
                body: {
                    query: {
                        match: {
                            'fields.grantUpdated.en-US': true,
                        },
                    },
                },
            });

            expect(response).toStrictEqual([testGrantId1, testGrantId2]);
        });

        it('should return an empty array if there are no updated grants', async () => {
            elasticService.search = mockSearch.mockReturnValue({
                body: {
                    hits: {
                        total: {
                            value: 0,
                        },
                        hits: [],
                    },
                },
            });

            const response = await serviceUnderTest.findAllUpdatedGrants();

            expect(mockSearch).toHaveBeenCalledTimes(1);
            expect(mockSearch).toHaveBeenCalledWith({
                index: 'mock-env-variable-value',
                body: {
                    query: {
                        match: {
                            'fields.grantUpdated.en-US': true,
                        },
                    },
                },
            });

            expect(response).toStrictEqual([]);
        });
    });

    describe('findAllUpcomingOpeningGrants', () => {
        it('should search for grants that open between the start and end of 14 days from now', async () => {
            const twoWeeksTimeDate = new Date();
            twoWeeksTimeDate.setDate(twoWeeksTimeDate.getDate() + 14);

            await serviceUnderTest.findAllUpcomingOpeningGrants();

            expect(mockSearch).toHaveBeenCalledTimes(1);
            expect(mockSearch).toHaveBeenCalledWith({
                index: 'mock-env-variable-value',
                body: {
                    query: {
                        range: {
                            'fields.grantApplicationOpenDate.en-US': {
                                gte:
                                    twoWeeksTimeDate
                                        .toISOString()
                                        .slice(0, 10) + 'T00:00:00.000Z',
                                lte:
                                    twoWeeksTimeDate
                                        .toISOString()
                                        .slice(0, 10) + 'T23:59:59.999Z',
                            },
                        },
                    },
                },
            });
        });

        it('should return an empty array when there are no upcoming opening grants', async () => {
            const response =
                await serviceUnderTest.findAllUpcomingOpeningGrants();

            expect(response).toStrictEqual([]);
        });

        it('should return a list of upcoming opening grants when there are upcoming opening grants', async () => {
            elasticService.search = mockSearch.mockReturnValue({
                body: {
                    hits: {
                        total: {
                            value: 1,
                        },
                        hits: [
                            {
                                _id: 'mock-id-1',
                            },
                        ],
                    },
                },
            });
            const mockedFetchEntriesResponse = [
                {
                    fields: {
                        grantName: 'mock-grant-name',
                        label: 'mock-label-name',
                        grantApplicationOpenDate: '2022-04-05T00:00:00.000Z',
                        grantApplicationCloseDate: '2022-04-20T00:00:00.000Z',
                    },
                    sys: {
                        id: 'mock-grant-id',
                    },
                },
            ];
            const mockedReturnUpcomingGrantArrayResponse = [
                { ...mockedFetchEntriesResponse[0], closing: false },
            ];
            contentfulService.fetchEntries = mockFetchEntries.mockReturnValue(
                mockedFetchEntriesResponse,
            );

            const response =
                await serviceUnderTest.findAllUpcomingOpeningGrants();

            expect(response).toStrictEqual(
                mockedReturnUpcomingGrantArrayResponse,
            );
        });
    });

    describe('findAllUpcomingClosingGrants', () => {
        it('should search for grants that close between the start and end of 14 days from now', async () => {
            const twoWeeksTimeDate = new Date();
            twoWeeksTimeDate.setDate(twoWeeksTimeDate.getDate() + 14);

            await serviceUnderTest.findAllUpcomingClosingGrants();

            expect(mockSearch).toHaveBeenCalledTimes(1);
            expect(mockSearch).toHaveBeenCalledWith({
                index: 'mock-env-variable-value',
                body: {
                    query: {
                        range: {
                            'fields.grantApplicationCloseDate.en-US': {
                                gte:
                                    twoWeeksTimeDate
                                        .toISOString()
                                        .slice(0, 10) + 'T00:00:00.000Z',
                                lte:
                                    twoWeeksTimeDate
                                        .toISOString()
                                        .slice(0, 10) + 'T23:59:59.999Z',
                            },
                        },
                    },
                },
            });
        });

        it('should return an empty array when there are no upcoming closing grants', async () => {
            const response =
                await serviceUnderTest.findAllUpcomingClosingGrants();

            expect(response).toStrictEqual([]);
        });

        it('should return a list of upcoming closing grants when there are upcoming closing grants', async () => {
            elasticService.search = mockSearch.mockReturnValue({
                body: {
                    hits: {
                        total: {
                            value: 1,
                        },
                        hits: [
                            {
                                _id: 'mock-id-1',
                            },
                        ],
                    },
                },
            });
            const mockedFetchEntriesResponse = [
                {
                    fields: {
                        grantName: 'mock-grant-name',
                        label: 'mock-label-name',
                        grantApplicationOpenDate: '2022-04-05T00:00:00.000Z',
                        grantApplicationCloseDate: '2022-04-20T00:00:00.000Z',
                    },
                    sys: {
                        id: 'mock-grant-id',
                    },
                },
            ];
            const mockedReturnUpcomingGrantArrayResponse = [
                { ...mockedFetchEntriesResponse[0], closing: true },
            ];
            contentfulService.fetchEntries = mockFetchEntries.mockReturnValue(
                mockedFetchEntriesResponse,
            );

            const response =
                await serviceUnderTest.findAllUpcomingClosingGrants();

            expect(response).toStrictEqual(
                mockedReturnUpcomingGrantArrayResponse,
            );
        });
    });

    describe('findGrantsPublishedAfterDate', () => {
        it("should return any grants found after a provided date", async() => {
            const testGrantId1 = 'test-grant-id-1';
            const testGrantId2 = "test-grant-id-2'";
            const searchDate = new Date('2022-03-25T14:00:00.000Z');
            elasticService.search = mockSearch.mockReturnValue({
                body: {
                    hits: {
                        total: {
                            value: 2,
                        },
                        hits: [
                            {
                                _id: testGrantId1,
                            },
                            {
                                _id: testGrantId2,
                            },
                        ],
                    },
                },
            });

            const response = await serviceUnderTest.findGrantsPublishedAfterDate(searchDate);

            expect(mockSearch).toHaveBeenCalledTimes(1);
            expect(mockSearch).toHaveBeenCalledWith({
                index: 'mock-env-variable-value',
                body: {
                    query: {
                        range: {
                            'sys.createdAt': {
                                gte: searchDate.toISOString()
                            },
                        },
                    },
                },
            });

            expect(response).toStrictEqual([testGrantId1, testGrantId2]);
        })
    })
});
