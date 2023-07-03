import { Injectable } from '@nestjs/common';
import { BinaryLike, createHash } from 'crypto';

@Injectable()
export class HashService {
    hash(value: BinaryLike) {
        const hash = createHash('sha512');
        hash.update(value);
        return hash.digest('base64');
    }
}
