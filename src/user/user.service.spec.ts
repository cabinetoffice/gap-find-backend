import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { HashService } from '../hash/hash.service';
import { User } from './user.entity';
import { UserService } from './user.service';
import { Delete } from '@elastic/elasticsearch/api/requestParams';

describe('UserService', () => {
    let service: UserService;
    let userRepository: Repository<User>;
    let hashService: HashService;

    const mockUser = {
        id: 1,
        emailAddress: 'test@test.com',
        hashedEmailAddress: 'hashed-email',
        encryptedEmailAddress: 'encrypted-email',
        updatedAt: new Date('2022-03-25T14:00:00.000Z'),
        createdAt: new Date('2022-06-25T14:00:00.000Z'),
        subscriptions: [],
        newsletterSubscriptions: [],
        savedSearches: [],
    } as User;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        findOne: jest.fn(),
                        save: jest.fn(),
                        delete: jest.fn(),
                    },
                },
                {
                    provide: HashService,
                    useValue: {
                        hash: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        hashService = module.get<HashService>(HashService);
        userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
        expect(userRepository).toBeDefined();
    });

    describe('create', () => {
        beforeEach(() => {
            jest.resetAllMocks();
        });

        it('should create a user', async () => {
            const email = 'test@test.com';
            const hashedEmailAddress = 'hashed-email-address';
            jest.spyOn(hashService, 'hash').mockReturnValue(hashedEmailAddress);
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
            jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);

            const result = await service.create(email);

            expect(userRepository.findOne).toHaveBeenNthCalledWith(1, {
                where: {
                    hashedEmailAddress,
                },
            });

            expect(hashService.hash).toHaveBeenNthCalledWith(1, email);

            expect(userRepository.save).toHaveBeenNthCalledWith(1, {
                emailAddress: email,
            });

            expect(result).toStrictEqual(mockUser);
        });

        it('should return a user if it already exists', async () => {
            const email = 'test@test.com';
            const hashedEmailAddress = 'hashed-email-address';

            jest.spyOn(hashService, 'hash').mockReturnValue(hashedEmailAddress);
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
            jest.spyOn(userRepository, 'save').mockResolvedValue(null);

            const result = await service.create(email);

            expect(hashService.hash).toBeCalledTimes(1);
            expect(hashService.hash).toBeCalledWith(email);

            expect(userRepository.findOne).toBeCalledTimes(1);
            expect(userRepository.findOne).toBeCalledWith({
                where: { hashedEmailAddress },
            });

            expect(userRepository.save).toBeCalledTimes(0);

            expect(result).toStrictEqual(mockUser);
        });
    });

    describe('findByEmail', () => {
        beforeEach(() => {
            jest.resetAllMocks();
        });

        it('should return a user if it already exists', async () => {
            const email = 'test@test.com';
            const hashedEmailAddress = 'hashed-email-address';

            jest.spyOn(hashService, 'hash').mockReturnValue(hashedEmailAddress);
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

            const result = await service.findByEmail(email);

            expect(userRepository.findOne).toHaveBeenNthCalledWith(1, {
                where: { hashedEmailAddress },
            });

            expect(result).toStrictEqual(mockUser);
        });

        it('should return null if user does not exist', async () => {
            const email = 'test@test.com';
            const hashedEmailAddress = 'hashed-email-address';
            jest.spyOn(hashService, 'hash').mockReturnValue(hashedEmailAddress);
            jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
            const result = await service.findByEmail(email);

            expect(userRepository.findOne).toHaveBeenNthCalledWith(1, {
                where: { hashedEmailAddress },
            });
            expect(result).toStrictEqual(null);
        });
    });

    describe('update', () => {
        beforeEach(() => {
            jest.resetAllMocks();
        });

        it('should update a user', async () => {
            jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);

            const result = await service.update(mockUser);

            expect(userRepository.save).toBeCalledTimes(1);
            expect(userRepository.save).toBeCalledWith({
                id: 1,
                emailAddress: 'test@test.com',
                hashedEmailAddress: 'hashed-email',
                encryptedEmailAddress: '',
                updatedAt: new Date('2022-03-25T14:00:00.000Z'),
                createdAt: new Date('2022-06-25T14:00:00.000Z'),
                subscriptions: [],
                newsletterSubscriptions: [],
                savedSearches: [],
            });

            expect(result).toStrictEqual(mockUser);
        });
    });

    describe('delete', () => {
        beforeEach(() => {
            jest.resetAllMocks();
        });

        it('should delete a user', async () => {
            const id = 12345678;
            const mockDelteResult = { raw: null, affected: 0 } as DeleteResult;

            jest.spyOn(userRepository, 'delete').mockResolvedValue(
                mockDelteResult,
            );

            const result = await service.delete(id);

            expect(userRepository.delete).toBeCalledTimes(1);
            expect(userRepository.delete).toBeCalledWith(id);

            expect(result).toStrictEqual(mockDelteResult);
        });
    });
});
