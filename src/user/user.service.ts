import { Injectable } from '@nestjs/common';
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

    async update(user: User) {
        return await this.userRepository.save(user);
    }

    async delete(id: number) {
        const result = await this.userRepository.delete(id);
        return result;
    }

    async migrateOrCreate(email: string, sub: string) {
        const user = await this.findByEmail(email);
        if (user) {
            user.sub = sub;
            return await this.update(user);
        } else {
            return await this.create(email, sub);
        }
    }
}
