let MOCK_ENCRYPTION_STAGE
let MOCK_PURPOSE;
let MOCK_ENCRYPTION_ORIGIN

export function setMockEncryptionStage(stage) {
    MOCK_ENCRYPTION_STAGE = stage;
}

export function setMockPurpose(purpose) {
    MOCK_PURPOSE = purpose;
}

export function setMockEncryptionOrigin(origin) {
    MOCK_ENCRYPTION_ORIGIN = origin;
}

export const mockBuildClient = {
    encrypt: jest.fn().mockImplementation((keyring, cleartext) => {
        const encoder = new TextEncoder();
        const cipherBuffer = encoder.encode(cleartext);
        return { result: cipherBuffer };
    }),
    encryptStream: jest.fn(),
    decryptUnsignedMessageStream: jest.fn(),
    decrypt: jest.fn().mockImplementation((keyring, ciphertext) => {
        return {
            plaintext: ciphertext,
            messageHeader: {
                encryptionContext: {
                    stage: MOCK_ENCRYPTION_STAGE,
                    purpose: MOCK_PURPOSE,
                    origin: MOCK_ENCRYPTION_ORIGIN,
                },
            },
        };
    }),
    decryptStream: jest.fn(),
};

export const RawAesKeyringNode = jest.fn();
export const CommitmentPolicy = jest.fn();
export const RawAesWrappingSuiteIdentifier = jest.fn();
export const buildClient = jest.fn().mockImplementation(() => {
    return mockBuildClient;
});
