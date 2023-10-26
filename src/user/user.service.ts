import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HashService } from '../hash/hash.service';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private hashService: HashService,
    ) {}

    async create(email: string, sub?: string) {
        const hashedEmailAddress = this.hashService.hash(email);
        const foundUser = await this.userRepository.findOne({
            where: {
                hashedEmailAddress,
            },
        });

        if (foundUser) return foundUser;
        const user = new User();
        user.emailAddress = email;
        user.sub = sub;
        const result = await this.userRepository.save(user);
        return result;
    }

    async findByEmail(email: string) {
        const hashedEmailAddress = this.hashService.hash(email);
        const result = await this.userRepository.findOne({
            where: {
                hashedEmailAddress,
            },
        });

        return result ? result : null;
    }

    async findById(id: number) {
        const result = await this.userRepository.findOne(id);
        return result ? result : null;
    }

    async update(user: User) {
        return await this.userRepository.save(user);
    }

    async delete(id: number) {
        const result = await this.userRepository.delete(id);
        return result;
    }

    async migrateOrCreate(email: string, sub: string) {
        try {
            const user = await this.findByEmail(email);
            if (user) {
                user.sub = sub;
                const updatedUser = await this.update(user);
                console.log(
                    `Migrated existing user successfully: ${updatedUser.sub}`,
                );
                return { isNewUser: false };
            } else {
                const newUser = await this.create(email, sub);
                console.log(`New user created: ${newUser.sub}`);
                return { isNewUser: true };
            }
        } catch (error) {
            console.error(`Error migrating user: ${error}`);
            throw new HttpException(
                'Error migrating user',
                HttpStatus.INTERNAL_SERVER_ERROR,
                error,
            );
        }
    }
}
