import { Test, TestingModule } from '@nestjs/testing';
import { HashService } from './hash.service';

describe('HashService', () => {
    let service: HashService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [HashService],
        }).compile();

        service = module.get<HashService>(HashService);
    });

    describe('hash', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('hash a value using sha512', () => {
            const testvalue = 'this is a test value';
            const testhash =
                'jzNThno68pswWEnKTlC+zGkn8peTY91YV5OagBPqcM9qNBrI0ZPX9pY7B6/Q4457+eGfCnPWvsDR9/foagz2WA==';
            expect(service.hash(testvalue)).toStrictEqual(testhash);
        });
    });
});
