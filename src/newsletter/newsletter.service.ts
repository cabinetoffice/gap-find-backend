import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Newsletter, NewsletterType } from './newsletter.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class NewsletterService {
    constructor(
        @InjectRepository(Newsletter)
        private newsletterRepository: Repository<Newsletter>,
        private userService: UserService,
    ) {}

    async findAll() {
        return this.newsletterRepository.find();
    }

    async findOneById(id: number) {
        return this.newsletterRepository.findOne({ where: { id } });
    }

    async findAllByType(type: NewsletterType) {
        return this.newsletterRepository.find({
            where: { type },
            relations: ['user'],
        });
    }

    async findOneByEmailAddressAndType(email: string, type: NewsletterType) {
        const { emailAddress, ...user } = await this.userService.findByEmail(
            email,
        );
        if (!!user) {
            return await this.newsletterRepository.findOne({
                where: { user, type },
            });
        }
    }

    async create(email: string, type: NewsletterType): Promise<Newsletter> {
        const newsletter = await this.findOneByEmailAddressAndType(email, type);

        if (!newsletter) {
            const user = await this.userService.create(email);

            const newsletter = new Newsletter();
            newsletter.type = type;
            newsletter.user = user;

            return await this.newsletterRepository.save(newsletter);
        } else {
            return newsletter;
        }
    }

    async deleteByNewsletterId(id: number) {
        const deleteResponse = await this.newsletterRepository.delete({ id });
        return deleteResponse.affected;
    }

    async deleteByEmailAddressAndType(email: string, type: NewsletterType) {
        const user = await this.userService.findByEmail(email);
        if (!!user) {
            const deleteResponse = await this.newsletterRepository.delete({
                user,
                type,
            });
            return deleteResponse.affected;
        }
        return 0;
    }
}
