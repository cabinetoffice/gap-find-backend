import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class HashService {
    hash(value) {
        const hash = createHash('sha512');
        hash.update(value);
        return hash.digest('base64');
    }
}
