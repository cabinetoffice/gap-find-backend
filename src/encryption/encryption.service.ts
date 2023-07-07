import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    RawAesKeyringNode,
    buildClient,
    CommitmentPolicy,
    RawAesWrappingSuiteIdentifier,
} from '@aws-crypto/client-node';
import { Readable } from 'stream';

@Injectable()
export class EncryptionService {
    private keyRing: RawAesKeyringNode;
    private encryptionClient;
    private context;

    constructor(private configService: ConfigService) {
        const encoder = new TextEncoder();

        const keyName = this.configService.get<string>('ENCRYPTION_KEY_NAME');
        const keyNamespace = this.configService.get<string>(
            'ENCRYPTION_KEY_NAMESPACE',
        );
        const unencryptedMasterKey = encoder.encode(
            this.configService.get<string>('ENCRYPTION_WRAPPING_KEY'),
        );
        const wrappingSuite =
            RawAesWrappingSuiteIdentifier.AES256_GCM_IV12_TAG16_NO_PADDING;

        this.keyRing = new RawAesKeyringNode({
            keyName,
            keyNamespace,
            unencryptedMasterKey,
            wrappingSuite,
        });

        this.encryptionClient = buildClient(
            CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT,
        );

        this.context = {
            stage: this.configService.get<string>('ENCRYPTION_STAGE'),
            purpose: 'Gov.UK Grant Application Finder',
            origin: this.configService.get<string>('ENCRYPTION_ORIGIN'),
        };
    }

    async encrypt(
        cleartext:
            | string
            | Buffer
            | Uint8Array
            | Readable
            | NodeJS.ReadableStream,
    ) {
        const { result } = await this.encryptionClient.encrypt(
            this.keyRing,
            cleartext,
            {
                encryptionContext: this.context,
            },
        );
        const cipherText = this.b64Encode(result);
        return cipherText;
    }

    async decrypt(cipherText: string | Uint8Array): Promise<string> {
        const { plaintext, messageHeader } =
            await this.encryptionClient.decrypt(
                this.keyRing,
                this.b64Decode(cipherText),
            );
        const { encryptionContext } = messageHeader;
        Object.entries(this.context).forEach(([key, value]) => {
            if (encryptionContext[key] !== value)
                throw new Error(
                    'Encryption Context does not match expected values',
                );
        });

        return plaintext.toString();
    }

    private b64Encode(buff: Buffer) {
        return buff.toString('base64');
    }

    private b64Decode(str: string | Uint8Array) {
        if (typeof str === 'string') return Buffer.from(str, 'base64');
        return Buffer.from(str);
    }
}
