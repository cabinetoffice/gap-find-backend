import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    buildClient,
    CommitmentPolicy,
    KmsKeyringNode,
} from '@aws-crypto/client-node';
import * as NodeRSA from 'node-rsa';

@Injectable()
export class EncryptionServiceV2 {
    private context;
    private encryptionClient;
    private keyArn;
    private generatorKeyId;

    constructor(private configService: ConfigService) {
        this.generatorKeyId = this.configService.get<string>(
            'ENCRYPTION_GENERATOR_KEY_ID',
        );

        this.keyArn = this.configService.get<string>(
            'ENCRYPTION_KEY_NAMESPACE',
        );

        this.encryptionClient = buildClient(
            CommitmentPolicy.REQUIRE_ENCRYPT_REQUIRE_DECRYPT,
        );

        this.context = {
            stage: this.configService.get<string>('ENCRYPTION_STAGE'),
            purpose: 'Gov.UK Grant Application Finder',
            origin: this.configService.get<string>('ENCRYPTION_ORIGIN'),
        };
    }

    async encryptV2(plaintext: string) {
        const generatorKeyId = this.generatorKeyId;
        const keyIds = [this.keyArn];

        const keyring = new KmsKeyringNode({ generatorKeyId, keyIds });

        const { result } = await this.encryptionClient.encrypt(
            keyring,
            plaintext,
            {
                encryptionContext: this.context,
            },
        );

        return this.b64Encode(result);
    }

    async decryptV2(cipherText: Buffer) {
        const text = this.b64Decode(cipherText);
        const keyIds = [this.keyArn];

        const keyring = new KmsKeyringNode({ keyIds });
        const { plaintext, messageHeader } =
            await this.encryptionClient.decrypt(keyring, text);

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

    encryptSecretWithPublicKey = (data: string, publicKey: string): string => {
        const key = new NodeRSA();
        const publicKeyWithBeginAndEnd = `-----BEGIN PUBLIC KEY-----${publicKey}-----END PUBLIC KEY-----`;
        key.importKey(publicKeyWithBeginAndEnd, 'pkcs8-public-pem');

        return key.encrypt(data, 'base64');
    };
}
