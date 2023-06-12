import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HashService } from '../hash/hash.service';
import { DeleteResult, Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private hashService: HashService,
    ) {}

    async create(email: string) {
        const hashedEmailAddress = this.hashService.hash(email);
        const foundUser = await this.userRepository.findOne({
            where: {
                hashedEmailAddress,
            },
        });

        if (foundUser) return foundUser;
        const user = new User();
        user.emailAddress = email;
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
        //Force trigger of BeforeUpdate event
        user.encryptedEmailAddress = '';
        const result = await this.userRepository.save(user);
        return result;
    }

    async delete(id: number) {
        const result = await this.userRepository.delete(id);
        return result;
    }
}
