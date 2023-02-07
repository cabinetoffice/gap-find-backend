import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';
import {setMockEncryptionOrigin, setMockEncryptionStage, setMockPurpose, mockBuildClient} from '../__mocks__/@aws-crypto/client-node';

const MOCK_ENCRYPTION_STAGE = 'mock-stage';
const MOCK_ENCRYPTION_ORIGIN = 'mock-origin';
const MOCK_PURPOSE = 'Gov.UK Grant Application Finder';

describe('EncryptionService', () => {
    let service: EncryptionService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EncryptionService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            switch (key) {
                                case 'ENCRYPTION_KEY_NAME':
                                    return 'mock-key-name';
                                case 'ENCRYPTION_KEY_NAMESPACE':
                                    return 'mock-key-namespace';
                                case 'ENCRYPTION_WRAPPING_KEY':
                                    return 'mock-wrapping-key';
                                case 'ENCRYPTION_STAGE':
                                    return MOCK_ENCRYPTION_STAGE;
                                case 'ENCRYPTION_ORIGIN':
                                    return MOCK_ENCRYPTION_ORIGIN;
                                default:
                                    return null;
                            }
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<EncryptionService>(EncryptionService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('encrypt', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            setMockEncryptionStage(MOCK_ENCRYPTION_STAGE)
            setMockEncryptionOrigin(MOCK_ENCRYPTION_ORIGIN)
            setMockPurpose(MOCK_PURPOSE)
        });

        it('should encrypt', async () => {
            const cleartext = 'test-encryption-string';
            const encoder = new TextEncoder();
            const cipherBuffer = encoder.encode(cleartext);

            expect(await service.encrypt(cleartext)).toStrictEqual(
                (cipherBuffer as Buffer).toString('base64'),
            );

            expect(mockBuildClient.encrypt).toBeCalledTimes(1);
        });

        it('should decrypt', async () => {
            const cleartext = 'test-decryption-string';
            const encoder = new TextEncoder();
            const cipherBuffer = encoder.encode(cleartext);

            expect(await service.decrypt(cipherBuffer)).toStrictEqual(
                cleartext,
            );

            expect(mockBuildClient.decrypt).toBeCalledTimes(1);
        });

        it('should throw an error if the encryption context does not match', async () => {
            setMockPurpose("incorrect mock purpose")
            const cleartext = 'test-decryption-string';
            const encoder = new TextEncoder();
            const cipherBuffer = encoder.encode(cleartext);

            await expect(service.decrypt(cipherBuffer)).rejects.toThrow('Encryption Context does not match expected values');
        });
    });
});
